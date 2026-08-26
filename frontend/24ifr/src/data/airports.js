export const generateAirports = () => [
    { code: 'IGAR', friendlyName: 'Airbase Garry', island: 'Rockford', hasGround: false, defaultTowerFrequency: '125.600', defaultGroundFrequency: '', stations: ['IGAR_TWR'], ctr: 'IRCC' },
    { code: 'IJAF', friendlyName: 'Al Najaf', island: 'Izolarni', hasGround: false, defaultTowerFrequency: '119.100', defaultGroundFrequency: '', stations: ['IJAF_TWR'], ctr: 'IZCC' },
    { code: 'IBAR', friendlyName: 'Barra Airport', island: 'Cyprus', hasGround: false, defaultTowerFrequency: '118.750', defaultGroundFrequency: '', stations: ['IBAR_TWR'], ctr: 'ICCC' },
    { code: 'IBLT', friendlyName: 'Boltic Airfield', island: 'Rockford', hasGround: false, defaultTowerFrequency: '120.250', defaultGroundFrequency: '', stations: ['IBLT_TWR'], ctr: 'IRCC' },
    { code: 'IRFD', friendlyName: 'Greater Rockford', island: 'Rockford', hasGround: true, defaultTowerFrequency: '118.100', defaultGroundFrequency: '120.400', stations: ['IRFD_TWR', 'IRFD_GND'], ctr: 'IRCC' },
    { code: 'IHEN', friendlyName: 'Henstridge Airfield', island: 'Cyprus', hasGround: false, defaultTowerFrequency: '130.250', defaultGroundFrequency: '', stations: ['IHEN_TWR'], ctr: 'ICCC' },
    { code: 'IZOL', friendlyName: 'Izolirani Intl.', island: 'Izolarni', hasGround: true, defaultTowerFrequency: '118.700', defaultGroundFrequency: '121.900', stations: ['IZOL_TWR', 'IZOL_GND'], ctr: 'IZCC' },
    { code: 'ILAR', friendlyName: 'Larnaca Intl.', island: 'Cyprus', hasGround: true, defaultTowerFrequency: '121.200', defaultGroundFrequency: '119.400', stations: ['ILAR_TWR', 'ILAR_GND'], ctr: 'ICCC' },
    { code: 'ILKL', friendlyName: 'Lukla Airport', island: 'Perth', hasGround: false, defaultTowerFrequency: '120.150', defaultGroundFrequency: '', stations: ['ILKL_TWR'], ctr: 'IPCC' },
    { code: 'IIAB', friendlyName: 'McConnell AFB', island: 'Cyprus', hasGround: false, defaultTowerFrequency: '127.250', defaultGroundFrequency: '', stations: ['IIAB_TWR'], ctr: 'ICCC' },
    { code: 'IMLR', friendlyName: 'Mellor', island: 'Rockford', hasGround: false, defaultTowerFrequency: '133.850', defaultGroundFrequency: '', stations: ['IMLR_TWR'], ctr: 'IRCC' },
    { code: 'IPAP', friendlyName: 'Paphos', island: 'Cyprus', hasGround: false, defaultTowerFrequency: '119.900', defaultGroundFrequency: '', stations: ['IPAP_TWR'], ctr: 'ICCC' },
    { code: 'IPPH', friendlyName: 'Perth', island: 'Perth', hasGround: true, defaultTowerFrequency: '127.400', defaultGroundFrequency: '121.700', stations: ['IPPH_TWR', 'IPPH_GND'], ctr: 'IPCC' },
    { code: 'ISCM', friendlyName: 'RAF Scampton', island: 'Izolarni', hasGround: false, defaultTowerFrequency: '121.300', defaultGroundFrequency: '', stations: ['ISCM_TWR'], ctr: 'IZCC' },
    { code: 'IDCS', friendlyName: 'Saba Airport', island: 'Orenji', hasGround: false, defaultTowerFrequency: '118.250', defaultGroundFrequency: '', stations: ['IDCS_TWR'], ctr: 'IOCC' },
    { code: 'IBTH', friendlyName: 'Saint Barthelemy', island: 'Saint Barthelemy', hasGround: false, defaultTowerFrequency: '118.700', defaultGroundFrequency: '', stations: ['IBTH_TWR'], ctr: 'IBCC' },
    { code: 'ISAU', friendlyName: 'Sauthemptona Airport', island: 'Sauthemptona', hasGround: false, defaultTowerFrequency: '118.200', defaultGroundFrequency: '', stations: ['ISAU_TWR'], ctr: 'ISCC' },
    { code: 'ISKP', friendlyName: 'Skopelos Airfield', island: 'Saint Barthelemy', hasGround: false, defaultTowerFrequency: '123.250', defaultGroundFrequency: '', stations: ['ISKP_TWR'], ctr: 'IBCC' },
    { code: 'ITKO', friendlyName: 'Tokyo', island: 'Orenji', hasGround: true, defaultTowerFrequency: '118.800', defaultGroundFrequency: '118.225', stations: ['ITKO_TWR', 'ITKO_GND'], ctr: 'IOCC' },
    { code: 'ITRC', friendlyName: 'Training Centre', island: 'Rockford', hasGround: false, defaultTowerFrequency: '119.150', defaultGroundFrequency: '', stations: ['ITRC_TWR'], ctr: 'IRCC' },
    { code: 'IBRD', friendlyName: 'Bird Island Airfield', island: 'Orenji', hasGround: false, defaultTowerFrequency: '118.300', defaultGroundFrequency: '', stations: ['IBRD_TWR'], ctr: 'IOCC' },
    { code: 'IKFL', friendlyName: 'Keflavik International', island: 'Grindavik', hasGround: true, defaultTowerFrequency: '118.300', defaultGroundFrequency: '121.750', stations: ['IKFL_TWR', 'IKFL_GND'], ctr: 'IGCC' },
    { code: 'ITEY', friendlyName: 'Pingeyri Airport', island: 'Grindavik', hasGround: false, defaultTowerFrequency: '119.425', defaultGroundFrequency: '', stations: ['ITEY_TWR'], ctr: 'IGCC' }
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
