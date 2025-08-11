import Link from 'next/link'
import { Metadata } from 'next'
import { Calendar, Clock, ArrowRight, Tag, User } from 'lucide-react'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Blog - SoulBond AI | AI Companionship Insights',
  description: 'Explore articles about AI companionship, emotional wellness, technology trends, and tips for getting the most out of your AI companion.',
  openGraph: {
    title: 'SoulBond AI Blog - AI Companionship Insights',
    description: 'Explore articles about AI companionship, emotional wellness, and technology trends.',
    images: ['/og-blog.png'],
  },
}

// This would typically come from a database or CMS
const blogPosts = [
  {
    id: 1,
    slug: 'understanding-ai-companionship',
    title: 'Understanding AI Companionship: A Guide for Beginners',
    excerpt: 'Learn how AI companions work, their benefits for mental wellness, and how to get started with your own digital companion.',
    author: 'Dr. Sarah Johnson',
    date: '2025-01-15',
    readTime: '5 min read',
    category: 'AI Technology',
    featured: true,
    image: '/blog/ai-companion-guide.jpg',
    tags: ['AI', 'Getting Started', 'Mental Health'],
  },
  {
    id: 2,
    slug: 'emotional-wellness-ai',
    title: 'How AI Companions Support Emotional Wellness',
    excerpt: 'Discover the science behind AI emotional support and how technology is revolutionizing mental health care.',
    author: 'Michael Chen',
    date: '2025-01-12',
    readTime: '7 min read',
    category: 'Mental Health',
    featured: true,
    image: '/blog/emotional-wellness.jpg',
    tags: ['Mental Health', 'Wellness', 'Research'],
  },
  {
    id: 3,
    slug: 'privacy-security-ai-companions',
    title: 'Privacy and Security in AI Companionship',
    excerpt: 'Understanding how your data is protected and what measures we take to ensure your conversations remain private.',
    author: 'Alex Rivera',
    date: '2025-01-10',
    readTime: '4 min read',
    category: 'Security',
    featured: false,
    image: '/blog/privacy-security.jpg',
    tags: ['Privacy', 'Security', 'Data Protection'],
  },
  {
    id: 4,
    slug: 'future-of-ai-relationships',
    title: 'The Future of AI Relationships: What to Expect',
    excerpt: 'Exploring upcoming trends and innovations in AI companionship technology and what they mean for users.',
    author: 'Dr. Emily Watson',
    date: '2025-01-08',
    readTime: '6 min read',
    category: 'Future Trends',
    featured: false,
    image: '/blog/future-ai.jpg',
    tags: ['Future', 'Innovation', 'Technology'],
  },
  {
    id: 5,
    slug: 'personalization-in-ai',
    title: 'The Power of Personalization in AI Companions',
    excerpt: 'How machine learning creates unique, personalized experiences that adapt to your personality and preferences.',
    author: 'James Liu',
    date: '2025-01-05',
    readTime: '5 min read',
    category: 'AI Technology',
    featured: false,
    image: '/blog/personalization.jpg',
    tags: ['Personalization', 'Machine Learning', 'User Experience'],
  },
  {
    id: 6,
    slug: 'ai-companion-success-stories',
    title: 'Real Stories: How AI Companions Changed Lives',
    excerpt: 'Inspiring testimonials from users who have found support, friendship, and growth through AI companionship.',
    author: 'Maria Garcia',
    date: '2025-01-03',
    readTime: '8 min read',
    category: 'User Stories',
    featured: true,
    image: '/blog/success-stories.jpg',
    tags: ['User Stories', 'Testimonials', 'Impact'],
  },
]

const categories = [
  { name: 'All Posts', count: blogPosts.length },
  { name: 'AI Technology', count: 2 },
  { name: 'Mental Health', count: 1 },
  { name: 'Security', count: 1 },
  { name: 'Future Trends', count: 1 },
  { name: 'User Stories', count: 1 },
]

export default function BlogPage() {
  const featuredPosts = blogPosts.filter(post => post.featured)
  const recentPosts = blogPosts.filter(post => !post.featured)

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
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/blog" className="text-white font-medium">
                Blog
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                Contact
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

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            SoulBond AI{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Blog
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Explore the latest insights on AI companionship, emotional wellness, and the future of human-AI relationships.
          </p>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8">Featured Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredPosts.map((post) => (
              <article
                key={post.id}
                className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300"
              >
                <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/50 text-sm">Featured Image</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-400 transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-gray-400 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="w-3 h-3" />
                      <span>{post.author}</span>
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Posts & Sidebar */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Recent Posts */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-white mb-8">Recent Posts</h2>
              <div className="space-y-8">
                {recentPosts.map((post) => (
                  <article
                    key={post.id}
                    className="flex gap-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                  >
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg flex-shrink-0" />
                    <div className="flex-grow">
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.date).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2 hover:text-purple-400 transition-colors">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>
                      <p className="text-gray-400 mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">By {post.author}</span>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          Read More →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Categories */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Categories</h3>
                <ul className="space-y-3">
                  {categories.map((category) => (
                    <li key={category.name}>
                      <Link
                        href={`/blog/category/${category.name.toLowerCase().replace(' ', '-')}`}
                        className="flex items-center justify-between text-gray-400 hover:text-white transition-colors"
                      >
                        <span>{category.name}</span>
                        <span className="text-sm bg-white/10 px-2 py-1 rounded">
                          {category.count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter */}
              <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Stay Updated</h3>
                <p className="text-gray-400 mb-4">
                  Get the latest articles and insights delivered to your inbox.
                </p>
                <form className="space-y-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Subscribe
                  </button>
                </form>
              </div>

              {/* Popular Tags */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {['AI', 'Mental Health', 'Privacy', 'Technology', 'Wellness', 'Future', 'Security'].map(
                    (tag) => (
                      <Link
                        key={tag}
                        href={`/blog/tag/${tag.toLowerCase().replace(' ', '-')}`}
                        className="px-3 py-1 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        {tag}
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}