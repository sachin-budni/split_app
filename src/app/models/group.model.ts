export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional for security when passing around
  avatarColor: string;
}

export interface Member {
  id: string;
  name: string;
  email?: string;
  avatarColor: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  paidByName: string;
  createdAt: Date;
  isSettlement?: boolean;
  settledWithId?: string;
  settledWithName?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  currency: string;
  iconUrl?: string;
  adminIds: string[];
  createdById?: string;
  createdByName?: string;
  members: Member[];
  expenses: Expense[];
  createdAt: Date;
}

export interface Settlement {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface GlobalSettlement extends Settlement {
  groupId: string;
  groupName: string;
  currency: string;
}

