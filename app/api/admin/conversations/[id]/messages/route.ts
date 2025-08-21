import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(await isAdmin(session.user.email))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const conversationId = params.id;

    // Fetch messages for the conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId
      },
      select: {
        id: true,
        content: true,
        role: true,
        createdAt: true,
        flagged: true,
        flagReason: true,
        sentiment: true,
        toxicityScore: true,
        metadata: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'VIEW_CONVERSATION_MESSAGES',
        resource: 'messages',
        resourceId: conversationId,
        metadata: {
          messageCount: messages.length
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      messages,
      count: messages.length
    });

  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}