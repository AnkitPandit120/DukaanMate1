
import React, { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Icons } from '../components/icons';
import { User } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const AdminCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string; trend?: string; trendUp?: boolean }> = ({ title, value, icon: Icon, color, trend, trendUp }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
    <div className={`absolute top-0 right-0 p-3 opacity-10`}>
        <Icon className={`h-24 w-24 text-${color}-500`} />
    </div>
    <div className="relative z-10">
        <div className={`p-3 rounded-lg inline-block mb-4 bg-${color}-100`}>
             <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="flex items-end gap-2 mt-1">
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            {trend && (
                <span className={`text-xs font-medium mb-1 px-1.5 py-0.5 rounded ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trendUp ? '+' : ''}{trend}
                </span>
            )}
        </div>
    </div>
  </div>
);

const AdminPanel: React.FC = () => {
    const { t } = useLanguage();

    // --- Mock Data Generation for Admin Analytics ---
    const users: User[] = JSON.parse(localStorage.getItem('dukaan-users') || '[]');
    const totalShops = users.length;
    
    // Simulate activity metrics
    const activeShopsToday = Math.max(1, Math.floor(totalShops * 0.65)); // ~65% active
    const totalSalesEntries = 1245; 
    const totalExpenseEntries = 342;
    const errorRate = 1.2; // 1.2% failure rate

    const entryTypeData = [
        { name: 'Manual Entry', value: 65 },
        { name: 'Voice (Rush Mode)', value: 35 },
    ];
    
    const entryTypeColors = ['#3B82F6', '#8B5CF6']; // Blue, Purple

    const activityData = [
        { name: '09:00', sales: 40, voice: 10 },
        { name: '11:00', sales: 120, voice: 45 },
        { name: '13:00', sales: 90, voice: 30 },
        { name: '15:00', sales: 85, voice: 25 },
        { name: '17:00', sales: 150, voice: 80 },
        { name: '19:00', sales: 180, voice: 100 },
        { name: '21:00', sales: 60, voice: 20 },
    ];

    // Sort users to simulate "Top Active"
    const topShops = useMemo(() => {
        return [...users].map(u => ({
            ...u,
            entriesToday: Math.floor(Math.random() * 150) + 20,
            status: Math.random() > 0.2 ? 'Active' : 'Idle'
        })).sort((a, b) => b.entriesToday - a.entriesToday).slice(0, 5);
    }, [users]);

    // Styles
    const tickColor = '#6B7280';
    const gridColor = '#E5E7EB';
    const tooltipStyle = { backgroundColor: '#FFFFFF', border: `1px solid #E5E7EB`, borderRadius: '0.5rem' };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Admin Command Center</h1>
                    <p className="text-sm text-gray-500 mt-1">Real-time platform monitoring and analytics</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
                    System Operational
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <AdminCard 
                    title="Total Shops" 
                    value={totalShops} 
                    icon={Icons.Users} 
                    color="blue" 
                    trend="12%" 
                    trendUp={true} 
                />
                <AdminCard 
                    title="Active Today" 
                    value={activeShopsToday} 
                    icon={Icons.Activity} 
                    color="green" 
                    trend="5%" 
                    trendUp={true} 
                />
                <AdminCard 
                    title="Total Sales" 
                    value={totalSalesEntries} 
                    icon={Icons.Sales} 
                    color="purple" 
                    trend="High" 
                    trendUp={true} 
                />
                 <AdminCard 
                    title="Total Expenses" 
                    value={totalExpenseEntries} 
                    icon={Icons.Expense} 
                    color="yellow" 
                    trend="Normal" 
                    trendUp={true} 
                />
                <AdminCard 
                    title="Error Rate" 
                    value={`${errorRate}%`} 
                    icon={Icons.AlertOctagon} 
                    color="red" 
                    trend="Stable" 
                    trendUp={true} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Voice vs Manual Stats */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Input Analysis</h3>
                    <p className="text-xs text-gray-500 mb-6">Voice (Rush Mode) vs Manual</p>
                    
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={entryTypeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {entryTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entryTypeColors[index % entryTypeColors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                            <span className="font-bold text-purple-500">35%</span> Voice Usage
                        </p>
                    </div>
                </div>

                {/* Hourly Activity Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Peak Activity</h3>
                    <p className="text-xs text-gray-500 mb-6">Entries per hour (Today)</p>
                    
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} cursor={{fill: '#F3F4F6'}} />
                                <Legend />
                                <Bar dataKey="sales" name="Manual" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="voice" name="Voice" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Active Shops */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">Top 5 Active Shops</h3>
                        <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Shop Name</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3 text-center">Entries</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {topShops.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                                                {user.name.charAt(0)}
                                            </div>
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-800">{user.entriesToday}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions / System Health */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Health Status</h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-green-500 mr-3"></div>
                                <span className="text-sm font-medium text-gray-700">API Latency</span>
                            </div>
                            <span className="text-sm font-bold text-green-600">45ms</span>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-green-500 mr-3"></div>
                                <span className="text-sm font-medium text-gray-700">Database Status</span>
                            </div>
                            <span className="text-sm font-bold text-green-600">Healthy</span>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                            <div className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-yellow-500 mr-3"></div>
                                <span className="text-sm font-medium text-gray-700">Voice API Usage</span>
                            </div>
                            <span className="text-sm font-bold text-yellow-600">High Load</span>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-500 mb-3">Latest Registrations</h4>
                        <ul className="space-y-3">
                            {users.slice(Math.max(users.length - 3, 0)).reverse().map((user, i) => (
                                <li key={i} className="flex items-center text-sm">
                                     <div className="h-6 w-6 rounded bg-gray-200 flex items-center justify-center text-xs mr-3">
                                        {user.name.charAt(0)}
                                     </div>
                                     <span className="text-gray-700 truncate w-40">{user.name}</span>
                                     <span className="ml-auto text-xs text-gray-400">Just now</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
