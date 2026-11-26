# FloorplanV2

Floorplan for placing lights on floor images and sending commands to an eDin+ controller on TCP port 26.

## Run

```
npm install
npm start
```

The first launch creates `userData/settings.csv` from `userData/settings.example.csv` when that file is missing. Floor images and the live settings file stay on the machine and are not committed.

## Using the app

- Floor buttons switch the plan. Names and the floor count are saved from Settings.
- **Load image** stores a PNG for the current floor as `userData/floor-N-image.png`.
- Lights start locked. **Unlock** allows dragging. A drag saves the new position.
- **Add Light** creates a light on the current floor and saves it.
- Double-click a light to edit its name, module, channel, and device ID.
- Hovering a light sends `?CHANLEVELX,...` to the controller. Replies arrive as a `tcp-message` event on `document` for the next piece of work.

A packaged build keeps its data in the Electron user-data folder under `floorplan-data`, separate from this working copy.
