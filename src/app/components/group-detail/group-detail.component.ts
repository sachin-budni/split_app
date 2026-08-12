import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';
import { Group, Member, Expense, Settlement, User } from '../../models/group.model';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Loading State -->
    <div class="loading-container container container-sm" *ngIf="!loaded">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading group details...</p>
    </div>

    <div class="group-detail container container-sm" *ngIf="group && loaded">
      <a routerLink="/" class="back-link animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Dashboard
      </a>

      <!-- Group Header -->
      <div class="group-header glass-card animate-fade-in-up" [style.--header-gradient]="headerGradient">
        <div class="header-top">
          <div class="header-icon" [style.background]="headerGradient" style="overflow: hidden;">
            <img *ngIf="group.iconUrl" [src]="group.iconUrl" style="width: 100%; height: 100%; object-fit: cover;" alt="Group Icon" />
            <span *ngIf="!group.iconUrl">{{ group.name.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="header-actions" *ngIf="isAdmin">
            <button class="btn btn-secondary btn-sm" (click)="toggleEdit()" *ngIf="!editing">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              Edit
            </button>
            <button class="btn btn-danger btn-sm" (click)="confirmDelete()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Delete
            </button>
          </div>
        </div>

        <!-- View Mode -->
        <div *ngIf="!editing">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-md); margin-bottom: var(--space-sm);">
            <h1 class="group-name" style="margin: 0;">{{ group.name }}</h1>
            <button class="btn btn-secondary btn-sm" (click)="showSummaryModal = true">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Summary
            </button>
          </div>
          <p class="group-desc" *ngIf="group.description">{{ group.description }}</p>
          <div class="group-meta">
            <span class="meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ group.createdAt | date:'mediumDate' }}
            </span>
            <span class="meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ group.currency }}
            </span>
            <span class="meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {{ group.members.length }} {{ group.members.length === 1 ? 'member' : 'members' }}
            </span>
            <span class="meta-item" *ngIf="group.createdByName">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Created by {{ group.createdByName }}
            </span>
          </div>
        </div>

        <!-- Edit Mode -->
        <div *ngIf="editing" class="edit-form animate-fade-in">
          <div class="form-group" style="margin-bottom: var(--space-md);">
            <label class="form-label">Group Icon</label>
            <div style="display: flex; align-items: center; gap: var(--space-md);">
              <label class="btn btn-secondary btn-sm" style="cursor: pointer;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Change Icon
                <input type="file" accept="image/*" style="display: none;" (change)="onFileSelected($event)">
              </label>
              <button class="btn btn-danger btn-sm" *ngIf="editIconUrl" (click)="editIconUrl = undefined">Remove Icon</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="editName">Group Name</label>
            <input id="editName" class="form-input" [(ngModel)]="editName" type="text" maxlength="50">
          </div>
          <div class="form-group">
            <label class="form-label" for="editDesc">Description</label>
            <textarea id="editDesc" class="form-input" [(ngModel)]="editDescription" rows="2" maxlength="200"></textarea>
          </div>
          <div class="edit-actions">
            <button class="btn btn-secondary btn-sm" (click)="cancelEdit()">Cancel</button>
            <button class="btn btn-primary btn-sm" (click)="saveEdit()">Save Changes</button>
          </div>
        </div>
      </div>

      <!-- Spending Summary -->
      <div class="spending-summary animate-fade-in-up stagger-1">
        <div class="summary-card glass-card">
          <div class="summary-label">Total Spent</div>
          <div class="summary-amount text-gradient">
            {{ currencySymbol }}{{ totalExpenses | number:'1.2-2' }}
          </div>
        </div>
        <div class="summary-card glass-card">
          <div class="summary-label">Expenses</div>
          <div class="summary-value">{{ group.expenses.length }}</div>
        </div>
        <div class="summary-card glass-card">
          <div class="summary-label">Per Person</div>
          <div class="summary-value">
            {{ group.members.length > 0 ? currencySymbol + (totalExpenses / group.members.length | number:'1.2-2') : '—' }}
          </div>
        </div>
      </div>

      <!-- Expenses Section -->
      <div class="expenses-section animate-fade-in-up stagger-2">
        <div class="section-header">
          <h2 class="section-title">Expenses</h2>
          <button class="btn btn-primary btn-sm" (click)="showAddExpense = !showAddExpense">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ showAddExpense ? 'Cancel' : 'Add Expense' }}
          </button>
        </div>

        <!-- Add Expense Form -->
        <div class="add-expense-form glass-card animate-scale-in" *ngIf="showAddExpense">
          <div class="form-row">
            <div class="form-group flex-2">
              <label class="form-label" for="expenseDesc">Description *</label>
              <input id="expenseDesc" class="form-input"
                     [class.error]="expenseSubmitted && !expenseDescription.trim()"
                     type="text"
                     placeholder="e.g., Dinner, Groceries, Taxi"
                     [(ngModel)]="expenseDescription">
            </div>
            <div class="form-group flex-1">
              <label class="form-label" for="expenseAmount">Amount ({{ currencySymbol }}) *</label>
              <input id="expenseAmount" class="form-input"
                     [class.error]="expenseSubmitted && (!expenseAmount || expenseAmount <= 0)"
                     type="number"
                     placeholder="0.00"
                     [(ngModel)]="expenseAmount"
                     min="0.01"
                     step="0.01">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="expensePaidBy">Paid By *</label>
            <select id="expensePaidBy" class="form-select"
                    [class.error]="expenseSubmitted && !expensePaidById"
                    [(ngModel)]="expensePaidById">
              <option value="">Select who paid</option>
              <option *ngFor="let member of group.members" [value]="member.id">
                {{ member.name }} {{ member.id === currentUserId ? '(You)' : '' }}
              </option>
            </select>
          </div>
          <span class="form-error" *ngIf="expenseError">{{ expenseError }}</span>
          <div class="form-actions">
            <button class="btn btn-primary" (click)="addExpense()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Add Expense
            </button>
          </div>
        </div>

        <!-- Expenses List -->
        <div class="expenses-list" *ngIf="group.expenses.length > 0">
          <div *ngFor="let expense of group.expenses; let i = index"
               class="expense-item glass-card animate-fade-in-up"
               [style.animation-delay]="(i * 0.05) + 's'">
            <div class="expense-left">
              <div class="expense-icon-circle">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div class="expense-info">
                <span class="expense-desc">{{ expense.description }}</span>
                <span class="expense-meta">
                  Paid by <strong>{{ expense.paidByName }}</strong> · {{ expense.createdAt | date:'shortDate' }}
                </span>
              </div>
            </div>
            <div class="expense-right">
              <span class="expense-amount">{{ currencySymbol }}{{ expense.amount | number:'1.2-2' }}</span>
              <button class="remove-btn" 
                      *ngIf="expense.paidById === currentUserId || isAdmin"
                      (click)="removeExpense(expense.id)" 
                      title="Remove expense">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div class="no-items" *ngIf="group.expenses.length === 0 && !showAddExpense">
          <div class="no-items-icon">💰</div>
          <p>No expenses yet. Add your first expense to start tracking.</p>
        </div>
      </div>

      <!-- Settlements Section -->
      <div class="settlements-section animate-fade-in-up stagger-3" *ngIf="settlements.length > 0">
        <div class="section-header">
          <h2 class="section-title">Settlements</h2>
          <span class="settlement-badge">{{ settlements.length }} {{ settlements.length === 1 ? 'payment' : 'payments' }} needed</span>
        </div>

        <div class="settlements-list">
          <div *ngFor="let s of settlements; let i = index"
               class="settlement-card glass-card animate-fade-in-up"
               [style.animation-delay]="(i * 0.08) + 's'">
            <div class="settlement-from">
              <div class="avatar avatar-md" [style.background-color]="getMemberColor(s.fromId)">
                {{ s.fromName.charAt(0).toUpperCase() }}
              </div>
              <div class="settlement-name">
                <span class="name-text">{{ s.fromName }}</span>
                <span class="settlement-role">owes</span>
              </div>
            </div>
            <div class="settlement-arrow">
              <div class="arrow-line"></div>
              <span class="arrow-amount">{{ currencySymbol }}{{ s.amount | number:'1.2-2' }}</span>
              <div class="arrow-line"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
            <div class="settlement-to">
              <div class="avatar avatar-md" [style.background-color]="getMemberColor(s.toId)">
                {{ s.toName.charAt(0).toUpperCase() }}
              </div>
              <span class="name-text">{{ s.toName }}</span>
            </div>
            <button class="btn btn-primary btn-sm settle-btn" 
                    *ngIf="s.toId === currentUserId"
                    (click)="settleUp(s.fromId, s.toId, s.amount)">
              Settle Up
            </button>
          </div>
        </div>
      </div>

      <!-- Members Section -->
      <div class="members-section animate-fade-in-up stagger-3">
        <div class="section-header">
          <h2 class="section-title">Members</h2>
          <button class="btn btn-primary btn-sm" (click)="showAddMember = !showAddMember" *ngIf="isAdmin">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ showAddMember ? 'Cancel' : 'Add Member' }}
          </button>
        </div>

        <!-- Add Member Form (Inline) -->
        <div class="add-member-inline glass-card animate-scale-in" *ngIf="showAddMember">
          <div class="form-group">
            <label class="form-label" for="memberSelect">Select User to Add</label>
            <div class="form-row">
              <select id="memberSelect" class="form-select flex-1" [(ngModel)]="selectedUserId">
                <option value="">Select a user...</option>
                <option *ngFor="let user of getAvailableUsers()" [value]="user.id">
                  {{ user.name }}
                </option>
              </select>
              <button class="btn btn-primary" (click)="addMember()" [disabled]="!selectedUserId">Add</button>
            </div>
          </div>
          <span class="form-error" *ngIf="addMemberError">{{ addMemberError }}</span>
        </div>

        <!-- Members List -->
        <div class="members-list">
          <div *ngFor="let member of group.members; let i = index"
               class="member-card glass-card animate-fade-in-up"
               [style.animation-delay]="(i * 0.05) + 's'">
            <div class="member-left">
              <div class="avatar avatar-lg" [style.background-color]="member.avatarColor">
                {{ member.name.charAt(0).toUpperCase() }}
              </div>
              <div class="member-info">
                <span class="member-name">{{ member.name }}</span>
                <span class="member-spent">
                  Spent: {{ currencySymbol }}{{ getMemberTotal(member.id) | number:'1.2-2' }}
                </span>
              </div>
            </div>
            <div class="member-right" style="display: flex; gap: 8px; align-items: center;">
              <span class="badge badge-admin" *ngIf="group.adminIds?.includes(member.id)">Admin</span>
              <span class="badge badge-user" *ngIf="member.id === currentUserId">You</span>
              <button class="btn btn-secondary btn-sm" 
                      style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: var(--radius-sm);"
                      (click)="makeAdmin(member.id)" 
                      *ngIf="isAdmin && !group.adminIds?.includes(member.id)">
                Make Admin
              </button>
              <button class="btn btn-secondary btn-sm" 
                      style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: var(--radius-sm); color: var(--accent-red); border-color: rgba(239, 68, 68, 0.2);"
                      (click)="removeAdmin(member.id)" 
                      *ngIf="group.createdById === currentUserId && group.adminIds?.includes(member.id) && member.id !== currentUserId">
                Remove Admin
              </button>
              <button class="remove-btn" (click)="removeMember(member.id)" title="Remove member" *ngIf="isAdmin && member.id !== currentUserId">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div class="no-items" *ngIf="group.members.length === 0">
          <p>No members in this group yet.</p>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div class="modal-overlay" *ngIf="showDeleteConfirm" (click)="showDeleteConfirm = false">
        <div class="modal glass-card animate-scale-in" (click)="$event.stopPropagation()">
          <div class="modal-icon">⚠️</div>
          <h3 class="modal-title">Delete Group</h3>
          <p class="modal-desc">Are you sure you want to delete <strong>{{ group.name }}</strong>? This action cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showDeleteConfirm = false">Cancel</button>
            <button class="btn btn-danger" (click)="deleteGroup()">Delete</button>
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
      
      <!-- Summary Modal -->
      <div class="modal-overlay" *ngIf="showSummaryModal" (click)="showSummaryModal = false">
        <div class="modal glass-card animate-scale-in" (click)="$event.stopPropagation()">
          <h3 class="modal-title">Group Summary</h3>
          <div style="text-align: left; margin: 1.5rem 0; display: flex; flex-direction: column; gap: 1rem; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
              <span style="color: var(--text-secondary);">Total Group Expenses</span>
              <span style="font-weight: bold; font-size: 1.1rem; color: var(--accent-green);">{{ currencySymbol }}{{ totalExpenses | number:'1.2-2' }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
              <span style="color: var(--text-secondary);">Total Members</span>
              <span style="font-weight: bold; font-size: 1.1rem;">{{ group.members.length }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
              <span style="color: var(--text-secondary);">Your Total Spending</span>
              <span style="font-weight: bold; font-size: 1.1rem; color: var(--accent-cyan);">{{ currencySymbol }}{{ getMemberTotal(currentUserId) | number:'1.2-2' }}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Group Created On</span>
              <span style="font-weight: bold;">{{ group.createdAt | date:'mediumDate' }}</span>
            </div>
          </div>
          <div class="modal-actions" style="justify-content: center;">
            <button class="btn btn-primary" (click)="showSummaryModal = false" style="width: 100%">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div class="not-found container" *ngIf="!group && loaded">
      <div class="empty-state animate-fade-in-up">
        <div class="empty-icon">🔍</div>
        <h2>Group not found</h2>
        <p>The group you're looking for doesn't exist or has been deleted.</p>
        <a routerLink="/" class="btn btn-primary">Back to Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .group-detail {
      padding-top: var(--space-xl);
      padding-bottom: var(--space-3xl);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      color: var(--text-secondary);
      font-size: var(--font-sm);
      font-weight: 500;
      margin-bottom: var(--space-xl);
      transition: color var(--transition-base);
    }

    .back-link:hover {
      color: var(--text-primary);
    }

    /* Group Header */
    .group-header {
      padding: var(--space-xl);
      margin-bottom: var(--space-xl);
    }

    .group-header:hover {
      transform: none;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-lg);
    }

    .header-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-2xl);
      font-weight: 800;
      color: white;
    }

    .header-actions {
      display: flex;
      gap: var(--space-sm);
    }

    .group-name {
      font-size: var(--font-3xl);
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: var(--space-sm);
    }

    .group-desc {
      color: var(--text-secondary);
      font-size: var(--font-base);
      line-height: 1.6;
      margin-bottom: var(--space-md);
    }

    .group-meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-md);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: var(--font-sm);
      color: var(--text-muted);
    }

    /* Edit Form */
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .edit-actions {
      display: flex;
      gap: var(--space-sm);
      justify-content: flex-end;
    }

    /* Spending Summary */
    .spending-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-md);
      margin-bottom: var(--space-xl);
    }

    .summary-card {
      padding: var(--space-lg);
      text-align: center;
    }

    .summary-card:hover {
      transform: translateY(-2px);
    }

    .summary-label {
      font-size: var(--font-xs);
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: var(--space-sm);
    }

    .summary-amount {
      font-size: var(--font-2xl);
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .summary-value {
      font-size: var(--font-xl);
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Sections */
    .expenses-section,
    .members-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title {
      font-size: var(--font-xl);
      font-weight: 700;
    }

    /* Add Expense Form */
    .add-expense-form {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .add-expense-form:hover {
      transform: none;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
    }

    .flex-2 { flex: 2; }

    /* Expenses List */
    .expenses-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .expense-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-md) var(--space-lg);
    }

    .expense-item:hover {
      transform: translateY(-2px);
    }

    .expense-left {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      flex: 1;
      min-width: 0;
    }

    .expense-icon-circle {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: rgba(16, 185, 129, 0.12);
      color: var(--accent-green);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .expense-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .expense-desc {
      font-weight: 600;
      font-size: var(--font-base);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .expense-meta {
      font-size: var(--font-xs);
      color: var(--text-muted);
    }

    .expense-meta strong {
      color: var(--text-secondary);
    }

    .expense-right {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      flex-shrink: 0;
    }

    .expense-amount {
      font-size: var(--font-lg);
      font-weight: 700;
      color: var(--accent-green);
    }

    /* Add Member Inline */
    .add-member-inline {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .add-member-inline:hover {
      transform: none;
    }

    .member-type-toggle {
      display: flex;
      background: var(--bg-glass);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 4px;
      gap: 4px;
    }

    .toggle-btn {
      flex: 1;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      font-weight: 500;
      font-size: var(--font-sm);
      color: var(--text-muted);
      transition: all var(--transition-base);
    }

    .toggle-btn.active {
      background: var(--gradient-primary);
      color: white;
    }

    .form-row {
      display: flex;
      gap: var(--space-md);
      align-items: flex-end;
    }

    .flex-1 { flex: 1; }

    /* Members List */
    .members-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .member-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-md) var(--space-lg);
    }

    .member-card:hover {
      transform: translateY(-2px);
    }

    .member-left {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .member-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .member-name {
      font-weight: 600;
      font-size: var(--font-base);
    }

    .member-email {
      font-size: var(--font-xs);
      color: var(--text-muted);
    }

    .member-spent {
      font-size: var(--font-xs);
      color: var(--accent-cyan);
      font-weight: 500;
    }

    .member-right {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .remove-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      transition: all var(--transition-base);
    }

    .remove-btn:hover {
      color: #EF4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .no-items {
      text-align: center;
      padding: var(--space-xl);
      color: var(--text-muted);
      font-size: var(--font-sm);
    }

    .no-items-icon {
      font-size: 2.5rem;
      margin-bottom: var(--space-sm);
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: var(--space-md);
    }

    .modal {
      max-width: 400px;
      width: 100%;
      padding: var(--space-xl);
      text-align: center;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal:hover {
      transform: none;
    }

    .modal-icon {
      font-size: 3rem;
      margin-bottom: var(--space-md);
    }

    .modal-title {
      font-size: var(--font-xl);
      font-weight: 700;
      margin-bottom: var(--space-sm);
    }

    .modal-desc {
      color: var(--text-secondary);
      font-size: var(--font-sm);
      margin-bottom: var(--space-xl);
      line-height: 1.6;
    }

    .modal-actions {
      display: flex;
      gap: var(--space-sm);
      justify-content: center;
    }

    /* Not Found */
    .not-found {
      padding: var(--space-3xl) 0;
    }

    .empty-state {
      text-align: center;
      padding: var(--space-3xl) var(--space-xl);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: var(--space-lg);
    }

    /* Settlements */
    .settlements-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);
    }

    .settlement-badge {
      font-size: var(--font-xs);
      font-weight: 600;
      color: var(--accent-orange);
      background: rgba(249, 115, 22, 0.12);
      border: 1px solid rgba(249, 115, 22, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
    }

    .settlements-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .settlement-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-lg);
      gap: var(--space-md);
    }

    .settlement-card:hover {
      transform: translateY(-2px);
    }

    .settlement-from,
    .settlement-to {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      min-width: 0;
    }

    .settlement-name {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .name-text {
      font-weight: 600;
      font-size: var(--font-sm);
      white-space: nowrap;
    }

    .settlement-role {
      font-size: var(--font-xs);
      color: var(--text-muted);
    }

    .settlement-arrow {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
      color: var(--accent-orange);
    }

    .badge-admin {
      background: rgba(245, 158, 11, 0.15);
      color: #F59E0B;
    }

    .arrow-line {
      width: 20px;
      height: 2px;
      background: linear-gradient(90deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.6));
      border-radius: 1px;
    }

    .arrow-amount {
      font-size: var(--font-base);
      font-weight: 800;
      color: var(--accent-orange);
      white-space: nowrap;
      padding: 0.25rem 0.75rem;
      background: rgba(249, 115, 22, 0.1);
      border-radius: var(--radius-full);
    }

    .settle-btn {
      margin-left: auto;
    }

    @media (max-width: 640px) {
      .spending-summary {
        grid-template-columns: 1fr;
      }

      .header-top {
        flex-direction: column;
        gap: var(--space-md);
      }

      .form-row {
        flex-direction: column;
      }

      .member-card,
      .expense-item {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-md);
      }

      .member-right,
      .expense-right {
        width: 100%;
        justify-content: space-between;
      }

      .settlement-card {
        flex-direction: column;
        gap: var(--space-xl);
      }

      .settlement-from, .settlement-to {
        flex-direction: column;
        text-align: center;
      }

      .settlement-arrow {
        flex-direction: column;
      }

      .settlement-arrow svg {
        transform: rotate(90deg);
      }

      .arrow-line {
        width: 2px;
        height: 20px;
        background: linear-gradient(180deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.6));
      }

      .settle-btn {
        width: 100%;
        margin-left: 0;
        margin-top: var(--space-sm);
      }
    }
  `]
})
export class GroupDetailComponent implements OnInit {
  group: Group | undefined;
  loaded = false;
  editing = false;
  showAddMember = false;
  showAddExpense = false;
  showDeleteConfirm = false;
  showSummaryModal = false;

  editName = '';
  editDescription = '';
  editIconUrl?: string;

  allUsers: User[] = [];
  headerGradient = '';
  selectedUserId = '';
  currentUserId = '';
  addMemberError = '';

  // Expense form
  expenseDescription = '';
  expenseAmount: number | null = null;
  expensePaidById = '';
  expenseError = '';
  expenseSubmitted = false;

  // Confirmation Modal State
  showConfirmModal = false;
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmAction: (() => void) | null = null;

  currencySymbol = '₹';
  totalExpenses = 0;
  settlements: Settlement[] = [];

  private gradients = [
    'linear-gradient(135deg, #8B5CF6, #6366F1)',
    'linear-gradient(135deg, #EC4899, #F59E0B)',
    'linear-gradient(135deg, #06B6D4, #3B82F6)',
    'linear-gradient(135deg, #10B981, #06B6D4)',
    'linear-gradient(135deg, #F59E0B, #EF4444)',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.allUsers = this.authService.getAllUsers();

    this.authService.currentUser$.subscribe(currentUser => {
      if (!currentUser) return; // Wait for auth state

      this.currentUserId = currentUser.id;

      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.groupService.getGroups(this.currentUserId).subscribe(groups => {
          if (!this.groupService.hasInitialized) return;

          this.group = groups.find(g => g.id === id);
          if (this.group) {
            const index = groups.indexOf(this.group);
            this.headerGradient = this.gradients[index % this.gradients.length];
            this.currencySymbol = this.groupService.getCurrencySymbol(this.group.currency);
            this.totalExpenses = this.groupService.getTotalExpenses(this.group);
            this.settlements = this.groupService.calculateSettlements(this.group);
          }
          this.loaded = true;
        });
      } else {
        this.loaded = true;
      }
    });
  }

  get isAdmin(): boolean {
    return this.group?.adminIds?.includes(this.currentUserId) ?? false;
  }

  toggleEdit() {
    this.editing = !this.editing;
    if (this.editing && this.group) {
      this.editName = this.group.name;
      this.editDescription = this.group.description || '';
      this.editIconUrl = this.group.iconUrl;
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        this.editIconUrl = await this.groupService.resizeImage(file, 200, 200);
      } catch (err) {
        console.error('Error uploading image', err);
      }
    }
  }

  cancelEdit() {
    this.editing = false;
  }

  saveEdit() {
    if (this.group && this.editName.trim()) {
      this.groupService.updateGroup(this.group.id, {
        name: this.editName.trim(),
        description: this.editDescription.trim(),
        iconUrl: this.editIconUrl
      });
      this.editing = false;
    }
  }

  confirmDelete() {
    this.showDeleteConfirm = true;
  }

  deleteGroup() {
    this.groupService.deleteGroup(this.group!.id);
    this.router.navigate(['/']);
  }

  // ---- Expense Methods ----

  addExpense() {
    this.expenseSubmitted = true;
    this.expenseError = '';

    if (!this.expenseDescription.trim()) {
      this.expenseError = 'Description is required';
      return;
    }
    if (!this.expenseAmount || this.expenseAmount <= 0) {
      this.expenseError = 'Please enter a valid amount';
      return;
    }
    if (!this.expensePaidById) {
      this.expenseError = 'Please select who paid';
      return;
    }

    const payer = this.group!.members.find(m => m.id === this.expensePaidById);
    if (!payer) return;

    this.groupService.addExpense(this.group!.id, {
      description: this.expenseDescription.trim(),
      amount: this.expenseAmount,
      paidById: this.expensePaidById,
      paidByName: payer.name
    });

    // Reset form
    this.expenseDescription = '';
    this.expenseAmount = null;
    this.expensePaidById = '';
    this.expenseSubmitted = false;
    this.expenseError = '';
  }

  removeExpense(expenseId: string) {
    this.openConfirmModal(
      'Remove Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      () => {
        this.groupService.removeExpense(this.group!.id, expenseId);
      }
    );
  }

  getMemberTotal(memberId: string): number {
    if (!this.group) return 0;
    return this.group.expenses
      .filter(e => e.paidById === memberId)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  // ---- Member Methods ----

  getAvailableUsers(): User[] {
    if (!this.group) return [];
    return this.allUsers.filter(u => !this.group!.members.some(m => m.id === u.id));
  }

  addMember() {
    this.addMemberError = '';

    if (!this.selectedUserId) {
      this.addMemberError = 'Please select a user';
      return;
    }

    const user = this.allUsers.find(u => u.id === this.selectedUserId);
    if (!user) return;

    this.groupService.addMember(this.group!.id, user);

    this.selectedUserId = '';
    this.showAddMember = false;
  }

  removeMember(memberId: string) {
    this.openConfirmModal(
      'Remove Member',
      'Are you sure you want to remove this member?',
      () => {
        this.groupService.removeMember(this.group!.id, memberId);
      }
    );
  }

  makeAdmin(memberId: string) {
    this.openConfirmModal(
      'Promote to Admin',
      'Are you sure you want to promote this user to Admin? They will have full control over the group.',
      () => {
        this.groupService.makeAdmin(this.group!.id, memberId);
      }
    );
  }

  removeAdmin(memberId: string) {
    this.openConfirmModal(
      'Remove Admin Privileges',
      'Are you sure you want to remove Admin privileges from this user?',
      () => {
        this.groupService.removeAdmin(this.group!.id, memberId);
      }
    );
  }

  openConfirmModal(title: string, message: string, action: () => void) {
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmAction = action;
    this.showConfirmModal = true;
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

  settleUp(fromId: string, toId: string, amount: number) {
    const fromMember = this.group?.members.find(m => m.id === fromId);
    const toMember = this.group?.members.find(m => m.id === toId);

    if (fromMember && toMember) {
      this.openConfirmModal(
        'Settle Up',
        `Are you sure you want to mark ${this.currencySymbol}${amount.toFixed(2)} as settled?`,
        () => {
          this.groupService.settleUp(this.group!.id, fromMember, toMember, amount);
        }
      );
    }
  }

  getMemberColor(memberId: string): string {
    const member = this.group?.members.find(m => m.id === memberId);
    return member?.avatarColor || '#ccc';
  }
}
