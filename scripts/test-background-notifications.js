// Test script for background notifications
// Run this in the browser console to test the enhanced notification system

console.log('🧪 Testing Enhanced Background Notifications...')

// Test 1: Add a reminder that should trigger in 10 seconds
function testReminderNotification() {
  console.log('📝 Testing reminder notification...')
  
  const reminder = {
    id: 'test-reminder-' + Date.now(),
    title: 'Test Reminder',
    description: 'This is a test reminder notification',
    scheduledTime: new Date(Date.now() + 10000), // 10 seconds from now
    type: 'general',
    completed: false
  }
  
  // Add reminder using ReminderManager
  if (typeof window !== 'undefined' && window.ReminderManager) {
    window.ReminderManager.addReminder(reminder)
    console.log('✅ Reminder added, should trigger in 10 seconds')
  } else {
    console.log('❌ ReminderManager not available')
  }
}

// Test 2: Add a medication reminder that should trigger in 15 seconds
function testMedicationNotification() {
  console.log('💊 Testing medication notification...')
  
  const medication = {
    name: 'Test Medication',
    dosage: '1 tablet',
    instructions: 'Take with food',
    schedule: [{
      time: new Date(Date.now() + 15000).toTimeString().slice(0, 5), // 15 seconds from now
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    notificationsEnabled: true,
    alarmEnabled: true,
    alarmSound: 'bell',
    alarmVolume: 70,
    color: '#ff6b6b',
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    notes: 'Test medication'
  }
  
  // Add medication using MedicationManager
  if (typeof window !== 'undefined' && window.MedicationManager) {
    const medicationId = window.MedicationManager.addMedication(medication)
    console.log('✅ Medication added with ID:', medicationId, 'should trigger in 15 seconds')
  } else {
    console.log('❌ MedicationManager not available')
  }
}

// Test 3: Check service worker status
function checkServiceWorkerStatus() {
  console.log('🔧 Checking service worker status...')
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        console.log('✅ Service worker is registered:', registration.scope)
        console.log('📊 Service worker state:', registration.active ? 'active' : 'inactive')
      } else {
        console.log('❌ No service worker registration found')
      }
    })
  } else {
    console.log('❌ Service worker not supported')
  }
}

// Test 4: Check background services
function checkBackgroundServices() {
  console.log('🔄 Checking background services...')
  
  // Check if background services are running
  const reminderState = localStorage.getItem('reminder_background_state')
  const medicationState = localStorage.getItem('medication_background_state')
  const pomodoroState = localStorage.getItem('global_pomodoro_timer')
  
  console.log('📝 Reminder background state:', reminderState ? 'active' : 'inactive')
  console.log('💊 Medication background state:', medicationState ? 'active' : 'inactive')
  console.log('🍅 Pomodoro background state:', pomodoroState ? 'active' : 'inactive')
}

// Test 5: Test service worker communication
function testServiceWorkerCommunication() {
  console.log('📡 Testing service worker communication...')
  
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'REMINDER_SYNC_REQUEST'
    })
    console.log('✅ Sync request sent to service worker')
  } else {
    console.log('❌ Service worker controller not available')
  }
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting comprehensive background notification tests...')
  
  checkServiceWorkerStatus()
  checkBackgroundServices()
  testServiceWorkerCommunication()
  
  // Wait a bit then run notification tests
  setTimeout(() => {
    testReminderNotification()
    
    setTimeout(() => {
      testMedicationNotification()
      console.log('🎉 All tests completed! Check for notifications in the next 15 seconds.')
    }, 2000)
  }, 1000)
}

// Export functions for manual testing
if (typeof window !== 'undefined') {
  window.testBackgroundNotifications = {
    testReminderNotification,
    testMedicationNotification,
    checkServiceWorkerStatus,
    checkBackgroundServices,
    testServiceWorkerCommunication,
    runAllTests
  }
  
  console.log('🧪 Background notification test functions available:')
  console.log('- window.testBackgroundNotifications.runAllTests()')
  console.log('- window.testBackgroundNotifications.testReminderNotification()')
  console.log('- window.testBackgroundNotifications.testMedicationNotification()')
  console.log('- window.testBackgroundNotifications.checkServiceWorkerStatus()')
  console.log('- window.testBackgroundNotifications.checkBackgroundServices()')
  console.log('- window.testBackgroundNotifications.testServiceWorkerCommunication()')
}

module.exports = {
  testReminderNotification,
  testMedicationNotification,
  checkServiceWorkerStatus,
  checkBackgroundServices,
  testServiceWorkerCommunication,
  runAllTests
} 