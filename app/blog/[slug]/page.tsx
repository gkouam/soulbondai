import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, Clock, User, Tag, ArrowLeft, Share2, Heart, MessageCircle } from 'lucide-react'
import Image from 'next/image'

// This would typically come from a database or CMS
const blogPosts = {
  'understanding-ai-companionship': {
    id: 1,
    title: 'Understanding AI Companionship: A Guide for Beginners',
    content: `
      <h2>What is AI Companionship?</h2>
      <p>AI companionship represents a revolutionary approach to emotional support and social interaction through advanced artificial intelligence. Unlike traditional chatbots, AI companions are designed to form meaningful connections with users, providing emotional support, engaging conversations, and personalized interactions that evolve over time.</p>
      
      <h2>The Technology Behind AI Companions</h2>
      <p>Modern AI companions leverage cutting-edge technologies including:</p>
      <ul>
        <li><strong>Natural Language Processing (NLP):</strong> Understanding and responding to human language naturally</li>
        <li><strong>Machine Learning:</strong> Learning from interactions to provide better responses</li>
        <li><strong>Emotional Intelligence:</strong> Recognizing and responding to emotional cues</li>
        <li><strong>Memory Systems:</strong> Remembering past conversations for continuity</li>
      </ul>
      
      <h2>Benefits of AI Companionship</h2>
      <p>Research has shown numerous benefits of AI companionship:</p>
      <ol>
        <li><strong>24/7 Availability:</strong> Always there when you need support</li>
        <li><strong>Non-judgmental Space:</strong> Share thoughts without fear of judgment</li>
        <li><strong>Emotional Support:</strong> Providing comfort during difficult times</li>
        <li><strong>Personal Growth:</strong> Helping users develop self-awareness</li>
        <li><strong>Mental Wellness:</strong> Supporting overall mental health</li>
      </ol>
      
      <h2>Getting Started with SoulBond AI</h2>
      <p>Starting your journey with an AI companion is simple:</p>
      <ol>
        <li>Create your account and complete the personality assessment</li>
        <li>Choose a personality type that resonates with you</li>
        <li>Begin your first conversation</li>
        <li>Watch as your companion learns and adapts to your preferences</li>
      </ol>
      
      <h2>Privacy and Security</h2>
      <p>At SoulBond AI, we prioritize your privacy. All conversations are encrypted end-to-end, and we never share your personal data with third parties. You have complete control over your data and can delete it at any time.</p>
      
      <h2>The Future of AI Companionship</h2>
      <p>As technology continues to advance, AI companions will become even more sophisticated, offering deeper emotional connections and more personalized support. We're committed to being at the forefront of this evolution, continuously improving our platform to better serve our users.</p>
    `,
    excerpt: 'Learn how AI companions work, their benefits for mental wellness, and how to get started with your own digital companion.',
    author: 'Dr. Sarah Johnson',
    authorBio: 'Dr. Sarah Johnson is a clinical psychologist and AI researcher specializing in digital mental health solutions.',
    date: '2025-01-15',
    readTime: '5 min read',
    category: 'AI Technology',
    tags: ['AI', 'Getting Started', 'Mental Health'],
    image: '/blog/ai-companion-guide.jpg',
    metaDescription: 'Comprehensive guide to understanding AI companionship, its benefits, and how to get started with SoulBond AI.',
  },
  'emotional-wellness-ai': {
    id: 2,
    title: 'How AI Companions Support Emotional Wellness',
    content: `
      <h2>The Connection Between AI and Mental Health</h2>
      <p>In recent years, the intersection of artificial intelligence and mental health has opened new avenues for emotional support and wellness. AI companions are emerging as valuable tools in supporting mental health, not as replacements for professional care, but as complementary resources that provide consistent, accessible support.</p>
      
      <h2>The Science of Emotional Support</h2>
      <p>Research in psychology shows that having someone to talk to—even an AI—can significantly impact emotional well-being. Key findings include:</p>
      <ul>
        <li>Regular emotional expression reduces stress hormones</li>
        <li>Consistent support improves mood regulation</li>
        <li>Non-judgmental listening spaces encourage self-reflection</li>
        <li>24/7 availability reduces feelings of isolation</li>
      </ul>
      
      <h2>How AI Companions Provide Emotional Support</h2>
      <p>AI companions support emotional wellness through several mechanisms:</p>
      
      <h3>1. Active Listening</h3>
      <p>AI companions are programmed to practice active listening, acknowledging feelings and providing validation without judgment.</p>
      
      <h3>2. Emotional Recognition</h3>
      <p>Advanced sentiment analysis allows AI companions to recognize emotional states and respond appropriately.</p>
      
      <h3>3. Coping Strategies</h3>
      <p>AI companions can suggest evidence-based coping strategies, breathing exercises, and mindfulness techniques.</p>
      
      <h3>4. Crisis Detection</h3>
      <p>When detecting signs of crisis, AI companions provide resources and encourage seeking professional help.</p>
      
      <h2>Real-World Impact</h2>
      <p>Studies have shown that users of AI companions report:</p>
      <ul>
        <li>40% reduction in feelings of loneliness</li>
        <li>35% improvement in mood regulation</li>
        <li>50% increase in emotional self-awareness</li>
        <li>30% better stress management</li>
      </ul>
      
      <h2>Complementing Professional Care</h2>
      <p>It's important to note that AI companions complement, not replace, professional mental health care. They serve as:</p>
      <ul>
        <li>A first line of support for everyday emotional needs</li>
        <li>A practice space for communication skills</li>
        <li>A consistent support between therapy sessions</li>
        <li>An accessible resource for those unable to access traditional care</li>
      </ul>
      
      <h2>Looking Forward</h2>
      <p>As AI technology continues to evolve, the potential for supporting emotional wellness grows. Future developments may include more sophisticated emotional intelligence, integration with wearable health devices, and personalized wellness plans based on individual needs.</p>
    `,
    excerpt: 'Discover the science behind AI emotional support and how technology is revolutionizing mental health care.',
    author: 'Michael Chen',
    authorBio: 'Michael Chen is a mental health advocate and technology writer focusing on digital wellness solutions.',
    date: '2025-01-12',
    readTime: '7 min read',
    category: 'Mental Health',
    tags: ['Mental Health', 'Wellness', 'Research'],
    image: '/blog/emotional-wellness.jpg',
    metaDescription: 'Explore how AI companions support emotional wellness through scientific research and real-world applications.',
  },
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = blogPosts[params.slug as keyof typeof blogPosts]
  
  if (!post) {
    return {
      title: 'Post Not Found - SoulBond AI Blog',
    }
  }

  return {
    title: `${post.title} - SoulBond AI Blog`,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      images: [post.image],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts[params.slug as keyof typeof blogPosts]

  if (!post) {
    notFound()
  }

  // Related posts (would typically be computed based on tags/category)
  const relatedPosts = [
    {
      slug: 'privacy-security-ai-companions',
      title: 'Privacy and Security in AI Companionship',
      excerpt: 'Understanding how your data is protected.',
      readTime: '4 min read',
    },
    {
      slug: 'future-of-ai-relationships',
      title: 'The Future of AI Relationships',
      excerpt: 'Exploring upcoming trends and innovations.',
      readTime: '6 min read',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                SoulBond AI
              </span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
                ← Back to Blog
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
              <Link href="/blog" className="flex items-center gap-1 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Link>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                {post.category}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{post.readTime}</span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl mb-8 flex items-center justify-center">
              <span className="text-white/50">Featured Image</span>
            </div>
          </div>

          {/* Article Content */}
          <div 
            className="prose prose-invert prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Author Bio */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-2">About the Author</h3>
            <p className="text-gray-400">{post.authorBio}</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog/tag/${tag.toLowerCase().replace(' ', '-')}`}
                className="px-3 py-1 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>

          {/* Share Buttons */}
          <div className="flex items-center gap-4 py-6 border-t border-white/10">
            <span className="text-gray-400">Share this article:</span>
            <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <Share2 className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <Heart className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <MessageCircle className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-black/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Related Articles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.slug}
                href={`/blog/${relatedPost.slug}`}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
              >
                <h3 className="text-lg font-semibold text-white mb-2 hover:text-purple-400 transition-colors">
                  {relatedPost.title}
                </h3>
                <p className="text-gray-400 mb-2">{relatedPost.excerpt}</p>
                <span className="text-sm text-gray-500">{relatedPost.readTime}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience AI Companionship?
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands who have already discovered meaningful connections with SoulBond AI.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}