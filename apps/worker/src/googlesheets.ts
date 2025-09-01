import axios from "axios";
import { google } from "googleapis";
import { parseDynamicFields } from "./parser";

// Fetch Google Sheets access token using refresh token
export async function getGoogleAccessToken(
  refresh_token: string,
): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables",
    );
  }

  try {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    });

    const accessToken = response.data.access_token;
    if (!accessToken) {
      throw new Error("No access token received");
    }
    return accessToken;
  } catch (error) {
    console.error("Failed to fetch Google access token:", error);
    throw new Error("Failed to fetch Google access token");
  }
}


// Get the last filled row and column count from a sheet
async function getSheetDimensions(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<{ lastRow: number; columnCount: number }> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const sheets = google.sheets({ version: "v4", auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });
    const values = response.data.values || [];
    const lastRow = values.length;
    const columnCount = values.length > 0 ? Math.max(...values.map((row) => row.length)) : 0;
    return { lastRow, columnCount };
  } catch (error: any) {
    if (error.code === 400 && error.message.includes("Range")) {
      // Sheet is empty or doesn't exist
      return { lastRow: 0, columnCount: 0 };
    }
    console.error("Failed to get sheet dimensions:", error);
    throw error;
  }
}

// Append row to Google Sheet, dynamically determining the next row
export async function appendRowToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  data: any[],
  triggerValues?: any
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const sheets = google.sheets({ version: "v4", auth });

  try {
    let { lastRow, columnCount } = await getSheetDimensions(accessToken, spreadsheetId, sheetName);
    console.log("columnCount", columnCount)
    // Handle array of objects or simple values
    const parsedRows = data.map((item) => {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        return Object.values(item).map((value) => parseDynamicFields(value, triggerValues));
      }
      return [parseDynamicFields(item, triggerValues)];
    });

    // Append each row, adjusting to match column count
    for (const parsedData of parsedRows) {
      let adjustedData = parsedData;
      if (columnCount > 0 && parsedData.length !== columnCount) {
        if (parsedData.length < columnCount) {
          adjustedData = [...parsedData, ...Array(columnCount - parsedData.length).fill("")];
        } else {
          adjustedData = parsedData.slice(0, columnCount);
        }
      }
      const range = `${sheetName}!A${lastRow + 1}`;
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          majorDimension: "ROWS",
          values: [adjustedData],
        },
      });
      console.log(`Appended row to ${sheetName} at ${range} in spreadsheet ${spreadsheetId}`);
      lastRow++;
    }

  } catch (error) {
    console.error("Failed to append row:", error);
    throw error;
  }
}

// Append column to Google Sheet with data (first sheet, sheetId: 0)
export async function appendColumnToSheet(
  accessToken: string,
  spreadsheetId: string,
  data: any[],
  triggerValues: any
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const sheets = google.sheets({ version: "v4", auth });
  try {
    // Get sheet ID for Sheet1
    const sheetResponse = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: ["Sheet1"],
      fields: "sheets(properties(sheetId,title))",
    });
    let sheetId = sheetResponse.data.sheets?.find((sheet) => sheet.properties?.title === "Sheet1")?.properties?.sheetId;

    let { lastRow, columnCount } = await getSheetDimensions(accessToken, spreadsheetId, "Sheet1");
    if (lastRow === 0 && columnCount === 0) {
      await createSheet(accessToken, spreadsheetId, "Sheet1");
      const newSheetResponse = await sheets.spreadsheets.get({
        spreadsheetId,
        ranges: ["Sheet1"],
        fields: "sheets(properties(sheetId,title))",
      });
      sheetId = newSheetResponse.data.sheets?.find((sheet) => sheet.properties?.title === "Sheet1")?.properties?.sheetId || 0;
      lastRow = 0;
      columnCount = 0;
    }

    // Handle array of objects or simple values
    const parsedColumns = data.map((item) => {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        return Object.values(item).map((value) => parseDynamicFields(value, triggerValues));
      }
      return [parseDynamicFields(item, triggerValues)];
    });

    // Insert and write each column
    for (let i = 0; i < parsedColumns.length; i++) {
      const columnData = parsedColumns[i];
      let adjustedData = columnData;
      if (lastRow > 0 && columnData.length !== lastRow) {
        if (columnData.length < lastRow) {
          adjustedData = [...columnData, ...Array(lastRow - columnData.length).fill("")];
        } else {
          adjustedData = columnData.slice(0, lastRow);
        }
      }

      // Insert one new column
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              insertDimension: {
                range: {
                  sheetId: sheetId || 0,
                  dimension: "COLUMNS",
                  startIndex: columnCount + i,
                  endIndex: columnCount + i + 1,
                },
                inheritFromBefore: false,
              },
            },
          ],
        },
      });
      console.log(`Inserted column at index ${columnCount + i} in Sheet1`);

      // Write data to the new column
      const columnLetter = String.fromCharCode(65 + columnCount + i);
      const range = `Sheet1!${columnLetter}${1}:${columnLetter}${lastRow || 1}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        requestBody: {
          majorDimension: "COLUMNS",
          values: [adjustedData],
        },
      });
      console.log(`Updated column ${columnCount + i + 1} at ${range} in spreadsheet ${spreadsheetId}`);
    }
  } catch (error) {
    console.error("Failed to append column:", error);
    throw error;
  }
}

// Create new sheet in Google Spreadsheet and append data row-wise if provided
export async function createSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  data?: any[],
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const sheets = google.sheets({ version: "v4", auth });

  try {
    // Create the sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });
    console.log(`Created sheet ${sheetName} in spreadsheet ${spreadsheetId}`);

    // Append data row-wise if provided
    if (data && data.length > 0) {
      await appendRowToSheet(accessToken, spreadsheetId, sheetName, data);
    }
  } catch (error) {
    console.error("Failed to create sheet or append data:", error);
    throw error;
  }
}