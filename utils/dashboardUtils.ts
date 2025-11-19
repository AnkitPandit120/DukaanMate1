
import { Sale, StockItem } from '../types';

export const getBestSelling = (sales: Sale[]) => {
    const productSales = sales.reduce((acc, sale) => {
        acc[sale.itemName] = (acc[sale.itemName] || 0) + sale.quantity;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));
};

export const getRestockNeeded = (stock: StockItem[]) => {
    return stock.filter(item => item.quantity < 10);
};

export const getSlowMovingInventory = (stock: StockItem[], sales: Sale[]) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSalesItems = new Set(
        sales
            .filter(sale => new Date(sale.date) >= thirtyDaysAgo)
            .map(sale => sale.itemName.toLowerCase())
    );

    return stock.filter(item => !recentSalesItems.has(item.itemName.toLowerCase()));
};

export const getItemsWithFallingDemand = (sales: Sale[]) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const salesLast7Days = sales.filter(s => new Date(s.date) >= oneWeekAgo);
    const sales7to14Days = sales.filter(s => new Date(s.date) >= twoWeeksAgo && new Date(s.date) < oneWeekAgo);

    const quantityLast7Days = salesLast7Days.reduce((acc, s) => {
        acc[s.itemName] = (acc[s.itemName] || 0) + s.quantity;
        return acc;
    }, {} as Record<string, number>);

    const quantity7to14Days = sales7to14Days.reduce((acc, s) => {
        acc[s.itemName] = (acc[s.itemName] || 0) + s.quantity;
        return acc;
    }, {} as Record<string, number>);

    const fallingDemandItems: { name: string, dropPercent: string }[] = [];
    for (const itemName in quantity7to14Days) {
        if (quantityLast7Days[itemName]) {
            const prevSales = quantity7to14Days[itemName];
            const currentSales = quantityLast7Days[itemName];
            if (currentSales < prevSales * 0.5) { // More than 50% drop
                const dropPercent = (((prevSales - currentSales) / prevSales) * 100).toFixed(0);
                fallingDemandItems.push({ name: itemName, dropPercent });
            }
        }
    }
    return fallingDemandItems;
};

export const getSuggestedReorders = (stock: StockItem[], sales: Sale[]) => {
    const lowStockItems = getRestockNeeded(stock);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const salesLast14Days = sales.filter(s => new Date(s.date) >= fourteenDaysAgo);

    return lowStockItems.map(item => {
        const totalSold = salesLast14Days
            .filter(s => s.itemName === item.itemName)
            .reduce((sum, s) => sum + s.quantity, 0);
        
        // Suggest reordering enough for the next 14 days based on past 14 days sales
        // Aim to have a buffer stock of 5 units.
        const dailyAvg = totalSold / 14;
        const suggested = Math.max(0, Math.ceil(dailyAvg * 14) + 5 - item.quantity);
        
        return { ...item, suggested };
    }).filter(item => item.suggested > 0);
};

export const getPeakSellingHours = (sales: Sale[]) => {
    const salesByHour: Record<number, number> = {};
    sales.forEach(sale => {
        const hour = new Date(sale.date).getHours();
        salesByHour[hour] = (salesByHour[hour] || 0) + 1; // +1 for each sale transaction
    });

    return Object.entries(salesByHour)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 3)
        .map(([hour]) => {
            const h = parseInt(hour);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayHour = h % 12 || 12;
            return {
                hour: `${displayHour}:00 - ${displayHour}:59 ${ampm}`,
                count: salesByHour[h],
            };
        });
};
