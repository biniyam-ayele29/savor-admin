# Notification System Documentation

## Overview
The Savor Admin dashboard now includes a comprehensive notification system that tracks and displays order updates in real-time.

## Features

### 🔔 Bell Icon Notification Center
- **Location**: Top-right corner of the navbar
- **Real-time Badge**: Shows unread notification count
- **Persistent Storage**: Notifications are saved in browser localStorage
- **Auto-refresh**: Updates automatically when new orders arrive

### 📬 Notification Types
1. **New Order Received**
   - Triggers when a new order is created
   - Shows customer name, company, and order amount
   - Includes order ID for quick reference

2. **Order Delivered**
   - Triggers when order status changes to "delivered"
   - Confirms successful delivery

### ⏰ Timestamp Features
- **Just now** - Less than 1 minute ago
- **Xm ago** - Minutes ago
- **Xh ago** - Hours ago
- **Xd ago** - Days ago
- **Full date** - For older notifications

### 🎯 Notification Actions
- **Click to mark as read** - Single click marks notification as read
- **Mark all as read** - Bulk action for all unread notifications
- **Delete individual** - Remove specific notifications (hover to see X button)
- **Clear all** - Remove all notifications at once

### 🌐 Browser Notifications
- **Push notifications** - Desktop notifications for new orders (requires permission)
- **Sound alerts** - Optional audio notification on new orders
- **Auto-permission request** - Asks for notification permission on first load

### 💾 Persistence
- Notifications are stored in browser localStorage
- Persist across browser sessions
- Automatically sync between tabs
- Survives page refreshes

## Technical Implementation

### Real-time Subscriptions
```typescript
// Listens to Supabase realtime events
- INSERT on orders table → New order notification
- UPDATE on orders table → Status change notification
```

### Data Structure
```typescript
interface Notification {
    id: string;              // Unique identifier
    title: string;           // Notification title
    message: string;         // Detailed message
    timestamp: string;       // ISO timestamp
    read: boolean;           // Read/unread status
    type: 'order' | 'info' | 'success' | 'warning';
    orderId?: string;        // Reference to order
}
```

### Storage
- **Key**: `savor_notifications`
- **Location**: Browser localStorage
- **Format**: JSON array of notifications

## Usage Tips

1. **Enable Browser Notifications**: Click "Allow" when prompted for best experience
2. **Keep Bell Icon Visible**: Check regularly for new orders
3. **Clear Old Notifications**: Use "Clear all" to maintain a clean notification list
4. **Mark as Read**: Click on notifications to acknowledge them

## Browser Compatibility
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Future Enhancements
- [ ] Filter notifications by type
- [ ] Search through notifications
- [ ] Export notification history
- [ ] Notification settings/preferences
- [ ] Email notifications integration
- [ ] SMS notifications for critical orders
