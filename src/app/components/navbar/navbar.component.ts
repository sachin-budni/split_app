import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/group.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <div class="navbar-inner container">
        <a routerLink="/" class="navbar-brand">
          <span class="brand-icon">💸</span>
          <span class="brand-text text-gradient">SplitEase</span>
        </a>

        <div class="navbar-links" *ngIf="isLoggedIn">
          <a routerLink="/"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: true }"
             class="nav-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            <span>Dashboard</span>
          </a>
          <a routerLink="/create-group"
             routerLinkActive="active"
             class="nav-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <span>New Group</span>
          </a>
          <a routerLink="/history"
             routerLinkActive="active"
             class="nav-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>History</span>
          </a>
        </div>

        <div class="navbar-auth">
          <ng-container *ngIf="!isLoggedIn; else loggedInTpl">
            <a routerLink="/login" class="nav-link">Log In</a>
            <a routerLink="/register" class="btn btn-primary btn-sm">Sign Up</a>
          </ng-container>
          <ng-template #loggedInTpl>
            <div class="user-profile" *ngIf="currentUser">
              <div class="avatar avatar-sm" [style.background-color]="currentUser.avatarColor">
                {{ currentUser.name.charAt(0).toUpperCase() }}
              </div>
              <span class="user-name">{{ currentUser.name }}</span>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="logout()">Logout</button>
          </ng-template>
        </div>

        <button class="mobile-toggle" (click)="toggleMenu()">
          <span class="toggle-bar" [class.open]="menuOpen"></span>
        </button>

        <div class="mobile-menu" [class.open]="menuOpen" (click)="menuOpen = false">
          <ng-container *ngIf="isLoggedIn">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="mobile-link">Dashboard</a>
            <a routerLink="/create-group" routerLinkActive="active" class="mobile-link">New Group</a>
            <a routerLink="/history" routerLinkActive="active" class="mobile-link">History</a>
            <div class="mobile-divider"></div>
            <div class="mobile-user" *ngIf="currentUser">
              Logged in as <strong>{{ currentUser.name }}</strong>
            </div>
            <button class="mobile-link text-danger" (click)="logout()">Logout</button>
          </ng-container>
          <ng-container *ngIf="!isLoggedIn">
            <a routerLink="/login" class="mobile-link">Log In</a>
            <a routerLink="/register" class="mobile-link">Sign Up</a>
          </ng-container>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(10, 10, 26, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-subtle);
    }

    .navbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72px;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-size: var(--font-xl);
      font-weight: 800;
      letter-spacing: -0.02em;
      transition: transform var(--transition-base);
    }

    .navbar-brand:hover {
      transform: scale(1.03);
    }

    .brand-icon {
      font-size: 1.5rem;
    }

    .navbar-links {
      display: flex;
      gap: var(--space-sm);
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-weight: 500;
      font-size: var(--font-sm);
      transition: all var(--transition-base);
    }

    .nav-link:hover {
      color: var(--text-primary);
      background: var(--bg-glass-hover);
    }

    .nav-link.active {
      color: var(--text-primary);
      background: rgba(139, 92, 246, 0.15);
    }

    .mobile-toggle {
      display: none;
      width: 32px;
      height: 32px;
      position: relative;
      justify-content: center;
      align-items: center;
    }

    .toggle-bar,
    .toggle-bar::before,
    .toggle-bar::after {
      display: block;
      width: 20px;
      height: 2px;
      background: var(--text-primary);
      border-radius: 2px;
      transition: all var(--transition-base);
    }

    .toggle-bar::before,
    .toggle-bar::after {
      content: '';
      position: absolute;
    }

    .toggle-bar::before { top: 10px; }
    .toggle-bar::after { bottom: 10px; }

    .toggle-bar.open { background: transparent; }
    .toggle-bar.open::before { top: 15px; transform: rotate(45deg); }
    .toggle-bar.open::after { bottom: 15px; transform: rotate(-45deg); }

    .mobile-menu {
      display: none;
    }

    .navbar-auth {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      margin-left: auto;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .user-name {
      font-size: var(--font-sm);
      font-weight: 500;
      color: var(--text-primary);
      display: none;
    }

    @media (min-width: 768px) {
      .user-name {
        display: block;
      }
    }

    @media (max-width: 640px) {
      .navbar-links { display: none; }
      .mobile-toggle { display: flex; }

      .mobile-menu {
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 72px;
        left: 0;
        right: 0;
        background: rgba(10, 10, 26, 0.95);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid var(--border-subtle);
        padding: var(--space-md);
        gap: var(--space-xs);
        transform: translateY(-100%);
        opacity: 0;
        transition: all var(--transition-base);
        pointer-events: none;
      }

      .mobile-menu.open {
        transform: translateY(0);
        opacity: 1;
        pointer-events: all;
      }

      .mobile-link {
        padding: 0.75rem 1rem;
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        font-weight: 500;
        transition: all var(--transition-base);
      }

      .mobile-link:hover,
      .mobile-link.active {
        color: var(--text-primary);
        background: rgba(139, 92, 246, 0.15);
      }

      .mobile-divider {
        height: 1px;
        background: var(--border-subtle);
        margin: var(--space-sm) 0;
      }

      .mobile-user {
        padding: 0.5rem 1rem;
        font-size: var(--font-sm);
        color: var(--text-secondary);
      }

      .text-danger {
        color: #EF4444 !important;
      }
    }
  `]
})
export class NavbarComponent implements OnInit {
  menuOpen = false;
  isLoggedIn = false;
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
