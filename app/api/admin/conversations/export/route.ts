import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin-auth';

function convertToCSV(conversations: any[]): string {
  if (conversations.length === 0) return '';

  // Define CSV headers
  const headers = [
    'Conversation ID',
    'User Email',
    'User Name',
    'Personality',
    'Message Count',
    'Risk Level',
    'Status',
    'Flagged',
    'Archived',
    'Crisis Content',
    'Created At',
    'Last Message At',
    'Average Sentiment'
  ];

  // Create CSV rows
  const rows = conversations.map(conv => [
    conv.id,
    conv.user.email,
    conv.user.name || '',
    `${conv.personality.name} (${conv.personality.archetype})`,
    conv._count.messages,
    conv.riskLevel,
    conv.isActive ? 'Active' : 'Inactive',
    conv.flagged ? 'Yes' : 'No',
    conv.archived ? 'Yes' : 'No',
    conv.containsCrisisContent ? 'Yes' : 'No',
    conv.createdAt ? new Date(conv.createdAt).toISOString() : '',
    conv.lastMessageAt ? new Date(conv.lastMessageAt).toISOString() : '',
    conv.averageSentiment?.toFixed(2) || 'N/A'
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape cells containing commas or quotes
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');

  return csvContent;
}

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
    const search = searchParams.get('search');
    const risk = searchParams.get('risk');
    const personality = searchParams.get('personality');
    const status = searchParams.get('status');
    const dateRange = searchParams.get('dateRange');
    const limit = parseInt(searchParams.get('limit') || '10000');

    // Build where clause (same as main GET endpoint)
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
        }
      ];
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

    // Fetch conversations
    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        personality: {
          select: {
            name: true,
            archetype: true
          }
        },
        messages: {
          select: {
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
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Process conversations to add calculated fields
    const processedConversations = conversations.map(conv => {
      const flaggedMessages = conv.messages.filter(m => m.flagged).length;
      const highToxicityMessages = conv.messages.filter(m => m.toxicityScore && m.toxicityScore > 0.7).length;
      
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
        : null;

      return {
        ...conv,
        riskLevel,
        averageSentiment
      };
    });

    // Convert to CSV
    const csv = convertToCSV(processedConversations);

    // Log the export action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPORT_CONVERSATIONS',
        resource: 'conversations',
        metadata: {
          count: conversations.length,
          filters: { search, risk, personality, status, dateRange }
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="conversations-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Export conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to export conversations' },
      { status: 500 }
    );
  }
}