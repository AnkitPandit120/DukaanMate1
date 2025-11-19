import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Sale, Expense, StockItem, Payment } from '../types';
import { mockSales, mockExpenses, mockStock, mockPayments } from '../data/mockData';
import { useAuth } from './AuthContext';

interface DataContextType {
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'date'>) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  stock: StockItem[];
  updateStock: (itemId: string, quantityChange: number) => void;
  addStockItem: (item: Omit<StockItem, 'id'>) => void;
  updateStockItem: (item: StockItem) => void;
  deleteStockItem: (itemId: string) => void;
  bulkAddStock: (items: Omit<StockItem, 'id'>[]) => void;
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePaymentStatus: (paymentId: string, status: Payment['status']) => void;
  online: boolean;
  qrCode: string | null;
  setQrCode: (qrCode: string | null) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const userKey = user ? user.id : 'guest';

    const [sales, setSales] = useState<Sale[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [stock, setStock] = useState<StockItem[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [online, setOnline] = useState(navigator.onLine);
    const [isLoading, setIsLoading] = useState(true);

    // Effect to load data when the user changes. This is now the single source of truth for loading.
    useEffect(() => {
        setIsLoading(true);
        const safeParse = <T,>(key: string, fallback: T): T => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : fallback;
            } catch (e) {
                console.error(`Failed to parse ${key} from localStorage`, e);
                // If parsing fails, remove the corrupted item
                localStorage.removeItem(key);
                return fallback;
            }
        };
        
        if (userKey === 'demo-user') {
            setSales(mockSales);
            setExpenses(mockExpenses);
            setStock(mockStock);
            setPayments(mockPayments);
            setQrCode(null);
        } else if (userKey !== 'guest') {
            setSales(safeParse(`${userKey}-sales`, []));
            setExpenses(safeParse(`${userKey}-expenses`, []));
            setStock(safeParse(`${userKey}-stock`, []));
            setPayments(safeParse(`${userKey}-payments`, []));
            setQrCode(safeParse(`${userKey}-qrcode`, null));
        } else {
            // Clear data for guest/logged out state
            setSales([]);
            setExpenses([]);
            setStock([]);
            setPayments([]);
            setQrCode(null);
        }
        setIsLoading(false);
    }, [userKey]);

    // Single, combined effect to save all data to localStorage.
    // This runs only after loading is complete and when data actually changes.
    useEffect(() => {
        if (!isLoading && userKey !== 'guest') {
            try {
                localStorage.setItem(`${userKey}-sales`, JSON.stringify(sales));
                localStorage.setItem(`${userKey}-expenses`, JSON.stringify(expenses));
                localStorage.setItem(`${userKey}-stock`, JSON.stringify(stock));
                localStorage.setItem(`${userKey}-payments`, JSON.stringify(payments));
                localStorage.setItem(`${userKey}-qrcode`, JSON.stringify(qrCode));
            } catch (error) {
                console.error("Failed to save data to localStorage", error);
            }
        }
    }, [sales, expenses, stock, payments, qrCode, isLoading, userKey]);


    useEffect(() => {
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const addSale = (sale: Omit<Sale, 'id' | 'date'>) => {
        const stockItem = stock.find(item => item.itemName.toLowerCase().trim() === sale.itemName.toLowerCase().trim());
    
        if (stockItem) {
            if (stockItem.quantity <= 0) {
                console.warn(`Attempted to sell out-of-stock item: ${sale.itemName}`);
                return; 
            }
    
            const quantityToSell = Math.min(sale.quantity, stockItem.quantity);
            const newSale = { ...sale, quantity: quantityToSell, id: new Date().toISOString(), date: new Date().toISOString() };
            setSales(prev => [newSale, ...prev]);
            updateStock(stockItem.id, -quantityToSell);
    
        } else {
            const newSale = { ...sale, id: new Date().toISOString(), date: new Date().toISOString() };
            setSales(prev => [newSale, ...prev]);
        }
    };

    const addExpense = (expense: Omit<Expense, 'id'>) => {
        const newExpense = { ...expense, id: new Date().toISOString() };
        setExpenses(prev => [newExpense, ...prev]);
    };
    
    const updateStock = (itemId: string, quantityChange: number) => {
        setStock(prev => prev.map(item => {
            if (item.id === itemId) {
                const newQuantity = Math.max(0, item.quantity + quantityChange);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const addStockItem = (item: Omit<StockItem, 'id'>) => {
        const newItem = { ...item, id: new Date().toISOString() };
        setStock(prev => [newItem, ...prev]);
    };

    const updateStockItem = (updatedItem: StockItem) => {
        setStock(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    };

    const deleteStockItem = (itemId: string) => {
        setStock(prev => prev.filter(item => item.id !== itemId));
    };

    const bulkAddStock = (items: Omit<StockItem, 'id'>[]) => {
      setStock(prevStock => {
        const newStock = [...prevStock];
        items.forEach(newItem => {
          const existingItem = newStock.find(item => item.itemName.toLowerCase() === newItem.itemName.toLowerCase());
          if (existingItem) {
             const index = newStock.findIndex(item => item.id === existingItem.id);
             newStock[index] = { ...existingItem, ...newItem, quantity: newItem.quantity, price: newItem.price, category: newItem.category, expiryDate: newItem.expiryDate };
          } else {
            newStock.unshift({ ...newItem, id: `${newItem.itemName}-${Date.now()}` });
          }
        });
        return newStock;
      });
    };

    const addPayment = (payment: Omit<Payment, 'id'>) => {
        const newPayment = { ...payment, id: new Date().toISOString() };
        setPayments(prev => [newPayment, ...prev]);
    };
    
    const updatePaymentStatus = (paymentId: string, status: Payment['status']) => {
        setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status } : p));
    };

    return (
        <DataContext.Provider value={{ sales, addSale, expenses, addExpense, stock, updateStock, addStockItem, updateStockItem, deleteStockItem, bulkAddStock, payments, addPayment, updatePaymentStatus, online, qrCode, setQrCode }}>
            {!isLoading && children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
