import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin-auth';

function convertToCSV(users: any[]): string {
  if (users.length === 0) return '';

  // Define CSV headers
  const headers = [
    'ID',
    'Name',
    'Email',
    'Role',
    'Status',
    'Subscription',
    'Email Verified',
    'Phone',
    'Phone Verified',
    'Messages Count',
    'Conversations Count',
    'Created At',
    'Last Active At'
  ];

  // Create CSV rows
  const rows = users.map(user => [
    user.id,
    user.name || '',
    user.email,
    user.role,
    user.isActive ? 'Active' : 'Inactive',
    user.subscriptionStatus || 'FREE',
    user.emailVerified ? 'Yes' : 'No',
    user.phone || '',
    user.phoneVerified ? 'Yes' : 'No',
    user._count?.messages || 0,
    user._count?.conversations || 0,
    user.createdAt ? new Date(user.createdAt).toISOString() : '',
    user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : ''
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
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const subscription = searchParams.get('subscription');
    const limit = parseInt(searchParams.get('limit') || '10000');

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role && role !== 'all') {
      where.role = role;
    }
    
    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }

    if (subscription && subscription !== 'all') {
      where.subscriptionStatus = subscription;
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        phone: true,
        phoneVerified: true,
        createdAt: true,
        lastActiveAt: true,
        subscriptionStatus: true,
        _count: {
          select: {
            messages: true,
            conversations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Convert to CSV
    const csv = convertToCSV(users);

    // Log the export action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPORT_USERS',
        resource: 'users',
        metadata: {
          count: users.length,
          filters: { search, role, status, subscription }
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
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Export users error:', error);
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    );
  }
}