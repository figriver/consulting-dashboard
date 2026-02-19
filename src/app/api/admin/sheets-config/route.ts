import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

async function isAdmin(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return user?.role === 'ADMIN';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!(await isAdmin(session.user.email))) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('client_id');

    const whereClause = clientId ? { clientId } : {};

    const configs = await prisma.sheetsConfig.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            isMedical: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error('Error fetching sheet configs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!(await isAdmin(session.user.email))) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { clientId, sheetId, sheetName, tabNames } = await request.json();

    // Validate required fields
    if (!clientId || !sheetId || !tabNames || tabNames.length === 0) {
      return NextResponse.json(
        {
          error:
            'clientId, sheetId, and tabNames (non-empty array) are required',
        },
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

    // Check for duplicate
    const existing = await prisma.sheetsConfig.findUnique({
      where: {
        clientId_sheetId: {
          clientId,
          sheetId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Sheet config already exists for this client and sheet ID' },
        { status: 409 }
      );
    }

    const config = await prisma.sheetsConfig.create({
      data: {
        clientId,
        sheetId,
        sheetName: sheetName || sheetId,
        tabNames,
        syncStatus: 'PENDING',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            isMedical: true,
          },
        },
      },
    });

    // Log this action
    await prisma.auditLog.create({
      data: {
        clientId,
        action: 'SHEETS_CONFIG_CREATED',
        details: {
          sheetId,
          sheetName,
          tabNames,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error creating sheet config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!(await isAdmin(session.user.email))) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id, sheetName, tabNames } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Verify config exists
    const existing = await prisma.sheetsConfig.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            isMedical: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Sheet config not found' },
        { status: 404 }
      );
    }

    const config = await prisma.sheetsConfig.update({
      where: { id },
      data: {
        ...(sheetName && { sheetName }),
        ...(tabNames && tabNames.length > 0 && { tabNames }),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            isMedical: true,
          },
        },
      },
    });

    // Log this action
    await prisma.auditLog.create({
      data: {
        clientId: existing.clientId,
        action: 'SHEETS_CONFIG_UPDATED',
        details: {
          configId: id,
          changes: {
            ...(sheetName && { sheetName }),
            ...(tabNames && { tabNames }),
          },
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error updating sheet config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!(await isAdmin(session.user.email))) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.sheetsConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Sheet config not found' },
        { status: 404 }
      );
    }

    await prisma.sheetsConfig.delete({
      where: { id },
    });

    // Log this action
    await prisma.auditLog.create({
      data: {
        clientId: existing.clientId,
        action: 'SHEETS_CONFIG_DELETED',
        details: {
          configId: id,
          sheetId: existing.sheetId,
          sheetName: existing.sheetName,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sheet config deleted',
    });
  } catch (error) {
    console.error('Error deleting sheet config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
