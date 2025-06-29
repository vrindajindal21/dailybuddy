# Push Notification Testing Guide

## Current Status ✅

Your reminder page **already has the correct code** for push notifications! The issue is that the system needs to be properly tested step by step.

## What's Already Working

1. ✅ **Reminder Page** - Has the correct API call to save reminders for push notifications
2. ✅ **API Routes** - `save-reminder` and `save-fcm-token` are properly set up
3. ✅ **Scheduler** - Automated script that checks for due reminders every minute
4. ✅ **FCM Integration** - Firebase Cloud Messaging is configured

## Testing Steps

### Step 1: Start the Services
```bash
# Terminal 1: Start the development server
npm run dev

# Terminal 2: Start the scheduler (runs every minute)
npm run scheduler:watch
```

### Step 2: Enable Push Notifications
1. Open your app in the browser (http://localhost:3000)
2. Look for the "Enable Push Notifications" button
3. Click it and grant notification permissions when prompted
4. Check the browser console for FCM token logs

### Step 3: Create a Test Reminder
1. Go to the Reminders page
2. Create a reminder for **1-2 minutes from now**
3. Set it to repeat daily or weekly
4. Save the reminder
5. Check the browser console for reminder saving logs

### Step 4: Test Push Notifications
1. Wait for the reminder time to arrive
2. You should receive a push notification
3. Check the scheduler terminal for logs
4. The notification should work even if the app is closed

## Debugging

### Check Current Status
```bash
node scripts/test-reminder.js
```

### Expected Console Logs
When creating a reminder, you should see:
```
Saving reminder for push notification: { title: "...", body: "...", time: "..." }
Reminder saved for push notification: { success: true, reminder: {...} }
```

When enabling FCM:
```
FCM token received: BDhloLCXMaJBH0Hqcegnyt8nHr3uE5sN7Gvipqk8V84q99ZVkLNvR7BkiM9R-nV8NWn2bram5xrDlRQk4anuRV0...
FCM token saved successfully. Total tokens: 1
```

### Common Issues

1. **No FCM tokens saved** - Users haven't granted notification permissions
2. **No reminders.json file** - No reminders have been created yet
3. **Scheduler not running** - Make sure to start `npm run scheduler:watch`
4. **Browser notifications blocked** - Check browser settings

## Files to Check

- `app/dashboard/reminders/page.tsx` - Reminder creation with push notification saving
- `app/api/save-reminder/route.js` - Saves reminders for push notifications
- `app/api/save-fcm-token/route.js` - Saves FCM tokens
- `scripts/scheduler-watch.js` - Automated reminder checking
- `components/enable-fcm-push.tsx` - FCM token generation

## Next Steps

1. **Test the system** using the steps above
2. **Check console logs** for any errors
3. **Verify FCM tokens** are being saved
4. **Confirm reminders** are being saved for push notifications
5. **Test background notifications** by closing the app

The reminder page is already properly configured for push notifications! 🎉 