/**
 * GOOGLE APP SCRIPT FOR SUBSTATION DASHBOARD
 * 
 * =========================================================================
 * STEP 1: INITIAL SETUP (CREATING THE TABS & HEADERS AUTOMATICALLY)
 * =========================================================================
 * 1. Open a blank Google Sheet.
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete any default code and paste this ENTIRE file.
 * 4. Save the file (Ctrl+S or Cmd+S).
 * 5. Run the function `setupProformaSheets` from the dropdown at the top, and grant it permissions.
 *    (Alternatively, go back to your Google Sheet, refresh the page, and you will see a new 
 *    menu button at the top called "⚡ Substation Setup" -> "Create Proforma Sheets").
 * 6. The script will automatically generate all your tabs with the correct columns!
 * 
 * =========================================================================
 * STEP 2: DEPLOY AS WEB APP (LINKING TO YOUR DASHBOARD)
 * =========================================================================
 * 1. Fill in some data in the newly created tabs.
 * 2. In Apps Script, click the blue "Deploy" button at the top right -> "New deployment".
 * 3. Select type: "Web app" (click the gear icon if you don't see it).
 * 4. Execute as: "Me"
 * 5. Who has access: "Anyone"
 * 6. Click "Deploy".
 * 7. Copy the "Web app URL" and paste it into `app.js` in your project folder!
 */

// -------------------------------------------------------------------------
// 1. SETUP UI AND TEMPLATE GENERATION
// -------------------------------------------------------------------------

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ Substation Setup')
    .addItem('Create Proforma Sheets', 'setupProformaSheets')
    .addToUi();
}

function setupProformaSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Substation Details
  createOrUpdateSheet(ss, "SubstationDetails", [
    ["Property Key", "Value"],
    ["id", "hzn"],
    ["name", "Huzurnagar Substation"],
    ["voltage", "220/132/33 KV"],
    ["location", "Nalgonda District"]
  ]);

  // 2. Feeders 220kV
  createOrUpdateSheet(ss, "Feeders220kV", [
    [
      "id", "name", "voltage", "length", "conductor", 
      "breakerType", "breakerMake", "breakerRating", "breakerYear", "breakerStatus",
      "ctRatio", "ctAccuracy", "ctBurden", "ctMake",
      "isoLineMake", "isoLineRating", "isoLineStatus",
      "isoBus1Make", "isoBus1Rating", "isoBus1Status",
      "isoBus2Make", "isoBus2Rating", "isoBus2Status"
    ],
    [
      "220_feeder_1", "Chillakallu Feeder", "220 KV", "45 km", "ACSR Zebra",
      "SF6 Circuit Breaker", "Siemens", "2000A, 40kA", "2020", "Closed",
      "800/1A", "0.2S Class", "30 VA", "Ritz",
      "CGL", "2000A", "Closed",
      "CGL", "2000A", "Closed",
      "CGL", "2000A", "Open"
    ]
  ]);

  // 3. PTRs
  createOrUpdateSheet(ss, "PTRs", [
    [
      "id", "name", "capacity", "voltageRatio", "make", "yearOfMfg", "impedance", "vectorGroup",
      "hvBreakerMake", "hvBreakerRating", "hvBreakerStatus",
      "hvIsoBus1Status", "hvIsoBus2Status",
      "lvBreakerMake", "lvBreakerRating", "lvBreakerStatus", "lvIsoStatus",
      "tertBreakerMake", "tertBreakerRating", "tertBreakerStatus", "tertIsoStatus"
    ],
    [
      "ptr_1", "PTR-1", "100 MVA", "220/132/33 KV", "T&R India", "2018", "12.5%", "YNyn0d11",
      "ABB", "1250A", "Closed",
      "Closed", "Open",
      "Siemens", "1250A", "Closed", "Closed",
      "CGL", "800A", "Closed", "Closed"
    ]
  ]);

  // 4. Feeders 132kV
  createOrUpdateSheet(ss, "Feeders132kV", [
    [
      "id", "name", "voltage", "length", "conductor",
      "breakerType", "breakerMake", "breakerRating", "breakerYear", "breakerStatus",
      "ctRatio", "ctAccuracy", "ctBurden", "ctMake",
      "isoLineStatus", "isoBusStatus"
    ],
    [
      "132_feeder_1", "Miryalaguda Feeder", "132 KV", "42.5 km", "ACSR Panther",
      "SF6", "ABB", "1250A, 40kA", "2021", "Closed",
      "600/1A", "0.2S", "15 VA", "Arteche",
      "Closed", "Closed"
    ]
  ]);

  // 5. Feeders 33kV
  createOrUpdateSheet(ss, "Feeders33kV", [
    [
      "id", "name", "voltage", "length", "conductor",
      "breakerType", "breakerMake", "breakerRating", "breakerYear", "breakerStatus",
      "ctRatio", "isoLineStatus", "isoBusStatus"
    ],
    [
      "33_feeder_1", "Town Feeder-1", "33 KV", "8.5 km", "Rabbit",
      "VCB", "Siemens", "800A, 25kA", "2020", "Closed",
      "400/1A", "Closed", "Closed"
    ]
  ]);

  // 6. DC System
  createOrUpdateSheet(ss, "DCSystem", [
    [
      "equipment", "make", "capacity", "voltage", "yearOfMfg", "status", "lastMaintenance"
    ],
    [
      "Battery Bank Set-1", "Exide", "300 AH", "220V DC", "2019", "Healthy", "10-May-2026"
    ],
    [
      "Battery Charger-1", "Chhabi", "50A", "220V DC", "2019", "Float Mode", "10-May-2026"
    ]
  ]);

  // 7. Staff Details
  createOrUpdateSheet(ss, "StaffDetails", [
    [
      "name", "designation", "mobileNumber", "shift", "status"
    ],
    [
      "John Doe", "Assistant Engineer", "9876543210", "General", "On Duty"
    ],
    [
      "Jane Smith", "Sub Engineer", "8765432109", "Shift A", "On Duty"
    ]
  ]);

  SpreadsheetApp.getUi().alert("✅ Success! All Proforma sheets have been created and formatted.");
}

