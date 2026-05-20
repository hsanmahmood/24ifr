import React, { useState, useEffect } from 'react';
import Combobox from './Combobox';
import { useSettings } from '../context/SettingsContext';
import { generateAirports } from '../data/airports';
import { FREQ_LIST } from '../data/frequencies';

const AtcSettings = ({ atis, controllers, onGenerateClearance, loading, generationLoading = false, onAirportChange, canGenerate = true }) => {
    const { settings } = useSettings();
    const defaultsEnabled = Boolean(settings.defaultSettingsEnabled);
    
    const normalizeCode = (v) => (v || '').toString().trim().toUpperCase();
    const canonicalStation = (v) => normalizeCode(v).replace(/_CTR$/, '');

    const [station, setStation] = useState(() => (defaultsEnabled ? settings.defaultAtcStation || '' : ''));
    const [departureAirport, setDepartureAirport] = useState('');
    const [runway, setRunway] = useState(() => settings.defaultRunway || '');
    const [atisLetter, setAtisLetter] = useState(() => settings.defaultAtisLetter || '');
    const [routing, setRouting] = useState(() => (defaultsEnabled ? settings.defaultRouting || 'As Filed' : 'As Filed'));
    const [sidDetails, setSidDetails] = useState(() => (defaultsEnabled ? settings.defaultSidRoutingDetails || settings.defaultRoutingDetails || '' : ''));
    const [directDetails, setDirectDetails] = useState(() => (defaultsEnabled ? settings.defaultDirectRoutingDetails || settings.defaultRoutingDetails || '' : ''));
    const [routingDetails, setRoutingDetails] = useState(() => {
        if (!defaultsEnabled) return '';
        if ((settings.defaultRouting || 'As Filed') === 'SID') return settings.defaultSidRoutingDetails || settings.defaultRoutingDetails || '';
        if ((settings.defaultRouting || 'As Filed') === 'DIRECT') return settings.defaultDirectRoutingDetails || settings.defaultRoutingDetails || '';
        return '';
    });
    const [initialClimb, setInitialClimb] = useState(() => settings.defaultInitialClimb || '2000');
    const [autoFilled, setAutoFilled] = useState({ runway: false, atis: false });
    const [availableStations, setAvailableStations] = useState([]);
    const [availableAirports, setAvailableAirports] = useState([]);

    useEffect(() => {
        if (!defaultsEnabled) {
            setStation('');
            setRouting('As Filed');
            setSidDetails('');
            setDirectDetails('');
            setRoutingDetails('');
            return;
        }

        setStation(settings.defaultAtcStation || '');
        setRouting(settings.defaultRouting || 'As Filed');
        setSidDetails(settings.defaultSidRoutingDetails || settings.defaultRoutingDetails || '');
        setDirectDetails(settings.defaultDirectRoutingDetails || settings.defaultRoutingDetails || '');
        setRoutingDetails(() => {
            if ((settings.defaultRouting || 'As Filed') === 'SID') return settings.defaultSidRoutingDetails || settings.defaultRoutingDetails || '';
            if ((settings.defaultRouting || 'As Filed') === 'DIRECT') return settings.defaultDirectRoutingDetails || settings.defaultRoutingDetails || '';
            return '';
        });
    }, [defaultsEnabled, settings.defaultAtcStation, settings.defaultRouting, settings.defaultSidRoutingDetails, settings.defaultDirectRoutingDetails, settings.defaultRoutingDetails]);

    useEffect(() => {
        const dataList = controllers?.data || (Array.isArray(controllers) ? controllers : []);
        const airportsDb = generateAirports();
        const stationCatalog = airportsDb.flatMap((airport) => {
            const airportCode = normalizeCode(airport.code);
            return (airport.stations || []).map((sCode) => ({
                airportCode,
                stationCode: normalizeCode(sCode),
                stationKey: canonicalStation(sCode),
                friendlyName: airport.friendlyName,
            }));
        });

        const online = [];
        const seen = new Set();

        dataList.forEach((c) => {
            if (c.claimable !== false) return;
            const raw = c.callsign || (c.airport && c.position ? `${c.airport}_${c.position}` : '');
            const normalized = normalizeCode(raw);
            if (!normalized) return;

            const matched = stationCatalog.find(s => s.stationCode === normalized || s.stationKey === canonicalStation(normalized));
            if (!matched || seen.has(matched.stationCode)) return;

            seen.add(matched.stationCode);
            online.push({
                label: canonicalStation(matched.stationCode),
                value: matched.stationCode,
                airport: matched.airportCode,
                frequency: FREQ_LIST[matched.stationCode] || c.frequency || c.freq || '---',
            });
        });

        online.sort((a, b) => a.label.localeCompare(b.label));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAvailableStations(online);
    }, [controllers]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const airportsDb = generateAirports();
        const onlineCodes = new Set(availableStations.map(s => normalizeCode(s.airport)).filter(Boolean));
        const visible = airportsDb
            .filter(a => onlineCodes.has(normalizeCode(a.code)))
            .sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAvailableAirports(visible);
    }, [availableStations]);

    const getStationRank = (callsign) => {
        const pos = normalizeCode(callsign).split('_')[1] || '';
        const ranks = { 'GND': 0, 'TWR': 1, 'APP': 2, 'DEP': 2, 'CTR': 3 };
        return ranks[pos] ?? 99;
    };

    const handleAirportChange = (airport) => {
        if (airport && !/^[A-Z]{4}$/.test(normalizeCode(airport))) return;
        setDepartureAirport(airport);
        onAirportChange?.(airport || '');
        setStation('');
        setAutoFilled({ runway: false, atis: false });
        if (!airport) return;

        const airportStations = availableStations.filter(s => normalizeCode(s.airport) === normalizeCode(airport));
        if (airportStations.length > 0) {
            const sorted = airportStations.sort((a, b) => getStationRank(a.value) - getStationRank(b.value));
            setStation(sorted[0].value);
            updateAtisAndRunway(normalizeCode(airport));
        }
    };

    const handleStationChange = (newStation) => {
        setStation(newStation);
        const sel = availableStations.find(s => s.value === newStation);
        if (sel) {
            const airp = normalizeCode(sel.airport);
            setDepartureAirport(airp);
            onAirportChange?.(airp);
            updateAtisAndRunway(airp);
        }
    };

    const updateAtisAndRunway = (airport) => {
        const atisData = atis?.data || (Array.isArray(atis) ? atis : []);
        const code = normalizeCode(airport);
        const sel = atisData.find(a => normalizeCode(a.airport) === code || normalizeCode(a.callsign).startsWith(code) || normalizeCode(a.station).startsWith(code));

        if (sel) {
            let letter = sel.letter || sel.atis_code;
            const content = sel.content || sel.text_atis || '';
            if (!letter && content) {
                const match = content.match(/INFO\s+([A-Z])/i);
                if (match) letter = match[1].toUpperCase();
            }
            if (letter) {
                setAtisLetter(letter);
                setAutoFilled(p => ({ ...p, atis: true }));
            }
            const rwMatch = content.match(/DEP RWY\s*(\w+)/i) || content.match(/RWY\s*(\d{2}[LCR]?)/i);
            if (rwMatch) {
                setRunway(rwMatch[1]);
                setAutoFilled(p => ({ ...p, runway: true }));
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canGenerate || generationLoading) return;
        const details = routing === 'SID' ? sidDetails : routing === 'DIRECT' ? directDetails : routingDetails;
        onGenerateClearance({ station, runway, routing, routingDetails: details, initialClimb, atisLetter });
    };

    const handleRoutingChange = (nextRouting) => {
        setRouting(nextRouting);
        if (nextRouting === 'As Filed') return;
        if (nextRouting === 'SID') {
            const nextDetails = sidDetails || settings.defaultSidRoutingDetails || settings.defaultRoutingDetails || '';
            setRoutingDetails(nextDetails);
            return;
        }
        if (nextRouting === 'DIRECT') {
            const nextDetails = directDetails || settings.defaultDirectRoutingDetails || settings.defaultRoutingDetails || '';
            setRoutingDetails(nextDetails);
        }
    };

    const handleRoutingDetailsChange = (value) => {
        setRoutingDetails(value);
        if (routing === 'SID') setSidDetails(value);
        if (routing === 'DIRECT') setDirectDetails(value);
    };

    return (
        <div className="bg-surface-dark border border-border-dark rounded-lg p-6 shadow-lg">
            <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase mb-8">ATC Settings</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <Combobox
                        label="Departure Airport"
                        options={availableAirports.map(a => ({
                            label: (a.code === 'IRFD' ? a.friendlyName : a.friendlyName.split(/\s+/)[0]),
                            value: a.code,
                            subtext: `${availableStations.filter(s => normalizeCode(s.airport) === a.code).length} online`
                        }))}
                        value={departureAirport}
                        onChange={handleAirportChange}
                        placeholder="Select Airport"
                    />
                    {departureAirport && (
                        <Combobox
                            label="ATC Station"
                            options={availableStations.filter(s => normalizeCode(s.airport) === departureAirport).sort((a, b) => getStationRank(a.value) - getStationRank(b.value)).map(s => ({ ...s, subtext: s.frequency }))}
                            value={station}
                            onChange={handleStationChange}
                            placeholder="Select Station"
                        />
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                Runway {autoFilled.runway && <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20">ATIS</span>}
                            </label>
                            <input type="text" value={runway} onChange={e => { setRunway(e.target.value); setAutoFilled(p => ({ ...p, runway: false })); }} placeholder="27L" className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 focus:border-primary outline-none" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                ATIS {autoFilled.atis && <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20">ATIS</span>}
                            </label>
                            <Combobox options={Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(l => ({ label: `Info ${l}`, value: l }))} value={atisLetter} onChange={val => { setAtisLetter(val); setAutoFilled(p => ({ ...p, atis: false })); }} placeholder="Select" />
                        </div>
                    </div>
                    <Combobox label="Routing Type" options={[{ label: 'As Filed', value: 'As Filed' }, { label: 'SID', value: 'SID' }, { label: 'Radar Vectors', value: 'VECTORS' }, { label: 'Direct', value: 'DIRECT' }]} value={routing} onChange={handleRoutingChange} />
                    {(routing === 'SID' || routing === 'DIRECT') && <input type="text" value={routingDetails} onChange={e => handleRoutingDetailsChange(e.target.value)} placeholder={routing === 'SID' ? 'SID name' : 'Waypoint'} className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 focus:border-primary outline-none" required />}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Initial Climb</label>
                        <input list="climb-levels" type="text" value={initialClimb} onChange={e => setInitialClimb(e.target.value)} className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 focus:border-primary outline-none" />
                        <datalist id="climb-levels">
                            <option value="2000" /><option value="3000" /><option value="4000" /><option value="5000" /><option value="6000" />
                        </datalist>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!canGenerate || generationLoading}
                    className="w-full bg-primary hover:brightness-110 text-black font-bold uppercase tracking-widest py-3.5 rounded transition-all shadow-sm flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
                >
                    <span className="material-symbols-outlined text-xl">check_circle</span> Generate
                </button>
            </form>

        </div>
    );
};

export default AtcSettings;
