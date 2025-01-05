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

    // Get all tickets assigned to the agent
    const tickets = await prisma.ticket.findMany({
      where: {
        assignedId: user.id
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Ticket fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}