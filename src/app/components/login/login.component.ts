import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container container">
      <div class="auth-card glass-card animate-fade-in-up">
        <div class="auth-header">
          <div class="brand-icon">💸</div>
          <h1 class="auth-title">Welcome Back</h1>
          <p class="auth-subtitle">Log in to manage your shared expenses</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              class="form-input" 
              placeholder="name@example.com"
              [(ngModel)]="email" 
              required
              email
              #emailInput="ngModel"
              [class.error]="emailInput.invalid && (emailInput.dirty || emailInput.touched || submitted)">
            <span class="form-error" *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched || submitted)">
              Please enter a valid email.
            </span>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password"
              class="form-input" 
              placeholder="••••••••"
              [(ngModel)]="password" 
              required
              #passwordInput="ngModel"
              [class.error]="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched || submitted)">
            <span class="form-error" *ngIf="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched || submitted)">
              Password is required.
            </span>
          </div>

          <div class="form-error auth-error" *ngIf="errorMessage">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
             {{ errorMessage }}
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full">
            Log In
          </button>

          <div class="auth-divider">
            <span>or continue with</span>
          </div>

          <button type="button" class="btn btn-secondary btn-lg w-full google-btn" (click)="loginWithGoogle()">
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/register" class="text-gradient">Sign up</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 72px);
      padding: var(--space-2xl) var(--space-md);
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: var(--space-2xl);
    }

    .auth-header {
      text-align: center;
      margin-bottom: var(--space-xl);
    }

    .brand-icon {
      font-size: 3rem;
      margin-bottom: var(--space-md);
    }

    .auth-title {
      font-size: var(--font-2xl);
      font-weight: 800;
      margin-bottom: var(--space-xs);
    }

    .auth-subtitle {
      color: var(--text-secondary);
      font-size: var(--font-base);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
    }

    .w-full {
      width: 100%;
    }

    .auth-error {
      background: rgba(239, 68, 68, 0.1);
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-md);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .auth-footer {
      margin-top: var(--space-xl);
      text-align: center;
      color: var(--text-secondary);
      font-size: var(--font-sm);
    }

    .auth-footer a {
      font-weight: 600;
    }

    .auth-divider {
      display: flex;
      align-items: center;
      text-align: center;
      color: var(--text-muted);
      font-size: var(--font-sm);
      margin: var(--space-xs) 0;
    }

    .auth-divider::before,
    .auth-divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid var(--border-subtle);
    }

    .auth-divider span {
      padding: 0 var(--space-sm);
    }

    .google-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      background: rgba(255, 255, 255, 0.05);
    }

    .google-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  submitted = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (!this.email || !this.password) return;

    const result = await this.authService.login(this.email, this.password);

    if (result.success) {
      this.router.navigate(['/']);
    } else {
      this.errorMessage = result.message || 'An error occurred.';
    }
  }

  async loginWithGoogle() {
    this.errorMessage = '';
    const result = await this.authService.loginWithGoogle();
    
    if (result.success) {
      this.router.navigate(['/']);
    } else {
      this.errorMessage = result.message || 'An error occurred during Google sign in.';
    }
  }
}
