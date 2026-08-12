import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent) },
  { path: '', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'create-group', loadComponent: () => import('./components/create-group/create-group.component').then(m => m.CreateGroupComponent), canActivate: [authGuard] },
  { path: 'group/:id', loadComponent: () => import('./components/group-detail/group-detail.component').then(m => m.GroupDetailComponent), canActivate: [authGuard] },
  { path: 'history', loadComponent: () => import('./components/transaction-history/transaction-history.component').then(m => m.TransactionHistoryComponent), canActivate: [authGuard] },
  { path: 'balances', loadComponent: () => import('./components/balances/balances.component').then(m => m.BalancesComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
