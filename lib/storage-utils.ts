// Utility functions for working with localStorage
export const storageUtils = {
  // Save data to localStorage with error handling
  save: <T,>(key: string, data: T): boolean => {
    try {
      const serialized = JSON.stringify(data)
      localStorage.setItem(key, serialized)
      return true
    } catch (error: any) {
      console.error(`Error saving data to localStorage (${key}):`, error)
      return false
    }
  },

  // Load data from localStorage with error handling
  load: <T,>(key: string, defaultValue: T): T => {
    try {
      const serialized = localStorage.getItem(key)
      if (serialized === null) {
        return defaultValue
      }
      return JSON.parse(serialized) as T
    } catch (error: any) {
      console.error(`Error loading data from localStorage (${key}):`, error)
      return defaultValue
    }
  },

  // Remove data from localStorage
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error: any) {
      console.error(`Error removing data from localStorage (${key}):`, error)
      return false
    }
  },

  // Check if localStorage is available
  isAvailable: (): boolean => {
    try {
      const testKey = "__storage_test__"
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      return true
    } catch (e: any) {
      return false
    }
  },
}
