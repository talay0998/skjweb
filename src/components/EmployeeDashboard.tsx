'use client'

import { useAppStore } from '@/store/useAppStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Monitor,
  LogOut,
  ShoppingCart,
  Package,
  ArrowRightLeft,
} from 'lucide-react'
import SalesPanel from './SalesPanel'
import InventoryPanel from './InventoryPanel'
import ShiftPanel from './ShiftPanel'

export default function EmployeeDashboard() {
  const { user, setEmployeeTab, employeeTab, logout } = useAppStore()

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Monitor className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-bold text-lg">时空网吧管理系统</h1>
            <Badge variant="outline" className="text-xs">员工端</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              当前操作员：<span className="font-medium text-foreground">{user?.name}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-red-500">
              <LogOut className="h-4 w-4 mr-1" />
              退出
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        <Tabs value={employeeTab} onValueChange={(v) => setEmployeeTab(v as 'sales' | 'inventory' | 'shift')}>
          <TabsList className="mb-4">
            <TabsTrigger value="sales" className="gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              销售
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-1.5">
              <Package className="h-4 w-4" />
              库存
            </TabsTrigger>
            <TabsTrigger value="shift" className="gap-1.5">
              <ArrowRightLeft className="h-4 w-4" />
              换班对账
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sales" className="mt-0">
            <SalesPanel />
          </TabsContent>
          <TabsContent value="inventory" className="mt-0">
            <InventoryPanel />
          </TabsContent>
          <TabsContent value="shift" className="mt-0">
            <ShiftPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-3 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted-foreground">
          时空网吧管理系统 © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
