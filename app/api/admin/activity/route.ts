import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(await isAdmin(session.user.email))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const activityType = searchParams.get('type');

    // Get recent user activities
    const whereClause = activityType ? { activityType } : {};

    const activities = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        userId: true,
        action: true,
        resource: true,
        metadata: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.auditLog.count({
      where: whereClause
    });

    // Get activity statistics
    const stats = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        action: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    // Get active users in the last hour
    const activeUsers = await prisma.user.count({
      where: {
        lastActiveAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    // Get recent registrations
    const recentRegistrations = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    // Get message volume
    const messageVolume = await prisma.message.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    // Serialize activities to ensure Date objects are converted to strings
    const serializedActivities = activities.map(activity => ({
      ...activity,
      createdAt: activity.createdAt.toISOString(),
      user: activity.user ? {
        email: activity.user.email,
        name: activity.user.name,
        role: activity.user.role
      } : null
    }));

    return NextResponse.json({
      activities: serializedActivities,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats: {
        actionStats: stats.map(stat => ({
          action: stat.action,
          count: stat._count.action
        })),
        activeUsers,
        recentRegistrations,
        messageVolume
      }
    });

  } catch (error) {
    console.error('Admin activity fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    );
  }
}