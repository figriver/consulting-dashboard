import prisma from './prisma';
import { GoogleSheetsClient } from './sheets';
import { getStrippingConfig, stripPII, logStripping } from './pii-stripper';
import { transformRows } from './metrics-transformer';
import { SyncStatus } from '@prisma/client';

export interface SyncResult {
  clientId: string;
  success: boolean;
  rowsSynced: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 2000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      const delayMs = baseDelayMs * Math.pow(2, i);
      console.warn(
        `Retry ${i + 1}/${maxRetries} after ${delayMs}ms:`,
        error
      );
      await sleep(delayMs);
    }
  }
  throw new Error('Unexpected: retryWithBackoff exhausted without throwing');
}

export async function syncClientData(
  clientId: string,
  accessToken: string
): Promise<SyncResult> {
  const startTime = new Date();
  const errors: string[] = [];
  let rowsSynced = 0;

  try {
    // Get client and sheet configs
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { sheetsConfigs: true },
    });

    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    if (client.sheetsConfigs.length === 0) {
      throw new Error(`No sheet configs found for client: ${clientId}`);
    }

    // Mark as syncing
    await prisma.sheetsConfig.updateMany({
      where: { clientId },
      data: { syncStatus: SyncStatus.SYNCING },
    });

    // Get stripping config
    const strippingConfig = await getStrippingConfig(clientId);

    // Create sheets client
    const sheetsClient = new GoogleSheetsClient(accessToken);

    // Process each sheet config
    for (const config of client.sheetsConfigs) {
      try {
        // Read sheet with retries
        const sheetData = await retryWithBackoff(() =>
          sheetsClient.readMultipleTabs(config.sheetId, config.tabNames)
        );

        // Process each tab
        for (const [tabName, data] of sheetData) {
          let rows = data.rows;

          // Apply PII stripping if needed
          if (client.isMedical) {
            const { strippedRows, strippedColumns } = stripPII(rows, strippingConfig);
            rows = strippedRows;

            // Log stripping
            if (strippedColumns.size > 0) {
              await logStripping(clientId, tabName, strippedColumns, rows.length);
            }
          }

          // Transform rows
          const transformedMetrics = transformRows(rows);

          // Upsert into database
          for (const metric of transformedMetrics) {
            await prisma.metricsRaw.upsert({
              where: {
                clientId_date_medium_source_campaign_location_user_servicePerson: {
                  clientId,
                  date: metric.date,
                  medium: metric.medium ?? '',
                  source: metric.source ?? '',
                  campaign: metric.campaign ?? '',
                  location: metric.location ?? '',
                  user: metric.user ?? '',
                  servicePerson: metric.servicePerson ?? '',
                },
              },
              update: {
                leads: metric.leads,
                consults: metric.consults,
                sales: metric.sales,
                spend: metric.spend,
                roas: metric.roas,
                leadsToConsultRate: metric.leadsToConsultRate,
                leadsToSaleRate: metric.leadsToSaleRate,
                rawDataJson: metric.rawDataJson,
              },
              create: {
                clientId,
                date: metric.date,
                medium: metric.medium,
                source: metric.source,
                campaign: metric.campaign,
                location: metric.location,
                user: metric.user,
                servicePerson: metric.servicePerson,
                leads: metric.leads,
                consults: metric.consults,
                sales: metric.sales,
                spend: metric.spend,
                roas: metric.roas,
                leadsToConsultRate: metric.leadsToConsultRate,
                leadsToSaleRate: metric.leadsToSaleRate,
                rawDataJson: metric.rawDataJson,
              },
            });
            rowsSynced++;
          }
        }

        // Mark config as successfully synced
        await prisma.sheetsConfig.update({
          where: { id: config.id },
          data: {
            syncStatus: SyncStatus.SUCCESS,
            lastSyncedAt: new Date(),
            lastError: null,
          },
        });
      } catch (error) {
        const errorMsg = `Failed to sync sheet config ${config.id}: ${String(error)}`;
        errors.push(errorMsg);
        console.error(errorMsg);

        // Mark config as failed
        await prisma.sheetsConfig.update({
          where: { id: config.id },
          data: {
            syncStatus: SyncStatus.FAILED,
            lastError: errorMsg,
          },
        });
      }
    }

    // Log sync result
    await prisma.auditLog.create({
      data: {
        clientId,
        action: 'SYNC_COMPLETED',
        details: {
          rowsSynced,
          errors,
          duration: new Date().getTime() - startTime.getTime(),
        },
      },
    });

    return {
      clientId,
      success: errors.length === 0,
      rowsSynced,
      errors,
      startTime,
      endTime: new Date(),
    };
  } catch (error) {
    const errorMsg = String(error);
    console.error(`Critical sync error for client ${clientId}:`, error);

    await prisma.auditLog.create({
      data: {
        clientId,
        action: 'SYNC_FAILED',
        details: {
          error: errorMsg,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      clientId,
      success: false,
      rowsSynced,
      errors: [errorMsg],
      startTime,
      endTime: new Date(),
    };
  }
}

export async function syncAllClients(accessToken: string): Promise<SyncResult[]> {
  const clients = await prisma.client.findMany();
  const results: SyncResult[] = [];

  for (const client of clients) {
    const result = await syncClientData(client.id, accessToken);
    results.push(result);
  }

  return results;
}
