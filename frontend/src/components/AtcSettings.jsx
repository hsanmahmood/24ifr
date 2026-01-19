import React, { useState, useEffect } from 'react';
import Combobox from './Combobox';

const AtcSettings = ({ atis, controllers, onGenerateClearance }) => {
    const [station, setStation] = useState('');
    const [departureAirport, setDepartureAirport] = useState('');
    const [runway, setRunway] = useState('');
    const [atisLetter, setAtisLetter] = useState('A');

    const [routing, setRouting] = useState(() => localStorage.getItem('atc_routing_type') || 'As Filed');
    const [routingDetails, setRoutingDetails] = useState('');
    const [initialClimb, setInitialClimb] = useState(() => localStorage.getItem('atc_initial_climb') || '5000');

    const [autoFilled, setAutoFilled] = useState({ runway: false, atis: false });

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
        if (dataList.length > 0) {
            const active = dataList
                .map(c => {
                    let callsign = c.callsign;
                    if (!callsign && c.airport && c.position) {
                        callsign = `${c.airport}_${c.position}`;
                    }
                    return { ...c, derivedCallsign: callsign };
                })
                .filter(c => c.derivedCallsign && c.claimable === false)
                .map(c => {
                    const freq = FREQ_LIST[c.derivedCallsign] || c.frequency || c.freq || '---';
                    const label = `${c.derivedCallsign} [${c.holder || 'Unknown'}]`;
                    return {
                        label: label,
                        value: c.derivedCallsign,
                        airport: c.airport || c.derivedCallsign.split('_')[0],
                        frequency: freq
                    };
                })
                .sort((a, b) => a.label.localeCompare(b.label));
            setAvailableStations(active);
        }
    }, [controllers]);

    useEffect(() => {
        const atisData = atis?.data || (Array.isArray(atis) ? atis : []);
        if (atisData.length > 0) {
            const airports = [...new Set(atisData.map(a => {
                if (a.airport) return a.airport;
                if (a.callsign) return a.callsign.split('_')[0];
                if (a.station) return a.station.split('_')[0];
                return null;
            }).filter(Boolean))].sort();
            setAvailableAirports(airports);
        }
    }, [atis]);

    const handleStationChange = (newStation) => {
        setStation(newStation);

        const selectedController = availableStations.find(s => s.value === newStation);
        if (selectedController) {
            const airport = selectedController.airport;
            setDepartureAirport(airport);
            updateAtisAndRunwayForAirport(airport);
        }
    };

    const handleAirportChange = (airport) => {
        setDepartureAirport(airport);
        updateAtisAndRunwayForAirport(airport);
    };

    const handleRoutingChange = (newVal) => {
        setRouting(newVal);
        localStorage.setItem('atc_routing_type', newVal);
    };

    const updateAtisAndRunwayForAirport = (airport) => {
        const atisData = atis?.data || (Array.isArray(atis) ? atis : []);
        const selectedAtis = atisData.find(a =>
            a.airport === airport ||
            (a.callsign && a.callsign.startsWith(airport)) ||
            (a.station && a.station.startsWith(airport))
        );

        if (selectedAtis) {
            let newAutoFilled = { ...autoFilled };

            let letter = selectedAtis.letter || selectedAtis.atis_code;
            const content = selectedAtis.content || selectedAtis.text_atis || '';

            if (!letter && content) {
                const match = content.match(/INFO\s+([A-Z])/i);
                if (match) letter = match[1].toUpperCase();
            }

            if (letter) {
                setAtisLetter(letter);
                newAutoFilled.atis = true;
            }

            const runwayMatch = content.match(/DEP RWY\s*(\w+)/i) || content.match(/RWY\s*(\d{2}[LCR]?)/i);
            if (runwayMatch) {
                setRunway(runwayMatch[1]);
                newAutoFilled.runway = true;
            }

            setAutoFilled(newAutoFilled);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let finalRouting;
        if (routing === 'As Filed') {
            finalRouting = 'As Filed';
        } else if (routing === 'SID') {
            finalRouting = `the ${routingDetails} departure`;
        } else if (routing === 'DIRECT') {
            finalRouting = `direct ${routingDetails}`;
        } else {
            finalRouting = routingDetails || 'radar vectors';
        }

        onGenerateClearance({ station, runway, routing: finalRouting, initialClimb, atisLetter });
    };

    const routingOptions = [
        { label: 'Use original filed route', value: 'As Filed' },
        { label: 'SID (Standard Instrument Departure)', value: 'SID' },
        { label: 'Radar Vectors (Controller guidance)', value: 'VECTORS' },
        { label: 'Direct (Navigation to specific waypoint)', value: 'DIRECT' }
    ];

    const atisOptions = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(l => ({ label: `Info ${l}`, value: l }));

    return (
        <div className="bg-surface-dark border border-border-dark rounded-lg p-6 shadow-lg sticky top-6">
            <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">ATC Settings</h2>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${controllers?.source === 'live' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{availableStations.length} Online • {controllers?.source || '...'}</span>
                </div>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    {/* ATC Station */}
                    <Combobox
                        label="ATC Station"
                        options={availableStations.map(s => ({ ...s, subtext: s.frequency }))}
                        value={station}
                        onChange={handleStationChange}
                        placeholder="Select Station"
                    />

                    {/* Departure Airport */}
                    <Combobox
                        label="Departure Airport"
                        options={availableAirports.map(a => ({ label: a, value: a }))}
                        value={departureAirport}
                        onChange={handleAirportChange}
                        placeholder="Select Airport"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        {/* Runway */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                Runway
                                {autoFilled.runway && (
                                    <span className="bg-emerald-500/10 text-emerald-500 text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold animate-fadeIn">ATIS</span>
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
                        {/* ATIS */}
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">ATIS</label>
                                {autoFilled.atis && (
                                    <span className="bg-emerald-500/10 text-emerald-500 text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold animate-fadeIn">ATIS</span>
                                )}
                            </div>
                            <Combobox
                                options={atisOptions}
                                value={atisLetter}
                                onChange={(val) => {
                                    setAtisLetter(val);
                                    setAutoFilled(prev => ({ ...prev, atis: false }));
                                }}
                                placeholder="Info A"
                            />
                        </div>
                    </div>

                    {/* Routing */}
                    <div className="space-y-1.5">
                        <Combobox
                            label="Routing Type"
                            options={routingOptions}
                            value={routing}
                            onChange={handleRoutingChange}
                            placeholder="Select Routing"
                        />

                        {routing !== 'As Filed' && (
                            <input
                                type="text"
                                value={routingDetails}
                                onChange={(e) => setRoutingDetails(e.target.value)}
                                placeholder={
                                    routing === 'SID' ? "Enter SID Name (e.g. MID5J)" :
                                        routing === 'VECTORS' ? "Enter Instructions (e.g. Fly Heading 270)" :
                                            "Enter Waypoint (e.g. BPK)"
                                }
                                className="w-full bg-black/50 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-zinc-700 animate-fadeIn mt-2"
                                required
                            />
                        )}
                    </div>

                    {/* Initial Climb */}
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
                                placeholder="5000"
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
                    <button type="submit" className="w-full bg-primary hover:brightness-110 text-black font-bold uppercase tracking-widest py-3.5 px-4 rounded transition-all duration-150 ease-out shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.99]">
                        <span className="material-symbols-outlined text-xl">check_circle</span>
                        Generate
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AtcSettings;
