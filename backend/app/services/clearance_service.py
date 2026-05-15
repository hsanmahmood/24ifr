from ..utils.formatters import generate_squawk

DEFAULT_TEMPLATE = '[CALLSIGN], cleared to [DESTINATION] via [ROUTE]. Runway [RUNWAY]. Climb and maintain [INITIAL_ALT]FT, expect Flight Level [FLIGHT_LEVEL]. Squawk [SQUAWK]. Information [ATIS] received.'

def build_clearance_text(template, replacements):
    output = template
    for token, value in replacements.items():
        output = output.replace(f'[{token}]', str(value or ''))
        output = output.replace(f'{{{token}}}', str(value or ''))
    return output.strip()

def generate_clearance_data(flight_plan, template, station_info, atis_info):
    plan_callsign = str(flight_plan.get('realcallsign') or flight_plan.get('callsign') or '').strip().upper()
    destination = str(flight_plan.get('arriving', '')).strip().upper()
    
    replacements = {
        'CALLSIGN': plan_callsign,
        'ATC_STATION': station_info['atc_station'],
        'ATIS': atis_info['atis'],
        'DESTINATION': destination,
        'ROUTE': flight_plan.get('normalized_route', 'as filed'),
        'RUNWAY': atis_info['runway'],
        'INITIAL_ALT': '3000',
        'FLIGHT_LEVEL': flight_plan.get('formatted_flight_level', 'XXX'),
        'SQUAWK': generate_squawk(),
    }
    
    return {
        'text': build_clearance_text(template or DEFAULT_TEMPLATE, replacements),
        'replacements': replacements
    }
