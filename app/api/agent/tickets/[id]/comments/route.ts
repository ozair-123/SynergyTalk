import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { content } = await req.json();

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: user.id,
        ticketId: params.id
      },
      include: {
        author: {
          select: {
            name: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Comment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}