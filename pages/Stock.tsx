import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { StockItem } from '../types';
import { Icons } from '../components/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Stock: React.FC = () => {
    const { stock, addStockItem, updateStockItem, deleteStockItem, bulkAddStock } = useData();
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [formState, setFormState] = useState<Omit<StockItem, 'id'>>({
        itemName: '', category: '', quantity: 0, expiryDate: '', price: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const openModal = (item: StockItem | null = null) => {
        setEditingItem(item);
        setFormState(item ? { ...item, expiryDate: item.expiryDate || '' } : { itemName: '', category: '', quantity: 0, expiryDate: '', price: 0 });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const itemToSave = {
            ...formState,
            expiryDate: formState.expiryDate || undefined
        };

        if (editingItem) {
            updateStockItem({ ...itemToSave, id: editingItem.id });
        } else {
            addStockItem(itemToSave);
        }
        closeModal();
    };

    const filteredStock = useMemo(() =>
        stock.filter(item =>
            item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [stock, searchTerm]
    );

    const isNearExpiry = (dateStr: string) => {
        const expiryDate = new Date(dateStr);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays >= 0;
    };

    const isExpired = (dateStr: string) => {
        const expiryDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0,0,0,0);
        return expiryDate < today;
    };

    const handleExportCSV = () => {
      const headers = ['itemName', 'category', 'quantity', 'price', 'expiryDate'];
      const csvContent = [
        headers.join(','),
        ...stock.map(item => headers.map(header => item[header as keyof StockItem]).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'stock_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const rows = text.split('\n').slice(1); // skip header
          const newItems: Omit<StockItem, 'id'>[] = rows.map(row => {
            const [itemName, category, quantity, price, expiryDate] = row.split(',');
            return {
              itemName,
              category,
              quantity: parseInt(quantity, 10) || 0,
              price: parseFloat(price) || 0,
              expiryDate: expiryDate?.trim() || undefined,
            };
          }).filter(item => item.itemName);
          bulkAddStock(newItems);
        };
        reader.readAsText(file);
      }
    };
    
    const handleDownloadReport = () => {
      const doc = new jsPDF();
      doc.text("Stock Report", 14, 15);
      autoTable(doc, {
        head: [['Item Name', 'Category', 'Quantity', 'Price (₹)', 'Expiry Date', 'Status']],
        body: filteredStock.map(item => {
           const status = item.quantity === 0 ? 'Out of Stock'
               : item.expiryDate && isExpired(item.expiryDate) ? 'Expired'
               : item.expiryDate && isNearExpiry(item.expiryDate) ? 'Near Expiry'
               : item.quantity < 10 ? 'Low Stock'
               : 'In Stock';
           return [
             item.itemName,
             item.category,
             item.quantity,
             item.price.toFixed(2),
             item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
             status,
           ];
        }),
      });
      doc.save('stock_report.pdf');
    };

    const inputClasses = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('stockManagement')}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                    <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 py-2 px-4 rounded-md shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center transition-colors text-sm">
                        <Icons.Import className="h-4 w-4 mr-2" /> {t('importCSV')}
                    </button>
                    <button onClick={handleExportCSV} className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 py-2 px-4 rounded-md shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center transition-colors text-sm">
                        <Icons.Download className="h-4 w-4 mr-2" /> {t('exportCSV')}
                    </button>
                    <button onClick={handleDownloadReport} className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 py-2 px-4 rounded-md shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center transition-colors text-sm">
                        <Icons.Download className="h-4 w-4 mr-2" /> {t('downloadReport')}
                    </button>
                    <button onClick={() => openModal()} className="bg-blue-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 flex items-center transition-colors text-sm">
                        <Icons.Add className="h-4 w-4 mr-2" /> {t('addNewItem')}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex justify-end mb-4">
                    <div className="relative">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                        <input type="text" placeholder={`${t('searchStock')}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('itemName')}</th>
                                <th scope="col" className="px-6 py-3">{t('itemCategory')}</th>
                                <th scope="col" className="px-6 py-3">{t('quantity')}</th>
                                <th scope="col" className="px-6 py-3">{t('price')}</th>
                                <th scope="col" className="px-6 py-3">{t('expiryDate')}</th>
                                <th scope="col" className="px-6 py-3">{t('status')}</th>
                                <th scope="col" className="px-6 py-3">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStock.map(item => {
                                const outOfStock = item.quantity === 0;
                                const lowStock = item.quantity > 0 && item.quantity < 10;
                                const nearExpiry = item.expiryDate ? isNearExpiry(item.expiryDate) : false;
                                const expired = item.expiryDate ? isExpired(item.expiryDate) : false;

                                return (
                                <tr key={item.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        <div className="flex items-center">
                                            <span>{item.itemName}</span>
                                            {(lowStock || outOfStock) && <Icons.Warning className="h-4 w-4 text-red-500 ml-2" title="Low Stock" />}
                                            {nearExpiry && <Icons.Pending className="h-4 w-4 text-yellow-500 ml-2" title="Near Expiry" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{item.category}</td>
                                    <td className={`px-6 py-4 font-bold ${lowStock || outOfStock ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>{item.quantity}</td>
                                    <td className="px-6 py-4">₹{item.price.toFixed(2)}</td>
                                    <td className={`px-6 py-4 ${nearExpiry ? 'text-yellow-600 dark:text-yellow-400 font-semibold' : ''}`}>
                                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {outOfStock ? <span className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-200 dark:text-gray-200 dark:bg-gray-600 rounded-full">{t('outOfStock')}</span>
                                        : expired ? <span className="px-2 py-1 text-xs font-semibold text-white bg-gray-500 dark:text-gray-200 dark:bg-gray-500 rounded-full">{t('expired')}</span>
                                        : nearExpiry ? <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 dark:text-yellow-200 dark:bg-yellow-900/40 rounded-full">{t('nearExpiry')}</span>
                                        : lowStock ? <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 dark:text-red-200 dark:bg-red-900/40 rounded-full">{t('lowStock')}</span>
                                        : <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 dark:text-green-200 dark:bg-green-900/40 rounded-full">{t('inStock')}</span>}
                                    </td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <button onClick={() => openModal(item)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"><Icons.Edit className="h-5 w-5"/></button>
                                        <button onClick={() => deleteStockItem(item.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"><Icons.Trash className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{editingItem ? t('editItem') : t('addNewItem')}</h2>
                            <button onClick={closeModal}><Icons.Close className="h-6 w-6 text-gray-500 dark:text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className={labelClasses}>{t('itemName')}</label>
                                <input type="text" name="itemName" value={formState.itemName} onChange={handleChange} className={inputClasses} required />
                            </div>
                            <div>
                                <label className={labelClasses}>{t('itemCategory')}</label>
                                <input type="text" name="category" value={formState.category} onChange={handleChange} className={inputClasses} required />
                            </div>
                             <div>
                                <label className={labelClasses}>{t('quantity')}</label>
                                <input type="number" name="quantity" value={formState.quantity} onChange={handleChange} className={inputClasses} required />
                            </div>
                            <div>
                                <label className={labelClasses}>{t('price')}</label>
                                <input type="number" step="0.01" name="price" value={formState.price} onChange={handleChange} className={inputClasses} required />
                            </div>
                            <div>
                                <label className={labelClasses}>{t('expiryDateOptional')}</label>
                                <input type="date" name="expiryDate" value={formState.expiryDate} onChange={handleChange} className={inputClasses} />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md mr-2 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">{editingItem ? t('update') : t('save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stock;
