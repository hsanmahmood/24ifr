// Local replication of backend clearance generation logic (main branch)
function _normalizeRoute(route) {
    const normalized = String(route || '').trim();
    if (!normalized || ['N/A', 'NA', 'NONE'].includes(normalized.toUpperCase())) return 'as filed';
    return normalized;
}

function _formatFlightLevel(flightLevel) {
    const normalized = String(flightLevel || '').trim();
    if (!normalized) return 'XXX';
    if (/^\d+$/.test(normalized) && normalized.length === 3) return normalized;
    if (/^\d+$/.test(normalized) && parseInt(normalized, 10) > 999) return String(Math.floor(parseInt(normalized, 10) / 100)).padStart(3, '0');
    return normalized;
}

function _buildClearanceText(template, replacements) {
    let output = template || '';
    Object.keys(replacements).forEach((token) => {
        const value = replacements[token] || '';
        output = output.split(`{${token}}`).join(value);
    });
    return (output || '').trim();
}

function parseArrivalRunway(content) {
    if (!content) return null;
    const lines = String(content).split(/\r?\n/);
    for (const line of lines) {
        if (line.toUpperCase().indexOf('ARR RWY') === -1) continue;
        const tail = line.toUpperCase().split('ARR RWY', 2)[1].trim();
        if (!tail) return null;
        const candidate = tail.split(/\s+/)[0].replace(/[.,;:]/g, '');
        if (candidate) return candidate;
    }
    return null;
}

function generateSquawk() {
    const excluded = new Set(['7500', '7600', '7700']);
    const digits = '01234567';
    while (true) {
        let s = '';
        for (let i = 0; i < 4; i++) s += digits[Math.floor(Math.random() * digits.length)];
        if (!excluded.has(s)) return s;
    }
}

function resolveControllerForAirport(airport, controllers) {
    const target = (airport || '').toString().trim().toUpperCase();
    if (!target) return null;
    const list = controllers?.data || (Array.isArray(controllers) ? controllers : []);
    if (!Array.isArray(list)) return null;
    for (const c of list) {
        const controllerAirport = String(c.airport || '').trim().toUpperCase();
        const claimable = c.claimable === undefined ? true : c.claimable;
        if (controllerAirport === target && claimable === false) {
            const position = String(c.position || 'TWR').trim().toUpperCase() || 'TWR';
            return { atc_station: `${target}_${position}`, airport: target, position, controller: c };
        }
    }
    return { atc_station: `${target}_TWR`, airport: target, position: 'TWR', controller: null };
}

function resolveAtisForAirport(airport, atis) {
    const target = (airport || '').toString().trim().toUpperCase();
    if (!target) return { atis: 'A', runway: 'active', entry: null };
    const list = atis?.data || (Array.isArray(atis) ? atis : []);
    if (!Array.isArray(list)) return { atis: 'A', runway: 'active', entry: null };
    for (const entry of list) {
        const entryAirport = String(entry.airport || '').trim().toUpperCase();
        if (entryAirport !== target) continue;
        const letter = String(entry.letter || entry.atis_code || '').trim().toUpperCase() || 'A';
        const content = entry.content || entry.text_atis || '';
        const runway = parseArrivalRunway(content) || 'active';
        return { atis: letter, runway, entry };
    }
    return { atis: 'A', runway: 'active', entry: null };
}

const DEFAULT_CLEARANCE_TEMPLATE = '{CALLSIGN}, {ATC_STATION}, good day. Startup approved. Information {ATIS} correct. Cleared {DESTINATION} via {ROUTE}, runway {RUNWAY}. Initial climb FT{INITIAL_ALT}. Squawk {SQUAWK}.';

