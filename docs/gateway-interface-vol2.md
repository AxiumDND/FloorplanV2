# eDIN+ Gateway Interface — Volume 2 (Advanced)

| | |
|---|---|
| **Title** | Gateway Interface Volume 2 – Advanced |
| **Version** | 2.0.3 (document dated 2 March 2022) |
| **Author** | Jeff Heine |
| **Gateway version covered** | Modification for Gateway Ver 2.02 (per history entry 2.03) |
| **Source** | `Gateway Interface Vol 2 - Advanced v2_0_3` (48 pages, carries a "DRAFT" watermark) |

Markdown transcription of the vendor PDF, for use as a lookup reference when working on the Floorplan app (raw TCP to an eDIN+ NPU controller). This volume builds on [Volume 1](gateway-interface.md) (Standard) and assumes familiarity with it; general syntax, acknowledgements, connection types and enumerations (device codes, status codes, palettes, button events) are in Volume 1. Volume 3 is at [`gateway-interface-vol3.md`](gateway-interface-vol3.md).

Where the PDF is ambiguous, incomplete or contains an apparent typo this is flagged as a **Note (transcription)**. Where the PDF itself says "tbc" / "To be completed" that is reproduced rather than filled in.

## Contents

- [Document history](#document-history)
1. [Introduction](#1-introduction)
2. [Overview of advanced features](#2-overview-of-advanced-features)
3. [Events](#3-events)
4. [Users & Access](#4-users--access)
5. [Advanced scene control & status](#5-advanced-scene-control--status)
6. [Advanced channel control & status](#6-advanced-channel-control--status)
7. [System adjustments](#7-system-adjustments)
- [Quick command index](#quick-message-index)

---

## Document history

| Date | Ver | Initials | Changes |
|---|---|---|---|
| 24-May-19 | 2.0.0 | Jph | Initial draft |
| 6-Sep-19 | 2.0.1 | Jph | Document: Admin rights for `$EVTADV`. Clarify wrgb notation |
| 14-Dec-21 | 2.02 | Jph | Modification for Gateway Ver 2.01 |
| 28-Feb-22 | 2.03 | Jph | Modification for Gateway Ver 2.02. Add DALI fixture health query. Improve Advanced DALI addressing section. Move back control section to volume 3 |

---

## 1 Introduction

### 1.1 Purpose and scope

Details for using **advanced** features of the eDIN+ GATEWAY interface; part of a set of Volumes.

| Volume | Scope |
|---|---|
| Volume 1 – Standard | How to access the GATEWAY and commands and queries that all users can use. |
| Volume 2 – Advanced | Advanced commands and queries that require more advanced knowledge of the eDIN+ system and are only needed to access these advanced features. Some are restricted to users with administration access. |
| Volume 3 – Developer | Commands and queries that allow some aspects of the eDIN+ system to be tightly integrated with third party products. Restricted to users with Administrator rights; require specialist knowledge of the eDIN+ system. |

### 1.2 Terminology

| Phrase | Description |
|---|---|
| API | Application Programming Interface. A set of protocols that define how to access a system. |
| Controller | A processor that controls a lighting system. The eDIN+ system has 2 types of controller: normal NPU and Standalone Mode. |
| DALI | Digital Addressable Lighting Interface. An industry standard physical interface/network for control of lighting equipment. It allows bi-directional data exchange, allowing its use with emergency lighting as well as dimmable luminaires. |

### 1.3 References

1. BS EN 62386-102:2014 – Digital addressable lighting interface. Part 102: General Requirements – Control gear.
2. BS EN 62386-202:2009 – Digital addressable lighting interface. Part 202: Particular requirements for control gear — Self-contained emergency lighting (device type 1).

---

## 2 Overview of advanced features

Each advanced topic has its own chapter. The GATEWAY is also organised into the three APIs (Interface, Channel, Scene & System); section 2.2 summarises the extensions to each.

### 2.1 Advanced topics

| Topic | Summary |
|---|---|
| 2.1.1 Events | The eDIN+ system can generate event messages on a GATEWAY connection (chapter 3). |
| 2.1.2 Users & Access | User accounts can limit access to particular areas within the configuration (chapter 4). |
| 2.1.3 Advanced Scene Control & Status | The full set of scene control commands mirroring the internal configuration; when a scene state is active/inactive; scene mode and flags (chapter 5). |
| 2.1.4 Advanced Channel Control & Status | Relay module control (blinds/curtains), native DALI Broadcast/Group/Fixture addressing on UBC modules, instantaneous channel level during long fades, and overriding/controlling input channels (chapter 6). |
| 2.1.5 System Adjustments | The few features a user may adjust via the GATEWAY: pre-set values for colour and tuneable white channels, and time settings (chapter 7). Volume 1 describes live scene setting; Volume 3 describes advanced offline scene setting. |

### 2.2 Advanced API extensions

#### 2.2.1 Interface API

| Area | Messages | Chapter |
|---|---|---|
| Event management | `$EVENTS`, `$EVTSCN`, `$EVTERR`, `$EVTOUT`, `$EVTDIS`, `$EVTCIN`, `$EVTAIN`, `$EVTADV`; `?EVENTS`, `?EVTSCN`, `?EVTERR`, `?EVTOUT`, `?EVTDIS`, `?EVTCIN`, `?EVTAIN`, `?EVTADV` | 3 Events |
| Change user account | `$USER`, `?USER` | 4 Users & Access |
| Change user password | `$USERPSSWD` | 4 Users & Access |
| PUBLIC and ADMINISTRATOR accounts | – | 4 Users & Access |

#### 2.2.2 Scene API

| Area | Messages | Chapter |
|---|---|---|
| Advanced scene control | `$SCNFAST`, `$SCNTOGGLE`, `$SCNBACKON`, `$SCNRAISE`, `$SCNLOWER`, `$SCNSTOP`, `$SCNRAMP`, `$SCNNUDGEUP`, `$SCNNUDGEDN` | 5 |
| Scene events | `!SCNSTATE`, `!SCNRECALL`, `!SCNRECALLX`, `!SCNOFF`, `!SCNFAST`, `!SCNBACKON`, `!SCNRAISE`, `!SCNLOWER`, `!SCNRAMP`, `!SCNSTOP`, `!SCNNUDGEUP`, `!SCNNUDGEDN`, `!SCNONOFF`, `!SCNTOGGLE`, `!SCNSAVE` | 3 Events |
| Scene status, mode and flags | – | 5 |

#### 2.2.3 System API

| Area | Messages | Chapter |
|---|---|---|
| Adjusting timelines | tbc (as printed in the PDF) | 7 System Adjustments |
| Controller inhibit | tbc (as printed in the PDF) | 3 Events |

#### 2.2.4 Channel API

| Area | Messages | Chapter |
|---|---|---|
| Advanced relay control | `$CHANPULSE` | 6 |
| Advanced DALI addressing | `BST`, `Gxx`, `Fxx` identifiers | 6 |
| Live channel levels | `?CHANLEVELX`, `?DALILEVELX`, `?DMXLEVELX` | 6 |
| Controlling input channels | `$INPSTATE`, `$INPPIR`, `$INPLEVEL` | 6 |
| Adjusting colour pre-sets | `$RGBPRESET`, `$TWPRESET` | 7 |
| Channel access | `?CHANACCESS`, `?DALIACCESS`, `?DMXACCESS`, `?BTNACCESS`, `?INPACCESS` | 4 |
| Channel events | `!CHANFADE`, `!DALIFADE`, `!DMXFADE`, `!CHANSTOP`, `!DALISTOP`, `!DMXSTOP`, `!DMXRGBCOLR`, `!DMXRGBPLAY`, `!CHANRGBCOLR`, `!CHANRGBPLAY`, `!DMXTWCOLR`, `!CHANTWCOLR`, `!BTNCOLR`, `!BTNTEXT`, `!CHANPULSE`, `!BTNSTATE`, `!INPSTATE`, `!INPPIR`, `!INPLEVEL`, `!MODULEERR`, `!CHANERR`, `!DALIERR`, `!DMXERR`, `!BTNERR`, `!INPERR` | 3 Events |

> **Note (transcription):** the overview and chapter 6 name the input-control commands inconsistently: the overview lists `$INPSTATE`, `$INPPIR`, `$INPLEVEL`; the body text of 6.4.3 and 6.4.4 refers to `$INPPIRSET` and `$INPLEVELSET`. The PDF does not give a full syntax block for any of these (see [6.4](#64-controlling-input-channels-and-injecting-input-events)).

---

## 3 Events

Events are messages that tell you when a change has occurred in the system (scene, input channel, output channel or wall plate button). They can also be a response to an explicit query. They fall broadly into four categories:

1. Input channel events that can trigger actions
2. Scene and channel operations that change the state of a scene or channel
3. Changes in scene and channel status, caused by operations or by changes in channel health
4. Result of a query

Typical uses: (1) input events – used by your own controller to trigger your own rules; (2)/(3) changes in scene/channel state – monitor and track changes in the eDIN+ system; (4) query results – both query responses and event messages are sent on the same connection and can be indistinguishable, so responses to queries must also be handled by your event handler.

The Interface API lets a connection request only events of certain classes. **Responses that are the result of a query are always sent and never filtered out.**

### Event classes

| Flag | Name | Description |
|---|---|---|
| `EVTSCN` | Scene events | Scene commands and changes to scene level and status |
| `EVTERR` | Health Status events | Changes in channel & module health status |
| `EVTOUT` | Output events | Changes in output channels, including DALI channels and DMX zones |
| `EVTDIS` | Plate Display events | Changes to wall plate LED colour and text |
| `EVTCIN` | Contact Input events | All input events except Analogue inputs, including Contact inputs, PIR inputs and plate buttons |
| `EVTAIN` | Analogue Input events | Change in Analogue Input channel level |
| `EVTADV` | Advanced events | Events associated with Advanced features |

Notes on classes:

- `EVTCIN` and `EVTAIN` are events on input channels and button switch inputs, most useful if you provide your own controller. Analogue input changes are separated out due to the sheer number and frequency of such events (e.g. light sensors used for daylight harvesting).
- `EVTSCN` events are for scene state changes (level and/or activeness) and are most useful for monitoring the system state.
- `EVTOUT` and `EVTDIS` events are for changes in outputs including channels, DMX and buttons. **`EVTDIS` only includes events for button outputs; use `EVTCIN` for button input events.**
- `EVTERR` events indicate changes of health on all hardware.
- `EVTADV` events cover events generated by advanced techniques, required only if you use those techniques.

### 3.1 Using events

This is the "Control with asynchronous event-driven feedback" technique from Volume 1. The state is determined by a continuous connection handling events sent by the eDIN+ system. Commands/queries are sent from one process; a second process receives all responses, including events and query responses. It suits naturally event-driven systems but is harder to debug.

- Events require a continuous connection: **RS232 or Raw IP only. HTTP cannot be used.**
- **No events are sent on a connection until the connection requests them**; you must send event filtering commands every time you make a new connection.
- Because events are changes in state, extra code is needed to determine the initial state and to resynchronise after a connection is lost and re-established: send explicit queries to return the current state of items of interest when a connection is established.

### 3.2 Event filtering commands and queries

Each connection has its own setting. These are part of the Interface API and can be sent at any time by all users.

#### 3.2.1 Set event reporting for all events

| | |
|---|---|
| Command | `$EVENTS,<on-off>;` |
| Long-ack format | `!OK,EVENTS,<on-off>;` |
| From | v01.00 |

`on-off` = zero to turn all event flags off, non-zero to turn all on.

```
$Events,1;
!OK,EVENTS,1;<CR><LF>
```

#### 3.2.2 Query event reporting for all events

| | |
|---|---|
| Query | `?EVENTS;` |
| Long-ack format | `!OK,EVENTS;` |
| From | v01.00 |
| Reply | list of all "Report Event Flag" messages: `!EVTxxx,<on-off>;<CR><LF>` |

```
?eVents;
!OK,EVENTS;<CR><LF>
!EVTOUT,1;<CR><LF>
!EVTDIS,1;<CR><LF>
!EVTERR,0;<CR><LF>
!EVTSCN,1;<CR><LF>
!EVTCIN,0;<CR><LF>
!EVTAIN,0;<CR><LF>
!EVTADV,0;<CR><LF>
```

#### 3.2.3 Set individual event reporting

| | |
|---|---|
| Commands | `$EVTSCN,<on-off>;` · `$EVTERR,<on-off>;` · `$EVTOUT,<on-off>;` · `$EVTDIS,<on-off>;` · `$EVTCIN,<on-off>;` · `$EVTAIN,<on-off>;` · `$EVTADV,<on-off>;` |
| Long-ack format | `!OK,EVTxxx,<on-off>;` |
| From | v01.00 |

`on-off` = zero to turn the flag off, non-zero to turn it on.

> You can only set the advanced events flag with `$EVTADV` on connections with **administrator privileges** (see [Users & Access](#4-users--access)). Otherwise the command is ignored. Administrator privileges are not needed to query `?EVTADV`.

```
$EvtScn,1;
!OK,EVTSCN,1;<CR><LF>
$EvtOut,0;
!OK,EVTOUT,0;<CR><LF>
```

#### 3.2.4 Query individual event reporting

| Query | Reply ("Report … Event Flag") |
|---|---|
| `?EVTSCN;` | `!EVTSCN,<on-off>;` (Scene) |
| `?EVTERR;` | `!EVTERR,<on-off>;` (Error status) |
| `?EVTOUT;` | `!EVTOUT,<on-off>;` (Output) |
| `?EVTDIS;` | `!EVTDIS,<on-off>;` (Display) |
| `?EVTCIN;` | `!EVTCIN,<on-off>;` (Contact Input) |
| `?EVTAIN;` | `!EVTAIN,<on-off>;` (Analogue Input) |
| `?EVTADV;` | `!EVTADV,<on-off>;` (Advanced) |

Long-ack format `!OK,EVTxxx;`. From v01.00. Replies end `<CR><LF>`.

```
?EvtOut;
!OK,EVTOUT;<CR><LF>
!EVTOUT,1;<CR><LF>
```

### 3.3 Channel API events

Only channels and modules with the **View** access flag set (see Users & Access) have these events reported, and only if the connection has asked for events. For button events, the button's plate module must have its View access flag.

#### 3.3.1 General output events

These result from commands that change the level or colour of output channels. DALI events come in 2 flavours: the standard Mode DALI channel number notation, and advanced DALI addressing (if advanced DALI operations are used – see [6.3](#63-advanced-dali-virtual-channel-addressing)).

**Event: "Change in (output) channel level with fade"** – Class `EVTOUT`. From v01.00 (DMX from v02.00).

```
!CHANFADE,<addr>,<devcode>,<chan-num>,<level>,<fadetime(ms)>;
!DALIFADE,<addr>,<devcode>,<dali-id>,<level>,<fadetime(ms)>;
!DMXFADE,<addr>,<devcode>,<zone-num>,<level>,<fadetime(ms)>;
```

```
!CHANFADE,002,021,006,255,00003000;<CR><LF>
!DALIFADE,002,017,016,255,00001000;<CR><LF>
!DALIFADE,002,017,016,BST,00001000;<CR><LF>
!DMXFADE,002,015,006,255,00005000;<CR><LF>
```

> **Note (transcription):** the third example (`!DALIFADE,002,017,016,BST,00001000;`) places `BST` in the level position, as printed in the PDF; elsewhere (6.3.2) `BST` appears in the `<dali-id>` position.

**Event: "Stop in (output) channel"** – Class `EVTOUT`. From v01.00 (DMX from v02.00).

```
!CHANSTOP,<addr>,<devcode>,<chan-num>;
!DALISTOP,<addr>,<devcode>,<dali-id>;
!DMXSTOP,<addr>,<devcode>,<zone-num>;
```

```
!CHANSTOP,002,021,006;<CR><LF>
!DALISTOP,002,017,016;<CR><LF>
!DALISTOP,002,017,G01;<CR><LF>
!DMXSTOP,002,015,006;<CR><LF>
```

**Event: "Change in colour control"** – Class `EVTOUT`. From v02.01.

```
!CHANRGBCOLR,<addr>,<devcode>,<chan-num>,<preset>,#<wrgb>;
!CHANRGBPLAY,<addr>,<devcode>,<chan-num>,<seq>,#<wrgb>;
!DMXRGBCOLR,<addr>,<devcode>,<zone-num>,<preset>,#<wrgb>;
!DMXRGBPLAY,<addr>,<devcode>,<zone-num>,<seq>,#<wrgb>;
```

```
!DMXRGBCOLR,002,015,006,001,#80FF00;<CR><LF>
!CHANRGBCOLR,002,015,006,000,#00FF00;<CR><LF>
```

**Event: "Change in tuneable white control"** – Class `EVTOUT`. From v02.01.

```
!CHANTWCOLR,<addr>,<devcode>,<chan-num>,<preset>,#<kelvin>K;
!DMXTWCOLR,<addr>,<devcode>,<zone-num>,<preset>,#<kelvin>K;
```

```
!DMXTWCOLR,002,015,006,048,#4350K;<CR><LF>
!CHANTWCOLR,002,015,006,050,#3000K;<CR><LF>
```

**Event: "Pulse in (relay) channel state"** – Class `EVTOUT`. From v02.00.

```
!CHANPULSE,<addr>,<devcode>,<chan-num>,<action>,<pulsetime(ms)>;
```

```
!CHANPULSE,001,012,002,001,001000;<CR><LF>
```

#### 3.3.2 Button output events

Result of commands that change the colour or text of a wall plate button.

**Event: "Change in Button colour" and "Change in Button text"** – Class `EVTDIS`. From v01.00.

```
!BTNCOLR,<addr>,<devcode>,<btn-num>,<palette-colour>;
!BTNTEXT,<addr>,<devcode>,<btn-num>,<text>;
```

```
!BTNCOLR,063,001,008,015;<CR><LF>
!BTNTEXT,063,001,008,All On;<CR><LF>
```

#### 3.3.3 General input events

Result of natural changes of input level/state, and of injecting inputs from the GATEWAY (see [6.4](#64-controlling-input-channels-and-injecting-input-events)).

| Event | Class | From | Format | Example |
|---|---|---|---|---|
| Change in Button switch state | `EVTCIN` | v02.00 | `!BTNSTATE,<addr>,<devcode>,<btn-num>,<new-state>;` | `!BTNSTATE,063,001,008,000;` |
| Change in PIR input state | `EVTCIN` | v02.00 | `!INPPIR,<addr>,<devcode>,<chan-num>,<new-state>;` | `!INPPIR,005,021,008,000;` |
| Change in switched input | `EVTCIN` | v02.00 | `!INPSTATE,<addr>,<devcode>,<chan-num>,<new-state>;` | `!INPSTATE,005,021,008,000;` |

#### 3.3.4 Analogue input events

**Event: "Change in analogue input"** – Class `EVTAIN`. From v02.00.

```
!INPLEVEL,<addr>,<devcode>,<chan-num>,<new-level>;
```

```
!INPLEVEL,005,021,008,255;<CR><LF>
```

#### 3.3.5 Channel health events

Result of natural changes of the status of channels or modules. If configured to do so, a UBC can report problems with individual DALI fixtures. A fixture problem is reported on both the Mode DALI channel the fixture is associated with and on the fixture itself. A DALI fixture is identified by **`F` followed by its DALI short address 0–63**, e.g. `F01`. Status codes are listed in Volume 1.

Notes:

- When monitoring channel health through events, track **both** `!MODULEERR` and `!CHANERR` events (and derivatives). Module errors are reported only in `!MODULEERR` events instead of `!CHANERR` events, to avoid a slew of channel messages. This differs from polling with `?CHAN` and derivatives, which **do** report module-level errors on the channel.
- When a module error generates a `!MODULEERR` event, any current channel errors on that module are temporarily cleared down, so only 1 live error is reported for a channel (module level or channel level). When the module error disappears (a `!MODULEERR` with status code 0), the channel error is re-reported with a `!CHANERR` event (or derivative) if still present.

| Event | Class | From | Format |
|---|---|---|---|
| Change in Module status | `EVTERR` | v02.00 | `!MODULEERR,<addr>,<devcode>,<new status-code>;` |
| Change in (output) channel status | `EVTERR` | v02.00 | `!CHANERR,<addr>,<devcode>,<chan-num>,<new status-code>;` · `!DALIERR,<addr>,<devcode>,<dali-num>,<new status-code>;` · `!DALIERR,<addr>,<devcode>,<dali-fixture>,<new status-code>;` · `!DMXERR,<addr>,<devcode>,<zone-num>,<new status-code>;` |
| Change in button status | `EVTERR` | v02.00 | `!BTNERR,<addr>,<devcode>,<btn-num>,<new status-code>;` |
| Change in input channel status | `EVTERR` | v02.00 | `!INPERR,<addr>,<devcode>,<chan-num>,<new-status>;` |

```
!MODUERR,002,021,001;<CR><LF>
!CHANERR,002,021,006,001;<CR><LF>
!DALIERR,002,017,016,025;<CR><LF>
!DALIERR,002,017,F16,025;<CR><LF>
!DMXERR,002,015,001,002;<CR><LF>
!BTNERR,063,001,008,000;<CR><LF>
!INPERR,005,021,008,000;<CR><LF>
```

> **Note (transcription):** the module example is printed as `!MODUERR,…` (missing "L") in the PDF; the message name is `!MODULEERR`.

### 3.4 Scene API events

Only scenes with the **View** access flag set have these events reported, and only if the connection has asked for events.

#### 3.4.1 Scene status events

"Change in scene state" is generated whenever scene state changes, due to a scene command on the scene or other events in the system. Changes in `scn-state` are instantaneous; changes in `scn-level` occur as fades, and the event reports how long it will take to reach the new level (ignore if you are unconcerned about level).

**Event: Change in Scene State** – Class `EVTSCN`. From v02.00.

```
!SCNSTATE,<scn-num>,<scn-state>,<scn-level>,<fadetime(ms)>;
```

| Parameter | Meaning |
|---|---|
| `scn-num` | Scene number, decimal |
| `scn-state` | 0 (inactive) or 1 (active) |
| `scn-level` | 0 (off) or 1–255 (on) |
| `fadetime` | Time in ms it will take to reach `scn-level` |

```
!SCNSTATE,00001,1,255,00001000;<CR><LF>
```

#### 3.4.2 Scene action events

Events reporting that a scene action has occurred; they mirror the scene commands (Volume 1 and 2). Generated whenever a scene action occurs, by a GATEWAY command or when the in-built controller responds to internal events. Class `EVTSCN`; all from v01.00.

```
!SCNRECALL,<scn-num>;
!SCNRECALLX,<scn-num>,<level>,<fadetime(ms)>;
!SCNOFF,<scn-num>;
!SCNFAST,<scn-num>;
!SCNBACKON,<scn-num>;
!SCNRAISE,<scn-num>;
!SCNLOWER,<scn-num>;
!SCNRAMP,<scn-num>;
!SCNSTOP,<scn-num>;
!SCNNUDGEUP,<scn-num>;
!SCNNUDGEDN,<scn-num>;
!SCNONOFF,<scn-num>;
!SCNTOGGLE,<scn-num>;
!SCNSAVE,<scn-num>;
```

```
!SCNRECALL,00008;<CR><LF>
!SCNRECALLX,00008,255,00001000;<CR><LF>
!SCNOFF,00008;<CR><LF>
!SCNFAST,00008;<CR><LF>
!SCNBACKON,00008;<CR><LF>
!SCNRAISE,00008;<CR><LF>
!SCNLOWER,00008;<CR><LF>
!SCNRAMP,00008;<CR><LF>
!SCNSTOP,00008;<CR><LF>
!SCNNUDGEUP,00008;<CR><LF>
!SCNNUDGEDN,00008;<CR><LF>
!SCNONOFF,00008;<CR><LF>
!SCNTOGGLE,00008;<CR><LF>
!SCNSAVE,00008;<CR><LF>
```

### 3.5 Advanced events

Class `EVTADV`: events associated with advanced features; refer to the relevant volume/section for event details. Listed in this volume: **Advanced DALI repair – see Volume 3.**

> The overview (2.2.3) lists "Controller inhibit – see Chapter 3 Events" as "tbc", but chapter 3 contains no controller-inhibit material.

---

## 4 Users & Access

User accounts can limit access to particular areas within the configuration. Each scene, channel, DMX zone and button has inherent access flags (set in the configuration; not changeable via the GATEWAY) that define whether it can be queried, controlled and adjusted. User accounts modify these flags per user: scenes and channels are put in areas, and accounts define which areas they can access (with or without being allowed to make adjustments).

Each user account provides a different "window" on to the eDIN+ system: some users see the whole system as if no user accounts were set up; others see a partial or reduced system. Access levels and user accounts involve minimal change to the GATEWAY: each connection can be set to a user account, otherwise operation is the same. All users use the same commands and queries; the only difference is that a scene or channel may exist for one user but not another.

### 4.1 Scene and channel access flags

Usually you need not worry about access levels. A scene or channel is either:

1. **Private** – fully hidden from the user; effectively does not exist.
2. **Public** – exists and has no restriction.
3. **Access-only** – exists and can be fully monitored and controlled with standard queries/commands, but cannot be adjusted and will not respond to adjustment commands such as `$SCNSAVE`. Likely only when operating with user accounts.

Each scene, channel, DMX zone and button has 3 access flags, combined into the single *inherent access level*:

| Access flag | Bit | Numeric value | Description |
|---|---|---|---|
| View | 0 | 1 | If set the scene or channel can be queried. |
| Control | 1 | 2 | If set the scene or channel can be controlled with commands. |
| Edit | 2 | 4 | If set the scene can be edited/adjusted with scene setting operations, or aspects of the channel or module can be edited/adjusted, e.g. colour pre-set. |

| Access level | Value | Description |
|---|---|---|
| Private | 0 | No access possible. It effectively does not exist. |
| Monitor-only | 1 | Can be monitored and queried but not controlled or adjusted. |
| Access-only | 3 | Can be monitored and controlled, but not adjusted. Will respond to standard queries and control commands. |
| Public | 7 | Fully accessible and adjustable. No restrictions. |

For systems with an NPU the access level is set by the configuration and cannot be changed through the Gateway. For all other systems, access flags cannot be changed; everything that exists is permanently fully accessible (public).

#### 4.1.1 Channel access queries

Establish whether a channel will respond to a command or query. Channels that do not exist, and channels with a Private access level, do not reply; otherwise all channels reply even if not set to reply to standard queries (normally a channel will not respond to a standard query if the View flag is not set).

- Buttons reflect the access level of their plate module. Use `ALL` instead of `btn-num` for all buttons on a plate. A plate's access level can be found with `?PLATENAMES` (Volume 1).
- All flavours of input channel use the generic `INP` query.
- Advanced DALI addressing can be used with the DALI query.
- `access` = bit-field flags 1 (viewable) + 2 (controllable) + 4 (editable).

All From v01.00. Long-ack format: `!OK,<xxx>ACCESS,…;`

| Query | Reply |
|---|---|
| `?CHANACCESS,<addr>,<devcode>,<chan-num>;` | `!CHANACCESS,<addr>,<devcode>,<chan-num>,<access>;` |
| `?DALIACCESS,<addr>,<devcode>,<dali-id>;` | `!DALIACCESS,<addr>,<devcode>,<dali-id>,<access>;` |
| `?DMXACCESS,<addr>,<devcode>,<zone-num>;` | `!DMXACCESS,<addr>,<devcode>,<zone-num>,<access>;` |
| `?BTNACCESS,<addr>,<devcode>,<btn-num>;` or `?BTNACCESS,<addr>,<devcode>,ALL;` | zero or more `!BTNACCESS,<addr>,<devcode>,<btn-num>,<access>;` |
| `?INPACCESS,<addr>,<devcode>,<chan-num>;` | `!INPACCESS,<addr>,<devcode>,<chan-num>,<access>;` |

```
?chanAccess,1,12,2;
!OK,CHANACCESS,001,012,002;<CR><LF>
!CHANACCESS,001,012,002,07;<CR><LF>
```

#### 4.1.2 Scene access queries

There are no separate scene access queries. The access level is returned from a normal `?SCN` or `?SCNS` scene status query and in scene status events.

### 4.2 User accounts and area access

User accounts are based around areas. Scenes and channels are put into areas and user accounts define, via **area access levels**, whether they can access scenes and channels in that area. Area access levels modify the inherent access level of scenes/channels, giving the **user access level** that the GATEWAY uses.

There is a default **Public** guest account providing minimum access for all users. Some accounts can be made administrator accounts as shorthand for unrestricted public access to all areas.

#### 4.2.1 Area access levels

For each account, an area access level is configured for every area:

- **Private** – inaccessible and hidden
- **Access-only** – only monitoring and control
- **Public** – unrestricted: monitoring, control and adjustments

The area access level for every area is returned in the responses to the discovery query `?AREANAMES`. User accounts and area access levels can only be created and set during configuration, not via the GATEWAY (except passwords).

#### 4.2.2 User access levels

Every scene and channel is assigned to exactly one area and has an inherent access level. With a user account, the inherent access level is combined with the area access level to produce the final user access level. There is always a **Default area (area number 0)**; scenes and channels are put in it when created and can be configured into other areas.

- Accounts can only **restrict** inherent access – they cannot increase or override it. If a scene or channel is invisible via the configuration, no account (including Administrator) can make it visible.
- All accounts implicitly inherit the access of the **Public** account, which is the default minimum all other accounts build on. If you have access to something from the Public account, you have access whichever account you use.

```
user-access = (inherent-access && public-area-access)
            ||(inherent-access && account-area-access);
```

In words: a channel or scene is viewable if it is inherently viewable AND in a viewable area, determined for both the Public account and the actual user account; it is viewable if viewable from either the Public account OR the user account. This is done for each access flag: view, control and edit. The area of a scene/channel, or its inherent access level, cannot be changed via the GATEWAY.

#### 4.2.3 Special Public account

A special user account called **Public** always exists: the guest account, with no password or credentials; it cannot be created or deleted. It is used:

- as the default account when a connection has not been set to any other account,
- to log out a connection of another account, and
- when you try to log a connection into a different account but fail.

If an eDIN+ has user accounts, the area access levels of the Public account can be configured – by default all areas are hidden (no access to anything). With no user accounts, the Public account automatically has full access to everything.

#### 4.2.4 Administrator privileges and special Administrator account

A normal user account can be made an administrator account, which makes all areas public and completely unrestricted. Some eDIN+ features and operations are available only to administrator accounts. When user accounts are set up, an account called **Administrator** is always created, so there is always at least one account with administrator privileges (it can be used as a normal account, and by an engineer to resolve or repair a system).

### 4.3 Using user accounts with connections

Other than setting a user for each connection, all operation is the same. You can use the GATEWAY without worrying about users: the Public account is used until another user is set. For systems without user accounts Public has unrestricted access; with user accounts, Public access is configurable.

You can set the user on every connection independently. A user is set using credentials; all connection types can change user with commands, and HTTP connections can additionally use HTTP Basic Authentication via headers. Because accounts present different windows on the system, available scenes and channels may change when you change user: **always invalidate any data held for the current user and refresh data for the new user**.

#### 4.3.1 The Public guest account

Used automatically when no other user is set, e.g.:

- default account when a new connection is made and no credentials presented;
- account when a connection presents incorrect credentials (tries to change user but fails);
- account when a connection explicitly cancels a user;
- account when a connection explicitly changes to the Public user.

#### 4.3.2 User account commands and queries

Credentials are a user-name and password set up in the configuration. Both are plain text and **case-sensitive**; they must match exactly. A user can change its own password with `$USERPSSWD`: the connection must already be set to that user with current credentials and must present both current and new passwords; the current user remains unchanged but all future connections use the new password. The password cannot be queried.

These are part of the Interface API and work on all connection types. HTTP connections are short-lived, so credentials must be presented with every access (use `$USER` or HTTP Basic Authentication). When you change user, delete and refresh locally cached scenes/areas/channels. Although you can change user at any time, it is usual to do so only when making a new connection – close the existing connection and open a new one (HTTP differs; see below).

| Parameter | Meaning |
|---|---|
| `user-name` | Plain text, case sensitive name of user account |
| `password` | Unencrypted plain text, case sensitive password |
| `status-code` | 0 = successful operation, 1 = operation failed |

**Change to a particular user account**

| | |
|---|---|
| Command | `$USER,<user-name>,<password>;` |
| Long-ack format | `!OK,USER,<user-name>,<password>;` |
| From | 02.00 |
| Reply | "Report Change of User": `!USERERR,<user-name>,<status-code>;` |

```
$User,William,Greensleeves;
!OK,USER,William,Greensleeves;<CR><LF>
!USERERR,William,0;<CR><LF>
```

**Cancel current user account; log off** – changes the user to Public.

| | |
|---|---|
| Command | `$USER;` |
| Long-ack format | `!OK,USER;` |
| From | 02.00 |
| Reply | `!USERERR,<user-name>,<status-code>;` |

```
$user;
!OK,USER;<CR><LF>
!USERERR,Public,0;<CR><LF>
```

**Change current user password**

| | |
|---|---|
| Command | `$USERPSSWD,<user-name>,<old-password>,<new-password>;` |
| Long-ack format | `!OK,USERPSSWD,<user-name>,<old-password>,<new-password>;` |
| From | 02.00 |
| Reply | "Report Change of Password": `!USERPSSWDERR,<user-name>,<status-code>;` |

```
$userPsswd,William,Greensleeves,Shakespear;
!OK,USERPSSWD,William,Greensleeves,Shakespear;<CR><LF>
!USERPSSWDERR,William,0;<CR><LF>
```

**Query current user account**

| | |
|---|---|
| Query | `?USER;` |
| Long-ack format | `!OK,USER,<user-name>;` (as printed; example shows `!OK,USER;`) |
| From | 01.00 |
| Reply | "Report of User": `!USER,<user-name>;` |

```
?user;
!OK,USER;<CR><LF>
!USER,Public;<CR><LF>
```

#### 4.3.3 Using HTTP Basic Access Authentication with user accounts

HTTP has no long-lived connections, so credentials must be presented on each access. Either include `$USER` as the first command of each access, or use HTTP Basic Access Authentication (`Authorization: Basic <credentials>`, where credentials is the base64 encoding of `username:password`).

jQuery with username/password parameters:

```js
$.ajax({
      type: "POST",
      url: 'http://'+ipaddr+'/gateway?',
      username: "William",
      password: "Greensleeves",
      ...
    })
```

jQuery with an explicit header:

```js
$.ajax({
      type: "POST",
      url: 'http://'+ipaddr+'/gateway?',
      headers: {
        "Authorization": "Basic "+btoa("William:Greensleeves")
      },
      ...
    })
```

---

## 5 Advanced scene control & status

Volume 1's standard commands provide full scene control and monitoring. Use the advanced commands only if you are fully conversant with the scene operations available in an eDIN+ configuration and want to mimic that exact behaviour from your controller.

### 5.1 Scene status explained

Each scene has a state (active/inactive). There is no agreed standard of when a scene is in use:

- **Complete overlap** (every scene has exactly the same channels): a scene becomes active when recalled and inactive when another is recalled.
- **No overlap**: scenes are independent and do not affect each other's state.
- **Partial overlap** (some but not all channels shared): ambiguous – depends on the channels, how many overlap, and the intention of the scenes (and the end user).

The algorithm can be adjusted: it can use **scene mode** or **channel mode**, and **strict** or **non-strict** rules.

#### 5.1.1 Scene mode and flags values

The "Report scene status" message includes a `mode` and a `flags` value.

| Field | Values |
|---|---|
| `mode` | 1 – scene monitor mode; 2 – channel monitor mode |
| `flags` | bit-field flags: 1 (is-an-off-scene) + 2 (strict rule applied) |

#### 5.1.2 The Is-An-Off-Scene flag

An *off scene* turns all its channels off (level zero). Its state and level behave like normal scenes, but channel control is opposite:

- Scene state is active when the scene is recalled (e.g. `$SCNRECALL`, `$SCNBACKON`) and inactive when recalled to off (e.g. `$SCNOFF`).
- Scene level is 0 when inactive and non-zero (usually 255) when active.
- Channel levels are turned **off** when the scene is recalled and **on** when recalled to off.

So scene state and channel levels look "out of sync": channels switch on with `!SCNOFF` events and off with `!SCNBACKON`; channels are on when scene level is 0 and off when it is 255. Toggle commands work on scene state, not channel levels – hence `$SCNBACKON` turns the off scene back on but turns channel levels off.

#### 5.1.3 Scene monitor mode

Default is scene monitor mode with strict rules. Operations on a scene make it active; operations on other overlapping scenes may make it inactive. The strict rule can be configured off, e.g.:

- A main scene whose channels include one feature channel with its own scene control, and the main scene should ignore the feature channel's state.
- A large hall with a main area plus smaller areas, each with their own scenes; an "All on" scene that should stay active as long as the main-area lights are on, even if smaller-area lights have changed – turn off the strict rule on "All on".

#### 5.1.4 Channel monitor mode

The system calculates scene state from channel on/off states no matter which scene(s) set them. Most useful for off scenes and scenes controlling feature channels; not particularly good for normal scenes.

The **strict rule** flag says all channel states must match those defined in the scene for it to be active. With strict off, any channels must match; for normal scenes the channel must be on to match, and if defined as off in the scene, the channel must be off. Matching works on simple on/off, not exact level.

### 5.2 Advanced scene control

#### 5.2.1 Summary of standard scene commands (Volume 1)

- Turn a scene on/off: `$SCNRECALL` and `$SCNOFF`
- Toggle a scene: `$SCNONOFF`
- Full control of scene level (including on/off) with controllable fade time: `$SCNRECALLX`

#### 5.2.2 Advanced scene recall commands

**Recall scene with fast recall time** – ignores the scene's fade time and recalls at maximum level using the *fast fade time* (a global setting in the configuration). Use to immediately turn on a scene with a very long fade time.

| | |
|---|---|
| Command | `$SCNFAST,<scn-num>;` |
| Long-ack format | `!OK,SCNFAST,<scn-num>;` |
| From | v01.00 |

```
$scnFast,8;
!OK,SCNFAST,00008;<CR><LF>
```

#### 5.2.3 Advanced scene toggle commands

The standard toggle is `$SCNONOFF`. `$SCNTOGGLE` toggles using a remembered snapshot of scene and channel levels when turning the scene back on, instead of always recalling to maximum. It is useful inside the system for full on/off/level up & down from a single button, but less useful when level control is provided by e.g. a slider with `$SCNRECALLX`.

Pitfall: it can remember very dim levels that are officially "on" but look off, so it appears to do nothing, toggling between off and almost-off. The only way to recover is another command that restores brighter levels.

**Recall scene with toggle action** – `$SCNTOGGLE` toggles between `$SCNBACKON` and `$SCNOFF` actions; similar to `$SCNONOFF` but saves/restores scene and channel levels. Be aware:

- One snapshot per scene, held temporarily by the scene. It does not change the levels defined in the scene (not a scene-setting action) and is forgotten when the controller is powered down or reset.
- Any/all `$SCNOFF` actions save a snapshot of current scene and channel levels before they are turned off, whether implicit or explicit in other commands.
- How the scene/channels reached their current level does not matter – only the level at the time of the `$SCNOFF` action.
- Levels are only saved if currently non-zero (an "off" level cannot be saved).
- Very low levels that physically look off are still saved, causing the confusing toggling described above.

| | |
|---|---|
| Command | `$SCNTOGGLE,<scn-num>;` |
| Long-ack format | `!OK,SCNTOGGLE,<scn-num>;` |
| From | v01.00 |

```
$scntoggle,8;
!OK,SCNTOGGLE,00008;<CR><LF>
```

**Recall scene with previous (toggle) level** – recalls the scene and channels to their previously saved level (the "on" half of `$SCNTOGGLE`), even if the scene is already active.

| | |
|---|---|
| Command | `$SCNBACKON,<scn-num>;` |
| Long-ack format | `!OK,SCNBACKON,<scn-num>;` |
| From | v01.00 |

```
$scnBackOn,8;
!OK,SCNBACKON,00008;<CR><LF>
```

#### 5.2.4 Advanced scene level adjustment commands

These adjust the scene level and the values of channels and other objects in the scene. A scene may contain objects invisible to the GATEWAY that are still affected, so these commands may have unintended side effects; their effect on scene state also depends on how the scene is configured. To simply change channel and scene levels use `$SCNRECALLX`. These commands are useful to mimic a plate button. All From v01.00. Long-ack format for each: `!OK,<CMD>,<scn-num>;`

| Command | Action |
|---|---|
| `$SCNRAISE,<scn-num>;` | **Raise** – start dimming up. Channels in the scene start increasing level to maximum; tuneable-white channels start increasing colour temperature to maximum; colour channels start moving forward through their colour palette in a circular un-ending sequence; channels already off (level = 0) are unaffected; rate set by a global configuration setting. |
| `$SCNLOWER,<scn-num>;` | **Lower** – start dimming down. Channels decrease level to a minimum set by a global configuration setting; tuneable-white channels decrease colour temperature to minimum; colour channels move backwards through the palette in a circular un-ending sequence; channels off are unaffected; rate is set by the global setting that determines the `SCNRAISE` rate. |
| `$SCNSTOP,<scn-num>;` | **Stop** scene dimming – stops raise, lower and ramp actions on all channels in the scene. |
| `$SCNRAMP,<scn-num>;` | **Ramp** – start dimming; alternates between a `SCNLOWER` action and a `SCNRAISE` action depending on the current scene state. |
| `$SCNNUDGEUP,<scn-num>;` | **Nudge up** – like `$SCNRAISE` but dims up by a fixed step size and stops. Channels increase level by the step size to maximum; tuneable-white channels move colour temperature forward to the next preset; colour channels move forward to the next palette entry; off channels unaffected; step size and rate are global configuration settings. |
| `$SCNNUDGEDN,<scn-num>;` | **Nudge down** – like `$SCNLOWER` but dims down by a fixed step and stops. Channels decrease level by the step size, capped at the minimum set by the global `SCNLOWER` minimum; tuneable-white channels move colour temperature backwards to the next preset; colour channels move backwards to the previous palette entry; off channels unaffected; step size/rate use the same global settings as `SCNNUDGEUP`. |

```
$scnraise,8;     !OK,SCNRAISE,00008;<CR><LF>
$scnlower,8;     !OK,SCNLOWER,00008;<CR><LF>
$scnSTOp,8;      !OK,SCNSTOP,00008;<CR><LF>
$scnramp,8;      !OK,SCNRAMP,00008;<CR><LF>
$scnNudgeUp,8;   !OK,SCNNUDGEUP,00008;<CR><LF>
$scnNudgeDn,8;   !OK,SCNNUDGEDN,00008;<CR><LF>
```

---

## 6 Advanced channel control & status

### 6.1 Advanced relay module control

Normally use `$CHANFADE` for both dimmable and relay channels (works well for mains-voltage relay control). The eDIN+ modules **EVO-RP-03-02** and **DIN-RP-05-04** can also be used for low-voltage control such as blinds, which often needs quick pulses that are hard to achieve with `$CHANFADE` sequences. Instead use `$CHANPULSE`.

Relay channel actions:

| Value | Name | Action |
|---|---|---|
| 1 | Pulse Close | Momentarily activate relay contact |
| 2 | Pulse Open | Momentarily deactivate relay contact |
| 3 | Pulse Toggle | Momentarily toggle relay contact |

"Open" and "Close" are correct for normally-open (NO) contacts; some relay channels may be set for normally-closed (NC), when "activate"/"deactivate" are more accurate.

#### 6.1.1 Advanced output state commands

**Send relay channel action**

| | |
|---|---|
| Command | `$CHANPULSE,<addr>,<devcode>,<chan-num>,<action>;` (as printed) |
| Long-ack format | `!OK,CHANSTATE,<addr>,<devcode>,<chan-num>,<action>,<pulsetime(ms)>;` (as printed) |
| From | v02.00 |

```
$ChanPulse,1,12,2,1,1000;
!OK,CHANPULSE,001,012,002,001,001000;<CR><LF>
```

> **Note (transcription):** the printed command syntax omits the pulse-time parameter, and the long-ack format prints `CHANSTATE`; the example sends a 5th parameter (`1000`) and the acknowledgement is `!OK,CHANPULSE,…,001,001000;` (action then pulse time in ms), matching the `!CHANPULSE` event in 3.3.1 which carries `<pulsetime(ms)>`. The PDF does not state limits for the pulse-time parameter.

### 6.2 Live channel levels

Two techniques: poll for the current level with a query, or enable channel events and monitor them. Polling gives on-demand samples (simple, but not representative of continuous behaviour). For continuous tracking use events, which also report fade lengths. The PDF does not recommend frequent regular polling over the GATEWAY, i.e. polling quicker than 5 minute intervals.

Two sets of polling queries:

- The normal `?CHAN` (and derivatives, Volume 1) always assume the channel is not mid-fade and report the last fade operation's final value (as if every fade snaps). Best when levels are mostly static and change quickly. E.g. 3 s fades polled every 5 minutes.
- The advanced `?CHANLEVELX` (and derivatives) report the level at the instant of the query, even during fades. Use for long fades (e.g. a 20-minute fade polled every 5 minutes). With short fades it can give a misleading level if it coincides with a fade.

If a channel has both long and short fades and accuracy matters, use events instead: enable with `$EVTOUT` or `$EVENTS` and monitor `!CHANFADE` / `!CHANSTOP` and derivatives (chapter 3).

#### 6.2.1 Advanced request channel level

Same format as the normal Request Channel Status queries, but only a channel level message is returned and the value is instantaneous. Three flavours for `CHAN`, `DALI`, `DMX`. Level is 0–255 (0 = off; relay/non-dimmable return 0 or 255); power is an estimate (percentage of maximum output power, plus wattage at max power – see Volume 1 7.3).

| Parameter | Meaning |
|---|---|
| `level` | Level (0–255) or relay state (0 or 255) |
| `power` | Percentage of maximum wattage (0–100) |
| `wattage` | Wattage at maximum level/power in Watts |

All From v02.00.

| Query | Long-ack | Reply |
|---|---|---|
| `?CHANLEVELX,<addr>,<devcode>,<chan-num>;` | `!OK,CHANLEVELX,<addr>,<devcode>,<chan-num>;` | `!CHANLEVELX,<addr>,<devcode>,<chan-num>,<level>,<power>,<wattage>;` |
| `?DALILEVELX,<addr>,<devcode>,<dali-num>;` | `!OK,DALILEVELX,<addr>,<devcode>,<dali-num>;` | `!DALILEVELX,<addr>,<devcode>,<dali-num>,<level>,<power>,<wattage>;` |
| `?DMXLEVELX,<addr>,<devcode>,<zone-num>;` | `!OK,DMXLEVELX,<addr>,<devcode>,<zone-num>;` | `!DMXLEVELX,<addr>,<devcode>,<zone-num>,<level>,<power>,<wattage>;` |

```
?chanLevelx,1,12,2;
!OK,CHANLEVELX,001,012,002;<CR><LF>
!CHANLEVELX,001,012,002,030,099,00100;<CR><LF>

?daliLevelx,1,17,2;
!OK,DALILEVELX,001,017,002;<CR><LF>
!DALILEVELX,001,017,002,254,099,02500;<CR><LF>

?dmxLevelx,1,15,2;
!OK,DMXLEVELX,001,015,002;<CR><LF>
!DMXLEVELX,001,015,002,255,033,02500;<CR><LF>
```

### 6.3 Advanced DALI virtual channel addressing

eDIN+ makes DALI lighting channels the same as other channels: DALI buses are accessed via Mode DALI channels rather than native DALI addressing. Mode DALI channels are mapped on to native DALI operations, giving three **UBC operating modes**: **Broadcast**, **Standard (Group)** and **Advanced (Channel)**. In some modes native DALI Broadcast and Group addressing show through, as *DALI virtual channels* accessed with DALI identifiers. Virtual channels have limited functionality and (representing collections of channels/fixtures) cannot have their own status or levels and generally cannot be queried.

To bypass Mode DALI and virtual channels and use direct native DALI addressing, use the low-level **XDALI API – see Volume 3**.

#### 6.3.1 Advanced virtual DALI output commands

Fade and stop commands can be sent to the virtual channels `BST` or `Gxx` (if they exist), using the standard `$DALIFADE` / `$DALISTOP` syntax (Volume 1) with the Mode DALI channel number replaced by an advanced DALI identifier:

| Identifier | Meaning |
|---|---|
| `BST` | DALI Broadcast – all fixtures (UBC operating modes Standard & Advanced) |
| `G00` to `G15` | DALI Group – commissioned DALI groups (UBC operating mode Advanced) |
| `Fxx` | DALI fixture, `F` followed by DALI short address 0–63 (see 6.3.3) |

Behaviour is **undefined** if used on UBCs not in the correct operating mode.

| | Set virtual DALI channel to level with fade | Stop virtual DALI channel fade |
|---|---|---|
| Command | `$DALIFADE,<addr>,<devcode>,<dali-id>,<level>,<fadetime(ms)>;` | `$DALISTOP,<addr>,<devcode>,<dali-id>;` |
| Long-ack | `!OK,DALIFADE,…` | `!OK,DALISTOP,<addr>,<devcode>,<dali-nid>;` (as printed) |
| From | v01.00 | v01.00 |

```
$dalifade,02,17,016,bst,1000;
!OK,DALIFADE,002,017,016,BST,00001000;<CR><LF>

$DALIstop,4,17,g0;
!OK,DALISTOP,004,017,G00;<CR><LF>
```

> **Note (transcription):** the fade example shows `bst` in the `<level>` position of an otherwise standard `$DALIFADE` (`…,016,bst,1000`), as printed. The surrounding text and section 6.3.2 indicate the identifier replaces the channel number (`$dalifade,02,17,BST,255,1000;`). Use the 6.3.2 form as the reference.

#### 6.3.2 Advanced virtual DALI output events

Using the advanced DALI commands generates the standard DALI events (3.3.1) with the `BST` / `Gxx` identifiers.

```
In UBC Standard mode and UBC Advanced (Channel) mode:
$dalifade,02,17,BST,255,1000;
!OK,DALIFADE,002,17,BST,255,00001000;<CR><LF>
!DALIFADE,002,17,BST,255,00001000;<CR><LF>

In UBC Advanced (Channel) mode:
$dalifade,02,17,G00,255,1000;
!OK,DALIFADE,002,17,G00,255,00001000;<CR><LF>
!DALIFADE,002,17,G00,255,00001000;<CR><LF>
```

#### 6.3.3 Advanced DALI fixture health query

If configured to do so, a UBC can report problems with individual DALI fixtures: lamp problem (status code 25), not reporting/missing (26), or settings not matching those saved during commissioning (22). It reports on the relevant Mode DALI channel with `!DALIERR,<addr>,<devcode>,<chan-num>,<status-code>` and on the fixture with a second `!DALIERR,<addr>,<devcode>,Fxx,<status-code>` event. These are also reported by the `?ERRORS` query (Volume 1).

A single fixture's status can be queried (same as the DALI channel status query, but with a fixture identifier, and returning only the DALI fixture health message). The fixture identifier is `F` followed by its DALI short address 0–63, e.g. `F01`. A fixture must be a known fixture (in the expected fixture list in the DALI commissioning data) to be reported; as with non-existent channels, unknown fixtures report nothing.

| | |
|---|---|
| Query | `?DALI,<addr>,<devcode>,<dali-fixture>;` |
| Long-ack format | `!OK,DALI,<addr>,<devcode>,<dali-fixture>;` |
| From | v02.00 |
| Reply | "Report DALI fixture health": `!DALIERR,<addr>,<devcode>,<dali-fixture>,<status-code>;` |

```
?dali,1,17,F1;
!OK,DALI,001,017,F01;<CR><LF>
!DALIERR,001,017,F01,000;<CR><LF>
```

### 6.4 Controlling input channels and injecting input events

Three input channel types: **Contact inputs**, **PIR/Occupancy inputs** and **Analogue inputs**. Contact inputs are used either as **simple contact closure switches** (state matters, e.g. room partition switches) or as **momentary/push-button switches** (timing of events matters, state unused). The channel type can be determined with the standard `?INP` query: `INPSTATE` for contact inputs, `INPPIR` for PIR/occupancy inputs, `INPLEVEL` for analogue inputs.

In general you cannot control an input channel's state, only monitor it. However you may want to mimic an input or force the controller to perform actions triggered by input change-of-state events. This is possible via `$BTNSTATE`, `$INPSTATE` and `$INPLEVEL` commands. PIR channels also have advanced features and can have their state controlled via `$INPPIR`.

> **Note (transcription):** this chapter does not give a full command syntax block (format, parameters, long-ack) for `$INPSTATE`, `$INPPIR`/`$INPPIRSET` or `$INPLEVEL`/`$INPLEVELSET`. The only injection command with a documented syntax in Volume 1/2 is `$BTNSTATE,<addr>,<devcode>,<btn-num>,<event>;` (Volume 1, 7.4.3). Syntax for the others is not reproduced here to avoid inventing it; confirm against the Quick/Technical Reference or Volume 3.

#### 6.4.1 Simple contact closure input channels

When queried, simple contact inputs report: `state = 0` when inactive (the "Normally Closed" or "Normally Open" state), `state = 1` when active. On any state change they generate a "Change in switched input" event with new state **Release-off (0)** (default inactive) or **Press-on (1)** (active). Other input events can be ignored.

The actual state can be overridden to Release-off or Press-on with `$INPSTATE`, which generates a suitable event and is reported by `?INP`. The override persists until changed by another `$INPSTATE` or until the real input channel reports a "Change in switched input" event. Take care: it can leave the system confused about the channel state versus reality.

#### 6.4.2 Button and momentary contact input channels

Buttons and momentary contacts have additional events related to how long they are pressed. When queried, `state = 0` (not pressed) or `1` (being pressed); since it is only active momentarily, querying is not very useful and does not report the held state (track via events).

Events (Button Events enumeration in Volume 1):

| Event | Value | Meaning |
|---|---|---|
| Release-off | 0 | immediately the button/switch is released |
| Press-on | 1 | immediately the button/switch is pressed |
| Hold-on | 2 | when pressed and held for a sufficient time |
| Short-press | 5 | when released but no Hold-on event occurred |
| Hold-off | 6 | when released after a Hold-on |

Two event sequences:

| Press | Sequence |
|---|---|
| Short press | Press-on (when pressed) then Short-press, Release-off (when released) |
| Long held press | Press-on (when pressed) then Hold-on (when held for sufficient time) then Hold-off, Release-off (when released) |

*Diagram on page 40 (timing of button input vs. events; described from the rendered page):* a button input trace is shown twice. In the short-press case the input goes high, "Press-on" is generated, and on release "Short-press" and "Release-off" are generated; state shows Release-off → Press-on → Release-off. In the long-press case the input stays high past the "Hold time": "Press-on", then "Hold-on" after the hold time, then on release "Hold-off" and "Release-off". The graphical axes are not reproduced; the sequences above carry the same information.

You can override the actual button/input state and generate an input event for any of the 5 events using `$INPSTATE` and `$BTNSTATE`. This generates a "Change in switched input" event and triggers any rules connected to that button/input event, so you can mimic buttons/switches via the GATEWAY. It is almost always safe to use these with button and momentary contact channels to generate single events or sequences. If injected events coincide with real presses, events interleave; usually "last event wins", no different from two buttons configured to do the same actions pressed together.

##### 6.4.2.1 Button and contact input channel timings

Only relevant if a contact input behaves unreliably. Contact input channels have configurable **Debounce Time**, **Close Time** and **Hold Time**. Buttons have the same parameters but fixed and not configurable.

| Parameter | Purpose |
|---|---|
| Debounce Time | Times a stable input after all changes have settled. Mechanical switches bounce, producing bursts of open/close events; used on both open and close to detect clean changes and reject short-lived noise. Normally needs no adjustment; may need increasing for a "heavy" switch with a long bounce/settling time. If too short you may see erroneous extra Press-on and Release-off events. |
| Close Time | Generates a consistent time for the Press-on event, timed from the start (first unclean contact closure). Ensures the Press-on event and connected actions (e.g. scene recalls) always occur with the same latency after the button/switch is first pressed. Also rejects pulses shorter than the Close Time. |
| Hold Time | Generates Hold-on events. Timed **from the Press-on event**, so add Close Time and Hold Time to get the Hold-on time from initial switch closure. |
| Inactive Time | No longer used; can be ignored. |

*Diagram on page 41 (debounce/close/hold timing; described from the rendered page):* three traces of a contact input. (1) Normal press: bounce at start, Debounce Time and Close Time marked from first contact; Press-on at end of Close Time; Hold-on after Hold Time; on release Hold-off (or Short-press) and Release-off, with Debounce Time at the release. (2) "The Press-on event will be delayed past the Close Time if the input has not yet settled." (3) "Real short lived pulses that are less than the Debounce or Close Time are ignored."

#### 6.4.3 PIR input channels

PIR input channels are used with PIR (passive infra-red) or other occupancy sensors to monitor occupancy and automate turning lights off (and maybe on). A channel generates a *presence* event when the area becomes newly occupied and an *absence* event when no longer occupied. Fully automated presence control turns lights on & off on presence & absence events; partially automated absence-only control only turns off on absence.

PIR channels are **not** contact input channels: they process the (often contact/relay closure) output of a PIR or occupancy sensor and convert it into an occupied state, and respond to commands sent by the controller so they work in sympathy with it. Mixing automated control with manual control (e.g. wall plate) is why you may send channel commands:

- **Lights turned on manually** – a future absence event is needed to turn them off automatically. Send `SET`: sets the channel to the occupied state (if not already) without generating a presence event that could override the manual turn-on. A future absence event is generated when occupancy is no longer detected.
- **Lights turned off manually** (everyone leaving) – the channel should become unoccupied so it will detect new presence. Send `CLEAR`: clears to unoccupied and inhibits new detections for a short time so leaving does not re-trigger the sensor.
- **Temporarily suspend automatic detection** (e.g. an audio-visual scene in a darkened meeting room where sensors may falsely report absence then presence) – send `HOLD`: sets and holds the channel in the occupied state indefinitely without causing presence or absence events until another command releases it.
- **Force presence/absence events** to resynchronise lights with the physical state – `TRIGGER`, `TIMEOUT` and `SYNC` force the channel to send a presence or absence event.

When queried, PIR channels report `state = 0` (empty/unoccupied) or `1` (occupied).

"Change in PIR input state" events report these event states:

| Value | State | Meaning |
|---|---|---|
| 0 | Empty | Sensor at rest, no occupancy; possible hard alternative to absence event |
| 1 | Triggered-On | Presence event, active sensor detected |
| 2 | Timeout-Off | Absence event, inactive sensor, timeout occurred |
| 3 | Set-On | Manual presence override, used to track occupancy |
| 5 | Cleared-Off | Manual absence override, used to track occupancy |

PIR channel commands (sent via the GATEWAY using the `$INPPIRSET` command – syntax not given in the PDF):

| Value | Command | Effect |
|---|---|---|
| 0 | `SYNC` | Force an immediate presence or absence event depending on the channel's current internal state |
| 1 | `TRIGGER` | Force an immediate presence event, timeout re-started |
| 2 | `TIMEOUT` | Force an immediate absence event, timeout cleared |
| 3 | `SET` | Manual presence override, timeout re-started |
| 4 | `HOLD` | Manual presence override, timeout suspended |
| 5 | `CLEAR` | Manual absence override, timeout cleared and inhibit period started |

##### 6.4.3.1 PIR channel timings

PIR channels work with: chatter-type sensors (short contact closure at regular intervals while presence is detected); self-timed sensors (single closure on first detection, remaining closed until presence ends – recommended self-time **under 10 seconds** so `TIMEOUT`, `CLEAR` and walk-test modes work correctly); Normally-Open or Normally-Closed sensors.

Configurable timing parameters:

| Parameter | Purpose |
|---|---|
| Debounce Time | Cleans up sensor inputs; the input must be settled for the Debounce Time for a state change to register. Same as for contact inputs. |
| Expiry Time | The timeout period the channel remains occupied. Restarted by every active sensor input and every `SET` command. The channel is triggered by the leading closure of the sensor, but the timeout does not begin until the sensor **releases** the input, so the sensor's self-timed period and the channel's expiry period **add together** – set the sensor period to under 10 seconds and use the channel Expiry Time to time the absence. |
| Inhibit Time | Used in the `CLEAR` override state; restarts for every `CLEAR`. During this period the sensor input is ignored; at the end the channel moves to EMPTY and the sensor input is re-enabled. Keep short – typically 20 seconds or less. For longer periods (e.g. wall plate on the far side of a large room), have the wall plate button event start a Delay Timer object which issues `CLEAR` on timeout, rather than the button issuing `CLEAR` directly. |

*Diagram on page 44 (PIR timing; described from the rendered page):* three traces. (1) Sensor triggers: Empty → Triggered (event `TRIGGERED`); timeout starts when the sensor input releases ("Start Timeout"), is restarted by further activity ("Restart Timeout"), and after the Expiry Time `TIMEOUT` / `EMPTY` events occur; a "Hold Timeout" marker is shown. (2) `SET` command: Empty → Triggered → Set; the channel stays SET while input is still active; after the Expiry Time `TIMEOUT` and `EMPTY` occur. (3) `SET` then `CLEAR`: the sensor is ignored ("Don't care") during the Inhibit Time, then `EMPTY`. Also: "Real short lived pulses that are less than the Debounce Time are ignored." Exact waveform timings are not reproduced.

#### 6.4.4 Analogue input channels

Analogue input channels monitor a control voltage from an external controller (e.g. a slider) or the output of an analogue sensor (e.g. lux, temperature). They have a reporting range that defaults to 0–255 but can be scaled to report meaningful values and to normalise physical differences between channels/sensors (e.g. all lux channels reporting the same nominal 300 Lux). Scaling is for convenience and optional.

| Type | Description |
|---|---|
| Analogue input | Most used. Physical analogue voltage input range 0–10 V; by default a calibrated range of 0–255. |
| DSI input | A digital serial input receiving values 0–255 conforming to the DSI serial format. |
| Evo input | Physical analogue voltage input range 0–9.3 V, reporting range 0–255. Supports an imperfection in some old products; not normally expected to be used. |

Two properties control when the channel generates a level event (usually one or the other, not both):

| Property | Description |
|---|---|
| Level sensitivity | Threshold on how much the level must change since last reported before a new level is reported. Smaller changes (possibly noise) generate no event. Special value 0 turns the feature off. Primarily for mirroring control inputs (e.g. slider to output lighting channels). |
| Time period | Reporting timer; each report resets it; when the timer reaches the period the channel generates an event reporting its level, irrespective of change. Special value 0 turns the feature off. Primarily for sensors, periodically updating the internal controller. |

Level and status can be queried with `?INP`. The input level can be overridden and an input event generated for any level using `$INPLEVELSET` (syntax not given in the PDF); this generates a "Change in analogue input" event and triggers connected rules. The override persists until a new event from the real channel or another `$INPLEVELSET`.

---

## 7 System adjustments

A limited number of configuration properties can be adjusted via the GATEWAY: channel levels defined in scenes (live scene setting – Volume 1), pre-set colour and tuneable white values used by modules, and times defined in Timelines and Delay timers. All these adjustments affect the **adjust-stamp** in the `?SYSTEMID` query.

### 7.1 Colour and tuneable white pre-set adjustments

Colour commands can use a direct rgb/kelvin value or a pre-set; the pre-sets' own values can be set via the GATEWAY. Each module has its own set of colour and temperature pre-sets, shared by all channels/DMX zones on that module. Because adjusting a pre-set affects more than one channel and possibly several areas, **administrator privileges are required if user accounts are in use**. These commands permanently change the pre-set; it is recommended to first determine the new value indirectly by adjusting a channel's colour/temperature (e.g. with `$CHANRGBCOLR` or similar – see Volume 1).

| Parameter | Meaning |
|---|---|
| `rgb-preset` | Adjustable pre-set static colours are 1–15 |
| `tw-preset` | Adjustable pre-set colour temperatures are 48–55 |
| `wrgb` | Direct colour as a 6- or 8-hex-digit colour, e.g. red = `#FF0000` |
| `kelvin` | Direct Kelvin colour temperature, typically 1800K to 7000K |

**Set pre-set colour**

| | |
|---|---|
| Command | `$RGBPRESET,<addr>,<devcode>,<rgb-preset>,#<wrgb>;` |
| Long-ack format | `!OK,RGBPRESET,<rgb-preset>,#<wrgb>;` (as printed; example includes addr and devcode) |
| From | v02.00 |

```
$rgbPreset,02,15,03,#FF00FF;
!OK,RGBPRESET,002,015,003,#FF00FF;<CR><LF>
```

**Set pre-set Kelvin**

| | |
|---|---|
| Command | `$TWPRESET,<addr>,<devcode>,<tw-preset>,#<kelvin>K;` |
| Long-ack format | `!OK,TWPRESET,<tw-preset>,#<kelvin>K;` (as printed; example includes addr and devcode) |
| From | v02.00 |

```
$twPreset,02,15,50,#2100k;
!OK,TWPRESET,002,015,050,#2100K;<CR><LF>
```

### 7.2 Timeline adjustments

"To be completed" – this section is a placeholder in the PDF with no content. (The introduction to chapter 7 says adjusting pre-set times of Timelines and Delays is described here; it is not.)

---

## Quick message index

| Message | Kind | Section | From |
|---|---|---|---|
| `$EVENTS` / `?EVENTS` | Command / query | 3.2.1–3.2.2 | v01.00 |
| `$EVTSCN` `$EVTERR` `$EVTOUT` `$EVTDIS` `$EVTCIN` `$EVTAIN` `$EVTADV` (and `?` forms) | Command / query | 3.2.3–3.2.4 | v01.00 (`$EVTADV` needs admin) |
| `!CHANFADE` `!DALIFADE` `!DMXFADE` | Event (EVTOUT) | 3.3.1 | v01.00 (DMX v02.00) |
| `!CHANSTOP` `!DALISTOP` `!DMXSTOP` | Event (EVTOUT) | 3.3.1 | v01.00 (DMX v02.00) |
| `!CHANRGBCOLR` `!CHANRGBPLAY` `!DMXRGBCOLR` `!DMXRGBPLAY` | Event (EVTOUT) | 3.3.1 | v02.01 |
| `!CHANTWCOLR` `!DMXTWCOLR` | Event (EVTOUT) | 3.3.1 | v02.01 |
| `!CHANPULSE` | Event (EVTOUT) | 3.3.1 | v02.00 |
| `!BTNCOLR` `!BTNTEXT` | Event (EVTDIS) | 3.3.2 | v01.00 |
| `!BTNSTATE` `!INPPIR` `!INPSTATE` | Event (EVTCIN) | 3.3.3 | v02.00 |
| `!INPLEVEL` | Event (EVTAIN) | 3.3.4 | v02.00 |
| `!MODULEERR` `!CHANERR` `!DALIERR` `!DMXERR` `!BTNERR` `!INPERR` | Event (EVTERR) | 3.3.5 | v02.00 |
| `!SCNSTATE` | Event (EVTSCN) | 3.4.1 | v02.00 |
| `!SCNRECALL` … `!SCNSAVE` (14 scene action events) | Event (EVTSCN) | 3.4.2 | v01.00 |
| `?CHANACCESS` `?DALIACCESS` `?DMXACCESS` `?BTNACCESS` `?INPACCESS` | Query | 4.1.1 | v01.00 |
| `$USER` / `?USER` | Command / query | 4.3.2 | 02.00 / 01.00 |
| `$USERPSSWD` | Command | 4.3.2 | 02.00 |
| `$SCNFAST` | Command | 5.2.2 | v01.00 |
| `$SCNTOGGLE` `$SCNBACKON` | Command | 5.2.3 | v01.00 |
| `$SCNRAISE` `$SCNLOWER` `$SCNSTOP` `$SCNRAMP` `$SCNNUDGEUP` `$SCNNUDGEDN` | Command | 5.2.4 | v01.00 |
| `$CHANPULSE` | Command | 6.1.1 | v02.00 |
| `?CHANLEVELX` `?DALILEVELX` `?DMXLEVELX` | Query | 6.2.1 | v02.00 |
| `$DALIFADE` / `$DALISTOP` with `BST`, `Gxx` identifiers | Command | 6.3.1 | v01.00 |
| `?DALI` with `Fxx` fixture identifier → `!DALIERR` | Query | 6.3.3 | v02.00 |
| `$INPSTATE` `$INPPIRSET` `$INPLEVELSET` (syntax not given) | Command | 6.4 | – |
| `$RGBPRESET` `$TWPRESET` | Command | 7.1 | v02.00 |
