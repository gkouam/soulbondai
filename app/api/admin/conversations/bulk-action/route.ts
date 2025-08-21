import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(await isAdmin(session.user.email))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { action, conversationIds, metadata } = await request.json();

    if (!conversationIds || conversationIds.length === 0) {
      return NextResponse.json(
        { error: 'No conversations selected' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let actionName = '';

    switch (action) {
      case 'flag':
        updateData = {
          flagged: true,
          flaggedAt: new Date(),
          flaggedBy: session.user.id,
          flagReason: metadata?.reason || 'Bulk flagged by admin'
        };
        actionName = 'BULK_FLAG_CONVERSATIONS';
        break;
      
      case 'unflag':
        updateData = {
          flagged: false,
          flaggedAt: null,
          flaggedBy: null,
          flagReason: null
        };
        actionName = 'BULK_UNFLAG_CONVERSATIONS';
        break;
      
      case 'archive':
        updateData = {
          archived: true,
          archivedAt: new Date(),
          archivedBy: session.user.id,
          isActive: false
        };
        actionName = 'BULK_ARCHIVE_CONVERSATIONS';
        break;
      
      case 'unarchive':
        updateData = {
          archived: false,
          archivedAt: null,
          archivedBy: null
        };
        actionName = 'BULK_UNARCHIVE_CONVERSATIONS';
        break;
      
      case 'delete':
        // For delete, we'll use deleteMany instead of updateMany
        const deletedCount = await prisma.conversation.deleteMany({
          where: {
            id: { in: conversationIds }
          }
        });

        // Log the bulk delete action
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'BULK_DELETE_CONVERSATIONS',
            resource: 'conversations',
            metadata: {
              conversationIds,
              count: deletedCount.count
            },
            ipAddress: request.ip || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        });

        return NextResponse.json({
          success: true,
          count: deletedCount.count,
          action: 'deleted'
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // For non-delete actions, update the conversations
    if (action !== 'delete') {
      const updated = await prisma.conversation.updateMany({
        where: {
          id: { in: conversationIds }
        },
        data: updateData
      });

      // Log the bulk action
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: actionName,
          resource: 'conversations',
          metadata: {
            conversationIds,
            count: updated.count,
            updateData
          },
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });

      return NextResponse.json({
        success: true,
        count: updated.count,
        action
      });
    }

  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}