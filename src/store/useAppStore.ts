'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  username: string
  name: string
  role: 'admin' | 'employee'
}

export type View = 'login' | 'employee-dashboard' | 'admin-dashboard'
export type EmployeeTab = 'sales' | 'inventory' | 'shift'
export type AdminTab = 'overview' | 'products' | 'employees' | 'finance' | 'logs' | 'export'

interface AppState {
  // Auth
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void

  // Navigation
  currentView: View
  setCurrentView: (view: View) => void
  employeeTab: EmployeeTab
  setEmployeeTab: (tab: EmployeeTab) => void
  adminTab: AdminTab
  setAdminTab: (tab: AdminTab) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({
        user,
        currentView: user ? (user.role === 'admin' ? 'admin-dashboard' : 'employee-dashboard') : 'login',
        employeeTab: 'sales',
        adminTab: 'overview',
      }),

      // Logout: clear everything and reset to login
      logout: () => {
        set({
          user: null,
          currentView: 'login',
          employeeTab: 'sales',
          adminTab: 'overview',
        })
      },

      // Navigation
      currentView: 'login',
      setCurrentView: (currentView) => set({ currentView }),
      employeeTab: 'sales',
      setEmployeeTab: (employeeTab) => set({ employeeTab }),
      adminTab: 'overview',
      setAdminTab: (adminTab) => set({ adminTab }),
    }),
    {
      name: 'cybercafe-store',
      // Only persist the user object, NOT the view/navigation state
      // This ensures the app always starts from login on page refresh
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
)
