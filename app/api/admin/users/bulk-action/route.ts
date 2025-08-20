import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin-auth';
import { z } from 'zod';

const bulkActionSchema = z.object({
  userIds: z.array(z.string()),
  action: z.enum(['activate', 'deactivate', 'delete', 'upgrade', 'downgrade'])
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(await isAdmin(session.user.email))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userIds, action } = bulkActionSchema.parse(body);

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: 'No users selected' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let actionDescription = '';

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        actionDescription = 'activated';
        break;
      case 'deactivate':
        updateData = { isActive: false };
        actionDescription = 'deactivated';
        break;
      case 'delete':
        updateData = { 
          isActive: false,
          deletedAt: new Date()
        };
        actionDescription = 'deleted';
        break;
      case 'upgrade':
        updateData = { subscriptionStatus: 'PREMIUM' };
        actionDescription = 'upgraded to premium';
        break;
      case 'downgrade':
        updateData = { subscriptionStatus: 'FREE' };
        actionDescription = 'downgraded to free';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Prevent deleting admin users
    if (action === 'delete') {
      const adminUsers = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          role: 'ADMIN'
        }
      });

      if (adminUsers.length > 0) {
        return NextResponse.json(
          { error: 'Cannot delete admin users' },
          { status: 403 }
        );
      }
    }

    // Perform bulk update
    const result = await prisma.user.updateMany({
      where: {
        id: { in: userIds }
      },
      data: updateData
    });

    // Log the bulk action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `BULK_${action.toUpperCase()}`,
        resource: 'users',
        metadata: {
          userIds,
          count: result.count,
          action: actionDescription
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${actionDescription} ${result.count} users`,
      count: result.count
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid bulk action data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}