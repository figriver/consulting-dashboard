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

    const configs = await prisma.coachingConfig.findMany({
      where: { clientId },
    });

    return NextResponse.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error('Error fetching coaching config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const { clientId, metricType, thresholdValue, enabled } = await request.json();

    if (!clientId || !metricType || thresholdValue === undefined) {
      return NextResponse.json(
        { error: 'clientId, metricType, and thresholdValue required' },
        { status: 400 }
      );
    }

    const config = await prisma.coachingConfig.upsert({
      where: {
        clientId_metricType: {
          clientId,
          metricType,
        },
      },
      update: {
        thresholdValue,
        enabled: enabled !== undefined ? enabled : true,
      },
      create: {
        clientId,
        metricType,
        thresholdValue,
        enabled: enabled !== undefined ? enabled : true,
      },
    });

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error updating coaching config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
