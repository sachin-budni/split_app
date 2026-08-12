import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';
import { Member, User } from '../../models/group.model';

@Component({
  selector: 'app-create-group',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="create-group container container-sm">
      <a routerLink="/" class="back-link animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Dashboard
      </a>

      <div class="page-header animate-fade-in-up">
        <h1 class="page-title">Create a <span class="text-gradient">New Group</span></h1>
        <p class="page-subtitle">Set up a group to start splitting expenses.</p>
      </div>

      <!-- Step Indicator -->
      <div class="steps-indicator animate-fade-in-up stagger-1">
        <div class="step" [class.active]="currentStep === 1" [class.completed]="currentStep > 1" (click)="goToStep(1)">
          <div class="step-circle">{{ currentStep > 1 ? '✓' : '1' }}</div>
          <span class="step-label">Group Info</span>
        </div>
        <div class="step-connector" [class.active]="currentStep > 1"></div>
        <div class="step" [class.active]="currentStep === 2">
          <div class="step-circle">2</div>
          <span class="step-label">Members</span>
        </div>
      </div>

      <!-- Step 1: Group Info -->
      <div class="step-content glass-card animate-fade-in-up stagger-2" *ngIf="currentStep === 1">
        <h2 class="step-title">Group Information</h2>

        <div class="form-group" style="display: flex; flex-direction: column; align-items: center; gap: var(--space-md); margin-bottom: var(--space-xl);">
          <div class="header-icon" [style.background]="groupName ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)'" style="width: 80px; height: 80px; font-size: 2.5rem; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-full); overflow: hidden;">
            <img *ngIf="iconUrl" [src]="iconUrl" style="width: 100%; height: 100%; object-fit: cover;" alt="Group Icon" />
            <span *ngIf="!iconUrl">{{ groupName ? groupName.charAt(0).toUpperCase() : 'G' }}</span>
          </div>
          
          <label class="btn btn-secondary btn-sm" style="cursor: pointer;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload Icon
            <input type="file" accept="image/*" style="display: none;" (change)="onFileSelected($event)">
          </label>
        </div>

        <div class="form-group">
          <label class="form-label" for="groupName">Group Name *</label>
          <input id="groupName"
                 class="form-input"
                 [class.error]="submitted && !groupName.trim()"
                 type="text"
                 placeholder="e.g., Weekend Trip, Roommates"
                 [(ngModel)]="groupName"
                 maxlength="50">
          <span class="form-error" *ngIf="submitted && !groupName.trim()">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Group name is required
          </span>
        </div>

        <div class="form-group">
          <label class="form-label" for="groupDesc">Description</label>
          <textarea id="groupDesc"
                    class="form-input form-textarea"
                    placeholder="What's this group for?"
                    [(ngModel)]="groupDescription"
                    rows="3"
                    maxlength="200"></textarea>
          <span class="char-count">{{ groupDescription.length }}/200</span>
        </div>

        <div class="step-actions">
          <button class="btn btn-primary btn-lg" (click)="nextStep()">
            Continue to Members
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      </div>

      <!-- Step 2: Members -->
      <div class="step-content glass-card" *ngIf="currentStep === 2" [class.animate-slide-right]="slideDirection === 'right'" [class.animate-slide-left]="slideDirection === 'left'">
        <h2 class="step-title">Add Members</h2>

        <!-- Add Member Dropdown -->
        <div class="add-member-form">
          <div class="form-group">
            <label class="form-label" for="userSelect">Select User</label>
            <div class="form-row">
              <select id="userSelect"
                      class="form-select flex-1"
                      [(ngModel)]="selectedUserId">
                <option value="">Select a user to add...</option>
                <option *ngFor="let user of getAvailableUsers()" [value]="user.id">
                  {{ user.name }} ({{ user.email }})
                </option>
              </select>
              <button class="btn btn-secondary" (click)="addMember()" [disabled]="!selectedUserId">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add
              </button>
            </div>
          </div>
        </div>

        <!-- Members List -->
        <div class="members-list" *ngIf="pendingMembers.length > 0">
          <h3 class="members-heading">
            Members ({{ pendingMembers.length }})
          </h3>
          <div *ngFor="let member of pendingMembers; let i = index"
               class="member-item animate-scale-in"
               [style.animation-delay]="(i * 0.05) + 's'">
            <div class="member-info">
              <div class="avatar avatar-md"
                   [style.background-color]="getMemberColor(i)">
                {{ member.name.charAt(0).toUpperCase() }}
              </div>
              <div class="member-details">
                <span class="member-name">{{ member.name }}</span>
                <span class="member-email" *ngIf="member.email">{{ member.email }}</span>
              </div>
              <span class="badge badge-user" *ngIf="member.id === currentUserId">You</span>
            </div>
            <button class="remove-btn" (click)="removePendingMember(i)" title="Remove member" *ngIf="member.id !== currentUserId">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="no-members" *ngIf="pendingMembers.length === 0">
          <p>No members added yet. Add users or guests to your group.</p>
        </div>

        <div class="step-actions">
          <button class="btn btn-secondary" (click)="prevStep()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back
          </button>
          <button class="btn btn-primary btn-lg" (click)="createGroup()" [disabled]="pendingMembers.length === 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Create Group
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .create-group {
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

    .page-header {
      margin-bottom: var(--space-xl);
    }

    .page-title {
      font-size: var(--font-3xl);
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: var(--space-sm);
    }

    .page-subtitle {
      color: var(--text-secondary);
      font-size: var(--font-base);
    }

    /* Steps Indicator */
    .steps-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-md);
      margin-bottom: var(--space-xl);
    }

    .step {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      cursor: pointer;
      transition: opacity var(--transition-base);
    }

    .step-circle {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: var(--font-sm);
      background: var(--bg-glass);
      border: 2px solid var(--border-subtle);
      color: var(--text-muted);
      transition: all var(--transition-base);
    }

    .step.active .step-circle {
      background: var(--gradient-primary);
      border-color: transparent;
      color: white;
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
    }

    .step.completed .step-circle {
      background: var(--accent-green);
      border-color: transparent;
      color: white;
    }

    .step-label {
      font-size: var(--font-sm);
      font-weight: 500;
      color: var(--text-muted);
      transition: color var(--transition-base);
    }

    .step.active .step-label,
    .step.completed .step-label {
      color: var(--text-primary);
    }

    .step-connector {
      width: 60px;
      height: 2px;
      background: var(--border-subtle);
      border-radius: 1px;
      transition: background var(--transition-base);
    }

    .step-connector.active {
      background: var(--gradient-primary);
    }

    /* Step Content */
    .step-content {
      padding: var(--space-xl);
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
    }

    .step-content:hover {
      transform: none;
    }

    .step-title {
      font-size: var(--font-xl);
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .char-count {
      font-size: var(--font-xs);
      color: var(--text-muted);
      text-align: right;
    }

    /* Step Actions */
    .step-actions {
      display: flex;
      justify-content: space-between;
      gap: var(--space-md);
      padding-top: var(--space-md);
    }

    .step-actions .btn:only-child {
      margin-left: auto;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Member Type Toggle */
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      padding: 0.625rem;
      border-radius: var(--radius-sm);
      font-weight: 500;
      font-size: var(--font-sm);
      color: var(--text-muted);
      transition: all var(--transition-base);
    }

    .toggle-btn.active {
      background: var(--gradient-primary);
      color: white;
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
    }

    .toggle-btn:not(.active):hover {
      color: var(--text-primary);
      background: var(--bg-glass-hover);
    }

    /* Add Member Form */
    .add-member-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .form-row {
      display: flex;
      gap: var(--space-md);
    }

    .flex-1 {
      flex: 1;
    }

    /* Members List */
    .members-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .members-heading {
      font-size: var(--font-sm);
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: var(--space-xs);
    }

    .member-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-md);
      background: var(--bg-glass);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      transition: all var(--transition-base);
    }

    .member-item:hover {
      border-color: var(--border-accent);
      background: var(--bg-glass-hover);
    }

    .member-info {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      flex: 1;
    }

    .member-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .member-name {
      font-weight: 600;
      font-size: var(--font-sm);
    }

    .member-email {
      font-size: var(--font-xs);
      color: var(--text-muted);
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

    .no-members {
      text-align: center;
      padding: var(--space-xl);
      color: var(--text-muted);
      font-size: var(--font-sm);
    }

    @media (max-width: 640px) {
      .form-row {
        flex-direction: column;
      }

      .steps-indicator {
        gap: var(--space-sm);
      }

      .step-connector {
        width: 30px;
      }

      .step-label {
        display: none;
      }
    }
  `]
})
export class CreateGroupComponent implements OnInit {
  currentStep = 1;
  submitted = false;
  memberSubmitted = false;
  slideDirection: 'left' | 'right' = 'right';

  // Step 1
  groupName = '';
  groupDescription = '';
  currency = 'INR';
  iconUrl?: string;

  // Step 2
  selectedUserId = '';
  allUsers: User[] = [];
  pendingMembers: User[] = [];
  currentUserId = '';

  constructor(
    private groupService: GroupService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.allUsers = this.authService.getAllUsers();

    // Automatically add the creator
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentUserId = currentUser.id;
      this.pendingMembers.push(currentUser);
    }
  }

  nextStep() {
    this.submitted = true;
    if (!this.groupName.trim()) return;
    this.slideDirection = 'right';
    this.currentStep = 2;
    this.submitted = false;
  }

  prevStep() {
    this.slideDirection = 'left';
    this.currentStep = 1;
  }

  goToStep(step: number) {
    if (step === 1) {
      this.slideDirection = 'left';
      this.currentStep = 1;
    }
  }

  getAvailableUsers(): User[] {
    return this.allUsers.filter(u => !this.pendingMembers.some(pm => pm.id === u.id));
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        this.iconUrl = await this.groupService.resizeImage(file, 200, 200);
      } catch (err) {
        console.error('Error uploading image', err);
      }
    }
  }

  addMember() {
    if (!this.selectedUserId) return;

    const user = this.allUsers.find(u => u.id === this.selectedUserId);
    if (user && !this.pendingMembers.some(pm => pm.id === user.id)) {
      this.pendingMembers.push(user);
    }
    this.selectedUserId = '';
  }

  removePendingMember(index: number) {
    // Prevent removing the creator
    if (this.pendingMembers[index].id === this.currentUserId) return;
    this.pendingMembers.splice(index, 1);
  }

  getMemberColor(index: number): string {
    return this.pendingMembers[index].avatarColor;
  }

  createGroup() {
    if (this.pendingMembers.length === 0) return;

    this.groupService.createGroup(
      this.groupName.trim(),
      this.groupDescription.trim(),
      this.currency,
      this.currentUserId,
      this.pendingMembers,
      this.iconUrl
    );

    this.router.navigate(['/']);
  }
}
