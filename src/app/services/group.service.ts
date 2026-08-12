import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Group, Member, Expense, Settlement } from '../models/group.model';
import { Database, ref, onValue, set } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private groupsSubject = new BehaviorSubject<Group[]>([]);
  public hasInitialized = false;
  private db = inject(Database);

  private readonly avatarColors = [
    '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B',
    '#EF4444', '#3B82F6', '#6366F1', '#14B8A6', '#F97316',
    '#A855F7', '#22D3EE', '#84CC16', '#E11D48', '#0EA5E9'
  ];

  private readonly currencySymbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹',
    JPY: '¥', CAD: 'C$', AUD: 'A$'
  };

  constructor() {
    // Listen to Firebase Realtime DB for groups list
    const groupsRef = ref(this.db, 'groups');
    onValue(groupsRef, (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const groups: Group[] = Object.values(data);
        const parsedGroups = groups.map((g: any) => {
          const membersArray = g.members ? Object.values(g.members) : [];
          const initialAdmin = g.adminIds ? g.adminIds[0] : (g.adminId || (membersArray.length > 0 ? (membersArray[0] as any).id : ''));
          const creatorName = (membersArray as any[]).find((m: any) => m.id === initialAdmin)?.name || 'Unknown';
          
          return {
            ...g,
            adminIds: g.adminIds || (g.adminId ? [g.adminId] : (g.members && g.members.length > 0 ? [g.members[0].id] : [])),
            currency: g.currency === 'USD' ? 'INR' : (g.currency || 'INR'),
            createdById: g.createdById || initialAdmin,
            createdByName: g.createdByName || creatorName,
            members: membersArray,
            expenses: g.expenses ? Object.values(g.expenses).map((e: any) => ({
              ...e,
              createdAt: e.createdAt ? new Date(e.createdAt) : new Date()
            })) : [],
            createdAt: g.createdAt ? new Date(g.createdAt) : new Date()
          };
        });
        this.hasInitialized = true;
        this.groupsSubject.next(parsedGroups);
      } else {
        this.hasInitialized = true;
        this.groupsSubject.next([]);
      }
    });
  }

  getGroups(userId?: string): Observable<Group[]> {
    if (!userId) return this.groupsSubject.asObservable();
    
    return new Observable<Group[]>(observer => {
      this.groupsSubject.subscribe(groups => {
        observer.next(groups.filter(g => g.members.some(m => m.id === userId)));
      });
    });
  }

  getGroupById(id: string): Group | undefined {
    return this.groupsSubject.value.find(g => g.id === id);
  }

  getCurrencySymbol(currency: string): string {
    return this.currencySymbols[currency] || currency;
  }

  createGroup(name: string, description: string, currency: string, adminId: string, members: Member[], iconUrl?: string): Group {
    const admin = members.find(m => m.id === adminId) || members[0];
    const group: Group = {
      id: this.generateId(),
      name,
      description,
      currency,
      iconUrl,
      adminIds: [adminId],
      createdById: adminId,
      createdByName: admin?.name || 'Unknown',
      members: [...members],
      expenses: [],
      createdAt: new Date()
    };

    const groups = [...this.groupsSubject.value, group];
    this.saveToStorage(groups);
    return group;
  }

  updateGroup(id: string, updates: Partial<Pick<Group, 'name' | 'description' | 'currency' | 'iconUrl'>>): void {
    const groups = this.groupsSubject.value.map(g =>
      g.id === id ? { ...g, ...updates } : g
    );
    this.saveToStorage(groups);
  }

  deleteGroup(id: string): void {
    const groups = this.groupsSubject.value.filter(g => g.id !== id);
    this.saveToStorage(groups);
  }

  addMember(groupId: string, member: Member): Member | null {
    const group = this.getGroupById(groupId);
    if (!group) return null;

    const groups = this.groupsSubject.value.map(g =>
      g.id === groupId
        ? { ...g, members: [...g.members, member] }
        : g
    );
    this.saveToStorage(groups);
    return member;
  }

  removeMember(groupId: string, memberId: string): void {
    const groups = this.groupsSubject.value.map(g =>
      g.id === groupId
        ? { ...g, members: g.members.filter(m => m.id !== memberId), adminIds: g.adminIds.filter(id => id !== memberId) }
        : g
    );
    this.saveToStorage(groups);
  }

  makeAdmin(groupId: string, memberId: string): void {
    const groups = this.groupsSubject.value.map(g =>
      g.id === groupId && !g.adminIds.includes(memberId)
        ? { ...g, adminIds: [...g.adminIds, memberId] }
        : g
    );
    this.saveToStorage(groups);
  }

  removeAdmin(groupId: string, memberId: string): void {
    const groups = this.groupsSubject.value.map(g =>
      g.id === groupId && g.adminIds.includes(memberId)
        ? { ...g, adminIds: g.adminIds.filter(id => id !== memberId) }
        : g
    );
    this.saveToStorage(groups);
  }

  // ---- Expense Methods ----

  addExpense(groupId: string, expense: Omit<Expense, 'id' | 'createdAt'>): Expense | null {
    const group = this.getGroupById(groupId);
    if (!group) return null;

    const newExpense: Expense = {
      ...expense,
      id: this.generateId(),
      createdAt: new Date()
    };

    const groups = this.groupsSubject.value.map(g =>
      g.id === groupId
        ? { ...g, expenses: [newExpense, ...(g.expenses || [])] }
        : g
    );
    this.saveToStorage(groups);
    return newExpense;
  }

  removeExpense(groupId: string, expenseId: string): void {
    const groups = this.groupsSubject.value.map(g =>
      g.id === groupId
        ? { ...g, expenses: (g.expenses || []).filter(e => e.id !== expenseId) }
        : g
    );
    this.saveToStorage(groups);
  }

  getTotalExpenses(group: Group): number {
    return (group.expenses || [])
      .filter(e => !e.isSettlement)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  settleUp(groupId: string, fromMember: Member, toMember: Member, amount: number): Expense | null {
    const expense: Omit<Expense, 'id' | 'createdAt'> = {
      description: `Settlement: ${fromMember.name} paid ${toMember.name}`,
      amount: amount,
      paidById: fromMember.id,
      paidByName: fromMember.name,
      isSettlement: true,
      settledWithId: toMember.id,
      settledWithName: toMember.name
    };
    return this.addExpense(groupId, expense);
  }

  calculateSettlements(group: Group): Settlement[] {
    if (!group.members || group.members.length === 0 || !group.expenses || group.expenses.length === 0) return [];

    const total = this.getTotalExpenses(group);
    const fairShare = total / group.members.length;

    const balances: { id: string; name: string; balance: number }[] = group.members.map(m => {
      let balance = -fairShare; 

      group.expenses.forEach(e => {
        if (!e.isSettlement) {
          if (e.paidById === m.id) {
            balance += e.amount;
          }
        } else {
          if (e.paidById === m.id) {
            balance += e.amount;
          }
          if (e.settledWithId === m.id) {
            balance -= e.amount;
          }
        }
      });

      return { id: m.id, name: m.name, balance: +balance.toFixed(2) };
    });

    const debtors = balances.filter(b => b.balance < -0.01).map(b => ({ ...b, balance: Math.abs(b.balance) }));
    const creditors = balances.filter(b => b.balance > 0.01).map(b => ({ ...b }));

    debtors.sort((a, b) => b.balance - a.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    const settlements: Settlement[] = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].balance, creditors[j].balance);
      if (amount > 0.01) {
        settlements.push({
          fromId: debtors[i].id,
          fromName: debtors[i].name,
          toId: creditors[j].id,
          toName: creditors[j].name,
          amount: +amount.toFixed(2)
        });
      }
      debtors[i].balance -= amount;
      creditors[j].balance -= amount;
      if (debtors[i].balance < 0.01) i++;
      if (creditors[j].balance < 0.01) j++;
    }

    return settlements;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  resizeImage(file: File, maxWidth = 200, maxHeight = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL(file.type));
        };
        img.onerror = () => reject('Error loading image');
        img.src = e.target.result;
      };
      reader.onerror = () => reject('Error reading file');
      reader.readAsDataURL(file);
    });
  }

  private getRandomColor(): string {
    return this.avatarColors[Math.floor(Math.random() * this.avatarColors.length)];
  }

  private saveToStorage(groups: Group[]): void {
    const record: Record<string, any> = {};
    groups.forEach(g => {
      record[g.id] = {
        ...g,
        createdAt: g.createdAt ? g.createdAt.toISOString() : new Date().toISOString(),
        expenses: (g.expenses || []).map(e => ({
          ...e,
          createdAt: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString()
        }))
      };
    });
    // Note: We don't call this.groupsSubject.next(groups) here anymore,
    // because Firebase onValue listener will pick up the change and update the subject!
    // This gives us true real-time multi-client syncing.
    // However, to ensure optimistic UI updates, we could call next() here,
    // but relying on Firebase is safer and avoids double-emitting.
    set(ref(this.db, 'groups'), record).catch((err: any) => console.error("Error saving groups to Firebase", err));
  }
}
