import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Check if user is admin
async function isAdmin(session: any) {
  return session?.user?.role === 'ADMIN' || session?.user?.email === 'kouam7@gmail.com';
}

const updateSubscriptionSchema = z.object({
  plan: z.enum(['free', 'basic', 'premium', 'ultimate']).optional(),
  status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'incomplete']).optional(),
  currentPeriodEnd: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!await isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const plan = searchParams.get('plan');
    const status = searchParams.get('status');
    const format = searchParams.get('format');

    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ]
      };
    }
    
    if (plan) {
      where.plan = plan;
    }
    
    if (status) {
      where.status = status;
    }

    // Export format
    if (format === 'export') {
      const allSubscriptions = await prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Create CSV
      const csv = [
        'User Email,User Name,Plan,Status,Amount,Period Start,Period End,Stripe Customer ID,Created At',
        ...allSubscriptions.map(sub => [
          sub.user.email,
          sub.user.name || '',
          sub.plan,
          sub.status,
          getPlanPrice(sub.plan),
          sub.currentPeriodStart?.toISOString() || '',
          sub.currentPeriodEnd?.toISOString() || '',
          sub.stripeCustomerId || '',
          sub.createdAt.toISOString()
        ].join(','))
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=subscriptions-${Date.now()}.csv`
        }
      });
    }

    // Get subscriptions with pagination
    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Get total count
    const totalSubscriptions = await prisma.subscription.count({ where });

    // Calculate stats
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'active' }
    });

    const cancelledSubscriptions = await prisma.subscription.count({
      where: { status: 'canceled' }
    });

    // Calculate MRR
    const activeSubsForMRR = await prisma.subscription.findMany({
      where: { 
        status: 'active',
        plan: { not: 'free' }
      },
      select: { plan: true }
    });

    const mrr = activeSubsForMRR.reduce((sum, sub) => {
      return sum + getPlanPrice(sub.plan);
    }, 0);

    const arr = mrr * 12;

    // Calculate churn rate (simplified)
    const lastMonthCancelled = await prisma.subscription.count({
      where: {
        status: 'canceled',
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const churnRate = activeSubscriptions > 0 
      ? (lastMonthCancelled / activeSubscriptions) * 100 
      : 0;

    // Plan distribution
    const planDistribution = {
      free: await prisma.subscription.count({ where: { plan: 'free' } }),
      basic: await prisma.subscription.count({ where: { plan: 'basic' } }),
      premium: await prisma.subscription.count({ where: { plan: 'premium' } }),
      ultimate: await prisma.subscription.count({ where: { plan: 'ultimate' } }),
    };

    // Format subscriptions with additional data
    const formattedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      amount: getPlanPrice(sub.plan),
      currency: 'USD',
      planType: sub.plan // for compatibility
    }));

    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      pagination: {
        page,
        limit,
        total: totalSubscriptions,
        totalPages: Math.ceil(totalSubscriptions / limit),
        hasNext: page * limit < totalSubscriptions,
        hasPrev: page > 1
      },
      stats: {
        totalSubscriptions,
        activeSubscriptions,
        cancelledSubscriptions,
        mrr,
        arr,
        churnRate,
        averageLifetimeValue: mrr > 0 ? (mrr * 12) / activeSubscriptions : 0,
        planDistribution
      }
    });

  } catch (error) {
    console.error('Admin subscriptions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!await isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData = updateSubscriptionSchema.parse(body);

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        ...(updateData.plan && { plan: updateData.plan }),
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.currentPeriodEnd && { 
          currentPeriodEnd: new Date(updateData.currentPeriodEnd) 
        }),
        updatedAt: new Date()
      }
    });

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_SUBSCRIPTION',
        resource: 'subscription',
        metadata: {
          subscriptionId,
          changes: updateData
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Subscription updated successfully',
      subscription: updatedSubscription
    });

  } catch (error) {
    console.error('Admin subscription update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!await isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Cancel subscription (set to cancel at period end)
    const cancelledSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
        status: 'canceled',
        updatedAt: new Date()
      }
    });

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CANCEL_SUBSCRIPTION',
        resource: 'subscription',
        metadata: {
          subscriptionId,
          userId: existingSubscription.userId
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Subscription cancelled successfully',
      subscription: cancelledSubscription
    });

  } catch (error) {
    console.error('Admin subscription cancel error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

// Helper function to get plan price
function getPlanPrice(plan: string): number {
  const prices: Record<string, number> = {
    free: 0,
    basic: 9.99,
    premium: 19.99,
    ultimate: 39.99
  };
  return prices[plan] || 0;
}