function createOrUpdateSheet(ss, sheetName, dataOptions) {
  let sheet = ss.getSheetByName(sheetName);
  
  // If the sheet already exists, DO NOT touch it! We want to preserve user data.
  if (sheet) {
    return;
  }
  
  // Otherwise, create it and paste the proforma data
  sheet = ss.insertSheet(sheetName);
  
  if (dataOptions && dataOptions.length > 0) {
    sheet.getRange(1, 1, dataOptions.length, dataOptions[0].length).setValues(dataOptions);
    // Make headers bold and visually distinct
    sheet.getRange(1, 1, 1, dataOptions[0].length)
         .setFontWeight("bold")
         .setBackground("#d9ead3")
         .setBorder(true, true, true, true, null, null);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, dataOptions[0].length);
  }
}

// -------------------------------------------------------------------------
// 2. API ENDPOINT LOGIC (DOGET)
// -------------------------------------------------------------------------

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Parse each sheet
    const rawData = {
      substation: getSheetDataAsObject(ss.getSheetByName("SubstationDetails")),
      feeders220kV: getSheetDataAsArray(ss.getSheetByName("Feeders220kV")),
      ptrs: getSheetDataAsArray(ss.getSheetByName("PTRs")),
      feeders132kV: getSheetDataAsArray(ss.getSheetByName("Feeders132kV")),
      feeders33kV: getSheetDataAsArray(ss.getSheetByName("Feeders33kV")),
      dcSystem: getSheetDataAsArray(ss.getSheetByName("DCSystem")),
      staffDetails: getSheetDataAsArray(ss.getSheetByName("StaffDetails"))
    };
    
    // Transform flat spreadsheet rows into deep nested JSON expected by the React app
    const formattedData = transformDataForApp(rawData);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", data: formattedData }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetDataAsObject(sheet) {
  if (!sheet) return {};
  const range = sheet.getDataRange();
  const data = range.getValues();
  const richText = range.getRichTextValues();
  let obj = {};
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    if (key) {
      obj[key] = data[i][1];
      const link = richText[i][1].getLinkUrl();
      if (link) {
        obj[key + "Link"] = link;
      }
    }
  }
  return obj;
}

function getSheetDataAsArray(sheet) {
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const data = range.getValues();
  const richText = range.getRichTextValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  const result = [];
  for (let i = 1; i < data.length; i++) {
    let rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      rowObj[key] = data[i][j];
      const link = richText[i][j].getLinkUrl();
      if (link) {
        rowObj[key + "Link"] = link;
      }
    }
    result.push(rowObj);
  }
  return result;
}

