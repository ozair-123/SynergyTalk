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

    // Get ticket statistics for the user
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      recentTickets
    ] = await Promise.all([
      // Total tickets
      prisma.ticket.count({
        where: { userId: payload.userId }
      }),
      // Open tickets
      prisma.ticket.count({
        where: { 
          userId: payload.userId,
          status: 'OPEN'
        }
      }),
      // In progress tickets
      prisma.ticket.count({
        where: { 
          userId: payload.userId,
          status: 'IN_PROGRESS'
        }
      }),
      // Resolved tickets
      prisma.ticket.count({
        where: { 
          userId: payload.userId,
          status: 'RESOLVED'
        }
      }),
      // Recent tickets
      prisma.ticket.findMany({
        where: { userId: payload.userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          assignedTo: {
            select: {
              name: true
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      recentTickets
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket statistics' },
      { status: 500 }
    );
  }
}