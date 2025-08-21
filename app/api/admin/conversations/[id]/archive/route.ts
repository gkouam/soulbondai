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
    const { archived } = await request.json();

    // Update conversation archive status
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        archived,
        archivedAt: archived ? new Date() : null,
        archivedBy: archived ? session.user.id : null,
        // If archiving, also mark as inactive
        isActive: archived ? false : undefined
      }
    });

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: archived ? 'ARCHIVE_CONVERSATION' : 'UNARCHIVE_CONVERSATION',
        resource: 'conversation',
        resourceId: conversationId,
        metadata: {
          previousStatus: !archived
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        archived: conversation.archived
      }
    });

  } catch (error) {
    console.error('Archive conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to update archive status' },
      { status: 500 }
    );
  }
}