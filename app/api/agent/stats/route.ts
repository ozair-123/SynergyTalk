import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify agent role
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get statistics
    const [
      totalAssigned,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      recentTickets
    ] = await Promise.all([
      prisma.ticket.count({
        where: { assignedId: user.id }
      }),
      prisma.ticket.count({
        where: { 
          assignedId: user.id,
          status: 'OPEN'
        }
      }),
      prisma.ticket.count({
        where: { 
          assignedId: user.id,
          status: 'IN_PROGRESS'
        }
      }),
      prisma.ticket.count({
        where: { 
          assignedId: user.id,
          status: 'RESOLVED'
        }
      }),
      prisma.ticket.findMany({
        where: { assignedId: user.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      totalAssigned,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      recentTickets
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}