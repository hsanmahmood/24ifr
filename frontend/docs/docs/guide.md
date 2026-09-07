# 24IFR Documentation

A simple guide for controllers using 24IFR on ATC 24.

## Overview

24IFR is a platform that helps controllers increase productivity by automatically processing Flight Plan data to structure it into an IFR clearance.

### Quick Start

1. Select the island where your station located.
2. Verify ATIS, runway, and QNH.
3. Choose a flight plan.
4. Verify the filed route and evaluate routing type that structures the clearance correctly.
5. Set initial climb altitude.
6. Click **Generate**.

### Selecting a flight plan

Click any flight plan card to load it into the clearance generator. The card shows:

- callsign
- Departure and arrival airports
- Aircraft type
- Filed route
- flight level
- Flight rules (IFR or VFR)

### Filed route hint

Directly below the Routing Type selector, a small **Filed:** hint shows the pilot's actual filed route. Use this to decide the correct routing type for the flight. For example: **As Filed** can sometimes contain confusing waypoints that may be replaced with "As filed" or if you select Radar Vectors but the pilot filed GPS Direct.

### Flight plan not appearing

If a specific flight plan is not visible in the list, check:

1. The pilot has actually filed a flight plan on ATC24.
2. Ensure the correct ATC station is selected, as only its departing flight plans will appear.
3. The relay data has refreshed, press the refresh button to fetch the latest data manually.

## ATC Settings Fields

The ATC Settings panel is the primary control surface for generating a clearance. Each field is described below.

### Departure Airport

Departure. Only airports with at least one active online controller appear in this list. If your airport is not visible, no controller is currently logged in for that airport.

### ATC Station

Your position callsign — for example `IKFL_TWR` or `IGCC`. This value appears as `{ATC_STATION}` in the clearance text.

If no airport station is online but a **Center (CTR)** controller covers the airspace, the CTR callsign is used.

### Runway

The active departure runway. Filled automatically from the ATIS for your airport. You can override this if the ATIS has not updated or if you need a different runway.

### ATIS

The current ATIS information letter — for example **Information X**. Filled automatically from ATIS data. A green badge indicates the value was auto-filled from 24DATA.

### QNH

The current QNH pressure value extracted automatically from the ATIS content. Appears as `{QNH}` in the clearance if your template includes it. Also appears under the ATIS field.

### Routing Type

Determines how the route phrase is constructed in the clearance.

| Type | Description |
|------|-------------|
| As Filed | Uses the pilot's filed route exactly |
| SID | Issues a named standard instrument departure |
| Radar Vectors | Instructs the pilot to expect vectors after departure |
| GPS Direct | Clears the pilot direct to the filed destination or a specified waypoint |

### Routing Details

Appears when **Radar vectors**, **GPS Direct**, or **SID** is selected. Enter the SID name.

### Initial Climb

The initial altitude to assign after departure. Common values are `2000`, `3000`, `4000`, and `5000`. The value appears as `{INITIAL_ALT}` in the clearance.

## Phraseology Presets

The **Config** page lets you choose and customize a clearance template for four different phraseologies. Each phraseology has its own independently saved template slot.

### Available phraseology

| Phraseology | Description |
|-------------|-------------|
| FAA | United States Federal Aviation Administration |
| ICAO-E | ICAO European format |
| CASA | Civil Aviation Safety Authority (Australia) |
| CAA | Civil Aviation Authority (United Kingdom) |

### How phraseology work

- Clicking an phraseology in the left panel loads its template into the editor.
- Editing the textarea updates only that phraseology draft — other phraseology slots are unaffected.
- Pressing **Save Template** writes the current draft to that phraseology's slot and sets it as your active phraseology.
- The active phraseology's template is used every time you generate a clearance on the main page.

### Resetting a phraseology

Click **Reset phraseology** below the phraseology list to restore the currently selected phraseology's template to its factory default. This only affects the selected phraseology.

### Placeholder chips

Click a `{TOKEN}` chip to insert it where your cursor is. Hover over a chip to see what it does.

## Template placeholders

Tokens are placeholders in your clearance template that are replaced with flightplan data when a clearance is generated. All tokens use curly brace syntax: `{TOKEN_NAME}`.

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

```text
{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE},
runway {RUNWAY}, initial climb {INITIAL_ALT}, squawk {SQUAWK},
information {ATIS}.
```

## Common Mistakes

### Wrong airport selected

**Problem:** The ATIS letter, QNH, and runway auto-filled with values for the wrong airport.

**Fix:** Verify the departure airport selected in ATC Settings matches the airport you are controlling. The auto-fill is driven entirely by the selected airport.

### ATIS not auto-filling

**Problem:** The ATIS letter, runway, or QNH fields remain empty after selecting an airport.

**Fix:** ATIS data updates every 45 seconds. If the controller just came online, press the refresh button to fetch the latest data manually.

### Station not appearing in the list

**Problem:** Your ATC station does not appear in the departure airport selector.

**Fix:** The list only shows islands with at least one active controller. If no controller is online in for that island, it will not appear.
