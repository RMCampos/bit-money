import { Request } from 'express';

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface CreatePostData {
  content: string;
  imageUrl?: string;
}

export interface Comment {
  id: number;
  userId: number;
  postId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface Account {
  id: number;
  userId: number;
  name: string;
  currentValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountData {
  name: string;
  currentValue?: number;
}

export interface UpdateAccountData {
  name?: string;
  currentValue?: number;
}

export interface CreditCard {
  id: number;
  userId: number;
  name: string;
  currentValue: number;
  limitValue: number;
  dueDate: string;
  closingDate: string;
  paid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCreditCardData {
  name: string;
  currentValue?: number;
  limitValue: number;
  dueDate: string;
  closingDate: string;
  paid?: boolean;
}

export interface UpdateCreditCardData {
  name?: string;
  currentValue?: number;
  limitValue?: number;
  dueDate?: string;
  closingDate?: string;
  paid?: boolean;
}

export interface Category {
  id: number;
  userId: number;
  name: string;
  accountType: 'E' | 'I'; // 'E' for expense, 'I' for income
  displayAtHome: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryData {
  name: string;
  accountType: 'E' | 'I';
  displayAtHome?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  accountType?: 'E' | 'I';
  displayAtHome?: boolean;
}

export interface Transaction {
  id: number;
  userId: number;
  transactionType: 'E' | 'I' | 'T'; // 'E' for expense, 'I' for income, 'T' for transfer
  amount: number;
  transactionDate: Date;
  paid: boolean;
  comment?: string;
  // For expense or income
  accountId?: number;
  categoryId?: number;
  // For transfer
  transferAccountId?: number;
  createdAt: Date;
  updatedAt: Date;
  // Optional nested objects
  account?: Account;
  category?: Category;
  transferAccount?: Account;
}

export interface CreateTransactionData {
  transactionType: 'E' | 'I' | 'T';
  amount: number;
  transactionDate?: Date;
  paid?: boolean;
  comment?: string;
  // For expense or income
  accountId?: number;
  categoryId?: number;
  // For transfer
  transferAccountId?: number;
}

export interface UpdateTransactionData {
  transactionType?: 'E' | 'I' | 'T';
  amount?: number;
  transactionDate?: Date;
  paid?: boolean;
  comment?: string;
  accountId?: number;
  categoryId?: number;
  transferAccountId?: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  netAmount: number;
  transactionCount: number;
}
