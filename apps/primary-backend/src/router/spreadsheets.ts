import { Router } from "express";
import { authMiddleware } from "../middleware";
import { google } from "googleapis";
import axios from "axios";
import { prismaClient } from "@flowcatalyst/database";

const router = Router();

// interface Spreadsheet {
//   spreadsheetId: string;
//   title: string;
//   sheets: string[];
//   error?: string;
// }

// Get access token from refresh token
async function getAccessToken(refreshToken: string): Promise<string> {
  const params = new URLSearchParams();
  params.append("refresh_token", refreshToken);
  params.append("client_id", process.env.GOOGLE_CLIENT_ID!);
  params.append("client_secret", process.env.GOOGLE_CLIENT_SECRET!);
  params.append("grant_type", "refresh_token");

  const tokenResp = await axios.post(
    "https://oauth2.googleapis.com/token",
    params.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
  );
  return tokenResp.data.access_token;
}

// List all Google Sheets spreadsheets for the user
router.get("/list", authMiddleware, async (req, res) => {
  try {
    // @ts-ignore
    const user = await prismaClient.user.findUnique({ where: { id: req.id } });
    if (!user || !user.googleRefreshToken)
      return res.status(401).json({
        error: "No refresh token. Please connect Google Sheets first.",
      });

    const access_token = await getAccessToken(user.googleRefreshToken);
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token });
    const drive = google.drive({ version: "v3", auth });
    const sheets = google.sheets({ version: "v4", auth });

    // List all Google Sheets files using Drive API
    // Note: drive.file scope only allows access to files created/opened by the app
    // For files not created by the app, users need to use Google Picker to select them
    let spreadsheetFiles: any[] = [];
    try {
      const driveResponse = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
        fields: "files(id, name)",
        pageSize: 100,
        orderBy: "modifiedTime desc",
      });
      spreadsheetFiles = driveResponse.data.files || [];
    } catch (driveError: any) {
      console.error("Drive API error:", driveError);
      // If Drive API fails (e.g., insufficient permissions), return empty array
      // Users can still use Google Picker to select spreadsheets
      if (driveError.code === 403 || driveError.code === 401) {
        console.log(
          "Drive API access denied - user can use Google Picker instead",
        );
        spreadsheetFiles = [];
      } else {
        throw driveError;
      }
    }

    // Get detailed information for each spreadsheet
    const result = await Promise.all(
      spreadsheetFiles.map(async (file) => {
        try {
          const sheetResp = await sheets.spreadsheets.get({
            spreadsheetId: file.id!,
            fields: "spreadsheetId,properties(title),sheets(properties(title))",
          });
          const sheetTitles = (sheetResp.data.sheets || [])
            .map((s) => s.properties?.title || "")
            .filter(Boolean);

          return {
            spreadsheetId: file.id!,
            title: sheetResp.data.properties?.title || file.name || "Untitled",
            sheets: sheetTitles,
          };
        } catch (err) {
          console.error(`Error fetching details for ${file.id}:`, err);
          return {
            spreadsheetId: file.id!,
            title: file.name || "Unknown",
            sheets: [],
            error: "Failed to fetch details",
          };
        }
      }),
    );

    res.status(200).json({ spreadsheets: result });
  } catch (err: any) {
    console.error("Error listing spreadsheets:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      response: err.response?.data,
      status: err.response?.status,
    });

    if (err.response?.status === 401 || err.response?.status === 403) {
      return res.status(401).json({
        error:
          "Google Sheets access expired. Please reconnect in Connections page.",
        details: err.response?.data?.error || err.message,
      });
    }

    // Return more detailed error message
    const errorMessage =
      err.response?.data?.error?.message ||
      err.message ||
      "Failed to fetch spreadsheets";
    res.status(500).json({
      error: "Failed to fetch spreadsheets",
      details: errorMessage,
    });
  }
});

