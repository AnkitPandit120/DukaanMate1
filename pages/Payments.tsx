import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Payment, PaymentStatus } from '../types';
import { Icons } from '../components/icons';

const Payments: React.FC = () => {
  const { payments, addPayment, updatePaymentStatus, qrCode, setQrCode } = useData();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<Omit<Payment, 'id' | 'status'>>({
    name: '', amount: 0, date: new Date().toISOString().split('T')[0], type: 'customer'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFormState({ name: '', amount: 0, date: new Date().toISOString().split('T')[0], type: 'customer' });
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPayment({ ...formState, status: PaymentStatus.Pending });
    closeModal();
  };

  const handleQrUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCode(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const totals = useMemo(() => {
    return payments.reduce((acc, p) => {
      if(p.status === PaymentStatus.Pending) acc.pending += p.amount;
      if(p.type === 'customer' && p.status === PaymentStatus.Received) acc.received += p.amount;
      if(p.type === 'supplier' && p.status === PaymentStatus.Paid) acc.paid += p.amount;
      return acc;
    }, { pending: 0, received: 0, paid: 0 });
  }, [payments]);

  const getStatusChip = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.Paid:
      case PaymentStatus.Received:
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900/50 rounded-full">{status}</span>;
      case PaymentStatus.Pending:
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/50 rounded-full">{status}</span>;
      default:
        return null;
    }
  };
  
  const inputClasses = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  // Function to parse YYYY-MM-DD as UTC to avoid timezone issues
  const parseDateAsUTC = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('payments')}</h1>
        <button onClick={openModal} className="bg-blue-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 flex items-center transition-colors">
          <Icons.Add className="h-5 w-5 mr-2" /> {t('addPaymentRecord')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{t('totalPending')}</h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">₹{totals.pending.toFixed(2)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">{t('totalReceived')}</h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">₹{totals.received.toFixed(2)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{t('totalPaid')}</h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">₹{totals.paid.toFixed(2)}</p>
              </div>
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('manageQRCode')}</h3>
              {qrCode ? (
                  <div className="flex items-center space-x-4">
                      <img src={qrCode} alt="Payment QR Code" className="w-20 h-20 rounded-md border p-1 dark:border-gray-600"/>
                      <div className="space-y-2">
                          <button onClick={() => fileInputRef.current?.click()} className="text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 py-1 px-3 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800">{t('changeQR')}</button>
                          <button onClick={() => setQrCode(null)} className="text-sm bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 py-1 px-3 rounded-md hover:bg-red-200 dark:hover:bg-red-800">{t('removeQR')}</button>
                      </div>
                  </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('qrUploadHint')}</p>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-green-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-green-700 flex items-center justify-center transition-colors">
                      <Icons.Upload className="h-5 w-5 mr-2" /> {t('uploadQR')}
                  </button>
                </div>
              )}
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleQrUpload} className="hidden" />
          </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3">{t('customerSupplierName')}</th>
                  <th scope="col" className="px-6 py-3">{t('amount')}</th>
                  <th scope="col" className="px-6 py-3">{t('type')}</th>
                  <th scope="col" className="px-6 py-3">{t('date')}</th>
                  <th scope="col" className="px-6 py-3">{t('status')}</th>
                  <th scope="col" className="px-6 py-3">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">₹{p.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 capitalize">{t(p.type)}</td>
                    <td className="px-6 py-4">{parseDateAsUTC(p.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{getStatusChip(p.status)}</td>
                    <td className="px-6 py-4">
                      {p.status === PaymentStatus.Pending && (
                        <button onClick={() => updatePaymentStatus(p.id, p.type === 'customer' ? PaymentStatus.Received : PaymentStatus.Paid)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300" title={t('markAsCompleted')}>
                          <Icons.CheckCircle className="h-5 w-5"/>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('addPaymentRecord')}</h2>
              <button onClick={closeModal}><Icons.Close className="h-6 w-6 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClasses}>{t('customerSupplierName')}</label>
                <input type="text" name="name" value={formState.name} onChange={handleChange} className={inputClasses} required />
              </div>
              <div>
                <label className={labelClasses}>{t('amount')}</label>
                <input type="number" step="0.01" name="amount" value={formState.amount} onChange={handleChange} className={inputClasses} required />
              </div>
              <div>
                <label className={labelClasses}>{t('type')}</label>
                <select name="type" value={formState.type} onChange={handleChange} className={inputClasses}>
                  <option value="customer">{t('customer')}</option>
                  <option value="supplier">{t('supplier')}</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>{t('date')}</label>
                <input type="date" name="date" value={formState.date} onChange={handleChange} className={inputClasses} required />
              </div>
              <div className="flex justify-end pt-4">
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md mr-2 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">{t('addPaymentRecord')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
