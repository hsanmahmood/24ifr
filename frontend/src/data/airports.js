
function generateAirports() {
    return [
        {
            code: "IGAR",
            friendlyName: "Airbase Garry",
            groundCallsign: "",
            towerCallsigns: [
                "Garry Approach",
                "Garry Director",
                "Garry Radar",
                "Garry Tower",
            ],
            hasGround: false,
            defaultTowerFrequency: "118.800",
            defaultGroundFrequency: "",
            maxAcft: "N/A",
            chartPacks: [
                { author: "Official", link: "https:
            ],
            generalInfo: "Location: Rockford PTFS\nICAO/IATA: IGAR / ABG",
            runwayInfo: [{ name1: "04", name2: "22", length: 2980, type: "concrete" }],
            commsInfo: "Garry Tower: 118.800\nRockford Centre: 124.850",
        },
        {
            code: "IRFD",
            friendlyName: "Greater Rockford",
            groundCallsign: "Rockford Ground",
            towerCallsigns: [
                "Rockford Centre",
                "Rockford Approach",
                "Rockford Control",
                "Rockford Tower",
            ],
            hasGround: true,
            defaultTowerFrequency: "124.850",
            defaultGroundFrequency: "120.400",
            maxAcft: "N/A",
            chartPacks: [],
            generalInfo: "Location: Rockford PTFS\nICAO/IATA: IRFD / RFD",
            runwayInfo: [
                { name1: "25R", name2: "07L", length: 3048, type: "concrete" },
                { name1: "25C", name2: "06C", length: 3680, type: "concrete" },
                { name1: "25L", name2: "07R", length: 3197, type: "concrete" }
            ],
            commsInfo: "ATIS: 127.600\nRockford Tower: 118.100\nRockford Centre: 124.850",
            topDowns: ["IGAR","IMLR","IBLT","ITRC","OWO"],
        },
        {
            code: "ITKO",
            friendlyName: "Tokyo",
            groundCallsign: "Tokyo Ground",
            towerCallsigns: ["Tokyo Approach","Tokyo Centre","Tokyo Tower"],
            hasGround: true,
            defaultTowerFrequency: "132.300",
            defaultGroundFrequency: "118.225",
            maxAcft: "N/A",
            chartPacks: [],
            generalInfo: "Location: Orenji PTFS\nICAO/IATA: ITKO / HND",
            runwayInfo: [{ name1: "02", name2: "20", length: 3754, type: "concrete" }],
            commsInfo: "ATIS: 128.800\nTokyo Tower: 118.800\nTokyo Control: 132.300",
            topDowns: ["IDCS"]
        },
        {
            code: "ILAR",
            friendlyName: "Larnaca Intl.",
            groundCallsign: "Larnaca Ground",
            towerCallsigns: ["Larnaca Approach","Larnaca Tower"],
            hasGround: true,
            defaultTowerFrequency: "126.300",
            defaultGroundFrequency: "119.400",
            maxAcft: "N/A",
            chartPacks: [],
            generalInfo: "Location: Cyprus PTFS\nICAO/IATA: ILAR / LCA",
            runwayInfo: [{ name1: "06", name2: "24", length: 3355, type: "concrete" }],
            commsInfo: "ATIS: 126.550\nLarnaca Tower: 121.200",
        },
        {
            code: "IZOL",
            friendlyName: "Izolirani Intl.",
            groundCallsign: "Izolirani Ground",
            towerCallsigns: ["Izolirani Approach","Izolirani Tower"],
            hasGround: true,
            defaultTowerFrequency: "124.640",
            defaultGroundFrequency: "121.900",
            maxAcft: "N/A",
            chartPacks: [],
            generalInfo: "Location: Izolirani PTFS\nICAO/IATA: IZOL / IZO",
            runwayInfo: [{ name1: "10", name2: "28", length: 4375, type: "concrete" }],
            commsInfo: "ATIS: 127.800\nIzolirani Tower: 118.700",
        }
    ];
}

function getAirport(code) {
    const list = generateAirports();
    return list.find(a => a.code === code) || list[0];
}

function getAirportByName(name) {
    const list = generateAirports();
    return list.find(a => a.friendlyName === name);
}

function getDefaultAirport() { return getAirport('IGAR'); }

export { generateAirports, getAirport as findAirport, getAirportByName, getDefaultAirport };
