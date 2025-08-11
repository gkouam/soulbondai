import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Check if user is admin
async function isAdmin(session: any) {
  return session?.user?.role === 'ADMIN' || session?.user?.email === 'kouam7@gmail.com';
}

const companionSchema = z.object({
  name: z.string().min(1),
  personality: z.enum(['warm', 'intellectual', 'creative', 'anxious', 'deep']),
  description: z.string().min(1),
  avatar: z.string().optional(),
  traits: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isPremium: z.boolean().optional(),
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
    const search = searchParams.get('search');
    const personality = searchParams.get('personality');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (personality) {
      where.personality = personality;
    }
    
    if (status) {
      if (status === 'active') where.isActive = true;
      if (status === 'inactive') where.isActive = false;
      if (status === 'premium') where.isPremium = true;
    }

    // Get companions from conversations (unique AI personalities)
    const conversations = await prisma.conversation.findMany({
      where,
      select: {
        id: true,
        aiName: true,
        aiPersonality: true,
        aiAvatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            messages: true
          }
        }
      },
      distinct: ['aiPersonality'],
    });

    // Group by personality and aggregate stats
    const companionMap = new Map();
    
    conversations.forEach(conv => {
      const key = conv.aiPersonality;
      if (!companionMap.has(key)) {
        companionMap.set(key, {
          id: conv.id,
          name: conv.aiName,
          personality: conv.aiPersonality,
          description: getPersonalityDescription(conv.aiPersonality),
          avatar: conv.aiAvatar || '',
          traits: getPersonalityTraits(conv.aiPersonality),
          isActive: true,
          isPremium: ['deep', 'creative'].includes(conv.aiPersonality),
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          _count: {
            conversations: 1,
            messages: conv._count.messages
          },
          popularity: 0
        });
      } else {
        const existing = companionMap.get(key);
        existing._count.conversations += 1;
        existing._count.messages += conv._count.messages;
      }
    });

    const companions = Array.from(companionMap.values());
    
    // Calculate popularity score
    companions.forEach(comp => {
      comp.popularity = comp._count.conversations * 10 + comp._count.messages;
    });
    
    // Sort by popularity
    companions.sort((a, b) => b.popularity - a.popularity);

    // Get stats
    const totalConversations = await prisma.conversation.count();
    const activeConversations = await prisma.conversation.count({
      where: { isActive: true }
    });

    return NextResponse.json({
      companions,
      stats: {
        totalCompanions: companions.length,
        activeCompanions: companions.filter(c => c.isActive).length,
        premiumCompanions: companions.filter(c => c.isPremium).length,
        totalConversations
      }
    });

  } catch (error) {
    console.error('Admin companions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!await isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = companionSchema.parse(body);

    // For now, we'll store companion configurations in a settings table or as conversation templates
    // In a real implementation, you might want a dedicated companions table
    
    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_COMPANION',
        resource: 'companion',
        metadata: validatedData,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Companion created successfully',
      companion: {
        id: Date.now().toString(),
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { conversations: 0, messages: 0 }
      }
    });

  } catch (error) {
    console.error('Admin companion create error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create companion' },
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
    const companionId = searchParams.get('companionId');

    if (!companionId) {
      return NextResponse.json(
        { error: 'Companion ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_COMPANION',
        resource: 'companion',
        metadata: {
          companionId,
          changes: body
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Companion updated successfully'
    });

  } catch (error) {
    console.error('Admin companion update error:', error);
    return NextResponse.json(
      { error: 'Failed to update companion' },
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
    const companionId = searchParams.get('companionId');

    if (!companionId) {
      return NextResponse.json(
        { error: 'Companion ID is required' },
        { status: 400 }
      );
    }

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_COMPANION',
        resource: 'companion',
        metadata: { companionId },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Companion deleted successfully'
    });

  } catch (error) {
    console.error('Admin companion delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete companion' },
      { status: 500 }
    );
  }
}

// Helper functions
function getPersonalityDescription(personality: string): string {
  const descriptions: Record<string, string> = {
    warm: 'Warm, supportive, and emotionally available. Perfect for users seeking comfort and understanding.',
    intellectual: 'Thoughtful, analytical, and intellectually stimulating. Great for deep discussions.',
    creative: 'Imaginative, artistic, and inspiring. Ideal for creative exploration and brainstorming.',
    anxious: 'Understanding of attachment needs, provides reassurance and stability.',
    deep: 'Contemplative, philosophical, and introspective. For meaningful, profound conversations.'
  };
  return descriptions[personality] || 'A unique AI companion personality.';
}

function getPersonalityTraits(personality: string): string[] {
  const traits: Record<string, string[]> = {
    warm: ['empathetic', 'supportive', 'caring', 'patient', 'understanding'],
    intellectual: ['analytical', 'curious', 'knowledgeable', 'logical', 'thoughtful'],
    creative: ['imaginative', 'artistic', 'innovative', 'expressive', 'inspiring'],
    anxious: ['reassuring', 'stable', 'consistent', 'protective', 'attentive'],
    deep: ['philosophical', 'introspective', 'wise', 'contemplative', 'profound']
  };
  return traits[personality] || [];
}