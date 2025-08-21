import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin-auth';
import { sendEmail, createAdminEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(await isAdmin(session.user.email))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { userId, type, reason, duration } = await request.json();

    if (!userId || !type || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate expiration date for suspensions
    let expiresAt = null;
    if (type === 'SUSPENSION' && duration) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration);
    }

    // Create sanction record
    const sanction = await prisma.sanction.create({
      data: {
        userId,
        type,
        reason,
        duration: type === 'SUSPENSION' ? duration : null,
        expiresAt,
        adminId: session.user.id,
        adminEmail: session.user.email || 'admin@soulbondai.com'
      }
    });

    // Update user status based on sanction type
    let updateData: any = {};
    
    switch (type) {
      case 'WARNING':
        updateData = {
          warningCount: { increment: 1 }
        };
        break;
      
      case 'SUSPENSION':
        updateData = {
          isActive: false,
          suspendedAt: new Date(),
          suspendedUntil: expiresAt
        };
        break;
      
      case 'BAN':
        updateData = {
          isActive: false,
          isBanned: true,
          bannedAt: new Date()
        };
        break;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Send email notification to user
    let emailSubject = '';
    let emailContent = '';

    switch (type) {
      case 'WARNING':
        emailSubject = 'Important: Account Warning from SoulBond AI';
        emailContent = `
          <p>This is an official warning regarding your account activity on SoulBond AI.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please review our community guidelines and ensure your future interactions comply with our terms of service.</p>
          <p>Continued violations may result in suspension or termination of your account.</p>
        `;
        break;
      
      case 'SUSPENSION':
        emailSubject = 'Account Suspended - SoulBond AI';
        emailContent = `
          <p>Your SoulBond AI account has been temporarily suspended.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Duration:</strong> ${duration} days</p>
          <p><strong>Suspension ends:</strong> ${expiresAt?.toLocaleDateString()}</p>
          <p>You will not be able to access your account until the suspension period ends.</p>
          <p>If you believe this action was taken in error, please contact our support team.</p>
        `;
        break;
      
      case 'BAN':
        emailSubject = 'Account Terminated - SoulBond AI';
        emailContent = `
          <p>Your SoulBond AI account has been permanently terminated due to severe or repeated violations of our terms of service.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>This decision is final and your account cannot be restored.</p>
          <p>You are prohibited from creating new accounts on our platform.</p>
        `;
        break;
    }

    try {
      await sendEmail({
        to: user.email,
        subject: emailSubject,
        html: createAdminEmailTemplate(emailContent, user.name || undefined)
      });
    } catch (emailError) {
      console.error('Failed to send sanction email:', emailError);
      // Continue even if email fails
    }

    // Log the sanction action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `APPLY_${type}`,
        resource: 'user',
        resourceId: userId,
        metadata: {
          sanctionId: sanction.id,
          userEmail: user.email,
          reason,
          duration: duration || null,
          expiresAt: expiresAt?.toISOString() || null
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      sanction: {
        id: sanction.id,
        type: sanction.type,
        expiresAt: sanction.expiresAt
      }
    });

  } catch (error) {
    console.error('Apply sanction error:', error);
    return NextResponse.json(
      { error: 'Failed to apply sanction' },
      { status: 500 }
    );
  }
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Fetch user's sanctions
    const sanctions = await prisma.sanction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      sanctions
    });

  } catch (error) {
    console.error('Fetch sanctions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sanctions' },
      { status: 500 }
    );
  }
}