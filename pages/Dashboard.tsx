
import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Icons } from '../components/icons';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Sale, Expense, Payment, PaymentStatus, StockItem, Activity } from '../types';
import { GoogleGenAI } from '@google/genai';
import { getBestSelling, getRestockNeeded, getSlowMovingInventory, getItemsWithFallingDemand, getSuggestedReorders, getPeakSellingHours } from '../utils/dashboardUtils';

const DashboardCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string; }> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
  </div>
);

const QuickAccessButton: React.FC<{ to: string, icon: React.ElementType, label: string }> = ({ to, icon: Icon, label }) => (
  <Link to={to} className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm text-center text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
    <Icon className="h-8 w-8 mb-2 text-blue-500" />
    <span className="font-semibold text-sm">{label}</span>
  </Link>
);

const InsightItem: React.FC<{ item: string; value?: string | number; subtext?: string; color?: string; }> = ({ item, value, subtext, color = 'blue' }) => (
    <li className={`flex items-center justify-between text-sm text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 p-2.5 rounded-md`}>
        <div>
            <span className="font-medium">{item}</span>
            {subtext && <p className="text-xs text-gray-500 dark:text-gray-400">{subtext}</p>}
        </div>
        {value && <span className={`font-bold text-${color}-500 dark:text-${color}-400`}>{value}</span>}
    </li>
);

