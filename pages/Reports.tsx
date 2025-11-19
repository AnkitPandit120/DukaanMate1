
import React, { useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Icons } from '../components/icons';
import { useTheme } from '../context/ThemeContext';

const Reports: React.FC = () => {
  const { sales, expenses } = useData();
  const { t } = useLanguage();
  const reportRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const processDataForCharts = (days: number) => {
    const dataMap = new Map<string, { date: string, sales: number, expenses: number, profit: number }>();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        dataMap.set(dateStr, { date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), sales: 0, expenses: 0, profit: 0 });
    }

    sales.forEach(sale => {
      const saleDateStr = new Date(sale.date).toISOString().split('T')[0];
      if (dataMap.has(saleDateStr)) {
        const entry = dataMap.get(saleDateStr)!;
        entry.sales += sale.price * sale.quantity;
      }
    });

    expenses.forEach(expense => {
      // Expenses use YYYY-MM-DD format
      if (dataMap.has(expense.date)) {
        dataMap.get(expense.date)!.expenses += expense.amount;
      }
    });
    
    dataMap.forEach(value => {
        value.profit = value.sales - value.expenses;
    });

    return Array.from(dataMap.values());
  };

  const monthlyData = useMemo(() => processDataForCharts(30), [sales, expenses]);
  
  const expenseByCategory = useMemo(() => {
    const categoryMap = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [expenses]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const downloadPdf = async () => {
    const input = reportRef.current;
    if (input) {
      const canvas = await html2canvas(input, {
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF', // gray-900 or white
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save("dukaanmate_report.pdf");
    }
  };

  const currencyFormatter = (value: number) => `₹${value.toFixed(0)}`;
  const tooltipFormatter = (value: number) => `₹${value.toFixed(2)}`;

  // Theme-aware chart styles
  const tickColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const gridColor = theme === 'dark' ? '#374151' : '#E5E7EB';
  const tooltipStyle = {
      backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
      border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
      color: theme === 'dark' ? '#F9FAFB' : '#1F2937',
      borderRadius: '0.5rem',
  };
  const legendColor = theme === 'dark' ? '#D1D5DB' : '#374151';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('reportsAndAnalytics')}</h1>
        <button onClick={downloadPdf} className="bg-blue-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 flex items-center transition-colors">
            <Icons.Download className="h-5 w-5 mr-2" /> {t('downloadAsPDF')}
        </button>
      </div>

      <div ref={reportRef} className="space-y-8 p-0 md:p-4 rounded-lg">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('monthlySalesAndExpenses')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
              <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 12 }}/>
              <YAxis tickFormatter={currencyFormatter} tick={{ fill: tickColor, fontSize: 12 }}/>
              <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} cursor={{ fill: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(209, 213, 219, 0.5)' }}/>
              <Legend wrapperStyle={{ color: legendColor, fontSize: '14px' }}/>
              <Bar dataKey="sales" fill="#3B82F6" name="Sales"/>
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('profitGrowth')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 12 }} />
              <YAxis tickFormatter={currencyFormatter} tick={{ fill: tickColor, fontSize: 12 }}/>
              <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
              <Legend wrapperStyle={{ color: legendColor, fontSize: '14px' }}/>
              <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} name="Profit" dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('expenseTrends')}</h2>
          <ResponsiveContainer width="100%" height={300}>
             <PieChart>
              <Pie
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                stroke={theme === 'dark' ? '#1f2937' : '#fff'}
              >
                {expenseByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `₹${value.toFixed(2)}`}/>
              <Legend wrapperStyle={{ color: legendColor, fontSize: '14px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
