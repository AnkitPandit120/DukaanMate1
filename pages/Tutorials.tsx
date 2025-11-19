import React, { useState } from 'react';
import { Icons } from '../components/icons';
import { useLanguage } from '../context/LanguageContext';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 py-4">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">{question}</h3>
        {isOpen ? <Icons.ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" /> : <Icons.ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />}
      </button>
      {isOpen && (
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {answer}
        </p>
      )}
    </div>
  );
};

const Tutorials: React.FC = () => {
    const { t } = useLanguage();
    const faqs = [
        {
            question: "How do I add a new sale?",
            answer: "Navigate to the 'Sales & Expenses' page. Fill in the item name, quantity, and price in the 'Add New Sale' form and click the 'Add Sale' button. The new sale will appear in the sales history table below."
        },
        {
            question: "What is Rush Mode?",
            answer: "Rush Mode is a voice-based notepad for busy times. Tap the microphone icon, and start speaking the items you're selling (e.g., '2 breads at 3 dollars'). The app will transcribe them. You can then edit the list and add all items to your sales records with one click."
        },
        {
            question: "How does the app work offline?",
            answer: "DukaanMate stores all your data in your browser. If you lose your internet connection, you can continue to use the app to add sales, manage stock, etc. The status indicator in the top bar will show 'Offline'. Once your connection is restored, it will automatically sync (simulated). "
        },
        {
            question: "How can I see which products are low in stock?",
            answer: "Go to the 'Stock Management' page. Any item with a quantity less than 10 will be highlighted and marked with a 'Low Stock' status chip, making it easy to see what you need to reorder."
        }
    ];

    const tutorials = [
        {
            title: "Getting Started with DukaanMate",
            description: "A quick 2-minute overview of the dashboard and main features.",
        },
        {
            title: "Mastering Stock Management",
            description: "Learn how to add, edit, and track your inventory, and get alerts for low stock and expiry dates.",
        },
        {
            title: "Using Rush Mode Like a Pro",
            description: "See a live demo of how to use the voice command feature during peak hours.",
        }
    ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('tutorials')}</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('videoTutorials')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map(tutorial => (
                <div key={tutorial.title} className="border dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700">
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                       <p className="text-gray-500 dark:text-gray-400">Video Placeholder</p>
                    </div>
                    <div className="p-4">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{tutorial.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{tutorial.description}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('faq')}</h2>
        <div>
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tutorials;
