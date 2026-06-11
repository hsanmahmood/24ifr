# Common Mistakes

## Routing mismatch

**Problem:** You selected Radar Vectors but the pilot filed a GPS direct route, or selected As Filed but the pilot's route is blank.

**Fix:** Check the **Filed:** hint directly below the Routing Type selector before generating. It shows the pilot's actual filed route so you can choose the appropriate routing type.

## Wrong airport selected

**Problem:** The ATIS letter, QNH, and runway auto-filled with values for the wrong airport.

**Fix:** Verify the departure airport selected in ATC Settings matches the airport you are controlling. The auto-fill is driven entirely by the selected airport.

## ATIS not auto-filling

**Problem:** The ATIS letter, runway, or QNH fields remain empty after selecting an airport.

**Fix:** ATIS data is live and updates every 45 seconds. If the airport controller just came online, press the refresh button to fetch the latest data manually. If ATIS is still missing, the controller for that airport may not have filed an ATIS yet.

## CTR station missing

**Problem:** You are working a CTR position but your callsign does not appear in the station field.

**Fix:** Switch to **Center mode** using the TWR / CTR toggle. In Center mode, the CTR callsign for your airspace is resolved automatically as the ATC station when no airport controller is online.

## Squawk conflict

**Problem:** Two pilots have been assigned the same squawk code.

**Fix:** Squawk codes are generated randomly from the valid range and exclude emergency codes 7500, 7600, and 7700. If a conflict occurs, press Generate again to produce a new clearance with a different squawk, then advise the pilot of the updated code.

## Airport not appearing in the list

**Problem:** Your airport does not appear in the departure airport selector.

**Fix:** The list only shows airports with at least one active online controller. If no controller is logged in for that airport, it will not appear. If you believe the airport data itself is missing or incorrect, contact the development team via the Feedback button.
