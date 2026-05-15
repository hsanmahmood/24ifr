import random

def generate_squawk():
    excluded = {'7500', '7600', '7700'}
    digits = '01234567'
    while True:
        squawk = ''.join(random.choice(digits) for _ in range(4))
        if squawk not in excluded:
            return squawk

def format_flight_level(flight_level):
    normalized = str(flight_level or '').strip()
    if not normalized:
        return 'XXX'
    if normalized.isdigit() and len(normalized) == 3:
        return normalized
    if normalized.isdigit() and int(normalized) > 999:
        return str(int(normalized) // 100).zfill(3)
    return normalized

def normalize_route(route):
    normalized = str(route or '').strip()
    if not normalized or normalized.upper() in {'N/A', 'NA', 'NONE'}:
        return 'as filed'
    return normalized
