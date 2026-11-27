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
- Hovering a light sends `?CHANLEVELX,...` to the controller. Replies arrive as a `tcp-message` event on `document` (for both HTTP and TCP) for the next piece of work.

A packaged build keeps its data in the Electron user-data folder under `floorplan-data`, separate from this working copy.
