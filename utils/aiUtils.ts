
import { StockItem, Notification, NotificationType } from '../types';

const isNearExpiry = (dateStr: string, days: number): boolean => {
    const expiryDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days && diffDays >= 0;
};

export const generateNotifications = (stock: StockItem[]): Notification[] => {
    const notifications: Notification[] = [];

    // Low stock notifications (quantity > 0 and < 10)
    const lowStockItems = stock.filter(item => item.quantity > 0 && item.quantity < 10);
    lowStockItems.forEach(item => {
        notifications.push({
            id: `low-${item.id}`,
            type: NotificationType.LowStock,
            message: `${item.itemName} is low on stock. Only ${item.quantity} left.`,
            itemId: item.id,
            itemName: item.itemName,
        });
    });

    // Near expiry notifications (within 7 days)
    const nearExpiryItems = stock.filter(item => item.expiryDate && isNearExpiry(item.expiryDate, 7));
    nearExpiryItems.forEach(item => {
        if(item.expiryDate) { // Double check to satisfy TypeScript
            notifications.push({
                id: `expiry-${item.id}`,
                type: NotificationType.NearExpiry,
                message: `${item.itemName} is expiring soon on ${new Date(item.expiryDate).toLocaleDateString()}.`,
                itemId: item.id,
                itemName: item.itemName,
            });
        }
    });

    // Out of stock notifications
    const outOfStockItems = stock.filter(item => item.quantity === 0);
    outOfStockItems.forEach(item => {
        notifications.push({
            id: `out-of-stock-${item.id}`,
            type: NotificationType.OutOfStock,
            message: `${item.itemName} is now out of stock.`,
            itemId: item.id,
            itemName: item.itemName,
        });
    });

    return notifications.sort((a, b) => a.type.localeCompare(b.type));
};