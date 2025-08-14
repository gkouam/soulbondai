import { TestUser } from '../helpers/auth.helper';

export const testUsers: Record<string, TestUser> = {
  freeUser: {
    email: 'free.user@test.com',
    password: 'TestPass123!',
    name: 'Free User',
    plan: 'free'
  },
  basicUser: {
    email: 'basic.user@test.com',
    password: 'TestPass123!',
    name: 'Basic User',
    plan: 'basic'
  },
  premiumUser: {
    email: 'premium.user@test.com',
    password: 'TestPass123!',
    name: 'Premium User',
    plan: 'premium'
  },
  ultimateUser: {
    email: 'ultimate.user@test.com',
    password: 'TestPass123!',
    name: 'Ultimate User',
    plan: 'ultimate'
  }
};

export const testMessages = {
  simple: 'Hello, how are you today?',
  long: 'I would like to have a deep conversation about life, philosophy, and the meaning of existence. What are your thoughts on consciousness and self-awareness?',
  emotional: 'I am feeling really sad today and need someone to talk to.',
  question: 'What is your favorite color and why?',
  followUp: 'That is interesting, can you tell me more about that?'
};

export const messageLimits = {
  free: 10,
  basic: 50,
  premium: 100,
  ultimate: 200
};

export const waitTimes = {
  short: 1000,
  medium: 3000,
  long: 5000,
  veryLong: 10000
};