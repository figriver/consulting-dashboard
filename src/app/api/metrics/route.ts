import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('client_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Get user info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Determine which client(s) to query
    let queryClientId: string;

    if (user.role === 'ADMIN') {
      // Admin can query any client
      if (!clientId) {
        return NextResponse.json(
          { error: 'client_id required for admin queries' },
          { status: 400 }
        );
      }
      queryClientId = clientId;
    } else {
      // Client can only query their own data
      if (!user.clientId) {
        return NextResponse.json(
          { error: 'User has no associated client' },
          { status: 403 }
        );
      }
      queryClientId = user.clientId;
    }

    // Build query
    const where: any = { clientId: queryClientId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Fetch metrics
    const metrics = await prisma.metricsRaw.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
