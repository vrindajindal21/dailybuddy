# Enhanced Background Notifications for DailyBuddy

## Overview

The DailyBuddy app now has a robust background notification system that works for **Pomodoro**, **Reminders**, and **Medications** - ensuring users never miss important notifications even when the app is closed or the device is locked.

## How It Works

### 1. Service Worker Background Processing

The service worker (`public/sw.js`) runs independently of the main app and handles:
- **Background timers** for Pomodoro sessions
- **Scheduled reminders** for tasks, habits, and general reminders
- **Medication reminders** with proper scheduling
- **System notifications** that appear even when the app is closed

### 2. Background Services

Each feature has its own background service component:

#### Pomodoro Background Service (`components/pomodoro-background-service.tsx`)
- ✅ **Already working perfectly** - serves as the reference implementation
- Manages timer state in localStorage
- Syncs with service worker for background timing
- Shows notifications both in-app and system-wide
- Handles timer completion with sound and visual alerts

#### Reminder Background Service (`components/reminder-background-service.tsx`)
- 🔄 **Enhanced** - now works like Pomodoro
- Syncs reminders with service worker every 2 minutes
- Checks for due reminders every 30 seconds
- Shows notifications in-app and system-wide
- Handles reminder completion and snoozing

#### Medication Background Service (`components/medication-background-service.tsx`)
- 🔄 **Enhanced** - now works like Pomodoro
- Syncs medications with service worker every 2 minutes
- Checks for due medications every 30 seconds
- Shows notifications in-app and system-wide
- Handles medication completion and snoozing

### 3. Event-Driven Architecture

The system uses custom events to communicate between components:

```javascript
// Reminder events
window.dispatchEvent(new CustomEvent('reminder-added', { detail: { reminder } }))
window.dispatchEvent(new CustomEvent('reminder-updated', { detail: { reminder } }))
window.dispatchEvent(new CustomEvent('reminder-deleted', { detail: { reminderId } }))
window.dispatchEvent(new CustomEvent('reminder-completed', { detail: { reminderId } }))

// Medication events
window.dispatchEvent(new CustomEvent('medication-added', { detail: { medication } }))
window.dispatchEvent(new CustomEvent('medication-updated', { detail: { medication } }))
window.dispatchEvent(new CustomEvent('medication-deleted', { detail: { medicationId } }))
window.dispatchEvent(new CustomEvent('medication-completed', { detail: { reminderId } }))
```

### 4. Service Worker Communication

The service worker receives messages from the main app:

```javascript
// Schedule a reminder in the background
navigator.serviceWorker.controller?.postMessage({
  type: 'SCHEDULE_REMINDER',
  reminder: {
    id: reminder.id,
    title: `🔔 ${reminder.title}`,
    body: reminder.description,
    scheduledTime: reminder.scheduledTime.toISOString(),
    type: 'reminder',
    completed: false
  }
})

// Remove a reminder from background
navigator.serviceWorker.controller?.postMessage({
  type: 'REMOVE_REMINDER',
  reminderId: reminderId
})

// Mark reminder as complete
navigator.serviceWorker.controller?.postMessage({
  type: 'COMPLETE_REMINDER',
  reminderId: reminderId
})
```

## Notification Types

### 1. In-App Notifications
- Rich popup notifications with actions
- Toast notifications for quick feedback
- Smart popup system for high-priority items

### 2. System Notifications
- Browser notifications that work when app is closed
- Action buttons (Complete, Snooze, View)
- Proper navigation to relevant pages
- Sound alerts with different tones for each type

### 3. Background Alerts
- Service worker manages timing independently
- Notifications trigger even if main app is closed
- Persistent until user interacts with them

## Testing the System

Use the test script to verify everything works:

```javascript
// In browser console
window.testBackgroundNotifications.runAllTests()
```

This will:
1. Check service worker status
2. Verify background services are running
3. Test reminder notification (triggers in 10 seconds)
4. Test medication notification (triggers in 15 seconds)
5. Test service worker communication

## Key Features

### ✅ Reliable Background Processing
- Service worker runs independently
- Periodic sync ensures no missed notifications
- State persistence in localStorage

### ✅ Rich Notifications
- Multiple notification types (in-app, system, popup)
- Action buttons for quick responses
- Sound alerts with different tones
- Visual indicators and icons

### ✅ Smart Deduplication
- Prevents duplicate notifications
- Session-based tracking
- Proper cleanup after completion

### ✅ Cross-Platform Support
- Works on desktop browsers
- Works on mobile browsers
- Works when app is installed as PWA
- Works when device is locked (on supported platforms)

## Platform Limitations

### Android
- ✅ Full background notification support
- ✅ Works when app is closed
- ✅ Works when device is locked
- ⚠️ Battery optimization may affect timing

### iOS
- ⚠️ Limited background processing
- ✅ Notifications work when app is in background
- ❌ May not work when app is completely closed
- ⚠️ Safari PWA limitations

### Desktop
- ✅ Full background notification support
- ✅ Works when browser is minimized
- ✅ Works when system is locked
- ✅ Rich notification support

## Troubleshooting

### Notifications Not Working
1. Check notification permissions in browser
2. Verify service worker is registered
3. Check browser console for errors
4. Ensure app is running in HTTPS (required for service workers)

### Background Sync Issues
1. Check if browser supports background sync
2. Verify periodic sync registration
3. Check service worker logs
4. Test with the provided test script

### Sound Not Working
1. Check browser audio permissions
2. Verify AudioContext is supported
3. Check if device is not muted
4. Test with different browsers

## Future Enhancements

- [ ] Push notifications for remote reminders
- [ ] Advanced snooze options
- [ ] Custom notification sounds
- [ ] Notification history
- [ ] Smart notification timing
- [ ] Integration with calendar apps

## Conclusion

The enhanced background notification system ensures that DailyBuddy users never miss important reminders, medications, or Pomodoro sessions. The system works reliably across different platforms and provides a rich, interactive notification experience that keeps users engaged with their productivity and wellness goals. 