import { Router } from "express";
import { authMiddleware } from "../middleware";
import { google, drive_v3 } from "googleapis";
import axios from "axios";
import { prismaClient } from "@flowcatalyst/database";

const router = Router();

interface Spreadsheet {
    spreadsheetId: string;
    title: string;
    sheets: string[];
    error?: string;
}

router.post("/list", authMiddleware, async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) {
        return res.status(401).json({ error: "Refresh token required" });
    }
    try {
        const response = await axios.post("https://oauth2.googleapis.com/token", {
            refresh_token,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            grant_type: "refresh_token",
        });
        const access_token = response.data.access_token;

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: access_token });
        const drive = google.drive({ version: "v3", auth });
        const sheets = google.sheets({ version: "v4", auth });

        const driveResponse = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet'",
            fields: "files(id, name)",
            spaces: "drive",
        });

        const spreadsheets = (driveResponse.data.files || []) as drive_v3.Schema$File[];

        const spreadsheetDetails: Spreadsheet[] = await Promise.all(
            spreadsheets.map(async (spreadsheet) => {
                try {
                    const sheetResponse = await sheets.spreadsheets.get({
                        spreadsheetId: spreadsheet.id!,
                        fields: "properties.title,sheets.properties.title",
                    });
                    const sheetTitles = (sheetResponse.data.sheets || [])
                        .map((s) => s.properties?.title || "")
                        .filter(Boolean);
                    return {
                        spreadsheetId: spreadsheet.id!,
                        title: spreadsheet.name || "Untitled",
                        sheets: sheetTitles,
                    };
                } catch (error) {
                    console.error(`Error fetching sheets for ${spreadsheet.id}:`, error);
                    return {
                        spreadsheetId: spreadsheet.id!,
                        title: spreadsheet.name || "Untitled",
                        sheets: [],
                        error: "Failed to fetch sheet names",
                    };
                }
            })
        );

        return res.status(200).json({ spreadsheets: spreadsheetDetails });
    } catch (error) {
        console.error("Error fetching spreadsheets:", error);
        return res.status(500).json({ error: "Failed to fetch spreadsheets" });
    }
})

router.post("/", authMiddleware, async (req, res) => {
    const { code } = req.body;
    //@ts-ignore
    const id = req.id;

    if (!code)
        res.status(401).json({ error: "GoogleOAuth Code Required" })
    try {
        const response = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${process.env.FRONTEND_URL}`,
            grant_type: "authorization_code",
        });

        const user = await prismaClient.user.update({
            where: {
                id
            },
            data: {
                googleRefreshToken: response.data.refresh_token
            },
        });
        if (!user) {
            return res.status(401).json({ message: "Log in First" });
        }
        res.status(200).json({
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
        })
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Operation failed" });
    }
});

export const spreadsheetsRouter = router;