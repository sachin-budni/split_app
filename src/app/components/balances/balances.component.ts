import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';
import { GlobalSettlement } from '../../models/group.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-balances',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="balances-page container">
      <a routerLink="/" class="back-link animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Dashboard
      </a>

      <div class="page-header animate-fade-in-up">
        <h1 class="page-title">Global <span class="text-gradient">Balances</span></h1>
        <p class="page-subtitle">A breakdown of exactly who owes what across all your groups.</p>
      </div>

      <!-- Loading State -->
      <div class="loading-container animate-fade-in-up" *ngIf="!loaded">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading global balances...</p>
      </div>

      <div class="balances-grid animate-fade-in-up stagger-1" *ngIf="loaded">
        
        <!-- To Pay Column -->
        <div class="balance-column">
          <div class="column-header negative">
            <h2 class="column-title">You Owe</h2>
            <div class="column-total">{{ getCurrencySymbol('INR') }}{{ totalToPay | number:'1.2-2' }}</div>
          </div>
          
          <div class="settlements-list" *ngIf="toPay.length > 0">
            <a *ngFor="let settlement of toPay"
               [routerLink]="['/group', settlement.groupId]"
               class="settlement-card glass-card">
              <div class="settlement-icon negative">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div class="settlement-info">
                <span class="settlement-name">To {{ settlement.toName }}</span>
                <span class="settlement-group">{{ settlement.groupName }}</span>
              </div>
              <div class="settlement-amount negative">
                {{ getCurrencySymbol(settlement.currency) }}{{ settlement.amount | number:'1.2-2' }}
              </div>
            </a>
          </div>

          <div class="empty-state" *ngIf="toPay.length === 0">
            <p>You're all settled up! 🎉</p>
          </div>
        </div>

        <!-- Get Back Column -->
        <div class="balance-column">
          <div class="column-header positive">
            <h2 class="column-title">You Are Owed</h2>
            <div class="column-total">{{ getCurrencySymbol('INR') }}{{ totalToGetBack | number:'1.2-2' }}</div>
          </div>
          
          <div class="settlements-list" *ngIf="toGetBack.length > 0">
            <a *ngFor="let settlement of toGetBack"
               [routerLink]="['/group', settlement.groupId]"
               class="settlement-card glass-card">
              <div class="settlement-icon positive">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div class="settlement-info">
                <span class="settlement-name">From {{ settlement.fromName }}</span>
                <span class="settlement-group">{{ settlement.groupName }}</span>
              </div>
              <div class="settlement-amount positive">
                {{ getCurrencySymbol(settlement.currency) }}{{ settlement.amount | number:'1.2-2' }}
              </div>
              <button class="btn btn-primary btn-sm settle-btn" 
                      (click)="settleUp($event, settlement.groupId, settlement.fromId, settlement.toId, settlement.amount)">
                Settle Up
              </button>
            </a>
          </div>

          <div class="empty-state" *ngIf="toGetBack.length === 0">
            <p>Nobody owes you anything right now.</p>
          </div>
        </div>

      </div>
      
      <!-- Generic Confirmation Modal -->
      <div class="modal-overlay" *ngIf="showConfirmModal" (click)="closeConfirmModal()">
        <div class="modal glass-card animate-scale-in" (click)="$event.stopPropagation()">
          <div class="modal-icon">⚠️</div>
          <h3 class="modal-title">{{ confirmModalTitle }}</h3>
          <p class="modal-desc">{{ confirmModalMessage }}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="closeConfirmModal()">Cancel</button>
            <button class="btn btn-primary" (click)="executeConfirmAction()">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .balances-page {
      padding-top: var(--space-xl);
      padding-bottom: var(--space-3xl);
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

    .balances-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-2xl);
    }
    
    @media (min-width: 768px) {
      .balances-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .balance-column {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: var(--space-sm);
      border-bottom: 2px solid;
    }

    .column-header.negative {
      border-color: rgba(239, 68, 68, 0.3);
    }
    .column-header.positive {
      border-color: rgba(16, 185, 129, 0.3);
    }

    .column-title {
      font-size: var(--font-xl);
      font-weight: 700;
    }

    .column-total {
      font-size: var(--font-2xl);
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }

    .column-header.negative .column-total { color: var(--accent-red); }
    .column-header.positive .column-total { color: var(--accent-green); }

    .settlements-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .settlement-card {
      display: flex;
      align-items: center;
      padding: var(--space-md);
      gap: var(--space-md);
      text-decoration: none;
      color: inherit;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.3s ease;
    }

    .settlement-card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .settlement-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .settlement-icon.negative {
      background: rgba(239, 68, 68, 0.1);
      color: var(--accent-red);
    }
    .settlement-icon.positive {
      background: rgba(16, 185, 129, 0.1);
      color: var(--accent-green);
    }

    .settlement-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .settlement-name {
      font-size: var(--font-lg);
      font-weight: 600;
      color: var(--text-primary);
    }

    .settlement-group {
      font-size: var(--font-sm);
      color: var(--text-secondary);
      background: rgba(139, 92, 246, 0.15);
      color: var(--accent-purple);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      align-self: flex-start;
    }

    .settlement-amount {
      font-size: var(--font-xl);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .settlement-amount.negative { color: var(--accent-red); }
    .settlement-amount.positive { color: var(--accent-green); }

    .settle-btn {
      margin-left: auto;
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
      border-radius: var(--radius-sm);
    }
    
    @media (max-width: 640px) {
      .settlement-card {
        padding: var(--space-sm);
        gap: var(--space-sm);
      }
      
      .settlement-name {
        font-size: var(--font-base);
      }
      
      .settlement-amount {
        font-size: var(--font-lg);
      }
      
      .settle-btn {
        padding: 0.25rem 0.5rem;
        font-size: 0.7rem;
      }
    }

    .empty-state {
      padding: var(--space-xl) 0;
      text-align: center;
      color: var(--text-secondary);
      font-style: italic;
    }
  `]
})
export class BalancesComponent implements OnInit, OnDestroy {
  toPay: GlobalSettlement[] = [];
  toGetBack: GlobalSettlement[] = [];
  totalToPay = 0;
  totalToGetBack = 0;
  loaded = false;
  
  // Confirmation Modal State
  showConfirmModal = false;
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmAction: (() => void) | null = null;
  
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

        let allToPay: GlobalSettlement[] = [];
        let allToGetBack: GlobalSettlement[] = [];
        let sumToPay = 0;
        let sumToGetBack = 0;

        groups.forEach(group => {
          const settlements = this.groupService.calculateSettlements(group);
          
          settlements.forEach(s => {
            if (s.fromId === user.id) {
              allToPay.push({ ...s, groupId: group.id, groupName: group.name, currency: group.currency });
              sumToPay += s.amount;
            } else if (s.toId === user.id) {
              allToGetBack.push({ ...s, groupId: group.id, groupName: group.name, currency: group.currency });
              sumToGetBack += s.amount;
            }
          });
        });

        // Sort by amount descending
        this.toPay = allToPay.sort((a, b) => b.amount - a.amount);
        this.toGetBack = allToGetBack.sort((a, b) => b.amount - a.amount);
        
        this.totalToPay = sumToPay;
        this.totalToGetBack = sumToGetBack;
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

  settleUp(event: Event, groupId: string, fromId: string, toId: string, amount: number) {
    event.preventDefault();
    event.stopPropagation();
    
    const group = this.groupService.getGroupById(groupId);
    if (!group) return;

    const fromMember = group.members.find(m => m.id === fromId);
    const toMember = group.members.find(m => m.id === toId);

    if (fromMember && toMember) {
      this.confirmModalTitle = 'Settle Up';
      this.confirmModalMessage = `Are you sure you want to mark ${this.getCurrencySymbol(group.currency)}${amount.toFixed(2)} as settled?`;
      this.confirmAction = () => {
        this.groupService.settleUp(groupId, fromMember, toMember, amount);
      };
      this.showConfirmModal = true;
    }
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.confirmAction = null;
  }

  executeConfirmAction() {
    if (this.confirmAction) {
      this.confirmAction();
    }
    this.closeConfirmModal();
  }
}
