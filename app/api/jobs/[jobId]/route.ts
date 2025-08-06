import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { queues } from '@/lib/queue/queues'

export async function GET(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { jobId } = params
    
    // Check all queues for the job
    let job = null
    let queueName = null
    
    for (const [name, queue] of Object.entries(queues)) {
      const foundJob = await queue.getJob(jobId)
      if (foundJob) {
        job = foundJob
        queueName = name
        break
      }
    }
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }
    
    // Verify job belongs to user
    if (job.data.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    // Get job state
    const state = await job.getState()
    const progress = job.progress
    
    return NextResponse.json({
      id: job.id,
      queue: queueName,
      state,
      progress,
      data: {
        // Only return safe data
        conversationId: job.data.conversationId,
        messageId: job.data.messageId,
      },
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      createdAt: new Date(job.timestamp).toISOString(),
      processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
    })
  } catch (error) {
    console.error('Get job status error:', error)
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    )
  }
}