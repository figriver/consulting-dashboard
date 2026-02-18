import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface SheetData {
  headers: string[];
  rows: Record<string, string | number>[];
}

export interface SheetRow {
  [key: string]: any;
}

export class GoogleSheetsClient {
  private sheets: any;
  private auth: OAuth2Client;

  constructor(accessToken: string) {
    this.auth = new OAuth2Client();
    this.auth.setCredentials({ access_token: accessToken });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async readSheet(sheetId: string, ranges: string[]): Promise<SheetData[]> {
    try {
      const response = await this.sheets.spreadsheets.values.batchGet({
        spreadsheetId: sheetId,
        ranges,
      });

      return response.data.valueRanges.map((range: any) => {
        const values = range.values || [];
        if (values.length === 0) {
          return { headers: [], rows: [] };
        }

        const headers = values[0] as string[];
        const rows = values.slice(1).map((row: any[]) => {
          const obj: SheetRow = {};
          headers.forEach((header, index) => {
            obj[header.trim()] = row[index] ?? null;
          });
          return obj;
        });

        return { headers, rows };
      });
    } catch (error) {
      console.error('Error reading Google Sheet:', error);
      throw new Error(`Failed to read sheet ${sheetId}: ${String(error)}`);
    }
  }

  async readMultipleTabs(
    sheetId: string,
    tabNames: string[]
  ): Promise<Map<string, SheetData>> {
    const ranges = tabNames.map((tab) => `'${tab}'!A:Z`);
    const dataSets = await this.readSheet(sheetId, ranges);

    const result = new Map<string, SheetData>();
    tabNames.forEach((tab, index) => {
      result.set(tab, dataSets[index]);
    });

    return result;
  }
}

export async function createSheetsClient(accessToken: string) {
  return new GoogleSheetsClient(accessToken);
}
