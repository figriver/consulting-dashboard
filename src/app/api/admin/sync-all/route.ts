import prisma from '@/lib/prisma';
import { syncClientData } from '@/lib/sync-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/sync-all
 *
 * Internal endpoint for triggering bulk syncs.
 * Can be called by:
 * 1. OpenClaw cron job (weekly, Sunday 6 PM CT)
 * 2. Manual trigger from UI
 *
 * Optional query params:
 * - client_id: Sync only a specific client
 *
 * Uses GOOGLE_SHEETS_ACCESS_TOKEN env var for authentication.
 * In production, should use per-user token storage.
 */

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('client_id');

    // Get access token from environment
    const accessToken = process.env.GOOGLE_SHEETS_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Google Sheets access token not configured',
          details:
            'Set GOOGLE_SHEETS_ACCESS_TOKEN environment variable to enable syncing',
        },
        { status: 500 }
      );
    }

    // Determine which clients to sync
    let clients;
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      if (!client) {
        return NextResponse.json(
          { error: `Client not found: ${clientId}` },
          { status: 404 }
        );
      }
      clients = [client];
    } else {
      clients = await prisma.client.findMany({
        include: {
          sheetsConfigs: {
            where: {
              syncStatus: {
                in: ['PENDING', 'FAILED'],
              },
            },
          },
        },
      });
      // Filter to only clients with pending or failed configs
      clients = clients.filter((c) => c.sheetsConfigs.length > 0);
    }

    if (clients.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No clients to sync',
        results: [],
      });
    }

    // Sync each client
    const results = [];
    for (const client of clients) {
      try {
        const result = await syncClientData(client.id, accessToken);
        results.push(result);
      } catch (error) {
        const errorMsg = String(error);
        console.error(`Failed to sync client ${client.id}:`, error);

        // Log the error
        await prisma.auditLog.create({
          data: {
            clientId: client.id,
            action: 'SYNC_ERROR',
            details: {
              error: errorMsg,
              timestamp: new Date().toISOString(),
            },
          },
        });

        results.push({
          clientId: client.id,
          success: false,
          rowsSynced: 0,
          errors: [errorMsg],
          startTime: new Date(),
          endTime: new Date(),
        });
      }
    }

    // Create summary log
    const successCount = results.filter((r) => r.success).length;
    const totalRows = results.reduce((sum, r) => sum + r.rowsSynced, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`Sync completed: ${successCount}/${results.length} clients, ${totalRows} rows, ${totalErrors} errors`);

    return NextResponse.json({
      success: totalErrors === 0,
      message: `Synced ${successCount} of ${results.length} clients`,
      summary: {
        totalClients: results.length,
        successCount,
        failureCount: results.length - successCount,
        totalRowsSynced: totalRows,
        totalErrors,
      },
      results,
    });
  } catch (error) {
    const errorMsg = String(error);
    console.error('Critical error in sync-all:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}
