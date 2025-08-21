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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const risk = searchParams.get('risk');
    const personality = searchParams.get('personality');
    const status = searchParams.get('status');
    const dateRange = searchParams.get('dateRange');
    const sortBy = searchParams.get('sortBy') || 'lastMessageAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          messages: {
            some: {
              content: { contains: search, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    if (risk) {
      // Calculate risk level based on message content and patterns
      where.messages = {
        some: {
          OR: [
            { flagged: risk === 'high' ? true : undefined },
            { toxicityScore: risk === 'high' ? { gte: 0.7 } : risk === 'medium' ? { gte: 0.4, lt: 0.7 } : { lt: 0.4 } }
          ]
        }
      };
    }

    if (personality) {
      where.personality = {
        archetype: personality
      };
    }

    if (status) {
      switch (status) {
        case 'active':
          where.isActive = true;
          break;
        case 'flagged':
          where.flagged = true;
          break;
        case 'archived':
          where.archived = true;
          break;
        case 'crisis':
          where.containsCrisisContent = true;
          break;
        case 'sanctioned':
          where.user = {
            sanctions: {
              some: {
                expiresAt: { gte: new Date() }
              }
            }
          };
          break;
      }
    }

    if (dateRange) {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }
      
      where.createdAt = { gte: startDate };
    }

    // Get total count
    const totalCount = await prisma.conversation.count({ where });

    // Fetch conversations with pagination
    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        },
        personality: {
          select: {
            id: true,
            name: true,
            archetype: true
          }
        },
        messages: {
          select: {
            id: true,
            flagged: true,
            toxicityScore: true,
            sentiment: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: sortBy === 'messageCount' 
        ? { messages: { _count: sortOrder as 'asc' | 'desc' } }
        : { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    });

    // Process conversations to add calculated fields
    const processedConversations = conversations.map(conv => {
      const flaggedMessages = conv.messages.filter(m => m.flagged).length;
      const highToxicityMessages = conv.messages.filter(m => m.toxicityScore && m.toxicityScore > 0.7).length;
      const totalMessages = conv._count.messages;
      
      // Calculate risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (flaggedMessages > 5 || highToxicityMessages > 3 || conv.containsCrisisContent) {
        riskLevel = 'high';
      } else if (flaggedMessages > 2 || highToxicityMessages > 1) {
        riskLevel = 'medium';
      }

      // Calculate average sentiment
      const sentimentScores = conv.messages
        .filter(m => m.sentiment !== null)
        .map(m => {
          if (m.sentiment === 'positive') return 1;
          if (m.sentiment === 'negative') return -1;
          return 0;
        });
      
      const averageSentiment = sentimentScores.length > 0
        ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
        : 0;

      return {
        id: conv.id,
        userId: conv.userId,
        personalityId: conv.personalityId,
        title: conv.title,
        messageCount: totalMessages,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
        isActive: conv.isActive,
        flagged: conv.flagged,
        archived: conv.archived,
        containsCrisisContent: conv.containsCrisisContent,
        user: conv.user,
        personality: conv.personality,
        _count: conv._count,
        riskLevel,
        averageSentiment
      };
    });

    // Calculate stats
    const stats = {
      totalConversations: totalCount,
      activeConversations: await prisma.conversation.count({ where: { ...where, isActive: true } }),
      flaggedConversations: await prisma.conversation.count({ where: { ...where, flagged: true } }),
      crisisConversations: await prisma.conversation.count({ where: { ...where, containsCrisisContent: true } }),
      archivedConversations: await prisma.conversation.count({ where: { ...where, archived: true } }),
      totalMessages: await prisma.message.count({
        where: {
          conversation: where
        }
      }),
      averageMessagesPerConversation: totalCount > 0
        ? (await prisma.message.count({ where: { conversation: where } })) / totalCount
        : 0,
      conversationsToday: await prisma.conversation.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      uniqueUsers: await prisma.conversation.groupBy({
        by: ['userId'],
        where,
        _count: true
      }).then(groups => groups.length),
      averageResponseTime: 2.3 // Placeholder - would calculate from actual response times
    };

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'VIEW_CONVERSATIONS',
        resource: 'conversations',
        metadata: {
          filters: { search, risk, personality, status, dateRange },
          page,
          limit
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      conversations: processedConversations,
      stats,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });

  } catch (error) {
    console.error('Fetch conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}