// Get details for specific sheet IDs (for backward compatibility)
router.post("/list", authMiddleware, async (req, res) => {
  const { sheetIds } = req.body;

  if (!Array.isArray(sheetIds) || sheetIds.length === 0) {
    return res.status(400).json({ error: "sheetIds required" });
  }
  try {
    // @ts-ignore
    const user = await prismaClient.user.findUnique({ where: { id: req.id } });
    if (!user || !user.googleRefreshToken) {
      return res.status(401).json({ error: "No refresh token" });
    }

    const access_token = await getAccessToken(user.googleRefreshToken);
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token });
    const sheets = google.sheets({ version: "v4", auth });

    const result = await Promise.all(
      sheetIds.map(async (id: string) => {
        try {
          const sheetResp = await sheets.spreadsheets.get({
            spreadsheetId: id,
            fields: "spreadsheetId,properties(title),sheets(properties(title))",
          });
          const sheetTitles = (sheetResp.data.sheets || [])
            .map((s) => s.properties?.title || "")
            .filter(Boolean);

          return {
            spreadsheetId: id,
            title: sheetResp.data.properties?.title || "Untitled",
            sheets: sheetTitles,
          };
        } catch (err) {
          return {
            spreadsheetId: id,
            title: "Unknown",
            sheets: [],
            error: "Failed to fetch",
          };
        }
      }),
    );

    res.status(200).json({ spreadsheets: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
  // const { refresh_token } = req.body;
  // if (!refresh_token) {
  //   return res.status(401).json({ error: "Refresh token required" });
  // }
  // try {
  //   const params = new URLSearchParams();
  //   params.append("refresh_token", refresh_token);
  //   params.append("client_id", process.env.GOOGLE_CLIENT_ID!);
  //   params.append("client_secret", process.env.GOOGLE_CLIENT_SECRET!);
  //   params.append("grant_type", "refresh_token");
  //
  //   const response = await axios.post(
  //     "https://oauth2.googleapis.com/token",
  //     params.toString(),
  //     {
  //       headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //     },
  //   );
  //
  //   const access_token = response.data.access_token;
  //
  //   const auth = new google.auth.OAuth2();
  //   auth.setCredentials({ access_token: access_token });
  //   const drive = google.drive({ version: "v3", auth });
  //   const sheets = google.sheets({ version: "v4", auth });
  //
  //   const driveResponse = await drive.files.list({
  //     q: "mimeType='application/vnd.google-apps.spreadsheet'",
  //     fields: "files(id, name)",
  //     spaces: "drive",
  //   });
  //
  //   const spreadsheets = (driveResponse.data.files ||
  //     []) as drive_v3.Schema$File[];
  //
  //   const spreadsheetDetails: Spreadsheet[] = await Promise.all(
  //     spreadsheets.map(async (spreadsheet) => {
  //       try {
  //         const sheetResponse = await sheets.spreadsheets.get({
  //           spreadsheetId: spreadsheet.id!,
  //           fields: "properties.title,sheets.properties.title",
  //         });
  //         const sheetTitles = (sheetResponse.data.sheets || [])
  //           .map((s) => s.properties?.title || "")
  //           .filter(Boolean);
  //         return {
  //           spreadsheetId: spreadsheet.id!,
  //           title: spreadsheet.name || "Untitled",
  //           sheets: sheetTitles,
  //         };
  //       } catch (error) {
  //         console.error(`Error fetching sheets for ${spreadsheet.id}:`, error);
  //         return {
  //           spreadsheetId: spreadsheet.id!,
  //           title: spreadsheet.name || "Untitled",
  //           sheets: [],
  //           error: "Failed to fetch sheet names",
  //         };
  //       }
  //     }),
  //   );
  //
  //   return res.status(200).json({ spreadsheets: spreadsheetDetails });
  // } catch (error) {
  //   console.error("Error fetching spreadsheets:", error);
  //   return res.status(500).json({ error: "Failed to fetch spreadsheets" });
  // }
});

// Get access token endpoint (for Google Picker)
router.get("/token", authMiddleware, async (req, res) => {
  try {
    // @ts-ignore
    const user = await prismaClient.user.findUnique({ where: { id: req.id } });
    if (!user || !user.googleRefreshToken)
      return res.status(401).json({
        error: "No refresh token. Please connect Google Sheets first.",
      });

    const access_token = await getAccessToken(user.googleRefreshToken);
    res.status(200).json({ access_token });
  } catch (error) {
    console.error("Error getting access token:", error);
    res.status(500).json({ error: "Failed to get access token" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { code } = req.body;
  //@ts-ignore
  const id = req.id;

  if (!code)
    return res.status(401).json({ error: "GoogleOAuth Code Required" });
  try {
    const params = new URLSearchParams();
    params.append("code", code);
    params.append("client_id", process.env.GOOGLE_CLIENT_ID!);
    params.append("client_secret", process.env.GOOGLE_CLIENT_SECRET!);
    params.append("redirect_uri", process.env.FRONTEND_URL!);
    params.append("grant_type", "authorization_code");

    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );
    const user = await prismaClient.user.update({
      where: {
        id,
      },
      data: {
        googleRefreshToken: response.data.refresh_token,
      },
    });
    if (!user) {
      return res.status(401).json({ message: "Log in First" });
    }
    res.status(200).json({
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Operation failed" });
  }
});

export const spreadsheetsRouter = router;
