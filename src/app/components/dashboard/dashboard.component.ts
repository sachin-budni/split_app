import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { GroupService } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';
import { Group } from '../../models/group.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  template: `
    <div class="dashboard container">
      <!-- Hero Section -->
      <div class="hero animate-fade-in">
        <h1 class="page-title text-gradient">Dashboard</h1>
        <p class="text-muted">Welcome back. Here's your expense overview.</p>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="!loaded">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading your dashboard...</p>
      </div>

      <ng-container *ngIf="loaded">
        <!-- Balances Summary -->
        <section class="balances-summary animate-fade-in-up stagger-1" *ngIf="groups.length > 0">
          <div class="summary-cards">
            <a routerLink="/balances" class="summary-card negative glass-card">
              <div class="summary-icon-wrapper negative">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
              </div>
              <div class="summary-content">
                <span class="summary-label">To Pay Total</span>
                <span class="summary-amount">{{ getCurrencySymbol('INR') }}{{ totalToPay | number:'1.2-2' }}</span>
              </div>
              <div class="summary-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </a>
            
            <a routerLink="/balances" class="summary-card positive glass-card">
              <div class="summary-icon-wrapper positive">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="7" x2="7" y2="17"></line><polyline points="17 17 7 17 7 7"></polyline></svg>
              </div>
              <div class="summary-content">
                <span class="summary-label">Get Back Total</span>
                <span class="summary-amount">{{ getCurrencySymbol('INR') }}{{ totalToGetBack | number:'1.2-2' }}</span>
              </div>
              <div class="summary-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </a>
          </div>
        </section>

        <!-- Analytics Section -->
        <section class="analytics-section animate-fade-in-up stagger-1" *ngIf="groups.length > 0">
          <div class="section-header">
            <h2 class="section-title">Analytics</h2>
          </div>

          <div class="analytics-panel glass-card">
            <!-- Insights Header -->
            <div class="analytics-insights">
              <div class="insight-item">
                <span class="insight-label">Total Tracked</span>
                <span class="insight-value">{{ getCurrencySymbol('INR') }}{{ totalExpensesTracked | number:'1.2-2' }}</span>
              </div>
              <div class="insight-item">
                <span class="insight-label">Most Expensive</span>
                <span class="insight-value">{{ mostExpensiveGroup || 'N/A' }}</span>
              </div>
              <div class="insight-item">
                <span class="insight-label">Net Balance</span>
                <span class="insight-value" [ngClass]="{'positive': totalToGetBack > totalToPay, 'negative': totalToPay > totalToGetBack}">
                  {{ totalToGetBack > totalToPay ? '+' : (totalToPay > totalToGetBack ? '-' : '') }}{{ getCurrencySymbol('INR') }}{{ getNetBalance() | number:'1.2-2' }}
                </span>
              </div>
            </div>
            
            <!-- Charts Grid -->
            <div class="analytics-grid">
              <div class="chart-wrapper">
                <h3 class="chart-title">Expenses by Group</h3>
                <div class="chart-container">
                  <canvas baseChart
                    [data]="expenseChartData"
                    [options]="expenseChartOptions"
                    [type]="'doughnut'">
                  </canvas>
                </div>
                <div class="chart-empty" *ngIf="expenseChartData?.datasets?.[0]?.data?.length === 0">
                  <p>No expenses tracked yet.</p>
                </div>
              </div>

              <div class="chart-wrapper">
                <h3 class="chart-title">Balances Overview</h3>
                <div class="chart-container">
                  <canvas baseChart
                    [data]="settlementChartData"
                    [options]="settlementChartOptions"
                    [type]="'bar'">
                  </canvas>
                </div>
                <div class="chart-empty" *ngIf="totalToPay === 0 && totalToGetBack === 0">
                  <p>You're all settled up! 🎉</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Groups Grid -->
        <section class="groups-section" *ngIf="groups.length > 0">
          <div class="section-header animate-fade-in-up stagger-1">
            <h2 class="section-title">Your Groups</h2>
            <span class="group-count">{{ groups.length }} {{ groups.length === 1 ? 'group' : 'groups' }}</span>
          </div>

          <div class="groups-grid">
            <a *ngFor="let group of groups; let i = index"
               [routerLink]="['/group', group.id]"
               class="group-card animate-fade-in-up"
               [class]="'stagger-' + (i + 2)"
               [style.animation-delay]="(i * 0.07) + 's'"
               [style.--group-gradient]="getGroupGradient(i)">

              <div class="card-header">
                <div class="card-icon" [style.background]="getGroupGradient(i)" style="overflow: hidden;">
                  <img *ngIf="group.iconUrl" [src]="group.iconUrl" style="width: 100%; height: 100%; object-fit: cover;" alt="Group Icon" />
                  <span *ngIf="!group.iconUrl">{{ group.name.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="card-meta">
                  <span class="card-currency">{{ group.currency }}</span>
                  <span class="card-date">{{ group.createdAt | date:'mediumDate' }}</span>
                  <span class="card-creator" *ngIf="group.createdByName">by {{ group.createdByName }}</span>
                </div>
              </div>

              <h3 class="card-title">{{ group.name }}</h3>
              <p class="card-desc" *ngIf="group.description">{{ group.description }}</p>

              <div class="card-spent" *ngIf="getGroupTotal(group) > 0">
                <span class="spent-label">Total Spent</span>
                <span class="spent-amount">{{ getCurrencySymbol(group.currency) }}{{ getGroupTotal(group) | number:'1.2-2' }}</span>
              </div>

              <div class="card-footer">
                <div class="avatar-stack">
                  <div *ngFor="let member of group.members.slice(0, 4)"
                       class="avatar avatar-sm"
                       [style.background-color]="member.avatarColor"
                       [title]="member.name">
                    {{ member.name.charAt(0).toUpperCase() }}
                  </div>
                  <div *ngIf="group.members.length > 4"
                       class="avatar avatar-sm overflow-avatar">
                    +{{ group.members.length - 4 }}
                  </div>
                </div>
                <span class="member-count">
                  {{ group.members.length }} {{ group.members.length === 1 ? 'member' : 'members' }}
                  <span class="per-person" *ngIf="getGroupTotal(group) > 0 && group.members.length > 0">
                    · {{ getCurrencySymbol(group.currency) }}{{ getGroupTotal(group) / group.members.length | number:'1.2-2' }}/person
                  </span>
                </span>
              </div>
            </a>
          </div>
        </section>

        <!-- Empty State -->
        <section class="empty-state animate-fade-in-up stagger-2" *ngIf="groups.length === 0">
          <div class="empty-icon">👥</div>
          <h2 class="empty-title">No groups yet</h2>
          <p class="empty-desc">Create your first group to start splitting expenses with friends, family, or colleagues.</p>
          <a routerLink="/create-group" class="btn btn-primary btn-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Create Your First Group
          </a>
        </section>
      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard {
      padding-top: var(--space-2xl);
      padding-bottom: var(--space-3xl);
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-3xl);
      gap: var(--space-md);
    }
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255,255,255,0.1);
      border-left-color: var(--accent-purple);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Hero */
    .hero {
      text-align: center;
      padding: var(--space-3xl) 0;
    }

    .hero-title {
      font-size: var(--font-5xl);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.1;
      margin-bottom: var(--space-md);
    }

    .hero-subtitle {
      font-size: var(--font-lg);
      color: var(--text-secondary);
      max-width: 500px;
      margin: 0 auto var(--space-xl);
      line-height: 1.6;
    }

    .hero-cta {
      text-decoration: none;
    }

    /* Section Header */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-xl);
    }

    .section-title {
      font-size: var(--font-2xl);
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .group-count {
      font-size: var(--font-sm);
      color: var(--text-muted);
      background: var(--bg-glass);
      padding: 0.375rem 0.875rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-subtle);
    }

    /* Groups Grid */
    .groups-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: var(--space-md);
    }

    .group-card {
      padding: var(--space-md);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
      text-decoration: none;
      color: inherit;
      position: relative;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      backdrop-filter: blur(16px);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .group-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: var(--group-gradient);
      opacity: 0.6;
      transition: opacity 0.4s ease, height 0.4s ease;
    }

    .group-card:hover {
      transform: translateY(-8px) scale(1.02);
      border-color: rgba(255, 255, 255, 0.15);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.15);
      background: rgba(255, 255, 255, 0.05);
    }

    .group-card:hover::before {
      opacity: 1;
      height: 6px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0;
    }

    .card-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-lg);
      font-weight: 800;
      color: white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .group-card:hover .card-icon {
      transform: scale(1.1) rotate(-5deg);
    }

    .card-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .card-currency {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--accent-cyan);
      background: rgba(6, 182, 212, 0.1);
      padding: 1px 6px;
      border-radius: var(--radius-full);
    }

    .card-date {
      font-size: 0.65rem;
      color: var(--text-muted);
    }

    .card-creator {
      font-size: 0.65rem;
      color: var(--text-muted);
      opacity: 0.8;
      font-style: italic;
    }

    .card-title {
      font-size: var(--font-base);
      font-weight: 800;
      letter-spacing: -0.01em;
      margin-bottom: 0;
      transition: color 0.3s ease;
    }

    .group-card:hover .card-title {
      background: var(--group-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .card-desc {
      font-size: var(--font-xs);
      color: var(--text-secondary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 2px;
    }

    /* Balances Summary */
    .balances-summary {
      margin-bottom: var(--space-2xl);
    }
    
    .summary-cards {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-md);
    }
    
    @media (min-width: 640px) {
      .summary-cards {
        grid-template-columns: 1fr 1fr;
      }
    }

    /* Analytics Section */
    .analytics-section {
      margin-bottom: var(--space-3xl);
    }
    
    .analytics-panel {
      padding: var(--space-xl);
      border-radius: var(--radius-lg);
      background: rgba(15, 23, 42, 0.4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2xl);
    }
    
    /* Insights Header */
    .analytics-insights {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-xl);
      padding-bottom: var(--space-xl);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .insight-item {
      flex: 1;
      min-width: 150px;
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }
    
    .insight-label {
      font-size: var(--font-sm);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    
    .insight-value {
      font-size: var(--font-2xl);
      font-weight: 800;
      color: var(--text-primary);
    }
    
    .insight-value.positive { color: var(--accent-green); }
    .insight-value.negative { color: var(--accent-red); }

    /* Charts Grid */
    .analytics-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-2xl);
    }
    
    @media (min-width: 768px) {
      .analytics-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .chart-wrapper {
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .chart-title {
      font-size: var(--font-lg);
      font-weight: 700;
      margin-bottom: var(--space-lg);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }
    
    .chart-title::before {
      content: '';
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--accent-purple);
      box-shadow: 0 0 10px var(--accent-purple);
    }

    .chart-container {
      position: relative;
      height: 250px;
      width: 100%;
    }

    .chart-empty {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      color: var(--text-secondary);
      font-style: italic;
      text-align: center;
      width: 100%;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: var(--space-lg);
      padding: var(--space-xl);
      text-decoration: none;
      color: inherit;
      position: relative;
      overflow: hidden;
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.4s ease;
    }

    .summary-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%);
      pointer-events: none;
    }

    .summary-card:hover {
      transform: translateY(-4px) scale(1.01);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.5);
    }

    .summary-card.negative {
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    
    .summary-card.positive {
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .summary-card.negative:hover { border-color: rgba(239, 68, 68, 0.5); }
    .summary-card.positive:hover { border-color: rgba(16, 185, 129, 0.5); }

    .summary-icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 8px 16px rgba(0,0,0,0.3);
      position: relative;
      z-index: 1;
    }

    .summary-icon-wrapper.negative {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05));
      color: var(--accent-red);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .summary-icon-wrapper.positive {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05));
      color: var(--accent-green);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      z-index: 1;
    }

    .summary-label {
      font-size: var(--font-sm);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .summary-amount {
      font-size: 2.2rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
      background: linear-gradient(to right, var(--text-primary), var(--text-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .summary-arrow {
      color: var(--text-muted);
      opacity: 0.5;
      transition: transform 0.3s ease, opacity 0.3s ease;
      z-index: 1;
    }

    .summary-card:hover .summary-arrow {
      opacity: 1;
      transform: translateX(4px);
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: var(--space-xs);
      border-top: 1px solid var(--border-subtle);
    }

    .member-count {
      font-size: 0.65rem;
      color: var(--text-muted);
    }

    .overflow-avatar {
      background: var(--bg-tertiary) !important;
      font-size: 0.65rem;
      color: var(--text-secondary);
    }

    .card-spent {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 8px;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: var(--radius-sm);
      margin-top: 0;
    }

    .spent-label {
      font-size: 0.65rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .spent-amount {
      font-size: var(--font-sm);
      font-weight: 700;
      color: var(--accent-green);
    }

    .per-person {
      color: var(--accent-cyan);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--space-3xl) var(--space-xl);
      max-width: 480px;
      margin: 0 auto;
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
    }

    @media (max-width: 768px) {
      .hero {
        padding: var(--space-xl) 0;
      }

      .groups-grid {
        grid-template-columns: 1fr;
      }
      
      .analytics-grid {
        grid-template-columns: 1fr;
      }
    }
    
    @media (max-width: 640px) {
      .analytics-panel {
        padding: var(--space-md);
        gap: var(--space-lg);
      }
      
      .analytics-insights {
        flex-direction: column;
        gap: var(--space-md);
      }
      
      .insight-item {
        align-items: center;
        text-align: center;
      }
      
      .insight-value {
        font-size: var(--font-xl);
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  groups: Group[] = [];
  totalToPay = 0;
  totalToGetBack = 0;
  loaded = false;

  // New Insights properties
  totalExpensesTracked = 0;
  mostExpensiveGroup = '';

  // Analytics properties
  expenseChartData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  expenseChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#e2e8f0', padding: 20, usePointStyle: true, pointStyle: 'circle' } },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true
      }
    },
    cutout: '75%',
    elements: {
      arc: {
        borderWidth: 4,
        borderColor: '#0f172a' // Matches background for premium separation
      }
    }
  };

  settlementChartData: ChartData<'bar'> = { labels: ['You Owe', 'You Are Owed'], datasets: [{ data: [0, 0] }] };
  settlementChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' }, border: { display: false } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { weight: 'bold' } }, border: { display: false } }
    }
  };

  private gradients = [
    'linear-gradient(135deg, #8B5CF6, #6366F1)',
    'linear-gradient(135deg, #EC4899, #F59E0B)',
    'linear-gradient(135deg, #06B6D4, #3B82F6)',
    'linear-gradient(135deg, #10B981, #06B6D4)',
    'linear-gradient(135deg, #F59E0B, #EF4444)',
    'linear-gradient(135deg, #A855F7, #EC4899)',
  ];

  // For charts
  private chartColors = [
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(6, 182, 212, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
  ];

  constructor(
    private groupService: GroupService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (!user) return; // Wait until auth state resolves

      this.groupService.getGroups(user.id).subscribe(groups => {
        if (!this.groupService.hasInitialized) return;

        this.groups = groups;

        let sumToPay = 0;
        let sumToGetBack = 0;
        let totalTracked = 0;
        let maxGroupTotal = 0;
        let mostExpensiveName = '';

        const expenseLabels: string[] = [];
        const expenseData: number[] = [];

        groups.forEach(group => {
          // Balances
          const settlements = this.groupService.calculateSettlements(group);
          settlements.forEach(s => {
            if (s.fromId === user.id) {
              sumToPay += s.amount;
            } else if (s.toId === user.id) {
              sumToGetBack += s.amount;
            }
          });

          // Expenses Chart Data
          const groupTotal = this.groupService.getTotalExpenses(group);
          if (groupTotal > 0) {
            totalTracked += groupTotal;
            expenseLabels.push(group.name);
            expenseData.push(groupTotal);

            if (groupTotal > maxGroupTotal) {
              maxGroupTotal = groupTotal;
              mostExpensiveName = group.name;
            }
          }
        });

        this.totalToPay = sumToPay;
        this.totalToGetBack = sumToGetBack;
        this.totalExpensesTracked = totalTracked;
        this.mostExpensiveGroup = mostExpensiveName;

        // Apply Data to Charts
        this.expenseChartData = {
          labels: expenseLabels,
          datasets: [{
            data: expenseData,
            backgroundColor: this.chartColors,
            borderColor: '#0f172a',
            borderWidth: 4,
            hoverOffset: 10
          }]
        };

        this.settlementChartData = {
          labels: ['You Owe', 'You Are Owed'],
          datasets: [{
            data: [sumToPay, sumToGetBack],
            backgroundColor: ['#ef4444', '#10b981'],
            borderColor: ['#b91c1c', '#047857'],
            borderWidth: 0,
            borderRadius: 8,
            hoverBackgroundColor: ['#f87171', '#34d399'],
            barThickness: 40
          }]
        };

        this.loaded = true;
      });
    });
  }

  getGroupGradient(index: number): string {
    return this.gradients[index % this.gradients.length];
  }

  getGroupTotal(group: Group): number {
    return this.groupService.getTotalExpenses(group);
  }

  getCurrencySymbol(currency: string): string {
    return this.groupService.getCurrencySymbol(currency);
  }

  getNetBalance(): number {
    return Math.abs(this.totalToGetBack - this.totalToPay);
  }
}
