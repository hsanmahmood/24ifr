# ATC Settings Fields

The ATC Settings panel is the primary control surface for generating a clearance. Each field is described below.

## Departure Airport

The ICAO code of the airport you are controlling. Only airports with at least one active online controller appear in this list. If your airport is not visible, no controller is currently logged in for that airport.

## ATC Station

Your position callsign — for example `IKFL_TWR` or `IGCC`. This value appears as `{ATC_STATION}` in the clearance text.

Station resolution priority:
1. If a **Delivery (DEL)** position is online at your airport, it is used.
2. If a **Ground (GND)** position is online, it is used.
3. If a **Tower (TWR)** position is online, it is used.
4. If no airport station is online but a **Center (CTR)** controller covers the airspace, the CTR callsign is used.
5. If nobody is online, the field defaults to `{AIRPORT}_TWR`.

## Runway

The active departure runway. Filled automatically from the live ATIS for your airport. You can override this if the ATIS has not updated or if you need a different runway.

## ATIS

The current ATIS information letter — for example **Information X**. Filled automatically from live ATIS data. A green badge indicates the value was auto-filled from a live source.

## QNH

The current QNH pressure value extracted automatically from the live ATIS content. Appears as `{QNH}` in the clearance if your template includes it. No manual input required.

## Routing Type

Determines how the route phrase is constructed in the clearance.

| Type | Description |
|------|-------------|
| As Filed | Uses the pilot's filed route exactly |
| SID | Issues a named standard instrument departure |
| Radar Vectors | Instructs the pilot to expect vectors after departure |
| GPS Direct | Clears the pilot direct to the filed destination or a specified waypoint |
| Direct | Clears the pilot direct to a specific waypoint |

## Routing Details

Appears when **SID**, **GPS Direct**, or **Direct** is selected. Enter the SID name or the direct waypoint here.

## Initial Climb

The initial altitude to assign after departure. Common values are `2000`, `3000`, `4000`, and `5000`. The value appears as `{INITIAL_ALT}` in the clearance.
