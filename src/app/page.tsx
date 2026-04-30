'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useAppStore } from '@/store/useAppStore'
import LoginView from '@/components/LoginView'
import EmployeeDashboard from '@/components/EmployeeDashboard'
import AdminDashboard from '@/components/AdminDashboard'
import { Loader2 } from 'lucide-react'

// Hook to detect client-side hydration safely
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export default function Home() {
  const { user, setUser } = useAppStore()
  const mounted = useHydrated()

  // Seed database on first load
  useEffect(() => {
    if (!mounted) return
    const seeded = localStorage.getItem('cybercafe-seeded')
    if (!seeded) {
      fetch('/api/seed', { method: 'POST' })
        .then(() => localStorage.setItem('cybercafe-seeded', 'true'))
        .catch(() => {})
    }
  }, [mounted])

  // Validate persisted user session on mount
  useEffect(() => {
    if (!mounted || !user) return
    fetch(`/api/auth/operator?userId=${user.id}`)
      .then((res) => {
        if (!res.ok) {
          setUser(null)
        }
      })
      .catch(() => {
        // Network error on first load, keep session
      })
  }, [mounted, user, setUser])

  // Show loading while hydrating from localStorage
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  // Derive view from user state - always recalculate to avoid stale view
  if (user?.role === 'admin') {
    return <AdminDashboard />
  }

  if (user) {
    return <EmployeeDashboard />
  }

  return <LoginView />
}
