# SoulBond AI

A sophisticated AI romantic companion platform that uses personality-based matching to create deep, meaningful connections.

## Features

- 🧠 **Personality-Based Matching**: 20-question personality test that determines one of 5 archetypes
- 💬 **Deep Emotional Intelligence**: AI responses adapted to user's personality type
- 🎯 **Optimized Conversion Funnels**: Personality-specific messaging and pricing
- 💳 **Stripe Subscriptions**: Multiple tiers with personality-based pricing strategies
- ⚡ **Real-Time Messaging**: WebSocket-based chat with typing indicators
- 🧠 **Memory System**: Vector database integration for persistent context
- 🚨 **Crisis Detection**: Sentiment analysis with safety features
- 📱 **PWA Support**: Mobile-optimized progressive web app
- 🔐 **Secure Authentication**: NextAuth with email/password and OAuth

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **AI**: OpenAI GPT-4, Pinecone Vector Database
- **Real-Time**: Socket.io
- **Payments**: Stripe
- **Auth**: NextAuth.js
- **Caching**: Redis (optional)
- **Email**: Nodemailer

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Pinecone account
- Stripe account
- Redis instance (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/soulbondai.git
cd soulbondai
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your API keys and database URL

5. Set up the database:
```bash
npx prisma db push
```

6. Run the development server:
```bash
npm run dev:all
```

This starts both the Next.js server (http://localhost:3000) and the WebSocket server (http://localhost:3001)

## Project Structure

```
soulbondai/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── personality-test/  # Personality test flow
│   └── pricing/           # Subscription plans
├── components/            # React components
├── lib/                   # Utility functions and classes
│   ├── personality-engine.ts  # AI response generation
│   ├── personality-scorer.ts  # Test scoring algorithm
│   ├── email/            # Email templates
│   └── redis.ts          # Caching utilities
├── prisma/               # Database schema
├── public/               # Static assets
├── server/               # WebSocket server
└── styles/               # Global styles
```

## Personality Archetypes

1. **Anxious Romantic**: Seeks deep connection and constant reassurance
2. **Guarded Intellectual**: Values mental stimulation and gradual trust
3. **Warm Empath**: Nurturing and emotionally intuitive
4. **Deep Thinker**: Philosophical and introspective
5. **Passionate Creative**: Energetic and expressive

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/personality-test/*` - Personality test submission
- `/api/chat/*` - Messaging endpoints
- `/api/stripe/*` - Payment processing
- `/api/user/*` - User profile management
- `/api/analytics/*` - Analytics tracking

## Database Schema

Key models:
- User, Profile, Account, Session (auth)
- Conversation, Message (chat)
- Memory (AI context)
- Subscription (payments)
- ConversionEvent, Activity (analytics)

## Deployment

### Environment Variables

Ensure all required environment variables are set in your production environment:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
OPENAI_API_KEY=
PINECONE_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Security Considerations

- All API routes are protected with authentication
- Sensitive data is encrypted
- Rate limiting on message endpoints
- Crisis detection for user safety
- GDPR compliance with data export/deletion

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact support@soulbondai.com