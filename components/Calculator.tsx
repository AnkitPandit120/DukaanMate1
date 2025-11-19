import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './icons';
import { useLanguage } from '../context/LanguageContext';

const Calculator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 450 });
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const { t } = useLanguage();

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ref.current) {
      isDragging.current = true;
      const rect = ref.current.getBoundingClientRect();
      offset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen]);
  
  const handleButtonClick = (value: string) => {
    if (display === '0' && value !== '.') {
      setDisplay(value);
    } else if (value === '.' && display.includes('.')) {
      return;
    } else {
      setDisplay(display + value);
    }
  };

  const handleOperator = (operator: string) => {
    const lastChar = display.slice(-1);
    if (['+', '-', '*', '/'].includes(lastChar)) {
        setDisplay(display.slice(0, -1) + operator);
    } else {
        setDisplay(display + operator);
    }
  };

  const handleClear = () => setDisplay('0');

  const handleEquals = () => {
    try {
      // Basic eval, not safe for production with arbitrary user input.
      const result = eval(display.replace(/[^-()\d/*+.]/g, ''));
      setDisplay(String(result));
    } catch (error) {
      setDisplay('Error');
    }
  };


  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white p-3.5 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110"
      >
        <Icons.Calculator className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      ref={ref}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-72 border dark:border-gray-700"
    >
      <div
        onMouseDown={handleMouseDown}
        className="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex justify-between items-center cursor-move rounded-t-lg"
      >
        <h3 className="font-semibold text-gray-700 dark:text-gray-200">{t('calculator')}</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100">
          <Icons.Close className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">
        <div className="bg-gray-200 dark:bg-gray-900 text-right p-4 rounded-md mb-4 text-2xl font-mono text-gray-800 dark:text-gray-100 break-all">
          {display}
        </div>
        <div className="grid grid-cols-4 gap-2 text-gray-800 dark:text-gray-100">
          <button onClick={handleClear} className="col-span-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-md transition-colors">C</button>
          <button onClick={() => handleOperator('/')} className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 font-bold py-3 rounded-md transition-colors">/</button>
          <button onClick={() => handleOperator('*')} className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 font-bold py-3 rounded-md transition-colors">*</button>
          
          {['7', '8', '9'].map(n => <button key={n} onClick={() => handleButtonClick(n)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold py-3 rounded-md transition-colors">{n}</button>)}
          <button onClick={() => handleOperator('-')} className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 font-bold py-3 rounded-md transition-colors">-</button>
          
          {['4', '5', '6'].map(n => <button key={n} onClick={() => handleButtonClick(n)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold py-3 rounded-md transition-colors">{n}</button>)}
          <button onClick={() => handleOperator('+')} className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 font-bold py-3 rounded-md transition-colors">+</button>
          
          {['1', '2', '3'].map(n => <button key={n} onClick={() => handleButtonClick(n)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold py-3 rounded-md transition-colors">{n}</button>)}
          <button onClick={handleEquals} className="row-span-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-md transition-colors">=</button>
          
          <button onClick={() => handleButtonClick('0')} className="col-span-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold py-3 rounded-md transition-colors">0</button>
          <button onClick={() => handleButtonClick('.')} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold py-3 rounded-md transition-colors">.</button>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
