import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { syncClientData } from '@/lib/sync-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json(
        { error: 'client_id required' },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // TODO: Get Google OAuth access token from session/user
    // For now, we'll need to implement a way to store and refresh the token
    // This is a placeholder that will need to be filled in with actual token management
    const accessToken = process.env.GOOGLE_OAUTH_ACCESS_TOKEN || '';

    if (!accessToken) {
      return NextResponse.json(
        { error: 'OAuth token not available. Please re-authenticate.' },
        { status: 500 }
      );
    }

    // Trigger sync
    const result = await syncClientData(clientId, accessToken);

    return NextResponse.json({
      success: result.success,
      data: {
        clientId: result.clientId,
        rowsSynced: result.rowsSynced,
        errors: result.errors,
        duration: result.endTime.getTime() - result.startTime.getTime(),
      },
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
