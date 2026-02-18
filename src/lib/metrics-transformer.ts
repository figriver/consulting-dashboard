import { Decimal } from '@prisma/client/runtime/library';
import { SheetRow } from './sheets';

export interface TransformedMetric {
  date: Date;
  medium: string | null;
  source: string | null;
  campaign: string | null;
  location: string | null;
  user: string | null;
  servicePerson: string | null;
  leads: number;
  consults: number;
  sales: number;
  spend: Decimal;
  roas: Decimal;
  leadsToConsultRate: Decimal;
  leadsToSaleRate: Decimal;
  rawDataJson: any;
}

const NUMERIC_FIELDS = ['leads', 'consults', 'sales', 'spend', 'roas'];
const SEGMENT_FIELDS = ['medium', 'source', 'campaign', 'location', 'user', 'service_person'];

// Common variations of column names (case-insensitive)
const COLUMN_ALIASES: Record<string, string[]> = {
  date: ['date', 'date_range', 'day', 'report_date'],
  leads: ['leads', 'lead_count', 'new_leads'],
  consults: ['consults', 'consultations', 'consult_count', 'scheduled_consults'],
  sales: ['sales', 'sales_count', 'revenue_count'],
  spend: ['spend', 'ad_spend', 'adspend', 'cost'],
  roas: ['roas', 'return_on_ad_spend'],
  medium: ['medium', 'channel', 'media_type'],
  source: ['source', 'traffic_source'],
  campaign: ['campaign', 'campaign_name'],
  location: ['location', 'location_name', 'office'],
  user: ['user', 'handler', 'account_manager'],
  service_person: ['service_person', 'person', 'provider'],
};

function findColumn(row: SheetRow, aliases: string[]): string | undefined {
  return Object.keys(row).find((key) =>
    aliases.some((alias) => key.toLowerCase() === alias.toLowerCase())
  );
}

function parseDate(dateStr: any): Date {
  if (!dateStr) {
    return new Date();
  }

  if (dateStr instanceof Date) {
    return dateStr;
  }

  // Handle Excel date numbers
  if (typeof dateStr === 'number') {
    // Excel epoch is 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    return new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000);
  }

  return new Date(dateStr);
}

function parseNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function calculateConversionRate(numerator: number, denominator: number): Decimal {
  if (denominator === 0) {
    return new Decimal(0);
  }

  const rate = (numerator / denominator);
  return new Decimal(rate).toDecimalPlaces(4);
}

export function transformRow(row: SheetRow): TransformedMetric | null {
  try {
    // Parse required fields
    const dateCol = findColumn(row, COLUMN_ALIASES.date);
    if (!dateCol) {
      console.warn('No date column found in row:', Object.keys(row));
      return null;
    }

    const leadsCol = findColumn(row, COLUMN_ALIASES.leads);
    const consultsCol = findColumn(row, COLUMN_ALIASES.consults);
    const salesCol = findColumn(row, COLUMN_ALIASES.sales);
    const spendCol = findColumn(row, COLUMN_ALIASES.spend);
    const roasCol = findColumn(row, COLUMN_ALIASES.roas);

    const date = parseDate(row[dateCol]);
    const leads = leadsCol ? parseNumber(row[leadsCol]) : 0;
    const consults = consultsCol ? parseNumber(row[consultsCol]) : 0;
    const sales = salesCol ? parseNumber(row[salesCol]) : 0;
    const spend = spendCol ? new Decimal(parseNumber(row[spendCol])) : new Decimal(0);
    
    // Calculate ROAS if not provided
    let roas: Decimal;
    if (roasCol) {
      roas = new Decimal(parseNumber(row[roasCol]));
    } else {
      if (spend.toNumber() === 0) {
        roas = new Decimal(0);
      } else {
        roas = new Decimal(sales).div(spend).toDecimalPlaces(4);
      }
    }

    // Parse segment dimensions
    const mediumCol = findColumn(row, COLUMN_ALIASES.medium);
    const sourceCol = findColumn(row, COLUMN_ALIASES.source);
    const campaignCol = findColumn(row, COLUMN_ALIASES.campaign);
    const locationCol = findColumn(row, COLUMN_ALIASES.location);
    const userCol = findColumn(row, COLUMN_ALIASES.user);
    const servicePersonCol = findColumn(row, COLUMN_ALIASES.service_person);

    const leadsToConsultRate = calculateConversionRate(consults, leads);
    const leadsToSaleRate = calculateConversionRate(sales, leads);

    return {
      date,
      medium: mediumCol ? (row[mediumCol] as string | null) : null,
      source: sourceCol ? (row[sourceCol] as string | null) : null,
      campaign: campaignCol ? (row[campaignCol] as string | null) : null,
      location: locationCol ? (row[locationCol] as string | null) : null,
      user: userCol ? (row[userCol] as string | null) : null,
      servicePerson: servicePersonCol ? (row[servicePersonCol] as string | null) : null,
      leads,
      consults,
      sales,
      spend,
      roas,
      leadsToConsultRate,
      leadsToSaleRate,
      rawDataJson: row,
    };
  } catch (error) {
    console.error('Error transforming row:', error, row);
    return null;
  }
}

export function transformRows(rows: SheetRow[]): TransformedMetric[] {
  return rows
    .map((row) => transformRow(row))
    .filter((metric): metric is TransformedMetric => metric !== null);
}
