import React, { useState, useEffect } from 'react';
import Combobox from './Combobox';
import { loadUserSettings } from '../services/api';
import { generateAirports } from '../data/airports';

const AtcSettings = ({ atis, controllers, onGenerateClearance, loading, onAirportChange, canGenerate = true, selectedFlightPlan }) => {
    const normalizeCode = (value) => (value || '').toString().trim().toUpperCase();
    const canonicalStationCode = (value) => normalizeCode(value).replace(/_CTR$/, '');

    const savedSettings = loadUserSettings() || {};

    const [station, setStation] = useState('');
    const [departureAirport, setDepartureAirport] = useState('');
    const [runway, setRunway] = useState(() => savedSettings.defaultRunway || '');
    const [atisLetter, setAtisLetter] = useState(() => savedSettings.defaultAtisLetter || '');
    const [qnh, setQnh] = useState(() => String(savedSettings.defaultQnh || ''));

    const [routing, setRouting] = useState(() => savedSettings.defaultRouting || 'As Filed');
    const [routingDetails, setRoutingDetails] = useState(() => savedSettings.defaultRoutingDetails || '');
    const [initialClimb, setInitialClimb] = useState(() => savedSettings.defaultInitialClimb || '');

    const [autoFilled, setAutoFilled] = useState({ runway: false, atis: false, qnh: false });

    const [availableStations, setAvailableStations] = useState([]);
    const [availableAirports, setAvailableAirports] = useState([]);

    useEffect(() => {
        const FREQ_LIST = {
            'IRCC_CTR': '124.850', 'IRFD_TWR': '118.100', 'IRFD_GND': '120.400', 'IMLR_TWR': '133.850',
            'IGAR_TWR': '125.600', 'IBLT_TWR': '120.250', 'ITRC_TWR': '119.150', 'ICCC_CTR': '126.300',
            'ILAR_TWR': '121.200', 'ILAR_GND': '119.400', 'IPAP_TWR': '119.900', 'IIAB_TWR': '127.250',
            'IHEN_TWR': '130.250', 'IBAR_TWR': '118.750', 'IZCC_CTR': '125.650', 'IZOL_TWR': '118.700',
            'IZOL_GND': '121.900', 'IJAF_TWR': '119.100', 'ISCM_TWR': '121.300', 'IOCC_CTR': '132.300',
            'ITKO_TWR': '118.800', 'ITKO_GND': '118.225', 'IDCS_TWR': '118.250', 'IBRD_TWR': '118.300',
            'IPCC_CTR': '135.250', 'IPPH_TWR': '127.400', 'IPPH_GND': '121.700', 'ILKL_TWR': '120.150',
            'IBCC_CTR': '128.600', 'IBTH_TWR': '118.700', 'ISKP_TWR': '123.250', 'IGCC_CTR': '126.750',
            'IGRV_TWR': '118.300', 'ISCC_CTR': '127.825', 'ISAU_TWR': '118.200'
        };

        const dataList = controllers?.data || (Array.isArray(controllers) ? controllers : []);

        const airportsDb = generateAirports();
        const stationCatalog = airportsDb.flatMap((airport) => {
            const airportCode = normalizeCode(airport.code);
            return (airport.stations || []).map((stationCode) => ({
                airportCode,
                stationCode: normalizeCode(stationCode),
                stationKey: canonicalStationCode(stationCode),
                friendlyName: airport.friendlyName,
            }));
        });

        const onlineStations = [];
        const seenStations = new Set();

        dataList.forEach((controller) => {
            if (controller.claimable !== false) {
                return;
            }

            let rawCallsign = controller.callsign;
            if (!rawCallsign && controller.airport && controller.position) {
                rawCallsign = `${controller.airport}_${controller.position}`;
            }

            const normalizedCallsign = normalizeCode(rawCallsign);
            if (!normalizedCallsign) {
                return;
            }

            const matchedStation = stationCatalog.find((station) => station.stationCode === normalizedCallsign || station.stationKey === canonicalStationCode(normalizedCallsign));
            if (!matchedStation) {
                return;
            }

            if (seenStations.has(matchedStation.stationCode)) {
                return;
            }

            seenStations.add(matchedStation.stationCode);
            onlineStations.push({
                label: canonicalStationCode(matchedStation.stationCode),
                value: matchedStation.stationCode,
                airport: matchedStation.airportCode,
                frequency: FREQ_LIST[matchedStation.stationCode] || controller.frequency || controller.freq || '---',
            });
        });

        onlineStations.sort((a, b) => a.label.localeCompare(b.label));
        setAvailableStations(onlineStations);
    }, [controllers]);

    useEffect(() => {
        const airportsDb = generateAirports();
        const onlineCodes = new Set(availableStations.map(s => normalizeCode(s.airport)).filter(Boolean));

        const visible = airportsDb
            .filter(a => onlineCodes.has(normalizeCode(a.code)))
            .sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));

        setAvailableAirports(visible);
    }, [availableStations]);

    const isValidICAO = (airport) => {
        return /^[A-Z]{4}$/.test(normalizeCode(airport));
    };

    const getStationCount = (airport) => {
        const code = normalizeCode(airport);
        return availableStations.filter(s => normalizeCode(s.airport) === code).length;
    };

    const getStationRank = (callsign) => {
        const position = normalizeCode(callsign).split('_')[1] || '';
        const rankMap = { 'GND': 0, 'TWR': 1, 'APP': 2, 'DEP': 2, 'CTR': 3 };
        return rankMap[position] ?? 99;
    };

    const handleAirportChange = (airport) => {
        if (airport && !isValidICAO(airport)) {
            return;
        }
        setDepartureAirport(airport);
        onAirportChange?.(airport || '');
        setStation('');
        setAutoFilled({ runway: false, atis: false, qnh: false });
        setQnh('');
        
        if (!airport) return;

        const airportStations = availableStations.filter(s => normalizeCode(s.airport) === normalizeCode(airport));
        
        if (airportStations.length > 0) {
            const sortedByRank = airportStations.sort((a, b) => 
                getStationRank(a.value) - getStationRank(b.value)
            );
            const lowestRankStation = sortedByRank[0].value;
            setStation(lowestRankStation);
            updateAtisAndRunwayForAirport(normalizeCode(airport));
        }
    };

    const handleStationChange = (newStation) => {
        setStation(newStation);
        const selectedController = availableStations.find(s => s.value === newStation);
        if (selectedController) {
            const airport = normalizeCode(selectedController.airport);
            setDepartureAirport(airport);
            onAirportChange?.(airport);
            updateAtisAndRunwayForAirport(airport);
        }
    };

    const handleRoutingChange = (newVal) => {
        setRouting(newVal);
        if (newVal === 'As Filed') {
            setRoutingDetails('');
        }
    };

    const updateAtisAndRunwayForAirport = (airport) => {
        const atisData = atis?.data || (Array.isArray(atis) ? atis : []);
        const airportCode = normalizeCode(airport);
        const selectedAtis = atisData.find(a =>
            normalizeCode(a.airport) === airportCode ||
            normalizeCode(a.callsign).startsWith(airportCode) ||
            normalizeCode(a.station).startsWith(airportCode)
        );

        if (selectedAtis) {
            let letter = selectedAtis.letter || selectedAtis.atis_code;
            const content = selectedAtis.content || selectedAtis.text_atis || '';

            if (!letter && content) {
                const match = content.match(/INFO\s+([A-Z])/i);
                if (match) letter = match[1].toUpperCase();
            }

            if (letter) {
                setAtisLetter(letter);
                setAutoFilled(prev => ({ ...prev, atis: true }));
            }

            const runwayMatch = content.match(/DEP RWY\s*(\w+)/i) || content.match(/RWY\s*(\d{2}[LCR]?)/i);
            if (runwayMatch) {
                setRunway(runwayMatch[1]);
                setAutoFilled(prev => ({ ...prev, runway: true }));
            }

            const qnhMatch = content.match(/\bQ(\d{4})\b/) || content.match(/\bA(\d{4})\b/);
            const nextQnh = qnhMatch ? qnhMatch[1] : String(selectedAtis.qnh || '');
            setQnh(nextQnh);
            if (qnhMatch) {
                setAutoFilled(prev => ({ ...prev, qnh: true }));
            }
        } else {
            setQnh('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canGenerate) {
            return;
        }
        onGenerateClearance({ station, runway, routing, routingDetails, initialClimb, atisLetter, qnh });
    };

    const routingOptions = [
        { label: 'Use original filed route', value: 'As Filed' },
        { label: 'SID', value: 'SID' },
        { label: 'Radar Vectors', value: 'VECTORS' },
        { label: 'GPS Direct', value: 'GPS Direct' }
    ];

    const atisOptions = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(l => ({ label: `Info ${l}`, value: l }));

    if (loading) {
        return (
            <div className="bg-surface-dark border border-border-dark rounded-lg p-6 shadow-lg space-y-6">
                <div className="skeleton h-6 w-44 rounded"></div>

                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="space-y-2">
                            <div className="skeleton h-3 w-28 rounded"></div>
                            <div className="skeleton h-10 w-full rounded"></div>
                        </div>
                    ))}
                </div>

                <div className="space-y-2">
                    <div className="skeleton h-3 w-24 rounded"></div>
                    <div className="skeleton h-16 w-full rounded"></div>
                </div>

                <div className="skeleton h-12 w-full rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-surface-dark border border-border-dark rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">ATC Settings</h2>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Island</label>
                        <div className="relative">
                            <Combobox
                                label="Island"
                                options={availableAirports.map((a) => {
                                    const baseName = a.friendlyName || a.code;
                                    let displayName = a.island || baseName.split(/\s+/)[0];
                                    if (a.code === 'IRFD' || /Greater\s+Rockford/i.test(baseName)) {
                                        displayName = baseName;
                                    }
                                    return {
                                        label: displayName,
                                        value: a.code,
                                        subtext: `${getStationCount(a.code)} online`,
                                    };
                                })}
                                value={departureAirport}
                                onChange={handleAirportChange}
                                placeholder="Select Island First"
                            />
                        </div>
                    </div>

                    {departureAirport && (
                        <Combobox
                            label="ATC Station"
                            options={availableStations
                                .filter(s => (s.airport || '').toUpperCase() === (departureAirport || '').toUpperCase())
                                .sort((a, b) => getStationRank(a.value) - getStationRank(b.value))
                                .map(s => ({ ...s, subtext: s.frequency }))}
                            value={station}
                            onChange={handleStationChange}
                            placeholder="Select Station"
                        />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                Runway
                                {autoFilled.runway && (
                                    <span className="bg-emerald-500/10 text-emerald-500 text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">ATIS</span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={runway}
                                onChange={(e) => {
                                    setRunway(e.target.value);
                                    setAutoFilled(prev => ({ ...prev, runway: false }));
                                }}
                                placeholder="27L"
                                className={`w-full bg-black/50 border text-white text-sm rounded px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-zinc-700 transition-all ${autoFilled.runway ? 'border-emerald-500/30 ring-1 ring-emerald-500/20' : 'border-zinc-800'}`}
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">ATIS</label>
                                {autoFilled.atis && (
                                    <span className="bg-emerald-500/10 text-emerald-500 text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">ATIS</span>
                                )}
                            </div>
                            <Combobox
                                options={atisOptions}
                                value={atisLetter}
                                onChange={(val) => {
                                    setAtisLetter(val);
                                    setAutoFilled(prev => ({ ...prev, atis: false }));
                                }}
                                placeholder="Select ATIS"
                            />
                            {qnh && (
                                <p className="text-[11px] text-zinc-500 font-mono mt-1">
                                    QNH: {qnh}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Combobox
                            label="Routing Type"
                            options={routingOptions}
                            value={routing}
                            onChange={handleRoutingChange}
                            placeholder="Select Routing"
                        />
                        {selectedFlightPlan?.route && (
                            <p className="text-[11px] text-zinc-500 font-mono">
                                Filed: {selectedFlightPlan.route}
                            </p>
                        )}

                        {(routing === 'SID' || routing === 'GPS Direct') && (
                            <input
                                type="text"
                                value={routingDetails}
                                onChange={(e) => setRoutingDetails(e.target.value)}
                                placeholder={
                                    routing === 'SID' ? 'Enter SID name, for example CAMEL 2' :
                                        'Enter waypoint, for example QUEEN'
                                }
                                className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-zinc-700 mt-2"
                                required
                            />
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Initial Climb</label>
                        <div className="relative">
                            <input
                                list="climb-levels"
                                type="text"
                                value={initialClimb}
                                onChange={(e) => {
                                    setInitialClimb(e.target.value);
                                    localStorage.setItem('atc_initial_climb', e.target.value);
                                }}
                                placeholder="Enter initial climb"
                                className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-zinc-700"
                            />
                            <datalist id="climb-levels">
                                <option value="3000">3000 FT</option>
                                <option value="4000">4000 FT</option>
                                <option value="5000">5000 FT</option>
                                <option value="6000">6000 FT</option>
                            </datalist>
                        </div>
                    </div>
                </div>
                <div className="pt-6">
                    <button type="submit" disabled={!canGenerate} className="w-full bg-primary hover:brightness-110 text-black font-bold uppercase tracking-widest py-3.5 px-4 rounded transition-all duration-150 ease-out shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed">
                        <span className="material-symbols-outlined text-xl">check_circle</span>
                        Generate
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AtcSettings;
