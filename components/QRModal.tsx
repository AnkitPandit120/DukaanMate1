import React from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Icons } from './icons';
import { Link } from 'react-router-dom';

interface QRModalProps {
  onClose: () => void;
}

const QRModal: React.FC<QRModalProps> = ({ onClose }) => {
  const { qrCode } = useData();
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm relative text-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <Icons.Close className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('paymentQR')}</h2>
        {qrCode ? (
          <img src={qrCode} alt="Payment QR Code" className="w-full h-auto object-contain rounded-md" />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <Icons.QrCode className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-semibold">{t('noQRUploaded')}</p>
            <Link to="/payments" onClick={onClose} className="mt-2 text-sm text-blue-600 hover:underline">
              {t('uploadQR')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRModal;
