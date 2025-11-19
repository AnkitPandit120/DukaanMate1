
import { Sale, StockItem, Payment, Expense, PaymentStatus } from '../types';

const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const formatDateTime = (date: Date) => date.toISOString();

// Function to get a random hour between 9 AM and 9 PM
const getRandomHour = () => Math.floor(Math.random() * 12) + 9; 

export const mockSales: Sale[] = [
  { id: '1', itemName: 'Milk', quantity: 2, price: 28, date: formatDateTime(new Date(new Date().setHours(getRandomHour(), 30, 0, 0))) },
  { id: '2', itemName: 'Bread', quantity: 1, price: 40, date: formatDateTime(new Date(new Date().setHours(getRandomHour(), 15, 0, 0))) },
  { id: '3', itemName: 'Eggs', quantity: 12, price: 6, date: formatDateTime(new Date(new Date(new Date().setDate(today.getDate() - 1)).setHours(getRandomHour(), 0, 0, 0))) },
  { id: '4', itemName: 'Cheese', quantity: 1, price: 250, date: formatDateTime(new Date(new Date(new Date().setDate(today.getDate() - 2)).setHours(getRandomHour(), 45, 0, 0))) },
  { id: '5', itemName: 'Milk', quantity: 5, price: 28, date: formatDateTime(new Date(new Date(new Date().setDate(today.getDate() - 3)).setHours(19, 0, 0, 0))) },
  { id: '6', itemName: 'Apples', quantity: 1, price: 120, date: formatDateTime(new Date(new Date(new Date().setDate(today.getDate() - 4)).setHours(11, 0, 0, 0))) },
  { id: '7', itemName: 'Bread', quantity: 3, price: 40, date: formatDateTime(new Date(new Date(new Date().setDate(today.getDate() - 5)).setHours(18, 0, 0, 0))) },
];

export const mockStock: StockItem[] = [
  { id: 's1', itemName: 'Milk', category: 'Dairy', quantity: 20, expiryDate: formatDate(new Date(new Date().setDate(today.getDate() + 10))), price: 28 },
  { id: 's2', itemName: 'Bread', category: 'Bakery', quantity: 30, expiryDate: formatDate(new Date(new Date().setDate(today.getDate() + 3))), price: 40 },
  { id: 's3', itemName: 'Eggs', category: 'Dairy', quantity: 5, expiryDate: formatDate(new Date(new Date().setDate(today.getDate() + 15))), price: 6 },
  { id: 's4', itemName: 'Cheese', category: 'Dairy', quantity: 15, expiryDate: formatDate(new Date(new Date().setDate(today.getDate() + 30))), price: 250 },
  { id: 's5', itemName: 'Apples', category: 'Produce', quantity: 50, price: 120 },
];

export const mockPayments: Payment[] = [
  { id: 'p1', name: 'Customer A', amount: 550, status: PaymentStatus.Pending, date: formatDate(today), type: 'customer' },
  { id: 'p2', name: 'Main Supplier', amount: 5000, status: PaymentStatus.Paid, date: formatDate(new Date(new Date().setDate(today.getDate() - 5))), type: 'supplier' },
  { id: 'p3', name: 'Customer B', amount: 1200, status: PaymentStatus.Received, date: formatDate(new Date(new Date().setDate(today.getDate() - 1))), type: 'customer' },
  { id: 'p4', name: 'Local Farm', amount: 2500, status: PaymentStatus.Pending, date: formatDate(new Date(new Date().setDate(today.getDate() - 2))), type: 'supplier' },
];

export const mockExpenses: Expense[] = [
  { id: 'e1', category: 'Rent', amount: 15000, date: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)) },
  { id: 'e2', category: 'Utilities', amount: 3500, note: 'Electricity bill', date: formatDate(new Date(new Date().setDate(today.getDate() - 10))) },
  { id: 'e3', category: 'Supplies', amount: 2000, date: formatDate(new Date(new Date().setDate(today.getDate() - 3))) },
];
