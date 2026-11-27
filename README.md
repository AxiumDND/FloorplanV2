# FloorplanV2

Floorplan for placing lights on floor images and sending commands to an eDin+ system over HTTP or raw TCP (port 26).

## Run

```
npm install
npm start
```

The first launch creates `userData/settings.csv` from `userData/settings.example.csv` when that file is missing. Floor images and the live settings file stay on the machine and are not committed.

## Connecting to the system

Open **Settings** (cog icon) and set:

- **Connection type**: **HTTP** (default) or **TCP**. HTTP POSTs to `http://<ip>/gateway?` (needs the NPU web server, on by default). TCP opens a raw session on port 26 (needs **Enable gateway control** under the NPU's Network services). HTTP does not deliver events; TCP does.
- **IP Address** of the NPU.
- **Username** and **Password**: the eDIN+ user account. Leave both empty to connect as the Public guest. They cannot contain commas or semicolons.

Click **Save Settings and Connect**. The app also connects on start-up with the saved settings. The dot next to the cog is green when connected, amber while connecting and red on a connection or login failure. The Settings page shows the detail, including which user the system accepted.

Login uses the gateway `$USER,<user-name>,<password>;` command and checks the `!USERERR` reply. Over HTTP it is sent at the start of every request (HTTP keeps no session); over TCP it is sent once after `!GATRDY;`. A wrong username or password stops the connection rather than falling back to Public.

The settings are stored in `userData/settings.csv` as `$connectionType,http|tcp;`, `$ipAddress,...;`, `$userName,...;` and `$password,...;`. The password is saved there as plain text, so keep that file private.

Run the connection tests with `npm test`.

## Using the app

- Floor buttons switch the plan. Names and the floor count are saved from Settings.
- **Load image** stores a PNG for the current floor as `userData/floor-N-image.png`.
- Lights start locked. **Unlock** allows dragging. A drag saves the new position.
- **Add Light** creates a light on the current floor and saves it.
- Double-click a light to edit its name, module, channel, and device ID.
- Every light is one lighting channel on the eDIN+ system: **Module** = MBus address (1-511), **Device ID** = module device code (1-255), **Channel** = channel number. A light with a missing or out-of-range value shows grey with a dashed edge ("No channel assigned") and sends nothing.
- Hovering a light sends `?CHANLEVELX,<module>,<device ID>,<channel>;`. The `!CHANLEVELX` reply (also `!CHANLEVEL` and the `!CHANFADE` event) sets the light's brightness; `!CHANSTOP` re-queries it and a non-zero `!CHANERR` outlines the light in red. Replies arrive as a `tcp-message` event on `document` (for both HTTP and TCP).
- While the plan is locked, the hover panel has an on/off switch and a 0-100% slider. Releasing them sends `$CHANFADE,<module>,<device ID>,<channel>,<level 0-255>,500;`. Switching on restores the last non-zero level (255 if none).
- Over TCP the app also sends `$EVTOUT,1;` after connecting so output events (`!CHANFADE`, `!CHANSTOP`) keep lights in step with other controllers. HTTP carries no events.
- Only documented gateway commands are used (`docs/gateway-interface.md` Channel API, vol 2 events and live levels). The channel logic is in `src/Modules/lightChannel.js`.

## Scene buttons

A scene button triggers one eDIN+ scene.

- **Add**: click the pencil icon (bottom edit bar) then **Add Scene Button**. A blue "New Scene" button appears on the current floor, grey with a dashed edge because it has no scene yet.
- **Edit**: click **Unlock**, drag the button into place, then double-click it to set its **Name** and **Scene number** (1-99999, the `<scn-num>` shown in the eDIN+ configuration) and click **Save**. Dragging and edits are saved to `userData/settings.csv` as `$Scenebutton;ID;floor,N,x%,y%,name,scene;`.
- **Trigger**: click **Lock**, then click the button. It sends `$SCNRECALL,<scene>;` (documented in `docs/gateway-interface.md` 6.1.1) through the existing connection, followed by `?SCN,<scene>;` so the button shows the real state: yellow when the scene is active.
- Hovering a button also queries `?SCN,<scene>;`. Replies (`!SCN`, and the `!SCNSTATE` event) arrive as `tcp-message`. Over TCP the app sends `$EVTSCN,1;` after connecting so the button follows scenes recalled from elsewhere; HTTP carries no events.
- A scene that does not exist on the system is acknowledged but does nothing (gateway behaviour), so the button stays inactive. The scene logic is in `src/Modules/sceneButton.js`.

## Page buttons

A page button switches the panel to another page (one of the floor tabs). The eDIN+ GATEWAY documentation (`docs/gateway-interface.md` vols 1-3) has no page or panel navigation command, so this is in-app navigation only and sends nothing to the gateway.

- **Add**: click the pencil icon (bottom edit bar) then **Add Page Button**. A green "New Page" button appears on the current page, grey with a dashed edge because it has no target yet.
- **Edit**: click **Unlock**, drag the button into place, then double-click it to set its **Name** and the page it **Opens** (chosen from your floor names), and click **Save**. Dragging and edits are saved to `userData/settings.csv` as `$Pagebutton;ID;floor,N,x%,y%,name,targetPage;`.
- **Use**: click **Lock**, then click the button to jump to its target page. If the target page no longer exists (fewer floors configured), the button turns grey and does nothing.
- The logic is in `src/Modules/pageButton.js`; the on-screen behaviour is in `src/Modules/pageManagement.js`.

A packaged build keeps its data in the Electron user-data folder under `floorplan-data`, separate from this working copy.