const Dashboard: React.FC = () => {
  const { sales, expenses, stock, payments } = useData();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [aiSummary, setAiSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const todaySales = sales.filter(s => new Date(s.date).toISOString().split('T')[0] === today);
    const dailySales = todaySales.reduce((acc, s) => acc + (s.price * s.quantity), 0);
    
    const totalSales = sales.reduce((acc, s) => acc + (s.price * s.quantity), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const totalProfit = totalSales - totalExpenses;
    const stockValue = stock.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const pendingPayments = payments.filter(p => p.status === PaymentStatus.Pending).reduce((acc, p) => acc + p.amount, 0);
    return { dailySales, totalSales, totalExpenses, totalProfit, stockValue, pendingPayments };
  }, [sales, expenses, stock, payments, today]);
  
  const salesTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(dateStr => {
      const total = sales
        .filter(s => new Date(s.date).toISOString().split('T')[0] === dateStr)
        .reduce((acc, s) => acc + (s.price * s.quantity), 0);
      return { name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }), sales: total };
    });
  }, [sales]);

  const smartInsights = useMemo(() => {
      return {
          bestSelling: getBestSelling(sales),
          restockNeeded: getRestockNeeded(stock),
          slowMoving: getSlowMovingInventory(stock, sales),
          fallingDemand: getItemsWithFallingDemand(sales),
          suggestedReorders: getSuggestedReorders(stock, sales),
          peakHours: getPeakSellingHours(sales),
      }
  }, [sales, stock]);

  const recentActivity = useMemo(() => {
    const combined: Activity[] = [
      ...sales.map((s): Activity => ({ id: `s-${s.id}`, type: 'sale', description: `${s.quantity}x ${s.itemName}`, amount: s.price * s.quantity, date: s.date, Icon: Icons.Income })),
      ...expenses.map((e): Activity => ({ id: `e-${e.id}`, type: 'expense', description: e.category, amount: e.amount, date: e.date, Icon: Icons.Expense })),
      ...payments.filter(p => p.status !== PaymentStatus.Pending).map((p): Activity => ({ id: `p-${p.id}`, type: 'payment', description: `${p.status} from/to ${p.name}`, amount: p.amount, date: p.date, Icon: p.status === 'Received' ? Icons.Income : Icons.Expense })),
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [sales, expenses, payments]);
  
  const profitExpenseData = [
      { name: t('totalProfit'), value: Math.max(0, stats.totalSales) },
      { name: t('viewExpenses'), value: stats.totalExpenses },
  ];
  const COLORS = ['#10B981', '#EF4444'];

  const generateDailyBriefing = async () => {
    setIsSummaryLoading(true);
    setAiSummary('');
    try {
      const prompt = `Analyze the following shop data for today (${new Date().toLocaleDateString()}) and provide a concise, friendly "AI Daily Briefing" for the shopkeeper. The briefing should include: 1. A summary of today's sales and profit in a single sentence. 2. Mention the best-selling item of the day. 3. Highlight any new low-stock items (quantity < 10). 4. Provide one positive observation or a simple, actionable suggestion for the day. Keep the tone encouraging and easy to understand. Format the output clearly with bullet points. All monetary values are in Indian Rupees (₹). Data: - All Sales: ${JSON.stringify(sales)} - All Stock: ${JSON.stringify(stock)} - All Expenses: ${JSON.stringify(expenses)}`;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAiSummary(response.text);
    } catch (error) {
      console.error("Failed to generate AI summary:", error);
      setAiSummary("Sorry, I couldn't generate the briefing. Please check your connection and try again.");
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Theme-aware chart styles
  const tickColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const gridColor = theme === 'dark' ? '#374151' : '#E5E7EB';
  const tooltipStyle = { backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`, borderRadius: '0.5rem' };
  const legendColor = theme === 'dark' ? '#D1D5DB' : '#374151';

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title={t('dailySales')} value={`₹${stats.dailySales.toFixed(2)}`} icon={Icons.Sales} color="bg-blue-500" />
        <DashboardCard title={t('totalProfit')} value={`₹${stats.totalProfit.toFixed(2)}`} icon={Icons.Zap} color="bg-green-500" />
        <DashboardCard title={t('stockValue')} value={`₹${stats.stockValue.toFixed(2)}`} icon={Icons.Stock} color="bg-yellow-500" />
        <DashboardCard title={t('pendingPayments')} value={`₹${stats.pendingPayments.toFixed(2)}`} icon={Icons.Pending} color="bg-red-500" />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('salesTrend')}</h3>
           <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} />
              <YAxis tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
              <Tooltip cursor={{fill: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(239, 246, 255, 0.5)'}} contentStyle={tooltipStyle} formatter={(value: number) => `₹${value.toFixed(2)}`}/>
              <Line type="monotone" dataKey="sales" name="Sales" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
             <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('quickAccess')}</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
               <QuickAccessButton to="/sales" icon={Icons.Add} label={t('addSale')}/>
               <QuickAccessButton to="/stock" icon={Icons.Stock} label={t('stock')}/>
               <QuickAccessButton to="/payments" icon={Icons.Payments} label={t('payments')}/>
               <QuickAccessButton to="/rush-mode" icon={Icons.RushMode} label={t('rushMode')}/>
               <QuickAccessButton to="/reports" icon={Icons.Reports} label={t('reports')}/>
               <QuickAccessButton to="/sales" icon={Icons.Expense} label={t('viewExpenses')}/>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('recentActivity')}</h3>
              <ul className="space-y-4">
                  {recentActivity.map(({id, Icon, description, amount, date, type}) => (
                      <li key={id} className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${type === 'expense' || (type === 'payment' && Icon === Icons.Expense) ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                              <Icon className={`h-5 w-5 ${type === 'expense' || (type === 'payment' && Icon === Icons.Expense) ? 'text-red-500' : 'text-green-500'}`} />
                          </div>
                          <div className="flex-1">
                              <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{description}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(date).toLocaleString()}</p>
                          </div>
                          <p className={`font-semibold text-sm ${type === 'expense' || (type === 'payment' && Icon === Icons.Expense) ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {type === 'expense' || (type === 'payment' && Icon === Icons.Expense) ? '-' : '+'}₹{amount.toFixed(2)}
                          </p>
                      </li>
                  ))}
              </ul>
          </div>
          {/* Profit vs Expenses */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('profitVsExpenses')}</h3>
              <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                      <Pie data={profitExpenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ₹${value.toFixed(0)}`}>
                          {profitExpenseData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ color: legendColor }} />
                  </PieChart>
              </ResponsiveContainer>
          </div>
      </div>
      
      {/* AI Daily Briefing */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
              <Icons.Zap className="h-6 w-6 mr-2 text-blue-500" />
              {t('aiDailyBriefing')}
            </h3>
            <button onClick={generateDailyBriefing} disabled={isSummaryLoading} className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-blue-400 flex items-center transition-colors">
              {isSummaryLoading ? t('generating') : t('generateBriefing')}
            </button>
          </div>
          {isSummaryLoading && (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 animate-pulse">{t('analyzingDay')}</p>
            </div>
          )}
          {aiSummary && (
            <div className="text-gray-700 dark:text-gray-200 bg-blue-50 dark:bg-gray-700/50 p-4 rounded-md whitespace-pre-wrap font-mono text-sm">
              {aiSummary}
            </div>
          )}
          {!aiSummary && !isSummaryLoading && (
             <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                {t('briefingHint')}
            </div>
          )}
      </div>

      {/* Smart Insights */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('smartInsights')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                  <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-3">{t('bestSelling')}</h4>
                  <ul className="space-y-2">
                      {smartInsights.bestSelling.map((item, index) => (
                          <InsightItem key={item.name} item={item.name} value={`${item.quantity} sold`} subtext={`#${index+1} Product`} />
                      ))}
                  </ul>
              </div>
              <div className="space-y-8">
                  <div>
                      <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-3">{t('slowMoving')}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('slowMovingDesc')}</p>
                      <ul className="space-y-2">
                          {smartInsights.slowMoving.length > 0 ? smartInsights.slowMoving.map(item => (
                              <InsightItem key={item.id} item={item.itemName} color="yellow" />
                          )) : <p className="text-sm text-gray-500 dark:text-gray-400">{t('noData')}</p>}
                      </ul>
                  </div>
                   <div>
                      <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-3">{t('peakHours')}</h4>
                      <ul className="space-y-2">
                          {smartInsights.peakHours.length > 0 ? smartInsights.peakHours.map(hour => (
                              <InsightItem key={hour.hour} item={hour.hour} value={`${hour.count} sales`} color="green" />
                          )) : <p className="text-sm text-gray-500 dark:text-gray-400">{t('noData')}</p>}
                      </ul>
                  </div>
              </div>
               <div className="space-y-8">
                  <div>
                      <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-3">{t('fallingDemand')}</h4>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('fallingDemandDesc')}</p>
                      <ul className="space-y-2">
                          {smartInsights.fallingDemand.length > 0 ? smartInsights.fallingDemand.map(item => (
                              <InsightItem key={item.name} item={item.name} value={`${item.dropPercent}% drop`} color="red" />
                          )) : <p className="text-sm text-gray-500 dark:text-gray-400">{t('noData')}</p>}
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-3">{t('suggestedReorder')}</h4>
                      <ul className="space-y-2">
                          {smartInsights.suggestedReorders.length > 0 ? smartInsights.suggestedReorders.map(item => (
                              <InsightItem key={item.id} item={item.itemName} value={`Buy ${item.suggested}`} subtext={`${item.quantity} left`} />
                          )) : <p className="text-sm text-gray-500 dark:text-gray-400">{t('allStockGood')}</p>}
                      </ul>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
