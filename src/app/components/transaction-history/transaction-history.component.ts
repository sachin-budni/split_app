import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';
import { Expense } from '../../models/group.model';
import { Subscription } from 'rxjs';

interface Transaction extends Expense {
  groupId: string;
  groupName: string;
  currency: string;
  isPayer: boolean;
  isReceiver: boolean;
}

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="history-page container">
      <a routerLink="/" class="back-link animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Dashboard
      </a>

      <div class="page-header animate-fade-in-up">
        <h1 class="page-title">Transaction <span class="text-gradient">History</span></h1>
        <p class="page-subtitle">A timeline of all your expenses and settlements across every group.</p>
      </div>

      <!-- Loading State -->
      <div class="loading-container animate-fade-in-up" *ngIf="!loaded">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading history...</p>
      </div>

      <div class="transactions-container animate-fade-in-up stagger-1" *ngIf="loaded">
        <div class="transactions-list" *ngIf="transactions.length > 0">
          <a *ngFor="let t of transactions; let i = index"
               [routerLink]="['/group', t.groupId]"
               class="expense-card glass-card animate-fade-in-up"
               [style.animation-delay]="(i * 0.05) + 's'">
            <div class="expense-icon" [ngClass]="{'settlement': t.isSettlement}">
              <svg *ngIf="!t.isSettlement" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
              <svg *ngIf="t.isSettlement" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div class="expense-info">
              <span class="expense-desc">{{ t.description }}</span>
              <span class="expense-meta">
                {{ t.paidByName }} 
                <ng-container *ngIf="t.isSettlement"> paid {{ t.settledWithName }}</ng-container> 
                <ng-container *ngIf="!t.isSettlement"> paid for the group</ng-container>
                <span class="bullet-divider">•</span>
                {{ t.createdAt | date:'mediumDate' }}
                <span class="bullet-divider">•</span>
                <span class="group-badge">{{ t.groupName }}</span>
              </span>
            </div>
            <div class="expense-amount-wrapper">
              <span class="expense-amount" 
                    [class.positive]="t.isReceiver && t.isSettlement"
                    [class.negative]="!t.isPayer">
                {{ getCurrencySymbol(t.currency) }}{{ t.amount | number:'1.2-2' }}
              </span>
            </div>
          </a>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="transactions.length === 0">
          <div class="empty-icon">📝</div>
          <h2 class="empty-title">No transactions yet</h2>
          <p class="empty-desc">Your transaction history will appear here once you start adding expenses or settling up in groups.</p>
          <a routerLink="/create-group" class="btn btn-primary">Create a Group</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-page {
      padding-top: var(--space-xl);
      padding-bottom: var(--space-3xl);
      max-width: 800px;
    }

    .page-header {
      margin-bottom: var(--space-2xl);
    }

    .page-title {
      font-size: var(--font-3xl);
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: var(--space-sm);
    }

    .page-subtitle {
      font-size: var(--font-lg);
      color: var(--text-secondary);
    }

    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .expense-card {
      display: flex;
      align-items: center;
      padding: var(--space-lg) var(--space-xl);
      gap: var(--space-lg);
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .expense-card:hover {
      transform: scale(1.02);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
    }

    .expense-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-full);
      background: rgba(239, 68, 68, 0.1);
      color: var(--accent-red);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .expense-icon.settlement {
      background: rgba(16, 185, 129, 0.1);
      color: var(--accent-green);
    }

    .expense-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0; /* for truncation */
    }

    .expense-desc {
      font-size: var(--font-lg);
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .expense-meta {
      font-size: var(--font-sm);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
    }

    .bullet-divider {
      color: var(--text-muted);
      margin: 0 4px;
      font-size: 8px;
    }

    .group-badge {
      background: rgba(139, 92, 246, 0.15);
      color: var(--accent-purple);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: var(--font-xs);
      font-weight: 600;
      white-space: nowrap;
    }

    .expense-amount-wrapper {
      text-align: right;
    }

    .expense-amount {
      font-size: var(--font-xl);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .expense-amount.positive {
      color: var(--accent-green);
    }
    
    .expense-amount.negative {
      /* If not payer, typically text-primary or secondary. If you want it red, use var(--accent-red) */
      color: var(--text-primary);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--space-3xl) var(--space-xl);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: var(--space-lg);
      filter: grayscale(0.3);
    }

    .empty-title {
      font-size: var(--font-2xl);
      font-weight: 700;
      margin-bottom: var(--space-sm);
    }

    .empty-desc {
      color: var(--text-secondary);
      font-size: var(--font-base);
      line-height: 1.6;
      margin-bottom: var(--space-xl);
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }
    
    @media (max-width: 640px) {
      .expense-card {
        padding: var(--space-md);
        gap: var(--space-md);
      }
      .expense-desc {
        font-size: var(--font-base);
      }
      .expense-meta {
        font-size: var(--font-xs);
      }
      .expense-amount {
        font-size: var(--font-lg);
      }
    }
  `]
})
export class TransactionHistoryComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  loaded = false;
  private sub?: Subscription;

  constructor(
    private groupService: GroupService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (!user) return; // Wait until auth state resolves

      this.sub = this.groupService.getGroups(user.id).subscribe(groups => {
        if (!this.groupService.hasInitialized) return;

        let allTransactions: Transaction[] = [];
        
        groups.forEach(group => {
          if (group.expenses && group.expenses.length > 0) {
            const mapped = group.expenses.map(e => ({
              ...e,
              groupId: group.id,
              groupName: group.name,
              currency: group.currency,
              isPayer: e.paidById === user.id,
              isReceiver: e.settledWithId === user.id
            }));
            allTransactions = [...allTransactions, ...mapped];
          }
        });

        // Sort descending by createdAt
        allTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        this.transactions = allTransactions;
        this.loaded = true;
      });
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  getCurrencySymbol(currency: string): string {
    return this.groupService.getCurrencySymbol(currency);
  }
}
