'use client'

import { useAppStore } from '@/store/useAppStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Monitor, LogOut, LayoutDashboard, Package, Users, DollarSign, Download, History } from 'lucide-react'
import AdminOverview from './AdminOverview'
import ProductPanel from './ProductPanel'
import EmployeePanel from './EmployeePanel'
import FinancePanel from './FinancePanel'
import ExportPanel from './ExportPanel'
import OperationLogPanel from './OperationLogPanel'

export default function AdminDashboard() {
  const { user, setAdminTab, adminTab, logout } = useAppStore()

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Monitor className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-bold text-lg">时空网吧管理系统</h1>
            <Badge className="bg-amber-500 text-white text-xs">管理后台</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              管理员：<span className="font-medium text-foreground">{user?.name}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-red-500">
              <LogOut className="h-4 w-4 mr-1" />退出
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        <Tabs value={adminTab} onValueChange={(v) => setAdminTab(v as 'overview' | 'products' | 'employees' | 'finance' | 'export' | 'logs')}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="overview" className="gap-1.5"><LayoutDashboard className="h-4 w-4" />总览</TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5"><Package className="h-4 w-4" />商品管理</TabsTrigger>
            <TabsTrigger value="employees" className="gap-1.5"><Users className="h-4 w-4" />员工管理</TabsTrigger>
            <TabsTrigger value="finance" className="gap-1.5"><DollarSign className="h-4 w-4" />财务统计</TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5"><History className="h-4 w-4" />操作日志</TabsTrigger>
            <TabsTrigger value="export" className="gap-1.5"><Download className="h-4 w-4" />数据导出</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-0"><AdminOverview /></TabsContent>
          <TabsContent value="products" className="mt-0"><ProductPanel /></TabsContent>
          <TabsContent value="employees" className="mt-0"><EmployeePanel /></TabsContent>
          <TabsContent value="finance" className="mt-0"><FinancePanel /></TabsContent>
          <TabsContent value="logs" className="mt-0"><OperationLogPanel /></TabsContent>
          <TabsContent value="export" className="mt-0"><ExportPanel /></TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-white py-3 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted-foreground">
          时空网吧管理系统 © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
