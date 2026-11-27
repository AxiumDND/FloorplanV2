# eDIN+ Gateway Interface — Volume 3 (Developer)

| | |
|---|---|
| **Title** | Gateway Interface Volume 3 – Developer |
| **Version** | 2.0.3 |
| **Date** | 8 March 2022 (document footer; title block "08 March 2022") |
| **Author** | Jeff Heine |
| **Source** | `Gateway Interface Vol 3 - Developer v2_0_3` (47 pages) |

Markdown transcription of the vendor PDF, for use as a lookup reference when working on the Floorplan app (raw TCP to an eDIN+ NPU controller). This volume builds on [Volume 1](gateway-interface.md) (Standard) and [Volume 2](gateway-interface-vol2.md) (Advanced); general syntax, connection types, event classes, user accounts and access flags are described there.

> **Important (from the PDF):** these developer facilities work closely with the eDIN+ internal workings and many have side-effects on system operation. The vendor asks that you contact Mode Lighting to discuss your application before using them. They require a connection with **administrative privileges** (automatic when no user accounts are in use; otherwise the connection must use an account with the appropriate privileges). **Exception:** the offline scene-setting commands/queries ([chapter 4](#4-offline-scene-setting)) are not restricted to administrator accounts – see 4.1.

Where the PDF is ambiguous, incomplete or contains an apparent typo this is flagged as a **Note (transcription)**. Sections the PDF itself marks "To be completed" are reproduced as such, not filled in.

## Contents

- [Document history](#document-history)
1. [Introduction](#1-introduction)
2. [Overview of developer features](#2-overview-of-developer-features)
3. [The Info web service and CSV files](#3-the-info-web-service-and-csv-files)
4. [Offline scene setting](#4-offline-scene-setting)
5. [External control through GATEWAY](#5-external-control-through-gateway)
6. [Advanced Channel API](#6-advanced-channel-api)
7. [Advanced DALI repair](#7-advanced-dali-repair)
8. [Advanced sensor repair](#8-advanced-sensor-repair)
9. [The XDALI API](#9-the-xdali-api)
- [Quick message index](#quick-message-index)

---

## Document history

| Date | Ver | Initials | Changes |
|---|---|---|---|
| 24-May-19 | 2.0.0 | Jph | Initial draft |
| 11-Jun-19 | 2.0.1 | Jph | Document: HTTP header `ModeLightingTimeout` |
| 14-Dec-21 | 2.0.2 | Jph | Modification for Gateway Ver 2.01 |
| 1-Mar-22 | 2.0.3 | Jph | Modifications for Gateway Ver 2.02. Add External control section and `$MASTERTICK` command. Add Offline scene setting section |

---

## 1 Introduction

### 1.1 Purpose and scope

Details for using the eDIN+ GATEWAY interface for the developer; part of a set of Volumes.

| Volume | Scope |
|---|---|
| Volume 1 – Standard | How to access the GATEWAY and commands and queries that all users can use. |
| Volume 2 – Advanced | Advanced commands and queries that require more advanced knowledge of the eDIN+ system and are only needed to access these advanced features. Some are restricted to users with Administration access. |
| Volume 3 – Developer | Commands and queries that allow some aspects of the eDIN+ system to be tightly integrated with third party products. Restricted to users with Administrator rights; require specialist knowledge of the eDIN+ system. |

### 1.2 Terminology

| Phrase | Description |
|---|---|
| API | Application Programming Interface. A set of protocols that define how to access a system. |
| Controller | A processor that controls a lighting system. The eDIN+ system has 2 types of controller: normal NPU and Standalone Mode. |
| DALI | Digital Addressable Lighting Interface. An industry standard physical interface/network for control of lighting equipment. It allows bi-directional data exchange, allowing its use with sensors, switches and emergency lighting as well as dimmable luminaires. |

### 1.3 References

1. BS EN 62386-102:2014 – Digital addressable lighting interface. Part 102: General Requirements – Control gear.
2. BS EN 62386-202:2009 – Digital addressable lighting interface. Part 202: Particular requirements for control gear — Self-contained emergency lighting (device type 1).

---

## 2 Overview of developer features

This volume describes features that only software developers are likely to need. Some provide the same facilities as the administrator pages of an eDIN+ system; others allow the system to be extended. It assumes familiarity with the eDIN+ system, the GATEWAY interface and Volumes 1 & 2. It is written as a reference manual rather than an application guide; developers may pick and mix facilities.

### 2.1 Developer features

| Section | Feature | Summary |
|---|---|---|
| 2.1.1 | Info web service and CSV info files | A web service separate from the GATEWAY interface giving fuller access to eDIN+ configuration than the discovery queries. Imports/exports the CSV files available manually through the configuration editor web pages or the offline editor – a full list of modules and channels, plus scenes and their scene-setting information. |
| 2.1.2 | Offline scene setting | Volume 1's `$SCNSAVE` saves *live* channel levels and has limitations: (i) a scene can't be adjusted silently/in the background – channels must be visibly set; (ii) DALI virtual channels (`BST` or `Gxx`) can't be adjusted, as they have no readable level state; (iii) you can't change which channels are in a scene. A set of commands overcomes these. |
| 2.1.3 | External control through GATEWAY | An external system can be the primary controller via the GATEWAY while a back-configuration in the eDIN+ takes over when it detects the primary controller is absent (e.g. lost connection). |
| 2.1.4 | Advanced Channel API | Commands/queries useful for advanced operations but which can disrupt normal operation: channel identification and test, module discovery, DALI fixture health queries. |
| 2.1.5 | Advanced DALI repair | Fixes DALI commissioning errors (status error 22 – DALI Commissioning problem) after a fixture is replaced, by finding and repairing the relevant fixtures. |
| 2.1.6 | Advanced sensor repair | "To be completed" (as printed). |
| 2.1.7 | XDALI API – the DALI "back door" | Send any DALI message and perform any DALI operation directly on a DALI bus, bypassing the eDIN+ system. |

---

## 3 The Info web service and CSV files

The Info web service is **separate from the GATEWAY interface**. It provides fuller access to eDIN+ configuration than the GATEWAY discovery queries. Uses include:

- system discovery – lists of modules and channels, and lists of scenes and their scene-setting information;
- offline scene setting – by importing scene-setting information back into the eDIN+ system.

Configuration information can be exported to and imported from Comma-Separated-Variable text files, manually via the configuration editor web pages / offline editor, or via this web service.

### 3.1 Accessing the web service

Plain-text AJAX-like HTTP GET and POST requests to:

```
http://<npu_ip_address>/info?<parameters>
```

using `Content-Type: application/csv`.

### 3.2 Exporting configuration information

Exporting needs **administrator privileges**. This is automatic if no user accounts are set up; otherwise send the username and password of an administrator account using HTTP BASIC Authorization (see Volume 2, Users).

Use **GET** requests. The mandatory `what=` parameter selects the list:

| `what=` | Returns |
|---|---|
| `names` | list of modules and their channels |
| `levels` | list of scenes and the channels they control |
| `dali` | list of DALI buses and their fixtures |

Optional filters per list:

| URL parameters | Effect |
|---|---|
| `what=names` | All areas, plates and modules |
| `what=names&foraddess=<addr-list>` | Only plates/modules with the given MBus addresses (comma-separated) |
| `what=names&fordevicecode=<devcode-list>` | Only plates/modules with the given device codes (comma-separated) |
| `what=names&foraddess=<addr-list>&fordevicecode=<devcode-list>` | Filter by both |
| `what=levels` | All areas and all scenes |
| `what=levels&forarea=<area-num-list>` | Only the given areas' area and scene information (comma-separated) |
| `what=levels&forscene=<scene-num-list>` | Only scenes with the given numbers (comma-separated) |
| `what=dali` | DALI fixture commissioning data for all DALI universes |
| `what=dali&foraddess=<addr-list>` | Only DALI universes with the given MBus addresses (comma-separated) |

Do not use both `forarea` and `forscene` together; `forscene` takes precedence.

> **Note (transcription):** the PDF spells the address filter parameter `foraddess` in the parameter descriptions but `foraddress` in the jQuery example (`what=names&foraddress=6,17`). Which spelling the firmware accepts is not stated; both are reproduced as printed.

Optional global parameter for all lists:

```
&where=<filename>
```

Useful when embedding the URL in web pages to trigger file downloads. The filename is returned in the HTTP response header `Content-Disposition: attachment; filename="<filename>.csv";`. Most HTTP stacks ignore it; browsers and some applications use it to save the data as that file.

jQuery example:

```js
$.ajax({
      type: 'GET',
      url: 'http://'+ipaddr+'/info?what=names&foraddress=6,17',
      contentType: 'application/csv; ',
      dataType: 'text',
      username: 'Administrator',
      password: 'use the proper password here',
    })
```

### 3.3 Importing configuration information

Importing is always an **edit of the configuration** and changes the *edit-stamp* of the SYSTEMID (Volume 1, System Discovery). You MUST supply the eDIN+ system's **configuration password** via HTTP BASIC Authorization, so user accounts MUST be set up to use import. The password protection is to stop accidental changes that could wipe out a large part of the configuration.

Use **POST** requests; the mandatory `what=` parameter selects the data type:

| `what=` | Effect |
|---|---|
| `names` | change module and channel names and areas |
| `levels` | perform scene setting |
| `dali` | re-registers commissioned (expected) DALI fixtures and their settings |

```js
$.ajax({
      type: 'POST',
      url: 'http://'+ipaddr+'/info?what=names',
      data: '!EDIN NAMES FILE\nAREA,1,First Area\n'
      contentType: 'application/csv; ',
      dataType: 'text',
      username: 'configuration',
      password: 'use the proper password here',
    })
```

The best way to learn the format is to export the relevant data, modify the fields and re-import it; you can also create and import only the data you want to change.

Rules for all imported data:

1. CSV: items on separate lines (CR, LF or CR-LF), fields separated by `,`.
2. The first line must identify the data type with a fixed identification text; text after the identification is ignored.
3. A line whose first character is `!` is a comment (item and rest of line ignored).
4. Blank lines are allowed and ignored.
5. Whitespace within a line is NOT removed; do not pad items.
6. The first field of an item is a fixed text token identifying the item type.
7. Each item type has its own format defining its number of fields. Tokens are case-insensitive. Numeric fields must exist and contain at least one digit 0–9; leading zeros and a leading `+`/`-` are allowed but not leading spaces. Text fields are case-sensitive and may be blank.
8. There are no set rules for which fields supply new values and which only identify existing items; an item can define a new item or identify an existing item and modify properties (see formats below).
9. Items with all required fields are accepted; additional fields are ignored.
10. Items that are not recognised, or not allowed to be imported/changed, are ignored.
11. Syntax and values closely follow the equivalent GATEWAY discovery/status queries where they exist.

#### 3.3.1 Names CSV file format

First line MUST be: `!EDIN NAMES FILE`. New items cannot be defined; existing items can be modified:

| Item | Format | Effect |
|---|---|---|
| `PROJECTNAME` | `PROJECTNAME,<name-string>` | Change the configuration project name text |
| `PROJECTVERSION` | `PROJECTVERSION,<version-string>` | Change the project version text |
| `PROJECTOWNER` | `PROJECTOWNER,<owner-string>` | Change the project owner text |
| `AREA` | `AREA,<area-no>,<name-string>` | Change an existing area's name text |
| `PLATE` | `PLATE,<addr>,<devcode>,<area-no>,<name-string>` | Change an existing plate's area number and name text |
| `MODULE` | `MODULE,<addr>,<devcode>,<area-no>,<name-string>` | Change an existing module's area number and name text |
| `CHAN` | `CHAN,<addr>,<devcode>,<chan-no>,<area-no>,<name-string>` | Change an existing output channel's area number and name text |
| `DALI` | `DALI,<addr>,<devcode>,<dali-no>,<area-no>,<name-string>` | Change an existing DALI output channel's area number and name text |
| `DMX` | `DMX,<addr>,<devcode>,<zone-no>,<area-no>,<name-string>` | Change an existing DMX zone's area number and name text |
| `INPSTATE` | `INPSTATE,<addr>,<devcode>,<chan-no>,<area-no>,<name-string>` | Change an existing contact input channel's area number and name text |
| `INPPIR` | `INPPIR,<addr>,<devcode>,<chan-no>,<area-no>,<name-string>` | Change an existing PIR input channel's area number and name text |
| `INPLEVEL` | `INPLEVEL,<addr>,<devcode>,<chan-no>,<area-no>,<name-string>` | Change an existing analogue input channel's area number and name text |

Example:

```
!EDIN NAMES FILE

!the next line changes the project name
PROJECTNAME,Example Project

!the next line changes the name for area no 1
AREA,1,First Area

!the next lines move the first two DALI channels on UBC at address 3 in to area no 1 and change their name
DALI,3,17,1,1,DALI Channel 1
DALI,3,17,2,1,Main Downlights
```

#### 3.3.2 Levels CSV file format

First line MUST be: `!EDIN LEVELS FILE`. New items cannot be defined; existing items can be modified:

| Item | Format | Effect |
|---|---|---|
| `AREA` | `AREA,<area-no>,<name-string>` | Change an existing area's name text |
| `SCENE` | `SCENE,<scene-no>,<name-string>` | Change an existing scene's name text |
| `SCNFADE` | `SCNFADE,<scene-no>,<fadetime-ms>` | Change an existing scene's fade time (ms) |
| `SCNCHANLEVEL` | `SCNCHANLEVEL,<scene-no>,<addr>,<devcode>,<chan-no>,<level>` | Change an existing scene channel's level |
| `SCNDALILEVEL` | `SCNDALILEVEL,<scene-no>,<addr>,<devcode>,<dali-no>,<level>` | Change an existing scene DALI channel's level |
| `SCNDMXLEVEL` | `SCNDMXLEVEL,<scene-no>,<addr>,<devcode>,<zone-no>,<level>` | Change an existing scene DMX zone's level |
| `SCNCHANRGBCOLR` / `SCNDMXRGBCOLR` | `SCNCHANRGBCOLR,<scene-no>,<addr>,<devcode>,<chan-no>,<colour>` and `SCNDMXRGB,<scene-no>,<addr>,<devcode>,<zone-no>,<colour>` (as printed) | Change an existing scene channel/zone's colour: preset value or `#rrggbb` colour |
| `SCNCHANRGBPLAY` / `SCNDMXRGBPLAY` | `SCNCHANRGBPLAY,<scene-no>,<addr>,<devcode>,<chan-no>,<seq>` and `SCNDMXRGBPLAY,<scene-no>,<addr>,<devcode>,<zone-no>,<seq>` | Change an existing scene channel/zone's sequence value |
| `SCNCHANTWCOLR` / `SCNDMXTWCOLR` | `SCNCHANTWCOLR,<scene-no>,<addr>,<devcode>,<chan-no>,<kelvin>` and `SCNDMXTWCOLR,<scene-no>,<addr>,<devcode>,<zone-no>,<kelvin>` | Change an existing scene channel/zone's colour temperature: preset value or `#kelvinK` |

> **Note (transcription):** the PDF's item-name cell reads `SCNCHANRGBCOLR` / `SCNDMXRGBCLOR` and the DMX format as `SCNDMXRGB,…`, while the example uses `SCNDMXRGBCOLR`. The consistent name is `SCNDMXRGBCOLR`; the others are typos in the PDF.

Example:

```
!EDIN LEVELS FILE

!the next line changes the fade time to 1 sec for scene no 3
SCNFADE,3,1000

! the next lines change the levels for scene no 5
SCNCHANLEVEL,5,1,12,3,255
SCNDMXLEVEL,5,2,15,1,255
SCNDMXRGBCOLR,5,2,15,1,#FF0080
```

#### 3.3.3 DALI CSV file format

First line MUST be: `!EDIN DALI COMMISSIONING FILE`. You can:

- completely clear existing commissioning data for an existing DALI universe and import new data for it;
- modify an existing DALI fixture (on an existing DALI universe);
- add new DALI fixtures to an existing DALI universe.

It is **not** possible to delete a single existing fixture except by deleting the data for the whole universe and re-importing it without that fixture.

Notes:

- This data defines or modifies the *expected fixture list* within an eDIN+ system. It does **not** reprogram or commission the physical fixtures.
- Keep all `BALLAST` items for the same DALI universe together; do not interleave `BALLAST` items for different universes.
- Use `DALIUNIVERSE` before any `BALLAST` items for that universe, as `DALIUNIVERSE` deletes all existing data (including data that comes before it).

| Item | Format | Effect |
|---|---|---|
| `DALIUNIVERSE` | `DALIUNIVERSE,<addr>,<devcode>` | Delete all existing fixture commissioning data for an existing DALI universe |
| `BALLAST` | `BALLAST,<addr>,<devcode>,<short-addr>,<long-addr>,<type>,<groups>` | Define a new fixture for an existing DALI universe, **or** change the type, groups and long address values of an existing fixture |

Example:

```
!EDIN DALI COMMISSIONING FILE

! the next item deletes all DALI commissioning data on UBC 3,17
DALIUNIVERSE,3,17
! the next items redefine 5 new fixtures for the universe
BALLAST,3,17,0,2109473,0,1
BALLAST,3,17,1,7811888,0,2
BALLAST,3,17,2,12129130,0,4
BALLAST,3,17,13,10722243,0,8
BALLAST,3,17,24,6492078,0,16
```

---

## 4 Offline scene setting

Offline scene setting does not rely on live channel levels. It lets you redefine a scene's fade time, which channels are in it, and their levels/states. It is more complex than the live `$SCNSAVE` method and a scene can be badly broken if care is not taken.

Advantages:

1. Does not rely on live levels – channels/levels can be defined away from the live system and uploaded remotely.
2. Can adjust channels that have no live state or level, specifically DALI virtual channels (`BST` or `Gxx`).
3. Can change which channels are in a scene.
4. Can adjust a scene almost silently and in the background – live channel levels are not changed.

Limitations:

1. Cannot create new scenes (new scene numbers); can replace existing scene definitions.
2. The **complete** scene definition (full channel list and all levels/states) must be sent every time, not just changed channels – so you need the existing channel list and values to adjust even one channel.
3. The operation must complete within a finite time and may fail (see 4.1).

### 4.1 Offline scene set overview

A set of commands defining the scene (fade time, channels, level/state/colour) is sent as a single operation, framed by `$SCNSET` at the start and `$SCNEND` at the end.

- Like `$SCNSAVE`, `$SCNSET` is an adjustment and changes the adjust-stamp in the `?SYSTEMID` query.
- Like `$SCNSAVE`, the scene is only changed if it allows editing (access-level Edit flag set); only controllable channels can have state/level/colour adjusted; only editable channels can be added to or deleted from a scene (see Volume 2).
- Like `$SCNSAVE`, scenes need not include both level and colour entries for colour / tuneable white channels, and only existing scenes can be changed.
- Unlike `$SCNSAVE`, you must send all channels in the scene, not just those that change.
- Unlike `$SCNSAVE`, the operation can fail and not adjust the scene; handle it if important.
- Unlike `$SCNSAVE`, channels can be added to and deleted from the scene.

The command set MUST include a command for every channel in the scene, even channels not being adjusted. A fade-time command need only be included if the fade time is changing; otherwise it is unchanged.

If no accounts are set up, all `SCNSET` commands are actioned (all scenes and channels are editable). A successful `$SCNSET` command list deletes all existing channels and (provided the channels exist) replaces them with the new definitions.

If user accounts are set up, **any user can use this method** (these commands/queries are NOT restricted to administrator accounts), but the scene must be editable and channels controllable or editable:

- Un-editable scenes are invisible to `SCNSET` commands and queries: ignored, with no `$SCNEND` / `?SCNSET` replies.
- Un-editable channels cannot be deleted from a scene; they persist even when absent from the command list.
- Un-editable channels cannot be added; the command is ignored.
- Un-controllable channels cannot have level/state/colour changed; the command is ignored.

The operation is almost invisible to the end user and does not change live channel levels, but it **invalidates the scene's state**, so plate buttons and others monitoring scene state may be affected.

The GATEWAY supports multiple simultaneous connections, so `$SCNSET` also acts as a request for the scene's **internal token**. Only one connection can hold a scene's token at a time; connections not granted the token have their scene-set commands ignored. The token is granted for a limited time and expires automatically if the connection does not explicitly finish. Complete operations in a finite time; there is a small chance an operation will fail or be ignored. This normally need not be considered but matters for troubleshooting and exception handling.

### 4.2 SCNSET method

1. Request the current definition with `?SCNSET` (and optionally `?SCNSETNAMES` for channel-element names, e.g. to present to an end user). `?SCNSET` returns the channel elements in the scene with their level/state/colour, plus the fade time.
2. Modify the element list and return it using the `SCNSET` commands.
3. To confirm, inspect the responses to the commands, or run a second `?SCNSET` and check the list. Only send the `?SCNSET` query after receiving the `!SCNSETACK` acknowledgment. With the HTTP web service, the `?SCNSET` query should be in a separate POST request.

Send the commands as a **single transaction**; with HTTP send them in a single POST request (the POST response includes `!SCNSETACK`).

| Step | Action |
|---|---|
| 1 | Send `$SCNSET` to begin the transaction. |
| 2 | (Optional) Send `$SCNFADE` to set a new default scene fade time; if omitted the existing value is preserved. Not all built-in configurations use a scene's default fade time when recalling it, so changing it may not change internal behaviour; in that case the fade time can only be changed by reconfiguring the system. |
| 3 | Send `$SCNCHAN` / `$SCNDALI` / `$SCNDMX…` commands for each channel in the scene. A channel without a new message is not in the new definition. |
| 4 | Send `$SCNEND` to complete the transaction and save the definition. `!SCNSETACK` is returned when the save is complete and says whether the operation was performed. |

Notes:

- On long-lived connections (not HTTP), after the initial `$SCNSET` the next SCNSET message must be sent **within 30 seconds** (the scene setting timeout), until `$SCNEND` or `$SCNABORT`. Otherwise the whole operation is aborted and the previous definition is unaffected.
- All scene-setting commands in a transaction must be sent on the **same session**; messages from a different session after the initial `$SCNSET` are rejected. With HTTP each POST request is its own session, so send everything in one POST.
- Only **one** active SCNSET transaction is allowed per scene. If `$SCNSET` is sent during an ongoing transaction on another session, the whole transaction on this session fails and is reported by the response to its terminating `$SCNEND`.
- `$SCNABORT;` aborts all current transactions on the session. On long-lived connections it may be prudent to prepend it to every SCNSET transaction; it is unnecessary over HTTP.
- `!SCNSETACK` is sent in response to `$SCNEND` and completes the transaction. Its status indicates whether the transaction obtained the internal token and performed the scene save; it does **not** indicate that every channel message was processed and saved.
- Each `$SCNxxx` channel message is processed independently: an error in a message, or a non-existent channel, means that channel is not added, but the rest of the transaction still runs. To confirm all channels were saved, re-query the definition.
- Only the level/state/colour of a channel element can be set via the GATEWAY; names reported by `?SCNSETNAMES` are informational and fixed by the configuration.

### 4.3 Scene set commands

Mirror the direct output channel commands of the Volume 1 Channel API. All **From v02.02**. Long-ack formats are `!OK,<same message>…`.

**Begin (time-limited)**

```
$SCNSET,<scn-num>;
Long-ack Format: !OK,SCNSET,<scn-num>;
```

followed by zero or more "Set Scene Item" commands:

| Item | Command syntax |
|---|---|
| Scene fade time (optional) | `$SCNFADE,<scn-num>,<fadetime(ms)>;` — long-ack `!OK,SCNFADE,<scn-num>,<fadetime(ms)>;` |
| Channel to level | `$SCNCHAN,<scn-num>,<addr>,<devcode>,<chan-num>,<level>;` · `$SCNDALI,<scn-num>,<addr>,<devcode>,<chan-num>,<level>;` · `$SCNDMX,<scn-num>,<addr>,<devcode>,<zone-num>,<level>;` — long-ack `!OK,SCNxxx,<scn-num>,<addr>,<devcode>,<chan/zone-num>,<level>;` |
| DALI virtual channel to level | `$SCNDALI,<scn-num>,<addr>,<devcode>,BST,<level>;` · `$SCNDALI,<scn-num>,<addr>,<devcode>,G<xx>,<level>;` — long-ack `!OK,SCNDALI,<scn-num>,<addr>,<devcode>,<dali-id>,<level>;` |
| Static preset colour | `$SCNDMXRGBCOLR,<scn-num>,<addr>,<devcode>,<zone-num>,<preset>;` · `$SCNCHANRGBCOLR,<scn-num>,<addr>,<devcode>,<chan-num>,<preset>;` |
| Direct static colour | `$SCNDMXRGBCOLR,<scn-num>,<addr>,<devcode>,<zone-num>,#<wrgb>;` · `$SCNCHANRGBCOLR,<scn-num>,<addr>,<devcode>,<chan-num>,#<wrgb>;` |
| Play colour sequence | `$SCNDMXRGBPLAY,<scn-num>,<addr>,<devcode>,<zone-num>,<preset>;` · `$SCNCHANRGBPLAY,<scn-num>,<addr>,<devcode>,<chan-num>,<preset>;` |
| Preset colour temperature | `$SCNCHANTWCOLR,<scn-num>,<addr>,<devcode>,<chan-num>,<preset>;` · `$SCNDMXTWCOLR,<scn-num>,<addr>,<devcode>,<zone-num>,<preset>;` |
| Direct colour temperature | `$SCNCHANTWCOLR,<scn-num>,<addr>,<devcode>,<chan-num>,#<kelvin>K;` · `$SCNDMXTWCOLR,<scn-num>,<addr>,<devcode>,<zone-num>,#<kelvin>K;` |

(For the colour/temperature items the long-ack is `!OK,` followed by the same message name.)

**End of scene definition**

```
$SCNEND,<scn-num>;
Long-ack Format: !OK,SCNEND,<scn-num>;
Reply ("Report scene set acknowledge"): !SCNSETACK,<scn-num>,<status>;
status = 1 for SCNSET operation performed, 0 for operation not performed
```

Only editable scenes (Edit access bit set) can be defined. Only controllable channels (Control access bit set) can be included in a scene definition; view-only channels are left unaffected. Messages must form a single transaction; on long-lived connections each message must arrive within 30 s of the previous one, otherwise the process is aborted; over HTTP the messages must be in a single POST.

**Abort all active scene definitions on session** (From v02.02)

```
$SCNABORT;
Long-ack Format: !OK,SCNABORT;
```

Example (the PDF shows commands first, then the replies):

```
$scnAbort;    (optional tidy) (only on long-lived connections)
$scnSET,3;
$scnFade,3,10000;
$scnChan,3,2,21,5,255;
$scnChanRgbColr,3,2,21,5,#ff7f00;
$scnChanTwColr,3,2,21,2,#2200K;
$scnDALI,3,3,17,12,200;
$scnDMXRgbColr,3,4,15,1,4;
$scnEnd,3;

!OK,SCNABORT;<CR><LF>
!OK,SCNSET,00003;<CR><LF>
!OK,SCNFADE,00003,00010000;<CR><LF>
!OK,SCNCHAN,00003,002,21,005,255;<CR><LF>
!OK,SCNCHANRGBCOLR,00003,002,21,005,#FF7F00;<CR><LF>
!OK,SCNCHANTWCOLR,00003,002,21,002,#2200K;<CR><LF>
!OK,SCNDALI,00003,003,17,012,200;<CR><LF>
!OK,SCNDMXRGBCOLR,00003,004,15,001,004;<CR><LF>
!OK,SCNEND,00003;<CR><LF>
!SCNSETACK,00003,1;<CR><LF>
```

### 4.4 Scene set queries

The Volume 1 discovery messages (`?SYSTEMID`, `?AREANAMES`, `?SCNNAMES`) still apply. Two new queries support scene setting: `?SCNSETNAMES` and `?SCNSET`.

#### 4.4.1 Scene definition query

Returns the channel elements in the scene with the level/state/colour set by the scene, plus the scene's fade time.

| | |
|---|---|
| Query | `?SCNSET,<scn-num>;` |
| Long-ack format | `!OK,SCNSET,<scn-num>;` |
| From | v02.02 |

Reply: `!SCNSET,<scn-num>;` (start), followed by zero or more "Report Scene Item" messages, then `!SCNEND,<scn-num>;`:

| Item | Reply syntax |
|---|---|
| Scene fade time | `!SCNFADE,<scn-num>,<fadetime(ms)>;` |
| Channel level | `!SCNCHAN,<scn-num>,<addr>,<devcode>,<chan-num>,<level>;` · `!SCNDMX,<scn-num>,<addr>,<devcode>,<zone-num>,<level>;` · `!SCNDALI,<scn-num>,<addr>,<devcode>,<dali-num>,<level>;` |
| DALI virtual channel level | `!SCNDALI,<scn-num>,<addr>,<devcode>,BST,<level>;` · `!SCNDALI,<scn-num>,<addr>,<devcode>,G<xx>,<level>;` |
| Static colour | `!SCNDMXRGBCOLR,<scn-num>,<addr>,<devcode>,<zone-num>,<preset>;` · `…,#<wrgb>;` · `!SCNCHANRGBCOLR,<scn-num>,<addr>,<devcode>,<chan-num>,<preset>;` · `…,#<wrgb>;` |
| Colour temperature | `!SCNCHANTWCOLR,<scn-num>,<addr>,<devcode>,<chan-num>,<preset>;` · `…,#<kelvin>K;` · `!SCNDMXTWCOLR,<scn-num>,<addr>,<devcode>,<zone-num>,<preset>;` · `…,#<kelvin>K;` |
| Colour sequence | `!SCNDMXRGBPLAY,<scn-num>,<addr>,<devcode>,<zone-num>,<preset>;` · `!SCNCHANRGBPLAY,<scn-num>,<addr>,<devcode>,<chan-num>,<preset>;` |

Only editable scenes report their items; only controllable channels are reported.

```
?scnSET,3;
!OK,SCNSET,00003;<CR><LF>
!SCNSET,00003;<CR><LF>
!SCNFADE,00003,00010000;<CR><LF>
!SCNCHAN,00003,002,21,005,255;<CR><LF>
!SCNCHANRGBCOLR,00003,002,21,005,#FF7F00;<CR><LF>
!SCNCHANTWCOLR,00003,002,21,002,#2200K;<CR><LF>
!SCNDALI,00003,003,17,BST,200;<CR><LF>
!SCNDMXRGBCOLR,00003,004,15,001,004;<CR><LF>
!SCNEND,00003;<CR><LF>
```

#### 4.4.2 Channel discovery for scene set operations

Returns the channel elements in the scene with their names; one name item is reported for every element item in the corresponding `?SCNSET` query.

| | |
|---|---|
| Query | `?SCNSETNAMES,<scn-num>;` |
| Long-ack format | `!OK,SCNSETNAMES,<scn-num>;` |
| From | v02.02 |

Reply: `!SCNSETNAMES,<scn-num>;` (start), zero or more "Report Scene Item Name" messages, then `!SCNSETNAMESEND,<scn-num>;`:

| Item | Reply syntax (as printed) |
|---|---|
| Channel name | `!SCNCHANNAME,<scn-num>,<addr>,<devcode>,<chan-num>,<name>;` · `!SCNDMXNAME,<scn-num>,<addr>,<devcode>,<zone-num>,<name>;` · `!SCNDALINAME,<scn-num>,<addr>,<devcode>,<dali-num>,<name>;` |
| DALI virtual channel name | `!SCNDALI,<scn-num>,<addr>,<devcode>,BST,<name>;` · `!SCNDALI,<scn-num>,<addr>,<devcode>,G<xx>,<name>;` |
| Colour channel name | `!SCNDMXRGBCOLR,<scn-num>,<addr>,<devcode>,<zone-num>,<name>;` · `!SCNCHANRGBCOLR,<scn-num>,<addr>,<devcode>,<chan-num>,<name>;` |
| Colour temperature channel name | `!SCNCHANTWCOLR,<scn-num>,<addr>,<devcode>,<chan-num>,<name>;` · `!SCNDMXTWCOLR,<scn-num>,<addr>,<devcode>,<zone-num>,<name>;` |
| Play-sequence channel name | `!SCNDMXRGBPLAY,<scn-num>,<addr>,<devcode>,<zone-num>,<name>;` · `!SCNCHANRGBPLAY,<scn-num>,<addr>,<devcode>,<chan-num>,<name>;` |

Only editable scenes report their items; only controllable channels are reported.

```
?scnSetNames,3;
!OK,SCNSETNAMES,00003;<CR><LF>
!SCNSETNAMES,00003;<CR><LF>
!SCNCHANNAME,00003,002,21,005,Downlights;<CR><LF>
!SCNCHANRGBCOLRNAME,00003,002,21,005,Downlights;<CR><LF>
!SCNCHANTWCOLRNAME,00003,002,21,002,;<CR><LF>
!SCNDALINAME,00003,003,17,BST,All;<CR><LF>
!SCNDMXRGBCOLRNAME,00003,004,15,001,Meeting Room 1;<CR><LF>
!SCNSETNAMESEND,00003;<CR><LF>
```

> **Note (transcription):** the PDF's format list for the names reply uses the same message names as `?SCNSET` for the DALI-virtual, colour and temperature items (e.g. `!SCNDALI`, `!SCNCHANRGBCOLR`), but the example uses `…NAME`-suffixed names (`!SCNCHANRGBCOLRNAME`, `!SCNCHANTWCOLRNAME`, `!SCNDALINAME`, `!SCNDMXRGBCOLRNAME`). The example is likely the better guide to what the firmware emits, but the PDF does not say so. Also, in the `?SCNSET` example the DALI virtual channel is `BST` whereas the `$SCNSET` example sets `$scnDALI,3,3,17,12,200` (DALI channel 12) – they are independent examples.

---

## 5 External control through GATEWAY

To use the GATEWAY via an NPU the NPU must have a configuration loaded: either a minimal configuration that simply defines the hardware modules, or a fuller one that also provides controller functions (rules triggered by input events). To be the system controller (respond to input events and drive output channels) there are two ways:

**A. Minimal configuration, no backup controller.** Create a configuration that only defines the hardware modules – no rules, scenes, areas etc. – and use the Channel API commands and queries. Without rules the in-built controller is passive: it reports via the GATEWAY but does not respond to input events or drive channels. Enabling and using GATEWAY events is recommended to respond in a timely fashion.

**B. Configuration with backup controller.** An external system is the primary controller via the GATEWAY, with a backup configuration (modules plus rules, scenes, areas, etc.) that takes over if it detects the primary controller is absent (e.g. lost connection). The only extra requirement is to **inhibit** the internal controller so it does not compete with/override your primary controller: repeatedly announce your presence using `$MASTERTICK`. Using GATEWAY events is again recommended.

### 5.1 Inhibit in-built backup control

#### 5.1.1 Master Tick command

Usable only on connections with **administrator privileges**.

Use it to take control of the eDIN+ system and inhibit the internal controller. It must be sent repeatedly so the internal controller knows the external controller is alive. When the internal controller no longer detects it, it takes back control.

- Send it **every second**; it also acts as a system heartbeat, sending the current time across the eDIN+ system so all parts can synchronise.
- The parameter is the current time as **seconds since 00:00:00 1 Jan 1970 UTC** – UTC, not local time.
- The internal controller waits about **5 seconds** with no `$MASTERTICK` before taking back control: stable if the external system stalls for a couple of seconds, but the backup kicks in reasonably quickly if external control is lost.

| | |
|---|---|
| Command | `$MASTERTICK,<seconds_since_1_jan_1970_utc>;` |
| Long-ack format | `!OK,MASTERTICK,<seconds_since_1_jan_1970_utc>;` |
| From | 02.02 |

```
$masterTick,1646218969;
!OK,MASTERTICK,1646218969;<CR><LF>
```

---

## 6 Advanced Channel API

### 6.1 Advanced module discovery

The Volume 1 discovery queries give information about areas, scenes and plates, with limited module hardware information. `?MODULENAME` (the PDF text also calls it `?MODULENAMES`) returns information about the modules. It follows the same format as `?PLATENAMES` but can be filtered by **device code** instead of area. Unlike `?PLATENAMES` it **can be used without a configuration loaded**, so it is a useful companion to the XDALI API (also needing no configuration): use it to find available UBCs and DALI universes to inject DALI messages on.

Most response items are not very useful: `device-style` is unused and always 0; modules are not usually assigned to an area, so `area-num` is likely 0 and access fully public (7); modules are not usually named. The main value is that the response exists at all, and provides the address and device code needed to access the module in other messages.

| Field | Meaning |
|---|---|
| `addr`, `devcode` | Address and device code of the module |
| `device-style` | 0, currently unused |
| `access` | bit-field flags 1 (viewable) + 2 (controllable) + 4 (editable) |
| `area-num` | Area number, decimal |
| `module-name` | Descriptive name in UTF-8 text |

**Request module names** – all modules, or only one device code.

| | |
|---|---|
| Query | `?MODULENAME;` or `?MODULENAME,<device-code>;` |
| Long-ack format | `!OK,MODULENAME;` or `!OK,MODULENAME,00000;` (as printed) |
| From | v02.00 |
| Reply | zero or more `!MODULENAME,<addr>,<devcode>,<device-style>,<access>,<area-num>,<module-name>;` |

```
?MODULENAME,17;
!OK,MODULENAME,017;
!MODULENAME,001,017,00,07,00000,;<CR><LF>
!MODULENAME,002,017,00,07,00000,;<CR><LF>
```

> **Note (transcription):** the PDF uses `?MODULENAMES` in running text and chapters 7/9 but defines and exemplifies the message as `?MODULENAME` / `!MODULENAME`. The command definition and example are used here as the reference form. The long-ack example (`!OK,MODULENAME,017;`) shows the device code, not `00000`.

### 6.2 Channel test and fixture identification

Visibly flash a lighting channel or fixture, e.g. to tie eDIN+ numbers to physical circuits/fixtures or check a circuit operates. A channel can be temporarily overridden to gently flash, and a DALI fixture can be made to flash or identify itself.

- Only **one** channel or fixture per module can be identified at a time; identifying another on the module automatically cancels the previous identification. Cancelling is sent to the **module**, not the channel.
- The override has a built-in **timeout of 300 seconds (5 minutes)**; resending the `$SHOW…` command within that time restarts the 5 minutes.

#### 6.2.1 Identify channel or fixture

Only channels with the Control access flag set are affected, and not all channel types can be overridden. Identifying a channel makes it continually ramp from minimum to maximum and back until cancelled. A DALI fixture is identified using advanced DALI addressing (Volume 2): `F` followed by the short address.

| Command | Syntax | Long-ack | From |
|---|---|---|---|
| Cancel identify on a module | `$SHOWOFF,<addr>,<devcode>;` | `!OK,SHOWOFF,<addr>,<devcode>;` | v02.00 |
| Identify channel | `$SHOWCHAN,<addr>,<devcode>,<chan-num>;` | `!OK,SHOWCHAN,…;` | v02.00 |
| Identify DALI channel | `$SHOWDALI,<addr>,<devcode>,<dali-num>;` | `!OK,SHOWDALI,…;` | v02.00 |
| Identify DALI fixture | `$SHOWDALI,<addr>,<devcode>,<dali-fixture>;` | `!OK,SHOWDALI,…;` | v02.00 |

```
$showOff,08,2;
!OK,SHOWOFF,008,002;<CR><LF>
$showChan,08,2,1;
!OK,SHOWCHAN,008,002,001;<CR><LF>
$showDali,05,17,3;
!OK,SHOWDALI,005,017,003;<CR><LF>
$showDali,2,17,F0;
!OK,SHOWDALI,002,017,F00;
```

### 6.3 DALI fixture status

If configured to do so, a UBC can report problems with individual DALI fixtures with a `!DALIERR,<addr>,<devcode>,Fxx,<status-code>` event (Volume 2, Channel Health events). These fixture errors are also reported by `?ERRORS` (Volume 1, System Health). The status of one fixture can also be queried.

#### 6.3.1 Request DALI fixture status

Same as the DALI channel status query but with a fixture identifier, returning only the DALI fixture health message. A fixture must be a **known** fixture (in the expected fixture list of the DALI commissioning data) to be reported; to learn about actual fixtures scan the bus with `$DALISCAN` (chapter 7). The fixture identifier is `F` followed by the DALI short address 0–63, e.g. `F01`.

| | |
|---|---|
| Query | `?DALI,<addr>,<devcode>,<dali-fixture>;` |
| Long-ack format | `!OK,DALI,<addr>,<devcode>,<dali-fixture>;` |
| From | v02.00 |
| Reply | `!DALIERR,<addr>,<devcode>,<dali-fixture>,<status-code>;` |

```
?dali,1,17,F1;
!OK,DALI,001,017,F01;<CR><LF>
!DALIERR,001,017,F01,000;<CR><LF>
```

---

## 7 Advanced DALI repair

DALI fixtures must be commissioned with correct settings to work properly in an eDIN system. If a fixture fails and is replaced, the new fixture must be programmed with the correct settings. The eDIN+ system can continually monitor DALI fixtures and, on detecting changed settings or missing/new fixtures, reports status error **22 – DALI Commissioning problem**. To clear it the UBC DALI universe must be repaired. Tools available:

- advanced module discovery (find UBC and other modules);
- commands to physically identify an output/DALI channel or DALI fixture (flash it or have it identify itself), tying eDIN+ numbers to physical circuits/fixtures;
- commands and queries to scan a DALI universe, report all discovered fixtures and their status, then either accept a fixture's settings into the commissioning data or repair a physical fixture's settings back to the expected values.

### 7.1 DALI Repair API and Events

All commands and queries here need a connection with **administrator privileges**. All events are in the **Advanced events class** (`EVTADV` – Volume 2, Events).

#### 7.1.1 Advanced DALI sessions

While performing repair commands/queries that change the fixture information the system knows, it is important to turn off and reset the system's fixture error checking: this is entering a **repair session**. It happens implicitly on a UBC when it receives any DALI Repair API command or query, or explicitly on all UBCs with `$DALICAPTURE`.

- On entering a repair session a UBC clears and resets all DALI errors it is reporting (so `$DALICAPTURE` is itself a way to reset DALI errors in a system).
- While in a repair session the UBC no longer checks for fixture errors, so you must end the session on all UBCs with `$DALIDONE` to restore normal detection.
- A repair session has an internal timeout of **5 minutes** that returns the UBC to normal operation. It is extended by every Repair API command/query received and can be extended explicitly with `$DALICAPTURE`.

| Command | Syntax | Long-ack | From | Purpose |
|---|---|---|---|---|
| Start a repair session | `$DALICAPTURE;` | `!OK,DALICAPTURE;` | v01.00 | Explicitly capture all UBC/DALI universes |
| End a repair session | `$DALIDONE;` | `!OK,DALIDONE;` | v01.00 | Must be the last command of a repair session; resets DALI universe status and restarts runtime checking |

```
$daliCapture;
!OK,DALICAPTURE;<CR><LF>
$daliDone;
!OK,DALIDONE;<CR><LF>
```

#### 7.1.2 Advanced DALI scans

To find out which fixtures actually exist on a UBC / DALI universe, scan the bus with `$DALISCAN`. This collects information on fixtures currently seen on the bus and matches them against the expected fixture list from the DALI commissioning data. Progress is available via `?DALISCAN`, or via `!DALISCAN` events generated at the start and end of a scan. Results are obtained as described in 7.1.3.

Scan status values: `0` idle, `1` search done, `2` searching, `3` programming, `4` error.

| Message | Syntax | Long-ack | From |
|---|---|---|---|
| Perform a DALI scan (command) | `$DALISCAN,<addr>,<devcode>;` | `!OK,DALISCAN,<addr>,<devcode>;` (format printed as `000,000`) | v01.00 |
| Request scan status (query) | `?DALISCAN,<addr>,<devcode>;` | `!OK,DALISCAN,<addr>,<devcode>;` | v01.00 |
| Report DALI scan status (reply & event, class `EVTADV`) | `!DALISCAN,<addr>,<devcode>,<scan-status>,<num-of-fixtures>;` | – | v01.00 |

```
$daliScan,1,17;
!OK,DALISCAN,001,017;<CR><LF>

?daliScan,1,17;
!OK,DALISCAN,001,017;<CR><LF>
!DALISCAN,001,017,1,24;<CR><LF>
```

#### 7.1.3 Advanced DALI live fixtures

A scan collects information on fixtures currently on the DALI bus. Obtain results with `?DALIFIX` (note `?DALISCAN` returns scan *progress*, not results). `?DALIFIX` returns no fixture data until a scan has been performed; fixture data is updated by fixture events from `$DALISCAN`, `$DALIREPAIR` and `$DALIACCEPT`, and can be queried repeatedly without affecting it. The same data comes from `!DALIFIX` events generated in real time during those operations (so no extra query is needed). During a scan `!DALIFIX` events arrive at irregular intervals – long gaps between some and short gaps between others are normal. `!DALIEND` (response or event) indicates no further fixture information; the event is generated at the end of a scan.

The `!DALIFIX` message includes a **fixture-status**, which uses different codes from the `!DALIERR` health status codes. If a fixture has no short address it is reported with the (unusual) `FXX` identifier; that identifier is also used with fixture-status 9 (Unassigned) to indicate a previously known fixture is being removed/deleted.

**DALI scan fixture status codes**

| Value | Name | Description |
|---|---|---|
| 0 | Ok | No error with fixture |
| 1 | Lamp Failure | Fixture is reporting lamp failure |
| 2 | Missing | The expected fixture with its correct settings is not present on the DALI bus |
| 5 | New | A fixture is present that does not match any of the expected fixtures in the DALI commissioning data |
| 8 | Address Clash | More than one fixture has the same short address (commissioning problem) |
| 9 | Unassigned | Fixture does not exist or does not have a valid DALI short address |

> **Note (transcription):** in 7.1.4's summary the PDF describes the missing-fixture status as "5 Missing" and the summary line in 7.1.3 lists "0 = OK, 2 = missing, 5 = new". The status table (2 = Missing, 5 = New) and all examples are consistent with 2 = Missing, 5 = New.

Field summary:

| Field | Meaning |
|---|---|
| `dali-fixture` | DALI identifier for fixture short address 0–63 |
| `long-addr` | DALI fixture 24-bit long or random address |
| `groups` | DALI fixture 16-bit groups bit-field |
| `device-type` | DALI fixture 8-bit device type |
| `fixture-status` | see table above |

| Message | Syntax | Notes |
|---|---|---|
| Request DALI fixture information (query) | `?DALIFIX,<addr>,<devcode>;` | Long-ack `!OK,DALIFIX,<addr>,<devcode>;`; From v01.00. Reply: zero or more `!DALIFIX…` then `!DALIEND…` |
| Report of DALI fixture information (reply & event, `EVTADV`) | `!DALIFIX,<addr>,<devcode>,<dali-fixture>,<long-addr>,<groups>,<device-type>,<fixture-status>;` | From v01.00 |
| End of DALI fixture information (reply & event, `EVTADV`) | `!DALIEND,<addr>,<devcode>;` | From v01.00 |

```
?daliFix,1,17;
!OK,DALIFIX,001,017;<CR><LF>
!DALIFIX,001,017,F00,04905615,00064,000,0;<CR><LF>
!DALIFIX,001,017,F01,53195828,00032,000,1;<CR><LF>
!DALIFIX,001,017,F01,14096720,00002,000,5;<CR><LF>
!DALIEND,001,017;<CR><LF>
```

#### 7.1.4 Advanced DALI repair

Commands that adjust both physical fixtures and the DALI commissioning data so fixture errors stop being reported.

- **Repairing** matches an *expected* fixture in the commissioning data with an *actual* physical fixture on the bus (typically an existing fixture replaced by a new one without the right settings). It reprograms the physical fixture where possible so its settings match the expected fixture – including **short address and groups**. Where the physical fixture cannot be adjusted, the expected fixture settings in the commissioning data are adjusted to match the physical fixture – including **long address and DALI device type**.
- **Accepting** only modifies the commissioning data to match the physical fixture, without changing the physical fixture: accept missing fixtures to delete them, accept new fixtures to add them, or accept minor changes to existing fixtures to stop DALI errors.

Both generate an event for the operation itself plus `!DALIFIX` events for the affected fixtures; these also update the internal fixture list reported by `?DALIFIX`. It may be easier to let the system track changes and request a fresh `?DALIFIX` when needed; after many operations consider a new `$DALISCAN` to verify the bus.

| Term | Meaning |
|---|---|
| `missing-fixture` | Id of an expected fixture (usually with a status of missing) |
| `new-fixture` | Id of a physical fixture (usually with a status of new) |
| `new-or-missing-fixture` | Id of a new or missing fixture that will be added to or deleted from the commissioning data. If there are both new and missing fixtures at the same short address, the existing fixture's data is replaced by the new fixture |

| Message | Syntax | Long-ack / notes | From |
|---|---|---|---|
| Repair a DALI fixture (command) | `$DALIREPAIR,<addr>,<devcode>,<missing-fixture>,<new-fixture>;` | `!OK,DALIREPAIR,…;` | v01.00 |
| Import (accept) a DALI fixture (command) | `$DALIACCEPT,<addr>,<devcode>,<new-or-missing-fixture>;` | `!OK,DALIACCEPT,…;` | v01.00 |
| Repair of DALI fixture (event, `EVTADV`) | `!DALIREPAIR,<addr>,<devcode>,<missing-fixture>,<new-fixture>;` | – | v01.00 |
| Import of DALI fixture (event, `EVTADV`) | `!DALIACCEPT,<addr>,<devcode>,<new or missing fixture>;` | – | v01.00 |

```
$dalirepair,1,17,f0,f01;
!OK,DALIREPAIR,001,017,F00,F01;<CR><LF>
$daliaccept,1,17,f1;
!OK,DALIACCEPT,001,017,F01;<CR><LF>
!DALIREPAIR,001,017,F00,F01;<CR><LF>
!DALIACCEPT,001,017,F23;<CR><LF>
```

(The last two lines are the event examples printed separately in the PDF.)

### 7.2 Fixing DALI Broadcast channel errors

Under most setups DALI Broadcast channel errors heal themselves once the physical problem is fixed (e.g. replacing a faulty fixture clears the reported lamp fault automatically). If not, the channel must be re-initialised – a simple operation via the module's own menu system or the eDIN+ web pages. **No GATEWAY commands or queries are provided** for DALI Broadcast channel repair.

### 7.3 The DALI repair process

Repair involves these steps:

| Step | Name | Summary |
|---|---|---|
| 1 | Prepare (optional) | `$DALICAPTURE` to capture all DALI universes; they stop checking fixtures and clear their reported DALI errors. Optional because it affects ALL universes; if omitted each universe is implicitly captured when it receives repair commands. Always release with `$DALIDONE`. |
| 2 | Perform a scan | `$DALISCAN` (see below) |
| 3 | Identify the correct new fixture | Match missing (expected) fixtures with new (actual) fixtures by physical location |
| 4 | Repair missing fixtures | `$DALIREPAIR` per missing fixture |
| 5 | Tidy by accepting | `$DALIACCEPT` for leftover missing/new fixtures |
| 6 | Check and end session | Inspect `?DALIFIX` statuses and/or send `$DALIDONE` |
| 7 | Back up the configuration | Done outside the GATEWAY |

#### 7.3.2 Step 2 – Perform a scan

`$DALISCAN` can be used at any time, but normal DALI bus operations (e.g. `$DALIFADE`) are **suspended until the scan completes**. Two methods:

**Polling** – send `$DALISCAN`; a scan usually takes about 30 seconds but depending on the DALI universe state it could take up to 10 minutes or so. Poll `?DALISCAN` for status (idle 0, searching 2, search completed successfully 1, search ended in error 4) and the number of fixtures found. When complete, `?DALIFIX` returns a `!DALIFIX` for each fixture found and each missing fixture, ending with `!DALIEND`. There may be 2 `!DALIFIX` messages for the same short address – if the original fixture is missing and a new fixture is found at that address.

```
$daliScan,1,17;
!OK,DALISCAN,001,017;<CR><LF>
…
?daliScan,1,17;
!OK,DALISCAN,001,017;<CR><LF>
!DALISCAN,001,017,01,024;<CR><LF>

?daliFix,1,17;
!OK,DALIFIX,001,017;<CR><LF>
!DALIFIX,001,017,F00,04905615,00064,000,0;
…
!DALIEND,001,017;
```

**Events** – enable advanced events first with `$EVTADV,1;` (or `$EVENTS,1;`). `$DALISCAN` then generates `!DALISCAN` events at start and end (same format as the `?DALISCAN` reply), `!DALIFIX` events in real time per fixture found (and found missing), and a closing `!DALIEND`.

```
$evtAdv,1;
!OK,EVTADV,1;
...
$daliScan,1,17;
!OK,DALISCAN,001,017;<CR><LF>
!DALISCAN,001,017,02,000;<CR><LF>   - searching
…
!DALIFIX,001,017,F00,04905615,00064,000,0;   - zero or more fixture events
…
!DALIEND,001,017;
!DALISCAN,001,017,01,024;<CR><LF>   - successful scan with 24 fixtures found
```

Interpreting `!DALIFIX` status (not the same as `!DALIERR` / `?ERRORS` health codes):

- **0 Ok / 1 Lamp Failure**: fixtures match the expected settings; can be ignored (no repair needed).
- **2 Missing**: no exactly matching fixture found – the old fixture may be unpowered/broken, removed, have changed settings, or have been replaced. Missing fixtures need repair.
- **5 New**: a fixture was found whose settings match none of the expected data – newly added, changed settings, or a replacement. New fixtures are used in the repair process.
- **8 Address Clash / 9 Unassigned**: the fixture has no unique short address and cannot be repaired. Unlikely, since `$DALISCAN` normally tries to fix these automatically; likely only if more than the maximum 64 fixtures are found on one universe due to wiring problems, which need an electrician. Rescan to check when resolved.

#### 7.3.3 Step 3 – Identifying the correct new fixture

Match missing (expected) fixtures with new (physical) fixtures by physical location. Easy pairings: a single fixture replaced with exactly 1 missing and 1 new in the list; or a new and missing fixture at the same short address (e.g. only the long address changed). Otherwise, match the recorded physical location of the missing fixture (site plan, fixture name, or flash its DALI group via repeated `$DALIFADE` or `$SHOWDALI` channel command) with the new fixture, found by flashing each in turn with `$SHOWDALI` using the `Fxx` id from the New `!DALIFIX` message. You can identify all new fixtures in one pass and record locations, or take each missing fixture in turn and have the end-user step through the new fixtures.

#### 7.3.4 Step 4 – Repair a missing fixture with the matching new fixture

`$DALIREPAIR` takes the `Fxx` identifier of the missing fixture and of its matching new fixture; it reprograms the new fixture with the missing fixture's correct settings and updates the expected data in the configuration. Pairing a missing and new fixture at the same short address is acceptable and often necessary, e.g. `$DALIREPAIR,3,17,F0,F0;`. Repeat for every missing fixture; refresh with `?DALIFIX` or track `!DALIFIX` events; rescan at any point to confirm status.

#### 7.3.5 Step 5 – Tidy the commissioning data by accepting actual fixtures

If a missing fixture has no new match, or a new fixture has no missing match, and error 22 remains, use `$DALIACCEPT`: accepting a missing fixture **deletes** it from the commissioning data; accepting a new fixture **adds** it with its current settings.

- If there are both a missing and a new fixture with the same `Fxx`, a single `$DALIACCEPT` clears the missing and adds the new fixture – equivalent to `$DALIREPAIR,x,x,Fnn,Fnn;`.
- If a fixture is reported missing only because it is unpowered and you `$DALIACCEPT` it to remove it (clearing error 26 DALI missing ballast), a new error 22 will appear when it is re-powered, as it is no longer in the commissioning data and will look like a new fixture.

#### 7.3.6 Step 6 – Check and end the repair session

When a UBC sees a scan or repair command it stops runtime checking (lamp failures / missing fixtures). To confirm all errors are fixed, inspect `?DALIFIX` – every status should be 0 Ok – and/or send `$DALIDONE;`, which clears existing DALI errors and re-enables runtime checking; remaining errors are then detected and reported in the usual way (usually up to 2 minutes for all errors to be reported). In any case, **always** finish a repair session with `$DALIDONE;`.

#### 7.3.7 Step 7 – Back up the configuration

When all fixtures are OK, back up the configuration in the usual way. (This cannot be done over the GATEWAY.)

#### 7.3.8 Using the Info web service in the repair process

The Info service can obtain/modify the *expected* fixture settings (DALI commissioning data) but does **not** affect physical fixtures – those must still be repaired via the GATEWAY.

To start afresh (e.g. re-loading an old configuration with wrong commissioning data when the actual fixture settings are correct):

1. Clear all commissioning data for each affected universe via the Info web service.
2. (If not already known) `$DALISCAN` and `?DALIFIX` for the actual fixtures – all will have New status.
3. `$DALIACCEPT` all fixtures via the GATEWAY.

To clear a universe, import a blank list:

```
!EDIN DALI COMMISSIONING FILE\n
! the next line deletes all DALI commissioning data on UBC 3,17\n
DALIUNIVERSE,3,17\n
! nothing else – no BALLAST items
```

To make a small change (e.g. move a fixture from one group / Mode channel to another):

1. Export the existing commissioning data for that fixture via the Info service.
2. Edit the Groups value.
3. Re-import via the Info service (this will now cause a runtime Bad Commissioning error because the expected data no longer matches the actual fixture).
4. Repair the actual fixture via the GATEWAY with `$DALIREPAIR`, e.g. for short address 0: `$DALIREPAIR,3,17,F0,F0;`.

To get the current commissioning data use a GET request to `http:/<ip-address-of-npu>/info&what=dali`; to change it use a POST to the same URL. See [chapter 3](#3-the-info-web-service-and-csv-files) for full GET/POST details.

> **Note (transcription):** the URL is printed as `http:/<ip-address-of-npu>/info&what=dali` in the PDF; chapter 3 gives the correct form `http://<npu_ip_address>/info?what=dali`.

#### 7.3.9 Repair process example

Scan result (as printed):

```
$DALISCAN,1,17;
!OK,DALISCAN,001,017;
!DALISCAN,001,017,02,000;
!DALIFIX,001,017,F00,04905615,00064,000,0;
!DALIFIX,001,017,F01,53195828,00032,000,2;
!DALIFIX,001,017,F01,14096720,00032,000,5;
!DALIFIX,001,017,F02,08348761,00002,000,2;
!DALIFIX,001,017,F03,21346988,00008,000,0;
!DALIFIX,001,017,F04,18361283,00000,000,5;
!DALIFIX,001,017,F05,00283700,00000,000,5;
!DALIEND,001,017;
!DALISCAN,001,017,01,005;
```

The expected fixtures in the commissioning data are at short addresses 0, 1, 2 and 3 (`F00` Ok, `F01` Missing, `F02` Missing, `F03` Ok). The scan found 5 actual fixtures at short addresses 0, 1, 3, 4, 5: `F00` and `F03` known and Ok; `F01`, `F04`, `F05` New (or modified).

- **Missing F01 / New F01**: same short address; only the long address differs (the old fixture was probably replaced by a correctly pre-programmed fixture). Confirm with `$SHOWDALI` / `$SHOWOFF`, then repair with the same identifier on both sides:

  ```
  $showDALI,1,17,f1;
  !OK,SHOWDALI,001,017,F01;
  $showOff,1,17;
  !OK,SHOWOFF,001,017;
  $daliRepair,1,17,f1,f1;
  !OK,DALIREPAIR,001,017,F01,F01;
  !DALIFIX,001,017,F01,14096720,00032,000,2;
  ```

- **Missing F02**: candidates `F04` and `F05` (both New). Flash each to find the right location:

  ```
  $showDALI,1,17,f4;
  !OK,SHOWDALI,001,017,F04;
  $showDALI,1,17,f5;
  !OK,SHOWDALI,001,017,F05;
  $showOff,1,17;
  !OK,SHOWOFF,001,017;
  ```

  `F05` is in the right place, so repair F02 with it:

  ```
  $daliRepair,1,17,f2,f5;
  !OK,DALIREPAIR,001,017,F02,F05;
  !DALIFIX,001,017,F02,00283700,00002,000,0;
  ```

- **Leftover New F04**: nothing to match, so accept it:

  ```
  $daliAccept,1,17,f4;
  !OK,DALIACCEPT,001,017,F04;
  !DALIFIX,001,017,F04,18361283,00000,000,0;
  ```

A new scan confirms the changes (all statuses 0, 5 fixtures):

```
$DALISCAN,1,17;
!OK,DALISCAN,001,017;
!DALISCAN,001,017,02,000;
!DALIFIX,001,017,F00,04905615,00064,000,0;
!DALIFIX,001,017,F01,14096720,00032,000,0;
!DALIFIX,001,017,F02,00283700,00002,000,0;
!DALIFIX,001,017,F03,21346988,00008,000,0;
!DALIFIX,001,017,F04,18361283,00000,000,0;
!DALIEND,001,017;
!DALISCAN,001,017,01,005;
```

End the session with `$DALIDONE;` and back up the revised configuration (not possible over the GATEWAY).

---

## 8 Advanced sensor repair

"To be completed" – this chapter is a placeholder in the PDF with no content.

---

## 9 The XDALI API

The eDIN+ system normally hides any DALI bus and does not support the full DALI feature set. The XDALI API gives **direct access to the DALI buses**, allowing any DALI message or operation to be sent directly, bypassing the eDIN+ system entirely.

- All commands and queries require **administrator privileges**.
- There are **no events** with the XDALI API in the sense of bus events, but each `$XDALI…` command (except `$XDALIDELAY`) generates an equivalent EVTADV event when it has been sent on the DALI bus (see 9.2).
- Use `?MODULENAME,17;` to discover available DALI universes and their UBC modules.
- It supports the standard **16-bit Control Gear DALI2 messages**. It does **not** support the extended 24-bit Control Device DALI2 messages.

> **Note (transcription):** chapter 9's introduction says "There are no events with XDALI API", while section 9.2 states each `$XDALI…` command (except `$XDALIDELAY`) generates an equivalent event of class `EVTADV` when sent on the bus, and lists them (e.g. `!XDALIDAP`). Both statements are in the PDF; the event formats in 9.2 are reproduced below.

### DALI2 message format

Four 16-bit Control Gear message formats:

| Type | First 8 bits | Second 8 bits |
|---|---|---|
| DAP (Direct-Arc-Power) | Identifies the message as DAP and holds the address of the fixture(s) | Brightness level |
| General Opcode | Address of the fixture(s) | Opcode representing a command or query |
| Special Opcode | Special opcode (sent to all fixtures) | Parameter data for the special command/query |
| Application Extended Opcode | Same format as General Opcode, but must be immediately preceded by a special "Enable Device Type" message | |

Two flags:

- **Needs Answer** – the opcode is a query with an 8-bit response.
- **Send Twice** – some commands (e.g. changing a stored setting or resetting) must be sent twice in quick succession (100 ms) to avoid accidental reception.

Possible responses for a "needs answer" message:

- **No response**: addressed fixture not present, or a "No" response.
- **Bad response**: corrupted because 2+ fixtures respond at once (and shouldn't), or a "Yes" response (more than one fixture may validly respond to Yes/No queries).
- **Good response**: an 8-bit value successfully received. A "Yes" response has the value 255.

### 9.1 XDALI API and connections

Used over connections like other messages, but the connection must have administrator privileges.

#### 9.1.1 HTTP query timeout control

XDALI queries go directly to UBC modules and responses come directly from them, so an HTTP request containing an XDALI query waits until the UBC responds. If the UBC doesn't exist or doesn't respond, the request could take a long time. HTTP requests therefore have a default timeout of a few seconds; set your own per request with the custom header `ModeLighting-Timeout` (value in seconds):

```
ModeLighting-Timeout: 20
```

### 9.2 XDALI API messages

The API follows the DALI2 structure:

| DALI2 message | Command | Query |
|---|---|---|
| DAP | `$XDALIDAP` | – |
| General Opcode | `$XDALI` | `?XDALI` |
| Special Opcode | `$XDALISP` | `?XDALISP` |
| Application Extended Opcode | `$XDALIAPP` (printed once as `$XDALAPP`) | `?XDALIAPP` |

- Opcode messages that need an answer use `?XDALI…` queries; otherwise `$XDALI…` commands.
- Commands that must be sent twice use the suffix `X2`, e.g. `$XDALIX2`, so the system can ensure the second send occurs within the 100 ms required by DALI2.
- All messages use the usual native DALI identifiers `BST`, `Gxx`, `Fxx`.
- All `?XDALI…` queries return an 8-bit `resp-data` and a `resp-status`:

| `resp-status` | Name | Description |
|---|---|---|
| 0 | Ok | A "Yes" response, or the value of `resp-data` is valid |
| 1 | No Response | A "No" response or "No fixture" error |
| 2 | Corrupt Response | A "Yes" response or "Corrupt Data" error due to more than one fixture replying erroneously or noise on the bus |

Some commands need processing time and no other message should be sent meanwhile (e.g. `RANDOMISE` takes up to 300 ms; fixtures must not send until after that). `$XDALIDELAY` forces a delay by blocking the bus for the required time.

#### 9.2.1 XDALI DAP message

Sends DAP (set Direct-Arc-Power) to one or more fixtures.

| Field | Meaning |
|---|---|
| `dali-id` | `BST`, `Gxx`, or `Fxx` (xx = group or short address) |
| `dap-level` | 0 = off, 1–254 = DAP level, 255 = stop fade |

| | |
|---|---|
| Command | `$XDALIDAP,<addr>,<devcode>,<dali-id>,<dap-level>;` |
| Long-ack format | `!OK,XDALIDAP…;` |
| From | v02.00 |
| Event ("Direct DALI DAP message", `EVTADV`) | `!XDALIDAP,<addr>,<devcode>,<dali-id>,<dap-level>;` |

```
$xdaliDAP,3,17,254;
!OK,XDALIDAP,003,017,254;<CR><LF>
```

> **Note (transcription):** the example omits the `<dali-id>` parameter (`$xdaliDAP,3,17,254;`), as printed. By the syntax, it should be e.g. `$xdaliDAP,3,17,BST,254;`.

#### 9.2.2 XDALI general messages

| Field | Meaning |
|---|---|
| `dali-id` | `BST`, `Gxx`, or `Fxx` |
| `opcode` | 0–200 as defined by the DALI2 standard |
| `resp-data`, `resp-status` | see 9.2 |

| | |
|---|---|
| Commands | `$XDALI,<addr>,<devcode>,<dali-id>,<opcode>;` · `$XDALIX2,<addr>,<devcode>,<dali-id>,<opcode>;` |
| Long-ack | `!OK,XDALI…` or `!OK,XDALIX2…` |
| Query | `?XDALI,<addr>,<devcode>,<dali-id>,<opcode>;` — long-ack `!OK,XDALI,<addr>,<devcode>,<dali-id>,<opcode>;` |
| Reply ("Report of General DALI message") | `!XDALI,<addr>,<devcode>,<dali-id>,<opcode>,<resp-data>,<resp-status>;` |
| Events ("Direct DALI General message", `EVTADV`) | `!XDALI,<addr>,<devcode>,<dali-id>,<opcode>;` · `!XDALIX2,<addr>,<devcode>,<dali-id>,<opcode>;` |
| From | v02.00 |

```
$xdali,3,17,bst,5;           recall max level command
!OK,XDALI,003,017,BST,005;<CR><LF>
$xdaliX2,3,17,f23,32;        reset command
!OK,XDALIX2,003,017,F23,032;<CR><LF>

?xdali,3,17,bst,146;         query lamp failure
!OK,XDALI,003,017,BST,146;<CR><LF>
!XDALI,003,017,BST,146,000,001;<CR><LF>   'No' answer
```

#### 9.2.3 XDALISP special messages

Sends a special message to all fixtures.

| Field | Meaning |
|---|---|
| `sp-cmd` | 161–201, value of the "address byte" as defined in DALI2 |
| `data` | 0–255, value of the "opcode byte" as defined in DALI2 |
| `resp-data`, `resp-status` | see 9.2 |

| | |
|---|---|
| Commands | `$XDALISP,<addr>,<devcode>,<opcode>,<data>;` · `$XDALISPX2,<addr>,<devcode>,<opcode>,<data>;` |
| Long-ack | `!OK,XDALISP…` or `!OK,XDALISPX2…` |
| Query | `?XDALI,<addr>,<devcode>,<opcode>,<data>;` (as printed – see note) — long-ack `!OK,XDALI,<addr>,<devcode>,<opcode>,<data>;` |
| Reply ("Report of Special DALI message") | `!XDALISP,<addr>,<devcode>,<opcode>,<data>,<resp-data>,<resp-status>;` |
| Events ("Direct DALI Special message", `EVTADV`) | `!XDALISP,<addr>,<devcode>,<opcode>,<data>;` · `!XDALISPX2,<addr>,<devcode>,<opcode>,<data>;` |
| From | v02.00 |

```
$xdaliSP,3,17,163,12;        store DTR0(data) command
!OK,XDALISP,003,017,163,012;<CR><LF>
$xdaliSpX2,3,17,167,0;       randomise command
!OK,XDALISPX2,003,017,167,000;<CR><LF>

?xdaliSp,3,17,169,0;         compare query
!OK,XDALISP,003,017,169,000;<CR><LF>
!XDALISP,003,017,169,000,000,002;<CR><LF>   'Yes' (corrupted) answer
```

> **Note (transcription):** the PDF prints the special-message query as `?XDALI,…` with `!OK,XDALI,…` long-ack, but the example (and the pattern of the other message families) uses `?xdaliSp` with `!OK,XDALISP,…` and the reply is `!XDALISP,…`. Use `?XDALISP` per the example.

#### 9.2.4 XDALIAPP application extended messages

Sends an application-extended message to one or more fixtures, immediately preceded by the required "ENABLE DEVICE TYPE x" special message.

| Field | Meaning |
|---|---|
| `dali-id` | `BST`, `Gxx`, or `Fxx` |
| `opcode` | 224–254 as defined by DALI2 |
| `device-type` | 0–253 as defined by DALI2 |
| `resp-data`, `resp-status` | see 9.2 |

| | |
|---|---|
| Commands | `$XDALIAPP,<addr>,<devcode>,<dali-id>,<opcode>,<device-type>;` · `$XDALIAPPX2,<addr>,<devcode>,<dali-id>,<opcode>,<device-type>;` |
| Long-ack | `!OK,XDALIAPP…` or `!OK,XDALIAPPX2…` |
| Query | `?XDALIAPP,<addr>,<devcode>,<dali-id>,<opcode>,<device-type>;` — long-ack `!OK,XDALIAPP,…;` |
| Reply ("Report of General DALI message") | `!XDALIAPP,<addr>,<devcode>,<dali-id>,<opcode>,<device-type>,<resp-data>,<resp-status>;` |
| Events ("Direct DALI Application Extended message", `EVTADV`) | `!XDALIAPP,<addr>,<devcode>,<dali-id>,<opcode>,<device-type>;` · `!XDALIAPPX2,<addr>,<devcode>,<dali-id>,<opcode>,<device-type>;` |
| From | v02.00 |

```
$xdaliApp,3,17,g1,227,1;      start function test – type 1 emergency lighting
!OK,XDALIAPP,003,017,G01,227,001;<CR><LF>
$xdaliAppX2,3,17,f8,240,1;    start identification – type 1 emergency lighting
!OK,XDALIAPPX2,003,017,F08,240,001;<CR><LF>

?xdaliApp,3,17,f18,253,1;     query emergency status – type 1 emergency lighting
!OK,XDALIAPP,003,017,F18,253,001;<CR><LF>
!XDALIAPP,003,017,F18,253,1,010,0;<CR><LF>   good response = value of 10
```

#### 9.2.5 XDALI delay

Adds a minimum delay into the internal DALI message queue, so there is at least the given gap between messages.

| Field | Meaning |
|---|---|
| `delaytime-ms` | 0–65000 delay in milliseconds |

| | |
|---|---|
| Command | `$XDALIDELAY,<addr>,<devcode>,<delaytime-ms>;` |
| Long-ack format | printed as `!OK,XDALIAPP… or !OK,XDALIAPPX2…`; the example shows `!OK,XDALIDELAY,003,017,00300;` |
| Event | none (`$XDALIDELAY` generates no event) |

```
$xdaliSpX2,3,17,167,0;       randomise command
$xdaliDelay,3,17,300;        wait 300ms
$xdaliSpX2,3,17,165,0;       initialise all command

!OK,XDALIX2,003,017,167,000;<CR><LF>
!OK,XDALIDELAY,003,017,00300;<CR><LF>
!OK,XDALIX2,003,017,165,000;<CR><LF>
```

> **Note (transcription):** the PDF's example sends `$xdaliSpX2` but the acknowledgements shown are `!OK,XDALIX2,…`; the long-ack format printed for `$XDALIDELAY` is a copy of the `XDALIAPP` one. The `!OK,XDALIDELAY,…` form in the example is the plausible one.

---

## Quick message index

| Message | Kind | Section | From |
|---|---|---|---|
| `GET/POST http://<npu>/info?what=names\|levels\|dali` | HTTP (Info service, not GATEWAY) | 3 | – |
| `$SCNSET` … `$SCNEND` (with `$SCNFADE`, `$SCNCHAN`, `$SCNDALI`, `$SCNDMX`, `$SCNCHANRGBCOLR`, `$SCNDMXRGBCOLR`, `$SCNCHANRGBPLAY`, `$SCNDMXRGBPLAY`, `$SCNCHANTWCOLR`, `$SCNDMXTWCOLR`) → `!SCNSETACK` | Command set | 4.3 | v02.02 |
| `$SCNABORT` | Command | 4.3 | v02.02 |
| `?SCNSET` → `!SCNSET`, items, `!SCNEND` | Query | 4.4.1 | v02.02 |
| `?SCNSETNAMES` → `!SCNSETNAMES`, items, `!SCNSETNAMESEND` | Query | 4.4.2 | v02.02 |
| `$MASTERTICK` | Command | 5.1.1 | 02.02 |
| `?MODULENAME` → `!MODULENAME` | Query | 6.1.1 | v02.00 |
| `$SHOWOFF`, `$SHOWCHAN`, `$SHOWDALI` | Command | 6.2.1 | v02.00 |
| `?DALI` (fixture identifier) → `!DALIERR` | Query | 6.3.1 | v02.00 |
| `$DALICAPTURE`, `$DALIDONE` | Command | 7.1.1 | v01.00 |
| `$DALISCAN` / `?DALISCAN` → `!DALISCAN` (EVTADV) | Command / query / event | 7.1.2 | v01.00 |
| `?DALIFIX` → `!DALIFIX`, `!DALIEND` (EVTADV) | Query / event | 7.1.3 | v01.00 |
| `$DALIREPAIR`, `$DALIACCEPT` → `!DALIREPAIR`, `!DALIACCEPT` (EVTADV) | Command / event | 7.1.4 | v01.00 |
| `$XDALIDAP` → `!XDALIDAP` (EVTADV) | Command / event | 9.2.1 | v02.00 |
| `$XDALI`, `$XDALIX2`, `?XDALI` → `!XDALI`, `!XDALIX2` | Command / query / event | 9.2.2 | v02.00 |
| `$XDALISP`, `$XDALISPX2`, `?XDALISP` → `!XDALISP`, `!XDALISPX2` | Command / query / event | 9.2.3 | v02.00 |
| `$XDALIAPP`, `$XDALIAPPX2`, `?XDALIAPP` → `!XDALIAPP`, `!XDALIAPPX2` | Command / query / event | 9.2.4 | v02.00 |
| `$XDALIDELAY` | Command | 9.2.5 | v02.00 |
