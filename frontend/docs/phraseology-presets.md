# Phraseology Presets

The **Config** page lets you choose and customise a clearance template for five different ATC authorities. Each authority has its own independently saved template slot.

## Available authorities

| Authority | Description |
|-----------|-------------|
| FAA | United States Federal Aviation Administration |
| ICAO-E | ICAO European format |
| CASA | Civil Aviation Safety Authority (Australia) |
| CAA | Civil Aviation Authority (United Kingdom) |
| Default | Generic VATSIM-style format |

## How presets work

- Clicking an authority in the left panel loads its template into the editor.
- Editing the textarea updates only that authority's draft — other authority slots are unaffected.
- Pressing **Save Template** writes the current draft to that authority's slot and sets it as your active phraseology.
- The active authority's template is used every time you generate a clearance on the main page.

## Resetting a preset

Click **Reset Preset** below the authority list to restore the currently selected authority's template to its factory default. This only affects the selected authority.

## Placeholder chips

The row of `{TOKEN}` chips above the editor can be clicked to insert a placeholder at the current cursor position in the textarea. Hover a chip to see a tooltip confirming this.