// Automatically maps table rows to deeply nested JSON
function transformDataForApp(flat) {
  return {
    ...flat.substation,

    // Static buses required for diagram mapping
    buses220kV: {
        type: "Double Main Bus",
        bus1: { id: "mb1", name: "Main Bus I", voltage: "220 KV" },
        bus2: { id: "mb2", name: "Main Bus II", voltage: "220 KV" },
        busCoupler: {
            id: "bc_220",
            breaker: { status: "Closed" }
        },
        pts: [
            { id: "pt_mb1", bus: "Main Bus I" },
            { id: "pt_mb2", bus: "Main Bus II" }
        ]
    },

    feeders220kV: flat.feeders220kV.map(row => ({
      id: row.id,
      name: row.name,
      doc: row.doc,
      mapLink: row.mapLink,
      mrtTestDate: row.mrtTestDate,
      voltage: row.voltage || "220 KV",
      length: row.length,
      conductor: row.conductor,
      breaker: {
        type: row.breakerType,
        make: row.breakerMake,
        rating: row.breakerRating,
        year: row.breakerYear,
        status: row.breakerStatus
      },
      ct: { ratio: row.ctRatio, accuracy: row.ctAccuracy, burden: row.ctBurden, make: row.ctMake },
      isolators: {
        lineIsolator: { make: row.isoLineMake, rating: row.isoLineRating, status: row.isoLineStatus },
        bus1Isolator: { make: row.isoBus1Make, rating: row.isoBus1Rating, status: row.isoBus1Status },
        bus2Isolator: { make: row.isoBus2Make, rating: row.isoBus2Rating, status: row.isoBus2Status }
      }
    })),

    ptrs: flat.ptrs.map(row => ({
      id: row.id,
      name: row.name,
      doc: row.doc,
      mrtTestDate: row.mrtTestDate,
      treTestDate: row.treTestDate,
      capacity: row.capacity,
      voltageRatio: row.voltageRatio,
      make: row.make,
      yearOfMfg: row.yearOfMfg,
      impedance: row.impedance,
      vectorGroup: row.vectorGroup,
      hvSide: {
        breaker: { make: row.hvBreakerMake, rating: row.hvBreakerRating, status: row.hvBreakerStatus },
        isolators: {
          bus1Isolator: { status: row.hvIsoBus1Status },
          bus2Isolator: { status: row.hvIsoBus2Status }
        }
      },
      lvSide: {
        breaker: { make: row.lvBreakerMake, rating: row.lvBreakerRating, status: row.lvBreakerStatus },
        isolator: { status: row.lvIsoStatus }
      },
      tertiarySide: {
        breaker: { make: row.tertBreakerMake, rating: row.tertBreakerRating, status: row.tertBreakerStatus },
        isolator: { status: row.tertIsoStatus }
      }
    })),

    feeders132kV: flat.feeders132kV.map(row => ({
      id: row.id,
      name: row.name,
      doc: row.doc,
      mapLink: row.mapLink,
      mrtTestDate: row.mrtTestDate,
      voltage: row.voltage || "132 KV",
      length: row.length,
      conductor: row.conductor,
      breaker: { type: row.breakerType, make: row.breakerMake, rating: row.breakerRating, year: row.breakerYear, status: row.breakerStatus },
      ct: { ratio: row.ctRatio, accuracy: row.ctAccuracy, burden: row.ctBurden, make: row.ctMake },
      isolators: {
        lineIsolator: { status: row.isoLineStatus },
        busIsolator: { status: row.isoBusStatus } 
      }
    })),

    feeders33kV: flat.feeders33kV.map(row => ({
      id: row.id,
      name: row.name,
      doc: row.doc,
      mrtTestDate: row.mrtTestDate,
      voltage: row.voltage || "33 KV",
      length: row.length,
      conductor: row.conductor,
      breaker: { type: row.breakerType, make: row.breakerMake, rating: row.breakerRating, year: row.breakerYear, status: row.breakerStatus },
      ct: { ratio: row.ctRatio },
      isolators: {
        lineIsolator: { status: row.isoLineStatus },
        busIsolator: { status: row.isoBusStatus } 
      }
    })),

    dcSystem: flat.dcSystem || [],
    staffDetails: flat.staffDetails || []
  };
}
