import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Sale, Expense } from '../types';
import { Icons } from '../components/icons';

const inputClasses = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

// Memoized Sales Form to prevent re-renders on every keystroke
const SalesForm: React.FC<{ onAddSale: (sale: Omit<Sale, 'id' | 'date'>) => void }> = React.memo(({ onAddSale }) => {
  const { t } = useLanguage();
  const [saleForm, setSaleForm] = useState({ itemName: '', quantity: 1, price: 0 });

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saleForm.itemName && saleForm.quantity > 0 && saleForm.price >= 0) {
      onAddSale({ ...saleForm });
      setSaleForm({ itemName: '', quantity: 1, price: 0 });
    }
  };
  
  return (
    <form onSubmit={handleSaleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div className="md:col-span-2">
        <label className={labelClasses}>{t('itemName')}</label>
        <input type="text" value={saleForm.itemName} onChange={e => setSaleForm({...saleForm, itemName: e.target.value})} className={inputClasses} required />
      </div>
      <div>
        <label className={labelClasses}>{t('quantity')}</label>
        <input type="number" min="1" value={saleForm.quantity} onChange={e => setSaleForm({...saleForm, quantity: parseInt(e.target.value)})} className={inputClasses} required />
      </div>
      <div>
        <label className={labelClasses}>{t('pricePerItem')}</label>
        <input type="number" step="0.01" min="0" value={saleForm.price} onChange={e => setSaleForm({...saleForm, price: parseFloat(e.target.value) || 0})} className={inputClasses} required />
      </div>
      <button type="submit" className="md:col-start-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 flex items-center justify-center transition-colors">
        <Icons.Add className="h-5 w-5 mr-2" /> {t('addSale')}
      </button>
    </form>
  );
});

// Memoized Expenses Form to prevent re-renders on every keystroke
const ExpensesForm: React.FC<{ onAddExpense: (expense: Omit<Expense, 'id' | 'date'>) => void }> = React.memo(({ onAddExpense }) => {
  const { t } = useLanguage();
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: 0, note: '' });
  
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseForm.category && expenseForm.amount > 0) {
      onAddExpense({ ...expenseForm });
      setExpenseForm({ category: '', amount: 0, note: '' });
    }
  };

  return (
    <form onSubmit={handleExpenseSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
            <label className={labelClasses}>{t('category')}</label>
            <input type="text" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className={inputClasses} required />
        </div>
        <div>
            <label className={labelClasses}>{t('amount')}</label>
            <input type="number" step="0.01" min="0" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value) || 0})} className={inputClasses} required />
        </div>
        <div className="md:col-span-1">
            <label className={labelClasses}>{t('noteOptional')}</label>
            <input type="text" value={expenseForm.note} onChange={e => setExpenseForm({...expenseForm, note: e.target.value})} className={inputClasses} />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 flex items-center justify-center transition-colors">
            <Icons.Add className="h-5 w-5 mr-2" /> {t('addExpense')}
        </button>
    </form>
  );
});


const Sales: React.FC = () => {
  const { sales, addSale, expenses, addExpense } = useData();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses'>('sales');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddSale = (sale: Omit<Sale, 'id'|'date'>) => {
    addSale(sale);
  };
  
  const handleAddExpense = (expense: Omit<Expense, 'id'|'date'>) => {
    addExpense({ ...expense, date: new Date().toISOString().split('T')[0] });
  };
  
  const filteredSales = useMemo(() => 
    sales.filter(s => s.itemName.toLowerCase().includes(searchTerm.toLowerCase())),
    [sales, searchTerm]
  );
  
  const filteredExpenses = useMemo(() => 
    expenses.filter(e => e.category.toLowerCase().includes(searchTerm.toLowerCase()) || e.note?.toLowerCase().includes(searchTerm.toLowerCase())),
    [expenses, searchTerm]
  );
  
  const totalIncome = useMemo(() => filteredSales.reduce((acc, s) => acc + (s.price * s.quantity), 0), [filteredSales]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((acc, e) => acc + e.amount, 0), [filteredExpenses]);
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('salesAndExpenses')}</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('sales')} className={`${activeTab === 'sales' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>{t('sales')}</button>
            <button onClick={() => setActiveTab('expenses')} className={`${activeTab === 'expenses' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>{t('viewExpenses')}</button>
          </nav>
        </div>
        {activeTab === 'sales' ? <SalesForm onAddSale={handleAddSale} /> : <ExpensesForm onAddExpense={handleAddExpense} />}
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{activeTab === 'sales' ? t('salesHistory') : t('expenseHistory')}</h2>
            <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input type="text" placeholder={`${t('search')}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                    {activeTab === 'sales' ? (
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('itemName')}</th>
                            <th scope="col" className="px-6 py-3">{t('quantity')}</th>
                            <th scope="col" className="px-6 py-3">{t('price')}</th>
                            <th scope="col" className="px-6 py-3">{t('total')}</th>
                            <th scope="col" className="px-6 py-3">{t('date')}</th>
                        </tr>
                    ) : (
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('category')}</th>
                            <th scope="col" className="px-6 py-3">{t('amount')}</th>
                            <th scope="col" className="px-6 py-3">{t('noteOptional')}</th>
                            <th scope="col" className="px-6 py-3">{t('date')}</th>
                        </tr>
                    )}
                </thead>
                <tbody>
                    {activeTab === 'sales' ? filteredSales.map((sale: Sale) => (
                        <tr key={sale.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{sale.itemName}</td>
                            <td className="px-6 py-4">{sale.quantity}</td>
                            <td className="px-6 py-4">₹{sale.price.toFixed(2)}</td>
                            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">₹{(sale.quantity * sale.price).toFixed(2)}</td>
                            <td className="px-6 py-4">{new Date(sale.date).toLocaleString()}</td>
                        </tr>
                    )) : filteredExpenses.map((expense: Expense) => (
                         <tr key={expense.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{expense.category}</td>
                            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">₹{expense.amount.toFixed(2)}</td>
                            <td className="px-6 py-4">{expense.note}</td>
                            <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="font-semibold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <td className="px-6 py-3 text-right" colSpan={activeTab === 'sales' ? 4 : 3}>{t('total')}</td>
                    <td className="px-6 py-3" colSpan={activeTab === 'sales' ? 1 : 1}>₹{activeTab === 'sales' ? totalIncome.toFixed(2) : totalExpenses.toFixed(2)}</td>
                  </tr>
                </tfoot>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
