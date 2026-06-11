# Available Tokens

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

## Example template

```
{CALLSIGN}, {ATC_STATION}, cleared to {DESTINATION} via {ROUTE},
runway {RUNWAY}, initial climb {INITIAL_ALT}, squawk {SQUAWK},
information {ATIS}.
```

## Token not appearing in output

If a token appears unchanged in the generated clearance (e.g. `{RUNWAY}` is not replaced), the value for that token was empty at generation time. Check that ATIS data has loaded for your airport and that all required ATC settings fields are filled in.
