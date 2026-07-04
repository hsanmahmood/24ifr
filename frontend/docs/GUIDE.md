# ATC 24 IFR Complete Guide

A comprehensive guide for virtual ATC controllers using the IFR clearance generator on the ATC 24 platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Flight Plans](#reading-flight-plans)
4. [ATC Settings](#atc-settings-fields)
5. [Tower and Center Mode](#tower-and-center-mode)
6. [Editing Clearances](#editing-a-clearance)
7. [Phraseology Presets](#phraseology-presets)
8. [Available Tokens](#available-tokens)
9. [Common Mistakes](#common-mistakes)
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Flight Plans](#reading-flight-plans)
4. [ATC Settings](#atc-settings-fields)
5. [Editing Clearances](#editing-a-clearance)
6. [Phraseology Presets](#phraseology-presets)
7. [Available Tokens](#available-tokens)
8. [Common Mistakes](#common-mistakes)
---

## Overview

ATC 24 IFR generates realistic IFR clearances for virtual controllers on the ATC 24 platform.

**Quick start:** Select your departure airport in ATC Settings, review the auto-filled ATIS and runway, choose your routing type, and press Generate.

### Requirements

- An active ATC 24 controller session
- At least one active controller online at your departure airport (the airport must appear in the controller list)

---

## Getting Started

### How it works

1. Log in with your Discord account.
2. Select your departure airport from the ATC Settings panel.
3. The station, ATIS letter, QNH, and departure runway fill in automatically from live data.
4. Choose your routing type and set your initial climb altitude.
5. Press **Generate** to produce the clearance text.
6. Edit the clearance if needed, then copy it to your clipboard.

### First time using the app

When you generate your first clearance, a hint will appear explaining that you can click directly into the clearance text to edit it before reading it out. This hint only appears once.

---

## Reading Flight Plans

The flight plan list on the left side of the main page shows all active flight plans currently on the network.

### Selecting a flight plan

Click any flight plan card to load it into the clearance generator. The card shows:

- Pilot callsign
- Departure and arrival airports
- Aircraft type
- Filed route
- Requested flight level
- Flight rules (IFR or VFR)

### Filed route hint

Directly below the Routing Type selector, a small **Filed:** hint shows the pilot's actual filed route. Use this to verify whether **As Filed** is appropriate before generating, especially if you planned to use Radar Vectors but the pilot filed GPS Direct.

### Flight plan not appearing

If a specific flight plan is not visible in the list, check:

1. You are in the correct mode — **Tower** mode only shows flights departing your selected airport. Switch to **Center** mode to see all active flight plans.
2. The pilot has actually filed a flight plan on the network.
3. The relay data has refreshed — press the refresh button to fetch the latest data manually.

---

## ATC Settings Fields

The ATC Settings panel is the primary control surface for generating a clearance. Each field is described below.

### Island

The ICAO code of the airport you are controlling. Only airports with at least one active online controller appear in this list. If your airport is not visible, no controller is currently logged in for that airport.

### ATC Station

Your position callsign — for example `IKFL_TWR` or `IGCC`. This value appears as `{ATC_STATION}` in the clearance text.

Station resolution priority:
1. If a **Delivery (DEL)** position is online at your airport, it is used.
2. If a **Ground (GND)** position is online, it is used.
3. If a **Tower (TWR)** position is online, it is used.
4. If no airport station is online but a **Center (CTR)** controller covers the airspace, the CTR callsign is used.
5. If nobody is online, the field defaults to `{AIRPORT}_TWR`.
The ATC station is automatically resolved from available controllers at your island. CTR (Center) controllers are treated as normal station positions within the island.
### Runway

The active departure runway. Filled automatically from the live ATIS for your airport. You can override this if the ATIS has not updated or if you need a different runway.

### ATIS

The current ATIS information letter — for example **Information X**. Filled automatically from live ATIS data. A green badge indicates the value was auto-filled from a live source.

### QNH

The current QNH pressure value extracted automatically from the live ATIS content. Appears as `{QNH}` in the clearance if your template includes it. No manual input required.

### Routing Type

Determines how the route phrase is constructed in the clearance.

| Type | Description |
|------|-------------|
| As Filed | Uses the pilot's filed route exactly |
| SID | Issues a named standard instrument departure |
| Radar Vectors | Instructs the pilot to expect vectors after departure |
| GPS Direct | Clears the pilot direct to the filed destination or a specified waypoint |

### Routing Details

Appears when **SID** or **GPS Direct** is selected. Enter the SID name or the direct waypoint here.

### Initial Climb

The initial altitude to assign after departure. Common values are `2000`, `3000`, `4000`, and `5000`. The value appears as `{INITIAL_ALT}` in the clearance.

---

## Tower and Center Mode

The **TWR / CTR** toggle in the top toolbar switches between two display modes for the flight plan list.

### Tower mode

Shows only flight plans departing your currently selected airport. Use this when working a TWR, GND, or DEL position at a single airport.

### Center mode

Shows all active flight plans on the network regardless of departure airport, sorted alphabetically by departure ICAO then by callsign. Use this when working a CTR position covering multiple airports.

### Switching modes

Click **TWR** or **CTR** in the toolbar. Your preference is saved automatically and persists across sessions.

### Center mode and station resolution

When Center mode is active and a CTR controller is online but no airport station is present, the CTR callsign is used automatically as the `{ATC_STATION}` in the clearance. You do not need to set it manually.

---

## Editing a Clearance

After generating a clearance, the output appears below the ATC Settings panel.

### Inline editing

Click anywhere in the clearance text to place your cursor and make changes. This is useful for small adjustments specific to a single flight without modifying your template.

Common reasons to edit inline:
- Correcting a callsign that was formatted unexpectedly
- Adding a non-standard instruction for a specific flight
- Changing the squawk code due to a conflict

### Copying to clipboard

Press the **Copy** button to copy the final clearance text. The button confirms the copy with a brief visual indicator.

### Clearance history

Every generated clearance is recorded automatically in your profile history. You can review past clearances from the Profile page.

### Regenerating

Pressing **Generate** again produces a new clearance with a fresh squawk code. If ATIS data has updated since your last generation, the new clearance will reflect the latest values.

---

## Phraseology Presets

The **Config** page lets you choose and customise a clearance template for five different ATC authorities. Each authority has its own independently saved template slot.

### Available authorities

| Authority | Description |
|-----------|-------------|
| FAA | United States Federal Aviation Administration |
| ICAO-E | ICAO European format |
| CASA | Civil Aviation Safety Authority (Australia) |
| CAA | Civil Aviation Authority (United Kingdom) |
| Default | Generic VATSIM-style format |

### How presets work

- Clicking an authority in the left panel loads its template into the editor.
- Editing the textarea updates only that authority's draft — other authority slots are unaffected.
- Pressing **Save Template** writes the current draft to that authority's slot and sets it as your active phraseology.
- The active authority's template is used every time you generate a clearance on the main page.

### Resetting a preset

Click **Reset Preset** below the authority list to restore the currently selected authority's template to its factory default. This only affects the selected authority.

### Placeholder chips

The row of `{TOKEN}` chips above the editor can be clicked to insert a placeholder at the current cursor position in the textarea. Hover a chip to see a tooltip confirming this.

---

## Available Tokens

Tokens are placeholders in your clearance template that are replaced with live data when a clearance is generated. All tokens use curly brace syntax: `{TOKEN_NAME}`.

| Token | Replaced with |
|-------|--------------|
| `{CALLSIGN}` | Pilot's callsign from the flight plan |
| `{ATC_STATION}` | Your active controller station callsign |
| `{ATIS}` | Current ATIS information letter |
| `{QNH}` | QNH pressure extracted from live ATIS |
| `{DESTINATION}` | Arrival airport ICAO code |
| `{ROUTE}` | Resolved route phrase based on the selected routing type |
| `{RUNWAY}` | Active departure runway designator |
| `{INITIAL_ALT}` | Initial climb altitude |
| `{FLIGHT_LEVEL}` | Pilot's filed flight level |
| `{SQUAWK}` | Randomly generated squawk code (excludes 7500, 7600, 7700) |

### Example template

```
{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE},
runway {RUNWAY}, initial climb {INITIAL_ALT}, squawk {SQUAWK},
information {ATIS}.
```

### Token not appearing in output

If a token appears unchanged in the generated clearance (e.g. `{RUNWAY}` is not replaced), the value for that token was empty at generation time. Check that ATIS data has loaded for your airport and that all required ATC settings fields are filled in.

---

## Common Mistakes

### Routing mismatch

**Problem:** You selected Radar Vectors but the pilot filed a GPS direct route, or selected As Filed but the pilot's route is blank.

**Fix:** Check the **Filed:** hint directly below the Routing Type selector before generating. It shows the pilot's actual filed route so you can choose the appropriate routing type.

### Wrong airport selected

**Problem:** The ATIS letter, QNH, and runway auto-filled with values for the wrong airport.

**Fix:** Verify the departure airport selected in ATC Settings matches the airport you are controlling. The auto-fill is driven entirely by the selected airport.

### ATIS not auto-filling

**Problem:** The ATIS letter, runway, or QNH fields remain empty after selecting an airport.

**Fix:** ATIS data is live and updates every 45 seconds. If the airport controller just came online, press the refresh button to fetch the latest data manually. If ATIS is still missing, the controller for that airport may not have filed an ATIS yet.

### CTR station missing

**Problem:** You are working a CTR position but your callsign does not appear in the station field.

**Fix:** Switch to **Center mode** using the TWR / CTR toggle. In Center mode, the CTR callsign for your airspace is resolved automatically as the ATC station when no airport controller is online.
### Squawk conflict

**Problem:** Two pilots have been assigned the same squawk code.

**Fix:** Squawk codes are generated randomly from the valid range and exclude emergency codes 7500, 7600, and 7700. If a conflict occurs, press Generate again to produce a new clearance with a different squawk, then advise the pilot of the updated code.

### Airport not appearing in the list

**Problem:** Your airport does not appear in the departure airport selector.

**Fix:** The list only shows airports with at least one active online controller. If no controller is logged in for that airport, it will not appear. If you believe the airport data itself is missing or incorrect, contact the development team via the Feedback button.

---

