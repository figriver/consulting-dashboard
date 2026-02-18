import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { notes } = body;

    // Get alert
    const alert = await prisma.coachingAlert.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Update alert to mark as acknowledged
    const updated = await prisma.coachingAlert.update({
      where: { id: resolvedParams.id },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy: user.id,
        notes: notes || null,
      },
    });

    // Log to audit log
    await prisma.auditLog.create({
      data: {
        clientId: alert.clientId,
        action: 'ALERT_ACKNOWLEDGED',
        details: {
          alertId: alert.id,
          metricType: alert.metricType,
          acknowledgedBy: user.email,
          notes,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
