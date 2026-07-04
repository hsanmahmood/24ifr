export const generateAirports = () => [
    { code: 'IGAR', friendlyName: 'Airbase Garry', hasGround: false, defaultTowerFrequency: '118.800', defaultGroundFrequency: '', stations: ['IGAR_TWR'], ctr: null },
    { code: 'IJAF', friendlyName: 'Al Najaf', hasGround: false, defaultTowerFrequency: '119.100', defaultGroundFrequency: '', stations: ['IJAF_TWR'], ctr: null },
    { code: 'IBAR', friendlyName: 'Barra Airport', hasGround: false, defaultTowerFrequency: '118.080', defaultGroundFrequency: '', stations: ['IBAR_TWR'], ctr: null },
    { code: 'IBLT', friendlyName: 'Boltic Airfield', hasGround: false, defaultTowerFrequency: '118.430', defaultGroundFrequency: '', stations: ['IBLT_TWR'], ctr: null },
    { code: 'IRFD', friendlyName: 'Greater Rockford', hasGround: true, defaultTowerFrequency: '118.100', defaultGroundFrequency: '120.400', stations: ['IRCC_CTR', 'IRFD_TWR', 'IRFD_GND', 'IRFD_DEP', 'IRFD_APP'], ctr: null },
    { code: 'IGRV', friendlyName: 'Grindavik Airport', hasGround: false, defaultTowerFrequency: '118.300', defaultGroundFrequency: '', stations: ['IGRV_TWR'], ctr: null },
    { code: 'IHEN', friendlyName: 'Henstridge Airfield', hasGround: false, defaultTowerFrequency: '118.200', defaultGroundFrequency: '', stations: ['IHEN_TWR'], ctr: null },
    { code: 'IZOL', friendlyName: 'Izolirani Intl.', hasGround: true, defaultTowerFrequency: '118.700', defaultGroundFrequency: '121.900', stations: ['IZOL_TWR', 'IZOL_GND', 'IZCC_CTR'], ctr: null },
    { code: 'ILAR', friendlyName: 'Larnaca Intl.', island: 'Cyprus', hasGround: true, defaultTowerFrequency: '121.200', defaultGroundFrequency: '119.400', stations: ['ILAR_TWR', 'ILAR_GND', 'ILAR_APP'], ctr: null },
    { code: 'ILKL', friendlyName: 'Lukla Airport', hasGround: false, defaultTowerFrequency: '120.150', defaultGroundFrequency: '', stations: ['ILKL_TWR'], ctr: null },
    { code: 'IIAB', friendlyName: 'McConnell AFB', hasGround: false, defaultTowerFrequency: '127.250', defaultGroundFrequency: '', stations: ['IIAB_TWR'], ctr: null },
    { code: 'IMLR', friendlyName: 'Mellor', hasGround: false, defaultTowerFrequency: '133.850', defaultGroundFrequency: '', stations: ['IMLR_TWR'], ctr: null },
    { code: 'IPAP', friendlyName: 'Paphos', hasGround: false, defaultTowerFrequency: '119.900', defaultGroundFrequency: '', stations: ['IPAP_TWR'], ctr: null },
    { code: 'IPPH', friendlyName: 'Perth', hasGround: true, defaultTowerFrequency: '127.400', defaultGroundFrequency: '121.700', stations: ['IPPH_TWR', 'IPPH_GND', 'IPCC_CTR'], ctr: null },
    { code: 'ISCM', friendlyName: 'RAF Scampton', hasGround: false, defaultTowerFrequency: '118.220', defaultGroundFrequency: '', stations: ['ISCM_TWR', 'ISCC_CTR'], ctr: null },
    { code: 'IDCS', friendlyName: 'Saba Airport', hasGround: false, defaultTowerFrequency: '122.500', defaultGroundFrequency: '', stations: ['IDCS_TWR'], ctr: null },
    { code: 'IBTH', friendlyName: 'Saint Barthelemy', hasGround: false, defaultTowerFrequency: '128.600', defaultGroundFrequency: '', stations: ['IBTH_TWR', 'IBCC_CTR'], ctr: null },
    { code: 'ISAU', friendlyName: 'Sauthemptona Airport', hasGround: false, defaultTowerFrequency: '127.820', defaultGroundFrequency: '', stations: ['ISAU_TWR', 'ISCC_CTR'], ctr: null },
    { code: 'ISKP', friendlyName: 'Skopelos Airfield', hasGround: false, defaultTowerFrequency: '118.400', defaultGroundFrequency: '', stations: ['ISKP_TWR'], ctr: null },
    { code: 'ITKO', friendlyName: 'Tokyo', island: 'Orenji', hasGround: true, defaultTowerFrequency: '118.800', defaultGroundFrequency: '118.225', stations: ['ITKO_TWR', 'ITKO_GND', 'IOCC_CTR'], ctr: null },
    { code: 'ITRC', friendlyName: 'Training Centre', hasGround: false, defaultTowerFrequency: '118.500', defaultGroundFrequency: '', stations: ['ITRC_TWR'], ctr: null },
    { code: 'TVO', friendlyName: 'Tavaro Seabase', hasGround: false, defaultTowerFrequency: '121.800', defaultGroundFrequency: '', stations: ['TVO_TWR'], ctr: null },
    { code: 'SHV', friendlyName: 'Sea Haven Seabase', hasGround: false, defaultTowerFrequency: '118.625', defaultGroundFrequency: '', stations: ['SHV_TWR'], ctr: null },
    { code: 'OWO', friendlyName: 'Waterloo Seabase', hasGround: false, defaultTowerFrequency: '118.600', defaultGroundFrequency: '', stations: ['OWO_TWR'], ctr: null },
    { code: 'IKFL', icao: 'IKFL', friendlyName: 'Keflavik International', island: 'Grindavik', elevation_ft: 37, coordinates: { lat: 41.7417, lng: -0.2183 }, runways: ['16', '34', '17', '35'], pressure_format: 'QNH', hasGround: false, defaultTowerFrequency: '', defaultGroundFrequency: '', stations: ['IKFL_TWR', 'IGCC_CTR'], ctr: 'IGCC' }
];

export const findAirport = (code) => {
    const list = generateAirports();
    return list.find(a => (a.code || '').toUpperCase() === (code || '').toUpperCase()) || list[0];
};

export const getAirportByName = (name) => {
    const list = generateAirports();
    return list.find(a => a.friendlyName === name);
};

export const getDefaultAirport = () => findAirport('IGAR');
