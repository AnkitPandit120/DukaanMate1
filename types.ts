
// FIX: Import React to use React.ElementType
import React from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  // Added role and registrationDate properties to support role-based login and admin features
  role?: string;
  registrationDate?: string;
}

export interface Sale {
  id: string;
  itemName: string;
  quantity: number;
  price: number;
  date: string; // ISO 8601 format date string
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  note?: string;
  date: string; // YYYY-MM-DD format
}

export interface StockItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  expiryDate?: string; // YYYY-MM-DD format
  price: number;
}

export enum PaymentStatus {
  Pending = 'Pending',
  Received = 'Received',
  Paid = 'Paid',
}

export interface Payment {
  id: string;
  name: string; // Customer or Supplier name
  amount: number;
  status: PaymentStatus;
  date: string; // YYYY-MM-DD format
  type: 'customer' | 'supplier';
}

export enum NotificationType {
  LowStock = 'lowStock',
  NearExpiry = 'nearExpiry',
  OutOfStock = 'outOfStock',
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  itemId: string;
  itemName: string;
}

export interface Activity {
  id: string;
  type: 'sale' | 'expense' | 'payment';
  description: string;
  amount: number;
  date: string;
  Icon: React.ElementType;
}
