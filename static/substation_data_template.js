// Substation Data Proforma
const SUBSTATION_DATA = {
    id: "hzn",
    name: "Sample Substation Dashboard",
    voltage: "220/132/33 KV",
    location: "Nalgonda District",
    incharge: "John Doe",
    lastUpdated: "2026-05-18",

    buses220kV: {
        type: "Double Main Bus",
        bus1: { name: "Main Bus I", voltage: "220 KV" },
        bus2: { name: "Main Bus II", voltage: "220 KV" },
        busCoupler: { breaker: { status: "Closed", type: "SF6" } },
        pts: [ { bus: "Main Bus I" }, { bus: "Main Bus II" } ]
    },

    feeders220kV: [
        { id: "220f1", name: "220KV Feeder-1", doc: "05-Aug-2015", voltage: "220 KV", breaker: { status: "Closed" }, isolators: { bus1Isolator: { status: "Closed" }, bus2Isolator: { status: "Open" } } },
        { id: "220f2", name: "220KV Feeder-2", voltage: "220 KV", breaker: { status: "Closed" }, isolators: { bus1Isolator: { status: "Open" }, bus2Isolator: { status: "Closed" } } },
        { id: "220f3", name: "220KV Feeder-3", voltage: "220 KV", breaker: { status: "Closed" }, isolators: { bus1Isolator: { status: "Closed" }, bus2Isolator: { status: "Open" } } },
        { id: "220f4", name: "220KV Feeder-4", voltage: "220 KV", breaker: { status: "Open" }, isolators: { bus1Isolator: { status: "Open" }, bus2Isolator: { status: "Open" } } }
    ],

    ptrs220to132: [
        { id: "ptr220_1", name: "100MVA PTR-1", doc: "12-Jan-2018", capacity: "100 MVA", voltageRatio: "220/132KV", hvSide: { breaker: {status: "Closed"}, isolators: {bus1Isolator:{status:"Closed"}, bus2Isolator:{status:"Open"}} }, lvSide: { breaker: {status: "Closed"} } },
        { id: "ptr220_2", name: "100MVA PTR-2", capacity: "100 MVA", voltageRatio: "220/132KV", hvSide: { breaker: {status: "Closed"}, isolators: {bus1Isolator:{status:"Open"}, bus2Isolator:{status:"Closed"}} }, lvSide: { breaker: {status: "Closed"} } }
    ],

    feeders132kV: [
        { id: "132f1", name: "132KV Feeder-1", voltage: "132 KV", breaker: { status: "Closed" } },
        { id: "132f2", name: "132KV Feeder-2", voltage: "132 KV", breaker: { status: "Closed" } },
        { id: "132f3", name: "132KV Feeder-3", voltage: "132 KV", breaker: { status: "Closed" } },
        { id: "132f4", name: "132KV Feeder-4", voltage: "132 KV", breaker: { status: "Open" } }
    ],

    ptrs132to33: [
        { id: "ptr132_1", name: "31.5MVA PTR-1", capacity: "31.5 MVA", voltageRatio: "132/33KV", hvSide: { breaker: {status: "Closed"} }, lvSide: { breaker: {status: "Closed"} } },
        { id: "ptr132_2", name: "31.5MVA PTR-2", capacity: "31.5 MVA", voltageRatio: "132/33KV", hvSide: { breaker: {status: "Closed"} }, lvSide: { breaker: {status: "Closed"} } }
    ],

    feeders33kV: [
        { id: "33f1", name: "33KV Feeder-1", voltage: "33 KV", breaker: { status: "Closed" } },
        { id: "33f2", name: "33KV Feeder-2", voltage: "33 KV", breaker: { status: "Closed" } },
        { id: "33f3", name: "33KV Feeder-3", voltage: "33 KV", breaker: { status: "Closed" } }
    ],

    dcSystem: [
        { equipment: "Battery Bank Set-1", make: "Exide", capacity: "300 AH", voltage: "220V DC", yearOfMfg: "2019", status: "Healthy", lastMaintenance: "10-May-2026" }
    ],

    staffDetails: [
        { name: "John Doe", designation: "Assistant Engineer", mobileNumber: "9876543210", shift: "General", status: "On Duty" },
        { name: "Jane Smith", designation: "Sub Engineer", mobileNumber: "8765432109", shift: "Shift A", status: "On Duty" }
    ]
};

if (typeof window !== 'undefined') {
    window.SUBSTATION_DATA_TEMPLATE = SUBSTATION_DATA;
}
