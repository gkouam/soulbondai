import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name: string;
  plan?: 'free' | 'basic' | 'premium' | 'ultimate';
}

export class AuthHelper {
  constructor(private page: Page) {}

  async login(user: TestUser) {
    await this.page.goto('/auth/login');
    await this.page.fill('input[type="email"]', user.email);
    await this.page.fill('input[type="password"]', user.password);
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('**/dashboard/**', { timeout: 10000 });
  }

  async register(user: TestUser) {
    await this.page.goto('/auth/register');
    await this.page.fill('input[id="name"]', user.name);
    await this.page.fill('input[id="email"]', user.email);
    await this.page.fill('input[id="password"]', user.password);
    await this.page.fill('input[id="confirmPassword"]', user.password);
    
    // Accept terms
    await this.page.check('input[type="checkbox"]');
    
    // Submit form
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect to onboarding or dashboard
    await this.page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 10000 });
  }

  async logout() {
    // Click user menu
    await this.page.click('[data-testid="user-menu-button"]');
    // Click logout
    await this.page.click('[data-testid="logout-button"]');
    // Wait for redirect to home
    await this.page.waitForURL('/');
  }

  async isLoggedIn(): Promise<boolean> {
    // Check if we can access a protected route
    await this.page.goto('/dashboard');
    const url = this.page.url();
    return !url.includes('/auth/login');
  }

  async setupAuthenticatedSession(user: TestUser) {
    // Try to login, register if it fails
    try {
      await this.login(user);
    } catch (error) {
      await this.register(user);
    }
  }
}