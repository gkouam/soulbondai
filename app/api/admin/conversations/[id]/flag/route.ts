import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin-auth';

export async function POST(
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
    const { flagged, reason } = await request.json();

    // Update conversation flag status
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        flagged,
        flagReason: flagged ? reason : null,
        flaggedAt: flagged ? new Date() : null,
        flaggedBy: flagged ? session.user.id : null
      }
    });

    // If flagging, also check if we should flag the user
    if (flagged) {
      // Count how many flagged conversations this user has
      const flaggedCount = await prisma.conversation.count({
        where: {
          userId: conversation.userId,
          flagged: true
        }
      });

      // If user has 3+ flagged conversations, flag the user account
      if (flaggedCount >= 3) {
        await prisma.user.update({
          where: { id: conversation.userId },
          data: {
            flagged: true,
            flagReason: 'Multiple flagged conversations'
          }
        });
      }
    }

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: flagged ? 'FLAG_CONVERSATION' : 'UNFLAG_CONVERSATION',
        resource: 'conversation',
        resourceId: conversationId,
        metadata: {
          reason: reason || 'No reason provided',
          previousStatus: !flagged
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        flagged: conversation.flagged
      }
    });

  } catch (error) {
    console.error('Flag conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to update flag status' },
      { status: 500 }
    );
  }
}