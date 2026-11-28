# eDIN+ Gateway Interface — Volume 1 (Standard)

| | |
|---|---|
| **Title** | Gateway Interface Volume 1 – Standard |
| **Version** | 2.0.3 (document dated 16 August 2024) |
| **Author** | Jeff Heine |
| **Gateway version covered** | Messages for Gateway Ver 2.02 (per history entry 2.0.3) |
| **Source** | `Gateway Interface Vol 1 - Standard v2_0_3` (55 pages, carries a "DRAFT" watermark) |

This is a Markdown transcription of the vendor PDF, intended as a lookup reference for working on the Floorplan app (which talks raw TCP to an eDIN+ NPU controller). Wording of the commands, parameters and ranges follows the PDF. Where the PDF is ambiguous or contains an apparent typo this is called out in a **Note (transcription)**.

Related volumes:

- Volume 2 – Advanced: [`gateway-interface-vol2.md`](gateway-interface-vol2.md)
- Volume 3 – Developer: [`gateway-interface-vol3.md`](gateway-interface-vol3.md)

## Contents

1. [Document history](#document-history)
2. [Introduction](#1-introduction)
3. [Introduction to the eDIN+ system and GATEWAY interface](#2-introduction-to-the-edin-system-and-gateway-interface)
4. [General syntax and operation](#3-general-syntax-and-operation)
5. [Connecting to and troubleshooting the Gateway interface](#4-connecting-to-and-troubleshooting-the-gateway-interface)
6. [Interface API](#5-interface-api)
7. [Scene and System API](#6-scene-and-system-api)
8. [Channel API](#7-channel-api)
9. [Appendix A – Enumerations](#appendix-a--enumerations)
10. [Quick command index](#quick-command-index)

---

## Document history

| Date | Ver | Initials | Changes |
|---|---|---|---|
| 24-Mar-19 | 2.0.0 | Jph | Initial draft |
| 6-Sep-19 | 2.0.1 | Jph | Clarify text on format of rgb and wrgb |
| 14-Dec-21 | 2.0.2 | Jph | Add extra values to the Enumeration tables. Modification of colour and tuneable white messages for Gateway Ver 2.01 |
| 28-Feb-22 | 2.0.3 | Jph | Update plate sections to include rotary plate. Add Channel Error status code enum for event processing. Add EVO-INT232 connections. Messages for Gateway Ver 2.02 |

---

## 1 Introduction

### 1.1 Purpose and scope

This document contains details for using the eDIN+ GATEWAY interface. It is part of a set of Volumes that cover the full GATEWAY interface.

| Volume | Scope |
|---|---|
| Volume 1 – Standard | How to access the GATEWAY and commands and queries that all users can use. |
| Volume 2 – Advanced | Advanced commands and queries that require more advanced knowledge of the eDIN+ system and are only needed to access these advanced features. Some are restricted to users with Administration access. |
| Volume 3 – Developer | A set of commands and queries that allow some aspects of the eDIN+ system to be tightly integrated with third party products. They are restricted to users with Administrator rights, and require specialist knowledge of the eDIN+ system. |

### 1.2 Terminology

| Phrase | Description |
|---|---|
| API | Application Programming Interface. A set of protocols that define how to access a system. |
| Controller | A processor that controls a lighting system. The eDIN+ system has 2 types of controller: normal NPU and Standalone Mode. |
| DALI | Digital Addressable Lighting Interface. An industry standard physical interface/network for control of lighting equipment. It allows bi-directional data exchange, allowing its use with sensors, switches and emergency lighting as well as dimmable luminaires. |

### 1.3 References

1. BS EN 62386-102:2014 – Digital addressable lighting interface. Part 102: General Requirements – Control gear.
2. BS EN 62386-202:2009 – Digital addressable lighting interface. Part 202: Particular requirements for control gear — Self-contained emergency lighting (device type 1).

### 1.4 Changes from Gateway Version 1.x

The core of the GATEWAY messages and protocols have not changed between v1.x and v2.x. However there are some significant additions and changes in some areas that are **not backwards compatible**:

- The `?SCN` query has had an extra `<level>` parameter added.
- The `!SCN` event is replaced with the `!SCNSTATE` event.
- All DMX support has changed and extended to support RGB colour and Tuneable White on both DMX zones and DBST CHANnels.
- The response to all channel status queries, e.g. `?CHAN`, `?DALI`, `?DMX`, `?INP`, has changed from a single reply message to multiple messages reporting different items such as health, level, colour etc.
- Relay support has been improved. `$CHANSTATE` and `!CHANSTATE` messages have been replaced with `$CHANFADE`, `$CHANPULSE` and `!CHANPULSE` messages.
- Channel discovery during scene setting has changed significantly to accommodate RGB & Tuneable White colour support.
- The behaviour of User login has changed significantly. Non-encoded passwords are now the norm.
- The System Health API and Developer DALI Bus Test & Repair API went through a number of iterations in v1.x. These interfaces are now stable.
- There is a new developer XDALI API that replaces the trial EMTEST API.

---

## 2 Introduction to the eDIN+ system and GATEWAY interface

The purpose of the GATEWAY interface is to allow external systems to monitor the status and control various aspects of the eDIN+ lighting system; it provides real time (sometimes called runtime) access to the system. With a few exceptions, you cannot inspect or set the configuration of the eDIN+ system through the interface.

### 2.1 Overview

The GATEWAY interface is character/text based and can be used over:

- an RS232 connection,
- a raw TCP/IP session over Ethernet, or
- a set of HTTP requests over Ethernet.

The interface provides:

- **Commands** to control the eDIN+ system
- **Queries** to request the current state of the eDIN+ system
- **Events** sent by the eDIN+ system notifying you when there is a change to its state

Syntax summary:

- Everything is in normal (printable) text using Unicode UTF-8 formatting.
- All commands begin with `$` and end with `;`
- All queries begin with `?` and end with `;`
- All events and responses to queries begin with `!` and end with `;`
- All events and responses to queries are "self-documenting" – they contain all the information you need to process them. You do not need to know what query made them, what the order of multiple queries were or the result of previous queries or events.
- Every command and query sent is acknowledged by the GATEWAY interface, so that you know it has been successfully sent.

Ways to interact with an eDIN lighting system:

| Technique | Description |
|---|---|
| Control-only | Simplest, but only if you do not want feedback about the state of the system. Simply send commands as required. |
| Control-with-polling-queries | Most applicable and straightforward. Send queries as required to request the current state; send commands as required. |
| Control-with-asynchronous-event-driven-monitoring | Most demanding. Your event handler continuously processes events sent by the eDIN system. Commands are sent by you as required. |

The commands, queries and events are grouped into API categories:

- **Interface API** – controls the information sent through the connections; used to tailor the connection.
- **Scene and System API** – talks to the in-built controller of the eDIN+ system (if it exists); gives access to things such as scenes and areas.
- **Channel API** – accesses the actual hardware. Allows you to monitor and control individual lighting channels (although controlling channels may fight any in-built controller which is also controlling these channels).

Documentation volumes: Volume 1 is the place to start; Volume 2 covers advanced features; Volume 3 is primarily for software developers building generic or highly integrated apps/systems. All eDIN+ systems need to be configured before they can be controlled and monitored via the GATEWAY (configuration cannot be done via the GATEWAY).

### 2.2 Before you begin

Two aspects to consider:

**1) How much control are you going to do, and how much will you leave to the in-built eDIN+ controller?**

Generally it is better to let the in-built controller control as much as possible because:

1. The in-built controller is always present. You only need to be in contact with the eDIN+ system when you or your end-user wants to know the state of the system or to do immediate control (the best option for e.g. a mobile phone app).
2. Even if your controller is always physically present, it may occasionally lose connection. The in-built controller provides continuous control and can turn lights on and off when wall plate buttons are pressed even when your connection is lost.
3. The eDIN+ product is focused on providing sophisticated lighting control in a simple manner and has extensive lighting-control know-how built in.

It is possible to set up a minimal configuration and perform all control yourself. It is also possible to set up a "back-up" configuration in the in-built controller but suspend it so that it only takes over if it detects your control is not present (advanced; see Volume 3).

**2) How do you want to interact with the GATEWAY interface?**

1. **Control-only (no feedback)** – simplest; only suitable when you do not need the live state. Suitable for all 3 connection types (RS232, HTTP, Raw IP) – simply ignore any incoming data.
2. **Control with polled feedback** – the most straightforward and generally applicable technique. Easier to code; you do not need a continuous connection. Feedback is only a response to a query you send. To monitor continuously you must regularly poll. Particularly suited to HTTP, but can also be used on RS232 and Raw IP.
3. **Control with asynchronous event-driven feedback** – most integration but requires event-driven programming and is harder to debug. State is determined by having a continuous connection open and handling events. Commands/queries are sent from one process; a second process receives all responses including events. Extra code is needed to synchronise to the initial state and to resynchronise when connections are lost and re-established. **Only possible with a continuous connection (RS232 or Raw IP); not possible over HTTP.**

Volume 1 documents the commands to control the system. The events sent by the eDIN+ system are documented in Volume 2.

### 2.3 Finding your way around the GATEWAY API

Each API has standard and advanced aspects, documented separately:

- Standard messages (Volume 1) access the main features of the eDIN+ system.
- Advanced messages (Volume 2) go beyond normal control and monitoring.
- Developer messages (Volume 3) are for niche markets/highly integrated Apps; contact Mode to discuss requirements.

Points to bear in mind when picking a command or query:

- You can freely use the Interface API to tailor your connection. Defaults mean you may never need it, but you might:
  1. to debug or troubleshoot a connection;
  2. (Advanced) to turn events on – they are **off by default**;
  3. (Advanced) to log on as a specific user if your configuration has user accounts.
- In general use the System API for control and monitoring, not the Channel API:
  - Only and always use System API commands if there is an active in-built controller. Using Channel API commands in such a system overrides the in-built control and confusion may result.
  - You **must** use the Channel API if there is no active in-built controller. The System API will do nothing.
- You can safely use System API and Channel API queries and events to monitor: System API for features such as lighting scenes, Channel API for low-level channel states.

### 2.4 Knowing your eDIN+ system configuration

To control a lighting system you have to know what there is to control. In general the GATEWAY interface expects you to already know what you have in your system. There are some limited discovery queries (see [System Discovery](#64-system-discovery)). Fuller information is available as CSV text files, obtained manually or via a different "Info" NPU web service (see Volume 3).

### 2.5 Configuring the eDIN+ system

All eDIN+ systems need to be configured to some extent:

- All hardware modules and channel properties need to be set up correctly. Depending on modules, the channel type of configurable IO channels needs to be set. Most channels have properties that control how they operate, such as cup & cap values.
- Controllers need to have scenes defined, possibly grouped into areas.
- Controllers can have rules defined that link input buttons and channels to scene recall actions.

The eDIN+ lighting system **cannot be configured through the GATEWAY interface**. The simplest way is to create an NPU configuration, either on a live system via the NPU web pages or with the eDIN+ offline editor that creates a file that can be uploaded to the NPU. Configuring is beyond the scope of the document.

---

## 3 General syntax and operation

The syntax is designed to be used either manually via a terminal emulation app such as HyperTerm or PuTTY, or programmatically via user apps such as Savant or Roomie.

### 3.1 General syntax

All messages are Unicode UTF-8 text strings and conform to:

```
$<msgId>[,<parameter>,<parameter>,…];     for commands
?<msgId>[,<parameter>,<parameter>,…];     for queries
!<msgId>[,<parameter>,<parameter>,…];     for acknowledgements, replies and events
```

- All messages start with `$`, `?` or `!`.
- All messages end in a semicolon `;`.
- There are no space characters in a message (except if spaces exist in text parameters).
- `<msgId>` is the name of the command, query or event.
- Each `<msgId>` may have 0 or more `<parameter>` (usually numeric decimal) values separated by commas.
- Messages are case-insensitive (except text parameters).
- Any extra characters sent between the end `;` of one message and the start of the next are ignored. It is permissible to add `<CR>` and `<LF>` after each `;`.

Commands and queries **sent to** the interface:

- must start with `$` or `?` and end with `;`
- are case insensitive
- numeric parameters can be variable length with or without leading zeros
- extra characters between messages (such as `<CR>`, `<LF>`) are tolerated and ignored

Acknowledgements, replies and events **received from** the interface:

- always start with `!` and end with `;`
- are in upper case
- numeric parameters may have leading zeros
- have variable length text parameters
- have `<CR><LF>` appended after each message

This makes parsing a line at a time possible, using simple uppercase comparisons.

### 3.2 Message acknowledgements

For every message sent, the interface acknowledges with `!OK` if it is a recognised command or query, or `!BAD` if it is unrecognised.

```
[<echochars>]!OK[,<msgId>,<parameter>,<parameter>,…];
[<echochars>]!BAD;
```

> The acknowledgement only indicates that the **syntax** is correct. It does **not** indicate that the eDIN system has performed the command or query successfully.

Acknowledge formatting options:

- **Echo** (`$DBGECHO`): characters sent are echoed back in the acknowledge, except unrecognised characters are echoed as `.`. Normally off; always off on a new connection and off by default for AJAX requests.
- **Long acknowledge** (`$DBGACK`): the `!OK` includes the command/query `msgId` and parameters. Normally on; always on for a new connection and on by default for AJAX requests. Useful for synchronisation and confirming the gateway interpreted your parameters correctly.

### 3.3 Message errors

The GATEWAY only detects and reports problems with command **syntax**, via the acknowledgement mechanism. It does **not** check that parameter values make sense for this specific eDIN+ system. That type of error is indicated only by an absence of a response (beyond the acknowledgement). E.g. querying a scene number that does not exist is acknowledged but produces no further response; recalling a non-existent scene does nothing and generates no events.

The reason is that the protocols are consistent across all types of eDIN+ system, whatever controller they have, or if a controller exists at all.

- `!OK` only indicates the message was received correctly, not that it was performed successfully.
- If the connection is good but the system does not respond, your parameter values are probably wrong. Check them against the configuration loaded in the NPU.

### 3.4 Gateway version numbers

The version is a decimal value with a major number before the point and a minor number after. Minor, backwards-compatible changes only increase the minor number; major or non-backwards-compatible changes increase the major number.

To be resilient:

- Quietly ignore or log unknown messages or parameters received (likely from a later GATEWAY version).
- Note the major version you are coding to. If the connection's major version is not right, log an error – your code will likely be incompatible.
- Note the minor version you are coding to. If the connection's minor version is smaller, log a warning – some messages may not be supported.

---

## 4 Connecting to and troubleshooting the Gateway interface

You can connect from any NPU on the system as long as the NPU has:

- Firmware version 2.0.0.0 or higher
- A complete configuration of the system loaded on to it

### 4.1 Connections

There are four ways to connect to an eDIN system. Currently, all must be through an NPU module.

1. Ethernet / raw TCP-IP connection with the NPU
2. The NPU local RS232 port
3. A remote RS232 connection into an EVO-INT232 module
4. HTTP / AJAX-like web service requests on the NPU

Multiple simultaneous sessions are possible. Currently each NPU can handle:

| Connection type | Max sessions |
|---|---|
| RS232 | 1 |
| Raw IP | 4 |
| EVO-INT232 | 2 |
| HTTP | Short-lived per request; limited only by how many instantaneous HTTP requests the NPU can handle |

(The PDF notes this may change over time.)

To check the connection, send the null command `$OK;`. If OK the system responds `!OK;<CR><LF>`.

#### 4.1.1 Raw TCP/IP

The NPU must be configured to accept Raw IP GATEWAY connections via the web page **Settings → Network services**:

- Ensure **Enable gateway control** is ticked.
- Adjust the **Use port** value as required or leave as the default (**port 26**).

When a new connection is made the interface sends 2 messages:

```
!GATRDY;<CR><LF>
!VERSION,<version>;<CR><LF>
```

The gateway **automatically closes raw TCP/IP connections idle for 1 hour**. It is idle if it does not receive any commands or queries and has not sent any events. To keep a connection open, send `$OK;` at least once an hour.

#### 4.1.2 RS232 port

On the NPU web page **Settings → RS232**:

- Under *RS232 port service → Port used by*, select **Gateway Control**.
- Adjust *RS232 port settings* (baud rate, data bits, …) as required.

When ready the port sends `!GATRDY;` and `!VERSION,<version>;` (each followed by `<CR><LF>`):

- when the RS232 port is newly configured for Gateway Control, and
- when the NPU powers up and is (has previously been) configured for Gateway Control.

The serial connection is left open unless the port is configured for another service.

#### 4.1.3 EVO INT-232

The INT232 module must be connected to the system's MBus and have a unique MBus address compatible with all other modules, but it should **not** be entered in the system's configuration file. The system auto-detects it and sets it up for GATEWAY operation with fixed RS232 settings: **9600 baud, 8 data bits, no parity, 1 stop bit** (cannot be changed).

When the system detects the INT232 it sends `!GATRDY;` and `!VERSION,<version>;` every time the NPU powers up and detects the INT232 on the MBus. The connection is left open while the system is alive. A system can currently handle a maximum of 2 INT232 modules as remote Gateway connections.

#### 4.1.4 HTTP

The NPU must have its Web Server enabled (the default). HTTP uses plain text AJAX-like **HTTP POST** requests to:

```
http://<npu_ip_address>/gateway?
```

(the terminating `?` is required) with `Content-Type: text/plain`. One or more commands/queries are assembled into the plain-text request body; responses are returned in the plain-text response body.

jQuery example from the PDF:

```js
$.ajax({
  type: "POST",
  url: 'http://'+ipaddr+'/gateway?',
  contentType: "text/plain;",
  dataType: "text",
  data: "$scnRecall,1;",
})
```

HTTP does not support long-term sessions. Each request/response stands alone, so **no event data is published on HTTP connections** – only commands and queries can be used.

### 4.2 Troubleshooting

#### 4.2.1 Raw IP & RS232 connections

Use a terminal emulator such as HyperTerm or PuTTY (the PDF uses PuTTY).

- **IP:** enter the NPU's IP address and port (default 26), set *Connection type* to **Raw**, press Open.
- **RS232:** *Connection type* **Serial**; in *Connection → Serial* set the COM port (default 9600, 8, 1, no parity, no flow control); in *Terminal* set *Local Echo* to **Force On**; press Open.

Note: the automatic `GATRDY` and `VERSION` messages do not occur unless the RS232 session is open when the NPU powers up.

To check the connection responds, type `$OK;<ENTER>`. Some apps (e.g. PuTTY) do not send characters until `<CR><LF>`/`<ENTER>` is pressed.

*Screenshot transcribed from page 19 (PuTTY session):*

```
!GATRDY;
!VERSION,01.00;
$ok;
!OK;
```

#### 4.2.2 HTTP connection

First check HTTP access to the NPU: can you reach the normal NPU web pages from the same computer? If not, there is a bigger physical-connection problem. Otherwise checklist:

- Is the URL correct? Example: `http://192.168.0.2/gateway?`
  - Is the NPU IP address the same as the one that works in the browser?
  - Have you included the terminating question mark?
- Is the content-type set to `text/plain`?
- Send the null command `$OK;` in the AJAX request data. A good connection responds with `!OK;`.

#### 4.2.3 A `!BAD` command or query

A `!BAD` acknowledgement means a problem with the syntax of the message text. Turn on `DBGECHO` to help: type `$DBGECHO,1;<ENTER>`, then the problem command. The Gateway echoes good text but replaces bad text with a period. In the PDF's example the bad command is `$CHANNEL;`; the correct command is `$CHANFADE`.

*Screenshot transcribed from page 20 (PuTTY session; callouts: "Turn on DBGECHO feature" at `$dbgecho,1;`; "Problem command" at `$channel,1,2,3,255;`; "Two dots caused by `<LF><CR>` chars" at the start of the echoed line; "Gateway stop recognising command here" at the first `.` in `$chan...............!BAD;`):*

```
!GATRDY;
!VERSION,01.00;
$ok;
!OK;
$channel,1,2,3,255;
!BAD;
$dbgecho,1;
!OK,DBGECHO,1;
..$channel,1,2,3,255;
$chan..............!BAD;
..
```

- With **HTTP** include `$DBGECHO,1;` at the start of every AJAX call (no session state between calls).
- With **Raw IP** include `$DBGECHO,1;` at the start of every session as soon as it is made. Every new session resets to default settings.
- With **RS232** settings only reset to defaults when the NPU reboots/powers up or the RS232 port settings change.

#### 4.2.4 Wrong or no response

`!OK;` only says the syntax is correct – not that the command makes sense on your system (e.g. it does not check that the channel is an output channel, or exists). If asked to do something it cannot do, the system silently ignores it; it will NOT send a message saying it cannot perform the operation.

To troubleshoot: ensure long acknowledgements are on and inspect the ack. Example: `$DBGACK,1;` then a command with too many digits in the `<channel>` parameter.

*Screenshot transcribed from page 21 (callouts: "Turn on long acks" at `$dbgack,1;`; "Problem – too big channel parameter" at `12345`; "channel parameter truncated by Gateway" at `345`):*

```
!GATRDY;
!VERSION,01.00;
$dbgack,1;
!OK,DBGACK,1;
$chanfade,3,12,12345,50,1000;
!OK,CHANFADE,003,12,345,050,00001000;
```

Note: with HTTP, long acknowledgements are on by default, so `$DBGACK,1;` is not needed.

Next check the parameters are in the correct order (see the Quick Reference or Technical Reference – not included in this volume). Then check the channel exists **and** is publicly accessible (see the configuration for channel/scene accessibility).

#### 4.2.5 Using Gateway events

Events are not published on HTTP; open a separate raw IP/RS232 session to monitor events while sending HTTP calls. Example: you query a channel that returns nothing, but you know the channel is in a particular scene. Open a new Gateway session, turn on events, recall the scene (via Gateway, web page or any other means) and compare the event for that channel with what you expect.

*Screenshot transcribed from page 21 (callouts: "Problem – no response to query" at `?chan,1,15,1;`; "Turn on events" at `$events,1;`; "Scene recalled with channel" at `!CHANFADE,001,14,001,...`; "Channel has different devcode" at `!CHANFADE,001,14,...`; "Good query with correct devcode" at `?chan,1,14,1;`):*

```
!GATRDY;
!VERSION,01.00;
?chan,1,15,1;
!OK,CHAN,001,15,001;

$events,1;
!OK,EVENTS,1;
!SCNRECALLX,00003,255,00003000;
!CHANFADE,001,14,001,255,00003000;

?chan,1,14,1;
!OK,CHAN,001,14,001;
!CHAN,001,14,001,000,255,100,00200;
```

> **Note (transcription):** the last line of the screenshot shows a single `!CHAN,…` reply, whereas the v2.x channel status reply documented in [7.3](#73-output-status) is `!CHANERR` + `!CHANLEVEL`. It is reproduced as shown in the PDF.

---

## 5 Interface API

Adjusts aspects of the connection. Three standard groups: (a) general purpose, (b) message debugging, (c) event filtering.

Each message below is documented in the PDF with a *From* version (the Gateway version in which it first appeared).

### 5.1 General purpose Interface API

#### 5.1.1 Null command

| | |
|---|---|
| Command | `$OK;` |
| Long-ack format | `!OK;` |
| From | v01.00 |

Test the connection or keep it open. Response is always `!OK;<CR><LF>`.

```
$ok;
!OK<CR><LF>
```

#### 5.1.2 Version query

| | |
|---|---|
| Query | `?VERSION;` |
| Long-ack format | `!OK,VERSION;` |
| Reply | "Report gateway version": `!VERSION,<version-text>;` |
| From | v01.00 |

```
?version;
!OK,VERSION;<CR><LF>
!VERSION,01.00;<CR><LF>
```

#### 5.1.3 Sign-on response (event)

| | |
|---|---|
| Event | "gateway ready": `!GATRDY;` |
| From | v01.00 |

Sent when a connection opens; the gateway version is also reported.

```
!GATRDY;
!VERSION,<version-text>;
```

### 5.2 Message debugging Interface API

All command/query messages are acknowledged either with a simple `!OK` or a long string `!OK,…` including the details of the message as interpreted. A `!BAD` means the interface does not recognise part or all of the message; turn on DBGECHO mode to find which part. In DBGECHO mode every character sent is echoed back unaffected unless the connection does not like it, in which case `.` is sent back.

#### 5.2.1 Long Acknowledge mode

| | |
|---|---|
| Command | `$DBGACK,<on-off>;` |
| Long-ack format | `!OK,DBGACK,<on-off>;` |
| Query | `?DBGACK;` |
| Query long-ack | `!OK,DBGACK;` |
| Reply | `!DBGACK,<on-off>;` |
| From | v01.00 |

`on-off` = zero to turn mode off, non-zero to turn mode on.

```
$dbgAck,1;  $dbgAck,0;
!OK,DBGACK,1;<CR><LF>
!OK;<CR><LF>

?dbgAck;
!OK,DBGACK;<CR><LF>
!DBGACK,1;<CR><LF>

?dbgAck;
!OK;<CR><LF>
!DBGACK,0;<CR><LF>
```

#### 5.2.2 Debug Echo mode

| | |
|---|---|
| Command | `$DBGECHO,<on-off>;` |
| Long-ack format | `!OK,DBGECHO,<on-off>;` |
| Query | `?DBGECHO;` (see note) |
| Query long-ack | `!OK,DBGECHO;` |
| Reply | `!DBGECHO,<on-off>;` |
| From | v01.00 |

`on-off` = zero to echo off, non-zero to turn echo on.

> **Note (transcription):** the PDF's query block for this section prints `?DBGACK;` / `!OK,DBGACK;` but its own example uses `?dbgEcho;` / `!OK,DBGECHO;` / `!DBGECHO,0;`. The query is documented here as `?DBGECHO;` following the example.

```
$dbgEcho,1;$dbgEcjl,0;$dbgEcho,0;
!OK,DBGECHO,1;<CR><LF>
$dbgEc....!BAD;<CR><LF>
$dbgEcho,0!OK,DBGECHO,0;<CR><LF>

?dbgEcho;
!OK,DBGECHO;<CR><LF>
!DBGECHO,0;<CR><LF>
```

### 5.3 Event filtering Interface API

Events and event filtering are an Advanced topic covered in Volume 2, but seeing events helps when debugging a connection. **No events are sent on a session until the connection requests them.**

#### 5.3.1 Set event reporting for all events

| | |
|---|---|
| Command | `$EVENTS,<on-off>;` |
| Long-ack format | `!OK,EVENTS,<on-off>;` |
| From | v01.00 |

`on-off` = zero to turn all event flags off, non-zero to turn all event flags on.

```
$Events,1;
!OK,EVENTS,1;<CR><LF>
```

---

## 6 Scene and System API

Interacts with the in-built controller of the eDIN+ system. If there is no active in-built controller these messages will not work and you need to use the Channel API. Four standard groups: (a) Scene Control, (b) Live Scene Setting, (c) System Health, (d) System Discovery.

### 6.1 Scene control

A lighting scene controls a number of lighting channels in a single operation. It has a fade time (can be overridden), an absolute **scene level**, and a collection of channels, each at a **relative level**. Changing the relative channel levels is "scene setting"; all other scene actions leave relative levels unchanged but affect the absolute scene level.

Scenes are identified by **scene number** (`<scn-num>`). A scene is either active (on) or inactive (off). By default a scene is active when recalled and inactive when another overlapping scene (one sharing a channel) is recalled (see Volume 2).

Guidance from the PDF:

- `$SCNRECALLX` is the most useful: set scene level to any value with any fade time (255 = on, 0 = off, intermediate e.g. from a slider).
- `$SCNRECALL` / `$SCNOFF` match how wall plates operate in the configuration.
- `$SCNONOFF` toggles from a single button without worrying about the scene state.

#### 6.1.1 Scene recall commands

**Recall scene** – make the scene active at maximum level and set the channels to the levels defined in the scene, using the scene's configured fade time.

| | |
|---|---|
| Command | `$SCNRECALL,<scn-num>;` |
| Long-ack format | `!OK,SCNRECALL,<scn-num>;` |
| From | v01.00 |

```
$scnrecall,8;
!OK,SCNRECALL,00008;<CR><LF>
```

**Recall scene to off (level = 0)** – makes the scene inactive, sets the scene level to zero and sets the scene's channels to level 0, using the scene's configured fade time.

| | |
|---|---|
| Command | `$SCNOFF,<scn-num>;` |
| Long-ack format | `!OK,SCNOFF,<scn-num>;` |
| From | v01.00 |

```
$scnOff,8;
!OK,SCNOFF,00008;<CR><LF>
```

**Recall scene with explicit values** – uses the explicit parameters rather than the configured defaults. Recalling at level 0 is the same as turning the scene off. This command specifies the **scene level**, not channel levels: a channel at 70% in the scene recalled at 50% (level = 128) is set to 70% × 50% = 35%.

| | |
|---|---|
| Command | `$SCNRECALLX,<scn-num>,<scn-level>,<fadetime(ms)>;` |
| Long-ack format | `!OK,SCNRECALLX,<scn-num>,<scn-level>,<fadetime>;` |
| From | v01.00 |
| `scn-level` | 0–255. 0 = off, 255 = max (100%) |
| `fadetime` | 0–8388607 milliseconds |

```
$scnrecallx,8,255,60000;
!OK,SCNRECALLX,00008,255,00060000;<CR><LF>
```

#### 6.1.2 Scene toggle commands

Each toggle is effectively two recall commands in one. Two varieties; both turn the scene off the same way but differ in how they turn it on:

- `$SCNONOFF` – the most common; always uses the normal maximum scene level to recall the scene on.
- `$SCNTOGGLE` – uses a "remembered snap-shot" of scene and channel levels when turning the scene back on. Can be confusing if used with other toggle and recall commands (described in Volume 2). *Only named in this volume; its message syntax is not given here.*

**Recall On/Off** – toggles between `$SCNRECALL` and `$SCNOFF`: set off if currently active, recalled to max if currently inactive, both using the scene's default fade time. If used with commands that adjust the scene level, it resets the levels, making adjustments temporary.

| | |
|---|---|
| Command | `$SCNONOFF,<scn-num>;` |
| Long-ack format | `!OK,SCNONOFF,<scn-num>;` |
| From | v01.00 |

```
$scnOnOff,8;
!OK,SCNONOFF,00008;<CR><LF>
```

### 6.2 Scene status

Each scene has a state (active/inactive) and a level. There is no agreed standard of when a scene becomes inactive, so the eDIN+ system can be configured. Each `!SCN` reply includes the scene's `mode` and `flags` configuration properties, but it is always safe to ignore them (see Volume 2).

| Parameter | Meaning |
|---|---|
| `scn-num` | Scene number, decimal |
| `scn-state` | 0 (inactive) or 1 (active) |
| `scn-level` | 0 (off) or 1–255 (on) |
| `mode`, `flags` | Fixed value indicating *in use* meaning – see Volume 2 |

#### 6.2.1 Request scene status

Find the active/inactive state and level of all scenes, scenes in an area, or a single scene.

| | |
|---|---|
| Queries | `?SCNS;` · `?SCNS,<area-num>;` · `?SCN,<scn-num>;` |
| Long-ack format | `!OK,SCNS;` or `!OK,SCNS,<area-num>;` or `!OK,SCN,<scn-num>;` |
| From | v02.00 (v01.x replies do not include `<scn-level>`) |
| Reply | zero or more `!SCN,<scn-num>,<mode>,<flags>,<scn-state>,<scn-level>;` |

```
?scns,1;
!OK,SCNS,00001;
!SCN,00001,01,02,001,255;<CR><LF>
!SCN,00002,02,02,000,000;<CR><LF>
```

### 6.3 System health

#### 6.3.1 System error list

The in-built controller maintains a list of all **current** channel errors. It is not a log; intermittent errors appear and disappear. It does not list channels with status code 0 (Status Ok). There are flavours of Channel Status Error message for the different channel types and their CHAN, DALI, DMX, BTN and INP identifiers, otherwise the same, reporting the error as a `status-code` (see [Channel status codes](#channel-status-codes)).

A module-level error can be reported when the problem affects all channels (e.g. no AC mains on a dimmer module is a single `MODULEERR`, not 4 or 8 channel errors). Errors can also be reported on DALI fixtures – see Volume 2 (Advanced DALI Fixture Health).

> **Note (transcription):** at the end of the first bullet of 6.3.1 (pages 29–30) the PDF contains a stray fragment: "See Appendix [broken reference] request input channel status" followed by the `?INP` query definition (also given in 7.6.1). It appears to be a layout defect in the source. It is documented once, under [7.6.1](#761-request-input-status).

**Request system error list**

| | |
|---|---|
| Query | `?ERRORS;` |
| Long-ack format | `!OK,ERRORS;` |
| From | v02.01 |
| Reply | zero or more "Report Channel Health" messages (below) |

```
!MODULEERR,<addr>,<devcode>,<status-code>;
!CHANERR,<addr>,<devcode>,<chan-num>,<status-code>;
!DALIERR,<addr>,<devcode>,<dali-num>,<status-code>;
!DALIERR,<addr>,<devcode>,<dali-fixture>,<status-code>;
!DMXERR,<addr>,<devcode>,<zone-num>,<status-code>;
!BTNERR,<addr>,<devcode>,<btn-num>,<status-code>;
!INPERR,<addr>,<devcode>,<chan-num>,<status-code>;
```

```
?errors;
!OK,ERRORS;<CR><LF>
!MODULEERR,003,015,002;<CR><LF>
!DALIERR,001,017,001,025;<CR><LF>
!DALIERR,001,017,F03,025;<CR><LF>
```

> **Note (transcription):** the `!MODULEERR,003,015,002;` example line is printed with only one value after the devcode; the format above shows `<status-code>` as the fourth parameter. Reproduced as in the PDF.

#### 6.3.2 Polling for channel status

Instead of the System Error List, you can poll health/status-code of individual channels with Channel API queries (Section 7); these return more than just health. Channel status codes automatically reflect module errors (e.g. a "No AC Mains" module error is reported by every channel on the module), so polling channels will not miss module errors.

### 6.4 System discovery

Limited discovery queries exist. It is assumed third-party apps know the specific eDIN+ system. The queries can also report what scenes and wall plates exist. Fuller information is available as CSV files (via the editors, or an "Info" NPU web service; see Volume 3).

#### 6.4.1 Configuration discovery queries

Discovery queries only let you **view** certain things in the configuration. Main queries: `?SYSTEMID`, `?AREANAMES`, `?SCNNAMES`, `?PLATENAMES`. Per-item queries: `?BTNSTYLE` and `?SCNCHANNAMES`.

- Discovery is centred on **areas** defined in the configuration; first obtain areas with `?AREANAMES`. Areas are not essential – they can be ignored. `?SCNNAMES` and `?PLATENAMES` work with or without areas.
- The information is static unless the configuration changes, so queries can be performed once or when the configuration changes. `?SYSTEMID` can be used to detect configuration changes. If a configuration has user accounts, each account gives a different window on the configuration and can change the available scenes and plates without changing the system ids – see Volume 2.
- `?SCNCHANNAMES` is used with live scene setting (see [6.5.2](#652-channel-discovery-for-scenes)).
- Many query responses have an `access` value; it is an advanced topic (Volume 2) and can generally be ignored.

Parameter summary:

| Parameter | Meaning |
|---|---|
| `scn-num` | Scene number, decimal |
| `area-num` | Area number, decimal |
| `addr`, `devcode` | Address and device code of wall plate |
| `scn-name` | Scene name, UTF-8 text |
| `area-name` | Area name, UTF-8 text |
| `plate-name` | Plate name, UTF-8 text |
| `area-content` | 1 (has channels) + 2 (has scenes) + 4 (has plates) |
| `access` | Bit-field flags: 1 (viewable) + 2 (controllable) + 4 (editable) |
| `plate-style` | 1 SGP style, 2 Coolbrium style, 3 ICON style, 4 Geneva style, 5 to 8 rotary plate with 1 to 4 buttons respectively |
| `btn-icon` | Reference number for button icon |

**Request scene areas**

Each area has an area number and a descriptive name (may be blank). Every scene, wall plate and channel is put in an area; `area-content` summarises what has been assigned to it.

| | |
|---|---|
| Query | `?AREANAMES;` |
| Long-ack format | `!OK,AREANAMES;` |
| From | v01.00 |
| Reply | zero or more `!AREANAME,<area-num>,<access>,<area-content>,<area-name>;` (no end-of-list message) |

```
?areaNames;
!OK,AREANAMES;<CR><LF>
!AREANAME,00000,07,001,;<CR><LF>
!AREANAME,00001,07,007,Main Hall;<CR><LF>
!AREANAME,00002,07,003,Outside porch;<CR><LF>
```

**Request scene names** – all scenes, or scenes in an area. If no area parameter is given, all scenes are reported.

| | |
|---|---|
| Queries | `?SCNNAMES;` · `?SCNNAMES,<area-num>;` |
| Long-ack format | `!OK,SCNNAMES;` or `!OK,SCNNAMES,00000;` |
| From | v01.00 |
| Reply | zero or more `!SCNNAME,<scn-num>,<access>,<area-num>,<scn-name>;` (no end-of-list message) |

```
?SCNNAMES,1;
!OK,SCNNAMES,00001;
!SCNNAME,00003,07,00001,Off;<CR><LF>
!SCNNAME,00004,07,00001,On;<CR><LF>
!SCNNAME,00005,07,00001,Kitchen;<CR><LF>
```

**Request plate names** – wall plates, their style, area and name; all, or in an area. If no area parameter is given, all plates are reported.

| | |
|---|---|
| Queries | `?PLATENAMES;` · `?PLATENAMES,<area-num>;` |
| Long-ack format | `!OK,PLATENAMES;` or `!OK,PLATENAMES,<area-num>;` |
| From | v01.00 |
| Reply | zero or more `!PLATENAME,<addr>,<devcode>,<plate-style>,<access>,<area-num>,<plate-name>;` (no end-of-list message) |

```
?PLATENAMES,1;
!OK,PLATENAMES,00001;
!PLATENAME,001,002,03,07,00001,Main;<CR><LF>
!PLATENAME,002,002,01,07,00001,Bedside;<CR><LF>
```

**Request button styles** – buttons on a wall plate, their type and name. Together with `?PLATENAMES` this lets you mimic the look of actual wall plates.

| | |
|---|---|
| Queries | `?BTNSTYLE,<addr>,<devcode>,ALL;` · `?BTNSTYLE,<addr>,<devcode>,<btn-num>;` |
| Long-ack format | `!OK,BTNSTYLE,<addr>,<devcode>,<ALL \|\| btn-num>;` |
| From | v01.00 |
| Reply | zero or more `!BTNSTYLE,<addr>,<devcode>,<btn-num>,<btn-icon>,<style>,<btn-name>;` |
| `style` | not used |

```
?BTNSTYLE,8,2,1;
!OK,BTNSTYLE,008,002,001;
!BTNSTYLE,008,002,001,001,000,;<CR><LF>
```

**Request system ID** – check whether the configuration has changed since last checked. If either stamp changed, re-discover.

- **edit-stamp** changes whenever the structure of the configuration changes (e.g. a new scene) or a static property changes (e.g. a scene name). Can only be done outside the GATEWAY.
- **adjust-stamp** changes when minor adjustments are made by a user, primarily scene-setting operations (via the GATEWAY or elsewhere). Generally unimportant for GATEWAY control, but may matter if you locally save scene-setting information.

| | |
|---|---|
| Query | `?SYSTEMID;` |
| Long-ack format | `!OK,SYSTEMID;` |
| From | v01.00 |
| Reply | `!SYSTEMID,<serial-num>,<edit-stamp>,<adjust-stamp>;` |
| `serial-num` | Serial number of NPU interface, as an 8-digit hexadecimal value |
| `edit-stamp` | Text string representing when the last edit was saved |
| `adjust-stamp` | Text string representing when the last adjustment was saved |

```
?systemid;
!OK,SYSTEMID;<CR><LF>
!SYSTEMID,0002016D,7027-55441,7027-55441;<CR><LF>
```

### 6.5 Live scene setting

The GATEWAY has two ways to permanently change a scene's channel levels: the **live method** using `$SCNSAVE` (this volume) and the advanced **offline method** using `SCNSET` (Volume 3).

Use `$SCNSAVE` at any time to capture the current live state/level/colour of all channels in the selected scene. If a scene is too bright or dim, use `$SCNRECALLX` to set the correct level then `$SCNSAVE`. If one or more channels are wrong, use the appropriate Channel API command to set their level or colour then `$SCNSAVE`. It is recommended to recall the (complete) scene before changing individual channel levels.

Two queries discover what channels are in a scene: `?SCNCHANSTATES` (current level/state, including live level or colour) and `?SCNCHANNAMES` (name and area of each entry). Colour and tuneable white channels have separate entries in a scene for level and colour.

Scene channel entry ids (`entry-id`), matching Channel API control types:

| Control type | entry-id values |
|---|---|
| Level / brightness | `CHAN`, `DALI`, `DMX` |
| Colour | `DMXRGBCOLR`, `CHANRGBCOLR`, `DMXRGBPLAY` |
| Tuneable white / colour temperature | `DMXTWCOLR`, `CHANTWCOLR` |

Things to be aware of:

- `$SCNSAVE` is an adjustment and changes the adjust-stamp in `?SYSTEMID`.
- It is not possible to exclude any entries from `$SCNSAVE`; all scene entries are set to their current live value. Recall the scene first, then adjust individual channels.
- It is not possible to include new channels or entries; only existing entries can be adjusted.
- Scenes need not include both level and colour entries for colour/tuneable-white channels; only existing entries are saved.
- It does not allow you to define new scenes, change which channels/entries are in the scene, or change the scene's default fade time.
- It only changes the scene if the scene allows editing (access *edit* flag set; see Volume 2). Only editable scenes report their channels; only controllable channels are reported.

#### 6.5.1 Save scene levels

Permanently reprogram the channel levels of a scene to the current channel levels.

| | |
|---|---|
| Command | `$SCNSAVE,<scn-num>;` |
| Long-ack format | `!OK,SCNSAVE,<scn-num>;` |
| From | v01.00 |

```
$scnSave,8;
!OK,SCNSAVE,00008;<CR><LF>
```

#### 6.5.2 Channel discovery for scenes

**Request channel names for scene** – list of channel entries with name and area.

| | |
|---|---|
| Query | `?SCNCHANNAMES,<scn-num>;` |
| Long-ack format | `!OK,SCNCHANNAMES,00000;` |
| From | v02.01 |
| Reply | zero or more `!<entry-id>NAME,<addr>,<devcode>,<chan-num>,<access>,<area-num>,<chan-name>;` |

`entry-id`: `CHAN`, `DALI`, `DMX` (levels); `DMXRGBCOLR`, `CHANRGBCOLR`, `DMXRGBPLAY` (colour); `DMXTWCOLR`, `CHANTWCOLR` (tuneable white).

```
?SCNCHANNAMES,4;
!OK,SCNCHANNAMES,00004;
!CHANNAME,002,012,001,03,00001,Main Ceiling;<CR><LF>
!DMXNAME,003,015,002,03,00001,Features;<CR><LF>
!DMXRGBCOLRNAME,003,015,002,03,00001,Features;<CR><LF>
!CHANNAME,004,017,001,03,00001,Side lights;<CR><LF>
!DALINAME,004,017,012,03,00001,Downlights;<CR><LF>
!CHANTWCOLRNAME,005,018,001,03,00001,Ambient;<CR><LF>
```

**Request channel status for scene** – channel entries with live status/level/colour. The "Report item status" replies are the same as for Channel API status queries.

| | |
|---|---|
| Query | `?SCNCHANSTATES,<scn-num>;` |
| Long-ack format | `!OK,SCNCHANSTATES,<scn-num>;` |
| From | v02.01 |
| Reply | zero or more "Report (item) state" messages – see Channel API |

> **Note (transcription):** the PDF's example types `?SCNCHANS,4;` and shows `!OK,SCNCHANS,00004;`, whereas the query is defined as `?SCNCHANSTATES`. Reproduced as printed.

```
?SCNCHANS,4;
!OK,SCNCHANS,00004;<CR><LF>
!CHANLEVEL,002,012,001,000,100,00100;<CR><LF>
!DMXLEVEL,003,015,002,000,033,00100;<CR><LF>
!DMXRGBCOLR,003,015,002,000,#FF7E00;<CR><LF>
!CHANLEVEL,004,017,001,000,100,00100;<CR><LF>
!DALILEVEL,004,017,012,000,100,02500;<CR><LF>
!CHANTWCOLR,005,018,001,048,#2200K;<CR><LF>
```

---

## 7 Channel API

Interacts with the actual hardware. Take care if the system has an active in-built controller, which will also control the hardware. Most hardware is either an output lighting channel (dimmable level) or a contact input channel / plate button that triggers events and actions. Volume 2 covers advanced channel control/monitoring; Volume 3 covers inhibiting the in-built controller.

### 7.1 Overview

#### 7.1.1 Different types of channels

- **Most outputs use the `CHAN` notation**, with two exceptions:
  - **`DALI` notation** – lighting channels on the DALI universe of UBC modules (addressable DALI) use `DALI` instead of `CHAN`, because there are both ordinary CHANs and DALI outputs on the same module.
  - **`DMX` notation** – the 8 channel IO module has both ordinary channels and DMX zones; DMX zones use `DMX`.

  Use `CHAN` unless the configuration indicates otherwise. Do not assume `DALI` notation relates to all DALI fixtures; outputs on the DBM module are **always** identified with `CHAN`, even if configured as DALI broadcast channels.

  Most channel commands, queries and events therefore come in 3 flavours (`CHAN`, `DALI`, `DMX`), identical except for the identifier.

- **Plate buttons (`BTN`)** are both inputs and outputs: a momentary contact switch input, plus colour LEDs and (for LCD plates) text outputs. BTNs have both control messages and input events.
- **Colour and tuneable-white outputs** have two controls: level/master brightness (normal `CHAN`/`DMX` notation) and colour (suffix `RGB` or `TW`, e.g. `CHANTW`, `DMXRGB`).
- **Input channels** come in varieties. Generic notation `INP`; specific notations:
  - `INPSTATE` – contact-input
  - `INPPIR` – pir-input
  - `INPLEVEL` – analogue-input
- **Modules** are needed to identify a channel but there are very few messages that refer to a module as a whole.

#### 7.1.2 Channel identification

All channels are identified by 3 items: module MBus address, module device code, and channel number, shown as `<addr>,<devcode>,<chan-num>`.

- MBus address: configurable per module and plate, range **1–511**, depending on system configuration.
- Device code: fixed per module type; must be correct. See [Device codes](#device-codes).
- Channel number: as identified on the module and in the configuration, with these exceptions:

| Channel kind | Identifier used |
|---|---|
| DALI (addressable DALI universe) | `<addr>,<devcode>,<dali-num>` – the Mode DALI channel number assigned to the ballast during commissioning. Some messages use `<dali-id>`; treat as `<dali-num>`. `<dali-id>` can also take advanced DALI Broadcast and Group Id values (Volume 2, Advanced DALI Addressing). For modules with DALI *Broadcast* output channels you **must** use the standard `CHAN` commands; the `DALI` commands are only for UBC modules with addressable DALI outputs. |
| DMX zones | `<addr>,<devcode>,<zone-num>` – the module's DMX universe **and** the specified zone must both be enabled (done during configuration/commissioning; not controllable through the GATEWAY). |
| Plate `BTN` buttons | `<addr>,<devcode>,<btn-num>`; `<btn-num>` may be `ALL` to set/query all buttons on the plate. Plates also have contact inputs on the back: use `INP` and channel numbers for those. |

#### 7.1.3 Plate button identification and numbering

- All plates use the `EVO-SGP-xx` device code `2`, except the LCD plate (`EVO-LCD-55`, device code `1`) and the RD-00-04 rotary switch plate (`EVO_RD_00_04`, device code `21`).
- All button numbering is based on the SGP55 10-button plate numbering. 2- and 5-button plates use "Button 9" for their last button. Coolbrium 8-button plates use buttons 1–8.
- Rotary plate: numbered from 1 across to a maximum of 4, usually 1 being the left-most knob, but it depends on how plate assemblies are mounted.

*Diagram on page 40 (transcribed from the rendered page):* a plate outline with two columns of buttons.

```
  Left column          Right column
  (1)                  (5)
  (2)                  (6)
  (3)                  (7)
  (4)                  (8)
  (9)                  (10)
```

- **5-button SGP50** – dashed box around the left column (buttons 1, 2, 3, 4 and 9).
- **2-button SGP20** – callouts point at button 1 and button 9.
- **8-button CBM44** – dashed box around buttons 1–8 (both columns, excluding 9 and 10).

> **Note (transcription):** the dashed boxes and callout arrows are approximated in text from the rendered diagram; consult the PDF for the exact drawing.

### 7.2 Output control

#### 7.2.1 Set output level

Set the output gradually to a final level, fading over a given time.

- Levels are **0 (min) – 255 (max)**, not percentages (8-bit internal value). 0 turns the channel off; any other value turns it on.
- Fade times are in **milliseconds**. A fade time of 0 snaps the output to its new level.
- Use this command for relay and other non-dimmable channels too (only full on/off):
  - fade time 0 to snap on/off as soon as the command is sent;
  - use the same fade time as other dimmable channels to turn on/off at the same time;
    - when fading to off the channel remains on until the end of the fade time, when it is switched off;
    - when fading on the channel turns on instantly.
  - This makes it easy to drive a relay channel wired to e.g. an analogue 1–10V dimmable channel – send the same command to both.
  - Not all relay channels support fades; those ignore the fade time and always snap.

| Command | Long-ack | From |
|---|---|---|
| `$CHANFADE,<addr>,<devcode>,<chan-num>,<level>,<fadetime(ms)>;` | `!OK,CHANFADE,…;` | v01.00 |
| `$DALIFADE,<addr>,<devcode>,<dali-num>,<level>,<fadetime(ms)>;` | `!OK,DALIFADE,…` | v01.00 |
| `$DMXFADE,<addr>,<devcode>,<zone-num>,<level>,<fadetime(ms)>;` | `!OK,DMXFADE,…` | v02.00 |

```
$ChanFade,1,12,2,30,3000;
!OK,CHANFADE,001,012,002,030,00003000;<CR><LF>

$dalifade,02,17,016,255,1000;
!OK,DALIFADE,002,017,016,255,00001000;<CR><LF>

$dmxfade,02,15,03,255,1000;
!OK,DMXFADE,002,015,003,255,00001000;<CR><LF>
```

#### 7.2.2 Stop output fade

Stop a channel fading prematurely. If no fade is active or the channel is already at its final level, no action is taken.

| Command | Long-ack | From |
|---|---|---|
| `$CHANSTOP,<addr>,<devcode>,<chan-num>;` | `!OK,CHANSTOP,<addr>,<devcode>,<chan-num>;` | v01.00 |
| `$DALISTOP,<addr>,<devcode>,<dali-num>;` | `!OK,DALISTOP,<addr>,<devcode>,<dali-num>;` | v01.00 |
| `$DMXSTOP,<addr>,<devcode>,<zone-num>;` | `!OK,DMXSTOP,<addr>,<devcode>,<zone-num>;` | v02.00 |

```
$chanstop,26,16,4;
!OK,CHANSTOP,026,016,004;<CR><LF>

$DALIstop,4,17,12;
!OK,DALISTOP,004,017,012;<CR><LF>

$DMXStop,4,15,2;
!OK,DMXSTOP,004,015,002;<CR><LF>
```

### 7.3 Output status

The basic query returns the channel health (status code), current level and an estimate of current output power. For colour or tuneable white channels the basic query also returns the current colour (see [7.5](#75-colour-and-tuneable-white-control-and-status)).

- Status code 0 = channel OK; any other value indicates a problem (see [Channel status codes](#channel-status-codes)).
- Level 0–255 (0 = off). Relay/non-dimmable channels return 0 or 255.
- Power is an **estimate**, not a measurement, based on level, the channel's dimming curve and cup & cap value. Reported in 2 parts: a percentage of maximum output power, and the wattage at maximum power (set in the configuration, fixed per channel).
- Level and power assume the channel is not in an active fade: they report the last fade operation's final value (as if every fade were a snap). If channels are continually changing over long fades, see Volume 2 for ways to request the actual current level.

| Parameter | Meaning |
|---|---|
| `status-code` | 0 (OK); see Enumerations for other values |
| `level` | Level (0–255) or relay state (0 or 255) |
| `power` | Percentage of maximum wattage (0–100) |
| `wattage` | Wattage at maximum level/power, in Watts |

#### 7.3.1 Request output status

Three flavours of query for `CHAN`, `DALI` and `DMX`.

| Query | Long-ack | From | Reply |
|---|---|---|---|
| `?CHAN,<addr>,<devcode>,<chan-num>;` | `!OK,CHAN,<addr>,<devcode>,<chan-num>;` | v02.00 | `!CHANERR,<addr>,<devcode>,<chan-num>,<status-code>;` and `!CHANLEVEL,<addr>,<devcode>,<chan-num>,<level>,<power>,<wattage>;` |
| `?DALI,<addr>,<devcode>,<dali-num>;` | `!OK,DALI,<addr>,<devcode>,<dali-num>;` | v02.00 | `!DALIERR,<addr>,<devcode>,<dali-num>,<status-code>;` and `!DALILEVEL,<addr>,<devcode>,<dali-num>,<level>,<power>,<wattage>;` |
| `?DMX,<addr>,<devcode>,<zone-num>;` | `!OK,DMX,<addr>,<devcode>,<zone-num>;` | v02.00 | `!DMXERR,<addr>,<devcode>,<zone-num>,<status-code>;` and `!DMXLEVEL,<addr>,<devcode>,<zone-num>,<level>,<power>,<wattage>;` |

```
?chan,1,12,2;
!OK,CHAN,001,012,002;<CR><LF>
!CHANERR,001,012,002,000;<CR><LF>
!CHANLEVEL,001,012,002,030,099,00100;<CR><LF>

?dali,1,17,2;
!OK,DALI,001,017,002;<CR><LF>
!DALIERR,001,017,002,000;<CR><LF>
!DALILEVEL,001,017,002,254,099,02500;<CR><LF>

?dmx,1,15,2;
!OK,DMX,001,015,002;<CR><LF>
!DMXERR,001,015,002,000;<CR><LF>
!DMXLEVEL,001,015,002,255,033,02500;<CR><LF>
```

### 7.4 Plate button control and status

Plate buttons are both inputs and outputs. The contact switch input and the output colour & text are completely independent: outputs do not change automatically when an input occurs – a controller has to do this explicitly. Some commands/queries apply to one button or all buttons on a plate (use `ALL` for the button number).

`$BTNCOLR` and `$BTNTEXT` control the button outputs. `$BTNSTATE` relates to the contact switch input; it is used to mimic an actual button or to mirror a wall plate via the gateway.

#### 7.4.1 Set button colour

All plates share a fixed palette; each colour has a number. This palette is different from, and not to be confused with, the palettes used by DMX zones or colour channels. See [eDIN Button Palette Colours](#edin-button-palette-colours).

| | |
|---|---|
| Commands | `$BTNCOLR,<addr>,<devcode>,ALL,<palette-colour>;` (ALL form from v02.00) · `$BTNCOLR,<addr>,<devcode>,<btn-num>,<palette-colour>;` |
| Long-ack format | `!OK,BTNCOLR,<addr>,<devcode>,<btn-num>,<palette-colour>;` |
| From | v01.00 |

```
$BtnColr,08,2,4,3;
!OK,BTNCOLR,008,002,004,003;<CR><LF>
```

#### 7.4.2 Set button text

Limit text to letter or number characters and spaces. All plate buttons have a text property, but only LCD plates can show it, and only a limited character set.

| | |
|---|---|
| Commands | `$BTNTEXT,<addr>,<devcode>,ALL,<text>;` (ALL form from v02.00) · `$BTNTEXT,<addr>,<devcode>,<btn-num>,<text>;` |
| Long-ack format | `!OK,BTNTEXT,<addr>,<devcode>,<btn-num>,<text>;` |
| From | v01.00 |

```
$btnText,63,1,all,;
!OK,BTNTEXT,063,001,ALL,;<CR><LF>
```

#### 7.4.3 Inject button input event

Forces a button input event so rules/actions connected to that button and event are performed as though from the real button. Primarily used to mirror a wall plate from the GATEWAY (see Volume 2).

Each internal rule is connected to one button and one event; a button can have several rules. There are 5 button events: Release-off, Press-on, Hold-on, Short-press, Hold-off (numeric values in [Button events](#button-events)).

To fully mimic a button, inject one of two sequences:

| Press type | Sequence |
|---|---|
| Short press | when pressed: Press-on; when released: Short-press, Release-off |
| Long held press | when pressed: Press-on, then Hold-on; when released: Hold-off, Release-off |

To trigger one known event and its rules, inject just that event.

| | |
|---|---|
| Command | `$BTNSTATE,<addr>,<devcode>,<btn-num>,<event>;` |
| Long-ack format | `!OK,BTNSTATE,<addr>,<devcode>,<btn-num>,<event>;` |
| From | v02.00 |

```
$btnState,63,1,9,1;
!OK,BTNSTATE,063,001,009,001;<CR><LF>
```

#### 7.4.4 Request button status and related queries

The basic button query returns health (status code), current contact switch input state, and the current button colour and text. You can query just colour or text, for a single button or all buttons on a plate.

| Parameter | Meaning |
|---|---|
| `status-code` | 0 (OK); see Enumerations |
| `state` | 0 (Release-off) or 1 (Press-on) |
| `palette-colour` | 0–255; see Enumerations |
| `text` | Zero or more letters, digits or spaces |

**Request button status**

| | |
|---|---|
| Queries | `?BTN,<addr>,<devcode>,ALL;` · `?BTN,<addr>,<devcode>,<btn-num>;` |
| Long-ack format | `!OK,BTN,<addr>,<devcode>,<btn-num \|\| ALL>;` |
| From | v02.00 |
| Reply | one or more of each: `!BTNERR,<addr>,<devcode>,<btn-num>,<status-code>;` · `!BTNSTATE,<addr>,<devcode>,<btn-num>,<state>;` · `!BTNCOLR,<addr>,<devcode>,<btn-num>,<palette-colour>;` · `!BTNTEXT,<addr>,<devcode>,<btn-num>,<text>;` |

```
?btn,15,1,2;
!OK,BTN,015,001,002;<CR><LF>
!BTNERR,015,001,002,000;<CR><LF>
!BTNSTATE,015,001,002,000;<CR><LF>
!BTNCOLR,015,001,002,005;<CR><LF>
!BTNTEXT,015,001,002,All Off;<CR><LF>
```

**Request button colour**

| | |
|---|---|
| Queries | `?BTNCOLR,<addr>,<devcode>,ALL` · `?BTNCOLR,<addr>,<devcode>,<btn-num>;` |
| Long-ack format | `!OK,BTNCOLR,<addr>,<devcode>,<btn-num \|\| ALL>;` |
| From | v01.00 |
| Reply | one or more `!BTNCOLR,<addr>,<devcode>,<btn-num>,<palette-colour>;` |

```
?btncolr,15,1,all;
!OK,BTNCOLR,015,001,ALL;<CR><LF>
!BTNCOLR,015,001,001,003;<CR><LF>
!BTNCOLR,015,001,002,005;<CR><LF>
!BTNCOLR,015,001,003,005;<CR><LF>
...
```

**Request button text**

| | |
|---|---|
| Queries | `?BTNTEXT,<addr>,<devcode>,ALL;` · `?BTNTEXT,<addr>,<devcode>,<btn-num>;` |
| Long-ack format | `!OK,BTNTEXT,<addr>,<devcode>,<btn-num \|\| ALL>;` |
| From | v01.00 |
| Reply | one or more `!BTNTEXT,<addr>,<devcode>,<btn-num>,<text>;` |

```
?btntext,15,1,2;
!OK,BTNTEXT,015,001,002;<CR><LF>
!BTNTEXT,015,001,002,All On;<CR><LF>
```

### 7.5 Colour and tuneable white control and status

An output channel is determined by the configuration as a normal output, colour channel or tuneable white channel. All have a level/master brightness control (see Output control). Colour and tuneable white channels have an additional colour control. Both DMX zones and DALI Broadcast `CHAN` channels can be normal (White), Colour or Tuneable White, determined by the fixture type configured.

- Both can be set to **static colours** using **pre-set values** (each has its own number), e.g. a nominal red or blue.
- Colour channels can alternatively be controlled with a direct `<rgb>` or `<wrgb>` (white-red-green-blue) value using the HTML/CSS `#rrggbb` 6-hex-digit notation, extended to `#wwrrggbb` 8-hex-digit if a 4th white channel is used.
- Tuneable white channels are controlled with colour temperature in **Kelvin**.
- Colour channels can **play a predetermined colour sequence** (each has its own number). Set the control to play a value to begin; set a static colour to stop the sequence.
- There are 2 flavours of each command and query for the `CHAN` and `DMX` identifiers, otherwise identical.

See [Appendix A](#appendix-a--enumerations) for all pre-set and sequence values. Volume 2 has advanced control and adjusting pre-set values via the GATEWAY.

#### 7.5.1 Colour control

Colour control commands have a **crossfade time** (ms). For static colours it is how long the change from the existing to new colour takes; for sequences, how long each step takes. 0 snaps to the new static colour. Sequences have a built-in speed limit; a channel defaults to that limit if the crossfade time given is too small. If you specify a nonsense value, or one the channel does not support, no action occurs.

| Parameter | Meaning |
|---|---|
| `preset` | Static colours 1–15; determined by configuration |
| `wrgb` | Direct colour as 6- or 8-hex-digit, e.g. red = `#FF0000` |
| `seq` | Sequence number 64–68 (or 96–100); see Enumerations |
| `fadetime` | Crossfade time in milliseconds |

**Set channel to pre-set static colour** (From v02.01)

```
$DMXRGBCOLRFADE,<addr>,<devcode>,<zone-num>,<preset>,<fadetime(ms)>;
$CHANRGBCOLRFADE,<addr>,<devcode>,<chan-num>,<preset>,<fadetime(ms)>;
Long-ack: !OK,DMXRGBCOLRFADE,…; or !OK,CHANRGBCOLRFADE,…;
```

```
$dmxRgbColrFade,02,15,03,2,1000;
!OK,DMXRGBCOLRFADE,002,015,003,002,00001000;<CR><LF>
```

**Set channel to direct static colour** (From v02.01) – same command with the direct `wrgb` value substituted for the pre-set.

```
$DMXRGBCOLRFADE,<addr>,<devcode>,<zone-num>,#<wrgb>,<fadetime(ms)>;
$CHANRGBCOLRFADE,<addr>,<devcode>,<chan-num>,#<wrgb>,<fadetime(ms)>;
Long-ack: !OK,DMXRGBCOLRFADE,…; or !OK,CHANRGBCOLRFADE,…;
```

```
$dmxRgbColrFade,02,15,03,#ff0000,1000;
!OK,DMXRGBCOLRFADE,002,015,003,#FF0000,00001000;<CR><LF>
```

**Set channel to play sequence** (From v02.01)

```
$DMXRGBPLAYFADE,<addr>,<devcode>,<zone-num>,<seq>,<fadetime(ms)>;
$CHANRGBPLAYFADE,<addr>,<devcode>,<chan-num>,<seq>,<fadetime(ms)>;
Long-ack: !OK,DMXRGBPLAYFADE,…; or !OK,CHANRGBPLAYFADE,…;
```

```
$dmxRgbPlayFade,02,15,3,64,1000;
!OK,DMXRGBPLAYFADE,002,015,003,064,00001000;<CR><LF>
```

#### 7.5.2 Tuneable white control

Crossfade time (ms) is how long it takes to change from the existing to the new colour temperature; 0 snaps. Specified by pre-defined number or direct Kelvin value. A nonsense or unsupported value results in no action.

| Parameter | Meaning |
|---|---|
| `preset` | Pre-set colour temperatures 48–63; defined by configuration |
| `kelvin` | Direct Kelvin colour temperature, typically 1800K to 7000K |
| `fadetime` | Crossfade time in milliseconds |

**Set channel to pre-set colour temperature** (From v02.01)

```
$DMXTWCOLRFADE,<addr>,<devcode>,<zone-num>,<preset>,<fadetime(ms)>;
$CHANTWCOLRFADE,<addr>,<devcode>,<chan-num>,<preset>,<fadetime(ms)>;
Long-ack: !OK,DMXTWCOLRFADE,…; or !OK,CHANTWCOLRFADE,…;
```

```
$chanTWColrFade,02,18,03,50,3000;
!OK,CHANTWCOLRFADE,002,018,003,050,00003000;<CR><LF>
```

**Set channel to direct Kelvin colour temperature** (From v02.01) – same command with the direct Kelvin value substituted.

```
$DMXTWCOLRFADE,<addr>,<devcode>,<zone-num>,#<kelvin>K,<fadetime(ms)>;
$CHANTWCOLRFADE,<addr>,<devcode>,<chan-num>,#<kelvin>K,<fadetime(ms)>;
Long-ack: !OK,DMXTWCOLRFADE,…; or !OK,CHANTWCOLRFADE,…;
```

```
$chanTWColrFade,02,18,03,#2700K,3000;
!OK,CHANTWCOLRFADE,002,018,003,#2700K,00003000;<CR><LF>
```

#### 7.5.3 Request colour status

Two ways: the normal request-output-status query ([7.3.1](#731-request-output-status)) also reports the colour as a separate message; or the colour-only query below.

| Parameter | Meaning |
|---|---|
| `preset` | Static colours 0–15; 0 is black, 1–15 determined by configuration |
| `wrgb` | Direct colour as 6- or 8-hex-digit, e.g. `#FF0000` |
| `seq` | Sequence number 64–68 (or 96–100) |

**Request output channel status** (colour channel) – From v02.00. Reply: "Report of output status" followed by "Report of colour status".

```
?CHAN,<addr>,<devcode>,<chan-num>;
?DMX,<addr>,<devcode>,<zone-num>;
Long-ack: !OK,CHAN,… or !OK,DMX,…
```

```
?chan,1,18,2;
!OK,CHAN,001,018,002;<CR><LF>
!CHANERR,001,018,008,000;<CR><LF>
!CHANLEVEL,001,018,008,255,099,00100;<CR><LF>
!CHANRGBCOLR,001,018,002,000,#FF0000;<CR><LF>
```

> **Note (transcription):** the example reply lines show channel `008` while the query is for channel `2`. Reproduced as printed.

**Request colour status** – From v02.00. Reply: one of "Report of colour status".

```
?CHANRGB,<addr>,<devcode>,<chan-num>;
?DMXRGB,<addr>,<devcode>,<zone-num>;
Long-ack: !OK,CHANRGB,… or !OK,DMXRGB,…

!CHANRGBCOLR,<addr>,<devcode>,<chan-num>,<preset>,#<wrgb>;<CR><LF>
!CHANRGBPLAY,<addr>,<devcode>,<chan-num>,<seq>,#<wrgb>;<CR><LF>
!DMXRGBCOLR,<addr>,<devcode>,<zone-num>,<preset>,#<wrgb>;<CR><LF>
!DMXRGBPLAY,<addr>,<devcode>,<zone-num>,<seq>,#<wrgb>;<CR><LF>
```

```
?dmxRgb,2,15,3;
!OK,DMXRGB,002,015,003;<CR><LF>
!DMXRGBCOLR,002,015,003,005,#8054A2;<CR><LF>
```

#### 7.5.4 Request tuneable white status

Either the normal output-status query (which also reports colour temperature as a separate message), or the colour-temperature-only query.

| Parameter | Meaning |
|---|---|
| `preset` | Pre-set colour temperatures 48–63; defined by configuration |
| `kelvin` | Direct Kelvin colour temperature, typically 1800K to 7000K |

**Request output channel status** (tuneable white) – From v02.01. Reply: "Report of output status" followed by "Report of colour temperature status".

```
?chan,1,18,2;
!OK,CHAN,001,018,002;<CR><LF>
!CHANERR,001,018,002,000;<CR><LF>
!CHANLEVEL,001,018,002,255,099,00100;<CR><LF>
!CHANTWCOLR,001,018,002,048,#3000K;<CR><LF>
```

**Request colour temperature status** – From v02.01. Reply: one of "Report of tuneable white status".

```
?CHANTW,<addr>,<devcode>,<chan-num>;
?DMXTW,<addr>,<devcode>,<zone-num>;
Long-ack: !OK,CHANTW,… or !OK,DMXTW,…

!CHANTWCOLR,<addr>,<devcode>,<chan-num>,<preset>,#<kelvin>K;<CR><LF>
!DMXTWCOLR,<addr>,<devcode>,<zone-num>,<preset>,#<kelvin>K;<CR><LF>
```

```
?dmxTW,2,15,3;
!OK,DMXTW,002,015,003;<CR><LF>
!DMXTWCOLR,002,015,003,051,#5000K;<CR><LF>
```

#### 7.5.5 Channel colour discovery

There is no specific query to determine whether a channel is a colour channel. However the normal Request Output Status query reports the colour or colour temperature status if the channel is a colour or tuneable white channel, which can be used to discover colour channels.

### 7.6 Input state

The main task on input channels is to determine and monitor the channel's input state. Controlling some input channel types and injecting input events to mimic real changes are advanced topics in Volume 2.

#### 7.6.1 Request input status

Returns the channel health (status code) and its current state. The meaning of `state` depends on the input type, so there are different reply flavours:

| Reply | Input type | `state` meaning |
|---|---|---|
| `INPSTATE` | contact-input | 0 when Inactive (the "Normally Closed" or "Normally Open" state) or 1 when active |
| `INPPIR` | pir-input | 0 when the sensor reports Unoccupied/Empty, 1 when Occupied |
| `INPLEVEL` | analogue-input | calibrated input level between its minimum and maximum calibrated values; for an uncalibrated channel the range is 0–255 |

The query uses the generic `INP` notation; the reply indicates the channel type if unknown.

| | |
|---|---|
| Query | `?INP,<addr>,<devcode>,<chan-num>` |
| Long-ack format | `!OK,INP,<addr>,<devcode>,<chan-num>;` (printed as `!OK,INP,000,000,000;`) |
| From | v02.00 |
| Reply | "Report input channel health" (`!INPERR`) and one of "Report input channel state" |

```
!INPERR,<addr>,<devcode>,<chan-num>,<status-code>;
!INPSTATE,<addr>,<devcode>,<chan-num>,<status-code>,<state>;
!INPPIR,<addr>,<devcode>,<chan-num>,<status-code>,<state>;
!INPLEVEL,<addr>,<devcode>,<chan-num>,<status-code>,<state>;
```

```
?inp,15,21,1;
!OK,INP,015,021,001;<CR><LF>
!INPERR,015,021,001,000;<CR><LF>
!INPPIR,015,021,001,000;<CR><LF>
```

> **Note (transcription):** the PDF's `!INPSTATE`/`!INPPIR`/`!INPLEVEL` formats include `<status-code>` before `<state>`; the example `!INPPIR,015,021,001,000;` shows only one value after the channel number. Reproduced as printed.

---

## Appendix A – Enumerations

Values used by various commands and queries.

### Device codes

| devCode | Product code | Products |
|---|---|---|
| 01 | EVO-LCD-55 | LCD Wall Plate |
| 02 | EVO-SGP-xx | 2, 5 and 10 button Wall Plates, Coolbrium & Icon plates |
| 04 | EVO-RP-03-02 | Evo 2-channel Relay Module |
| 08 | EVS-xxx | All Legacy Evo Slave Packs |
| 09 | EVO-INT-CI-xx | Evo 4 & 8 channel Contact Input modules |
| 12 | DIN-02-08 | eDIN 2A 8 channel leading edge dimmer module |
| 13 | DIN-03-04-TE | eDIN 3A 4 channel trailing edge dimmer module |
| 14 | DIN-03-04 | eDIN 3A 4 channel leading edge dimmer module |
| 15 | DIN-INT-00-08 | eDIN 8 channel IO module |
| 16 | DIN-RP-05-04 | eDIN 5A 4 channel relay module |
| 17 | DIN-UBC-01-05 | eDIN Universal Ballast Control module |
| 18 | DIN-DBM-00-08 | eDIN 8 channel Configurable Output module |
| 19 | DIN-DCM-xxx | All eDIN Dimmer Packs |
| 21 | DIN-RP-00-xx | All eDIN Rotary switch wall plates |
| 24 | ECO_MULTISENSOR | eDIN Multi-sensor (both Mk1 and Mk2) |
| 30 | MBUS-SPLIT | MBus splitter module |
| 144 | DIN-RP-05-04 | eDIN 5A 4 channel mains sync relay module |
| 145 | DIN-UBC-01-05 | eDIN Universal Ballast Control 2 module |

### Channel status codes

| Value | Error | Description |
|---|---|---|
| 0 | Status Ok | No Errors |
| 2 | Device missing | Device or Module is not responding to MBus messages. |
| 3 | Channel Errors | Module has errors on at least one specific channel – see the individual channel for details of the error |
| 4 | Bad Device Firmware | System is configured to use features that are not present in current module firmware. |
| 5 | No AC | Module uses mains AC and it does not detect any main AC power |
| 6 | Too Hot | The module has detected that its internal temperature is above its maximum rated operating temperature. |
| 7 | Override Active | The channel has been manually set to override mode and is no longer controlled by the system |
| 8 | Internal Failure | The channel or module has detected some sort of hardware failure internally |
| 9 | DALI Fixture Errors | There are fixtures on this DALI channel that are reporting errors – see the individual DALI fixtures for details of the error |
| 10 | Channel Load Failure | The module has detected there is a problem with the external load a channel is driving |
| 20 | No DALI PSU | The module has detected that there is no PSU on its DALI bus. |
| 21 | No DALI Commissioning Data | The DALI universe on this module does not contain any commissioning data. |
| 22 | DALI Commissioning problem | The module has detected that the actual DALI fixtures detected do not match with the commissioning data |
| 25 | DALI Lamp failure | A DALI fixture on this channel is indicating a lamp failure condition |
| 26 | DALI missing ballast | A DALI fixture that is in the commissioning data is not present (is not responding). |

### eDIN Button Palette Colours

| Value | Name |
|---|---|
| 0 | Black |
| 1 | White |
| 2 | Red |
| 3 | Green |
| 4 | Blue |
| 5 | Orange |
| 6 | Cyan |
| 7 | Magenta |
| 8 | Yellow |
| 9 | DimWhite |
| 10 | DimRed |
| 11 | DimGreen |
| 12 | DimBlue |
| 13 | DimOrange |
| 14 | DimCyan |
| 15 | DimMagenta |
| 16 | DimYellow |

### eDIN Colour Palette and Modes

| Value | Mode |
|---|---|
| 1–15 | Static Colour Palette code – static wash using palette colour |
| 64–68 | Solid Colour Sequence |
| 64 | Long Rainbow Solid |
| 65 | Short Rainbow Solid |
| 66 | Hot Colours Solid |
| 67 | Cold Colours Solid |
| 68 | User Colours Solid |
| 96–100 | Ripple Colour Sequence |
| 96 | Long Rainbow Ripple |
| 97 | Short Rainbow Ripple |
| 98 | Hot Colours Ripple |
| 99 | Cold Colours Ripple |
| 100 | User Colours Ripple |

Static colour palette (palette code → default name):

| Palette code | Default name |
|---|---|
| 1 | Red |
| 2 | Orange |
| 3 | Yellow |
| 4 | LawnGreen |
| 5 | Green |
| 6 | Mint |
| 7 | Cyan |
| 8 | DeepSkyBlue |
| 9 | Blue |
| 10 | Purple |
| 11 | Magenta |
| 12 | DeepPink |
| 13 | User1 |
| 14 | User2 |
| 15 | User3 |

### eDIN Tuneable White Pre-sets

| Preset value | Default name | Default temperature |
|---|---|---|
| 48 | Candlelight | 1800K |
| 49 | SoftWhite | 2700K |
| 50 | WarmWhite | 3000K |
| 51 | Whitelight | 3500K |
| 52 | CoolWhite | 4000K |
| 53 | BrightWhite | 5000K |
| 54 | Daylight | 6000K |
| 55 | BlueSky | 7000K |

### Button events

| Value | State |
|---|---|
| 0 | Release-off |
| 1 | Press-on |
| 2 | Hold-on |
| 5 | Short-press |
| 6 | Hold-off |

---

## Quick command index

Commands (`$`), queries (`?`) and the replies/events (`!`) documented in this volume.

| Message | Kind | Section | From |
|---|---|---|---|
| `$OK;` | Command | 5.1.1 | v01.00 |
| `?VERSION;` → `!VERSION` | Query | 5.1.2 | v01.00 |
| `!GATRDY;` | Event (sign-on) | 5.1.3 | v01.00 |
| `$DBGACK` / `?DBGACK` → `!DBGACK` | Command / query | 5.2.1 | v01.00 |
| `$DBGECHO` / `?DBGECHO` → `!DBGECHO` | Command / query | 5.2.2 | v01.00 |
| `$EVENTS,<on-off>;` | Command | 5.3.1 | v01.00 |
| `$SCNRECALL` | Command | 6.1.1 | v01.00 |
| `$SCNOFF` | Command | 6.1.1 | v01.00 |
| `$SCNRECALLX` | Command | 6.1.1 | v01.00 |
| `$SCNONOFF` | Command | 6.1.2 | v01.00 |
| `?SCNS` / `?SCN` → `!SCN` | Query | 6.2.1 | v02.00 |
| `?ERRORS` → `!MODULEERR`, `!CHANERR`, `!DALIERR`, `!DMXERR`, `!BTNERR`, `!INPERR` | Query | 6.3.1 | v02.01 |
| `?AREANAMES` → `!AREANAME` | Query | 6.4.1 | v01.00 |
| `?SCNNAMES` → `!SCNNAME` | Query | 6.4.1 | v01.00 |
| `?PLATENAMES` → `!PLATENAME` | Query | 6.4.1 | v01.00 |
| `?BTNSTYLE` → `!BTNSTYLE` | Query | 6.4.1 | v01.00 |
| `?SYSTEMID` → `!SYSTEMID` | Query | 6.4.1 | v01.00 |
| `$SCNSAVE` | Command | 6.5.1 | v01.00 |
| `?SCNCHANNAMES` → `!<entry-id>NAME` | Query | 6.5.2 | v02.01 |
| `?SCNCHANSTATES` | Query | 6.5.2 | v02.01 |
| `$CHANFADE` / `$DALIFADE` / `$DMXFADE` | Command | 7.2.1 | v01.00 / v01.00 / v02.00 |
| `$CHANSTOP` / `$DALISTOP` / `$DMXSTOP` | Command | 7.2.2 | v01.00 / v01.00 / v02.00 |
| `?CHAN` / `?DALI` / `?DMX` → `!xxxERR` + `!xxxLEVEL` | Query | 7.3.1 | v02.00 |
| `$BTNCOLR` | Command | 7.4.1 | v01.00 (ALL form v02.00) |
| `$BTNTEXT` | Command | 7.4.2 | v01.00 (ALL form v02.00) |
| `$BTNSTATE` | Command | 7.4.3 | v02.00 |
| `?BTN` → `!BTNERR`, `!BTNSTATE`, `!BTNCOLR`, `!BTNTEXT` | Query | 7.4.4 | v02.00 |
| `?BTNCOLR` / `?BTNTEXT` | Query | 7.4.4 | v01.00 |
| `$DMXRGBCOLRFADE` / `$CHANRGBCOLRFADE` | Command | 7.5.1 | v02.01 |
| `$DMXRGBPLAYFADE` / `$CHANRGBPLAYFADE` | Command | 7.5.1 | v02.01 |
| `$DMXTWCOLRFADE` / `$CHANTWCOLRFADE` | Command | 7.5.2 | v02.01 |
| `?CHANRGB` / `?DMXRGB` → `!xxxRGBCOLR` / `!xxxRGBPLAY` | Query | 7.5.3 | v02.00 |
| `?CHANTW` / `?DMXTW` → `!xxxTWCOLR` | Query | 7.5.4 | v02.01 |
| `?INP` → `!INPERR` + `!INPSTATE`/`!INPPIR`/`!INPLEVEL` | Query | 7.6.1 | v02.00 |