export function generateClearanceLocal(payload = {}, { flightPlans = [], controllers = [], atis = [] } = {}) {
    const callsign = String(payload.callsign || '').trim();
    const template = String(payload.template || DEFAULT_CLEARANCE_TEMPLATE);
    const event = Boolean(payload.event || false);

    if (!callsign) throw new Error('callsign is required');

    const normalizedCall = callsign.trim().toLowerCase();
    const plans = Array.isArray(flightPlans) ? flightPlans : (flightPlans.data || []);
    const plan = plans.find(p => (String(p.callsign || '').trim().toLowerCase() === normalizedCall) || (String(p.realcallsign || '').trim().toLowerCase() === normalizedCall));
    if (!plan) throw new Error('Flight plan not found');

    const departure = String(plan.departing || '').trim().toUpperCase();
    const destination = String(plan.arriving || '').trim().toUpperCase();
    const plan_callsign = String(plan.realcallsign || plan.callsign || '').trim().toUpperCase();
    const route = _normalizeRoute(plan.route);
    const flight_level = _formatFlightLevel(plan.flightlevel);
    const aircraft = String(plan.aircraft || '').trim();
    const flight_rules = String(plan.flightrules || '').trim().toUpperCase();

    const controller_info = resolveControllerForAirport(departure, controllers);
    const atc_station = controller_info ? controller_info.atc_station : `${departure}_TWR`;

    const atis_info = resolveAtisForAirport(departure, atis);
    const atis_letter = atis_info.atis || 'A';
    let runway = atis_info.runway || 'active';

    if (runway === 'active') {
        const parsed_runway = parseArrivalRunway(atis_info.entry?.content || '');
        runway = parsed_runway || 'active';
    }

    const squawk = generateSquawk();
    const clearance = _buildClearanceText(template, {
        CALLSIGN: plan_callsign,
        ATC_STATION: atc_station,
        ATIS: atis_letter,
        DESTINATION: destination,
        ROUTE: route,
        RUNWAY: runway,
        INITIAL_ALT: '3000',
        FLIGHT_LEVEL: flight_level,
        SQUAWK: squawk,
    });

    return {
        clearance,
        squawk,
        callsign: plan_callsign,
        destination,
        departure,
        aircraft,
        flight_rules,
        flight_level,
        atis: atis_letter,
        atc_station,
    };
}

export default { generateClearanceLocal };
export const DEFAULT_TEMPLATE = '{CALLSIGN}, {ATC_STATION}, good day. Startup approved. Information {ATIS} correct. Cleared {DESTINATION} via {ROUTE}, runway {RUNWAY}. Initial climb FT{INITIAL_ALT}. Squawk {SQUAWK}.';

export const PLACEHOLDERS = [
    '[CALLSIGN]', '[ATC_STATION]', '[ATIS]', '[DESTINATION]',
    '[ROUTE]', '[RUNWAY]', '[INITIAL_ALT]', '[FLIGHT_LEVEL]', '[SQUAWK]'
];

export const normalizeSettings = (s = {}) => ({
    clearanceTemplate: s.clearanceTemplate || DEFAULT_TEMPLATE,
    defaultAtcStation: s.defaultAtcStation || '',
    defaultRouting: s.defaultRouting || 'As Filed',
    defaultRoutingDetails: s.defaultRoutingDetails || '',
    uppercaseCallsign: s.uppercaseCallsign ?? true,
});

export const formatFlightLevel = (fl) => {
    const num = Number(fl);
    if (!Number.isFinite(num) || num <= 0) return 'XXX';
    const val = num > 999 ? Math.floor(num / 100) : num;
    return String(val).padStart(3, '0');
};

export const resolveRouting = ({ flightPlan, routing, details, settings }) => {
    const s = normalizeSettings(settings);
    const mode = routing || s.defaultRouting;
    if (mode === 'As Filed') return flightPlan?.route || '';
    if (mode === 'SID') return d ? `the ${d} departure` : 'the departure procedure';
    if (mode === 'DIRECT') return d ? `direct ${d}` : (flightPlan?.route || 'direct');
    if (mode === 'VECTORS') return 'Radar Vectors';
    return d || flightPlan?.route || 'as filed';
};

export const buildClearanceText = ({ flightPlan, formSettings = {}, advancedSettings = {} }) => {
    const settings = normalizeSettings(advancedSettings);
    const routePhrase = resolveRouting({
        flightPlan,
        routing: formSettings.routing,
        details: formSettings.routingDetails,
        settings,
    });

    const template = settings.clearanceTemplate || DEFAULT_TEMPLATE;
    const callsign = flightPlan?.callsign ? (settings.uppercaseCallsign ? flightPlan.callsign.toUpperCase() : flightPlan.callsign) : '';
    const station = formSettings.station || settings.defaultAtcStation || '';
    const runway = formSettings.runway || '';
    const atisLetter = formSettings.atisLetter || '';
    const initialClimb = formSettings.initialClimb || '';
    const flightLevel = formatFlightLevel(flightPlan?.flightlevel);

    return applyTemplate(template, {
        CALLSIGN: callsign,
        ATC_STATION: station,
        ATIS: atisLetter,
        DESTINATION: flightPlan?.arriving || '',
        ROUTE: routePhrase,
        RUNWAY: runway,
        INITIAL_ALT: initialClimb,
        FLIGHT_LEVEL: flightLevel,
        SQUAWK: generateSquawk(),
    }).trim();
};

export const applyTemplate = (template, replacements) => {
    return Object.entries(replacements).reduce((out, [token, value]) => {
        const replacement = value ?? '';
        return out
            .replace(new RegExp(`\\[${token}\\]`, 'g'), replacement)
            .replace(new RegExp(`\\{${token}\\}`, 'g'), replacement);
    }, template);
};