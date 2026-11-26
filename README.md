# FloorplanV2
Floorplan v2 for edin+

Electron app for placing lights on floor images and sending commands to an eDin+ controller on TCP port 26.

## Run

```
npm install
copy userData\settings.example.csv userData\settings.csv
npm start
```

Floor images go in `userData` as `floor-1-image.png` through `floor-6-image.png`. Site settings and floor images stay on the machine and are not committed.
