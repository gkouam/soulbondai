import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin-auth';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  content: z.string().min(1),
  isHtml: z.boolean().optional().default(true)
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
    const { to, subject, content, isHtml } = emailSchema.parse(body);

    // Send email using your email service
    await sendEmail({
      to,
      subject,
      html: isHtml ? content : undefined,
      text: !isHtml ? content : undefined,
    });

    // Log the email send action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SEND_EMAIL',
        resource: 'email',
        metadata: {
          to,
          subject,
          sentAt: new Date().toISOString()
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Send email error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}