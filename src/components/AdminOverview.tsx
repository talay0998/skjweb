'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DollarSign, TrendingUp, ShoppingCart, Warehouse,
  Banknote, Smartphone, CreditCard, HelpCircle, Package,
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface FinanceData {
  totalRevenue: number; totalCost: number; profit: number
  cashTotal: number; wechatTotal: number; alipayTotal: number; otherTotal: number; salesCount: number
}

interface SaleRecord {
  id: string; totalAmount: number; paymentMethod: string; createdAt: string
  operator: { id: string; name: string }
  items: { product: { name: string }; quantity: number; price: number; costPrice: number }[]
}

const PIE_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
const PAYMENT_LABELS: Record<string, string> = { cash: '现金', wechat: '微信', alipay: '支付宝', other: '其他' }
const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4 text-amber-500" />, wechat: <Smartphone className="h-4 w-4 text-green-500" />,
  alipay: <CreditCard className="h-4 w-4 text-blue-500" />, other: <HelpCircle className="h-4 w-4 text-purple-500" />,
}

const PRODUCT_ICONS: Record<string, string> = {
  '青瓜味饮料1升': '🥒', '老汉瓜味饮料1升': '🍈', '东方树叶1升': '🍃',
  '黑卡': '⚫', '红牛': '🐂', '咖啡': '☕',
  '茉莉蜜茶1升': '🍵', '绿茶1升': '🍵', '红茶1升': '🍵',
  '奶皮': '🥛', '激活': '💧', '奶茶': '🥤',
  '百岁山': '💧', '鲜橙多': '🍊', '可乐': '🥤',
  '红茶': '🍵', '绿茶': '🍵', '黑加仑': '🍇',
  '茉莉蜜茶': '🍵', '健力宝': '🥤', '农夫山泉': '💧', '娃哈哈': '💧',
  '包面': '🍜', '鸡腿': '🍗', '火腿肠': '🌭',
  '可可派': '🍫', '卤鸡蛋': '🥚', '卷豆腐': '🧈',
  '豆腐干': '🧈', '碎翠虾': '🦐', '馕伴': '🍞',
}

export default function AdminOverview() {
  const [finance, setFinance] = useState<FinanceData | null>(null)
  const [recentSales, setRecentSales] = useState<SaleRecord[]>([])
  const [inventoryValue, setInventoryValue] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [topProducts, setTopProducts] = useState<{ name: string; count: number; revenue: number }[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [financeRes, salesRes, productsRes] = await Promise.all([
        fetch(`/api/finance?date=${today}`),
        fetch(`/api/sales?date=${today}`),
        fetch('/api/products'),
      ])
      const financeData = await financeRes.json()
      const salesData = await salesRes.json()
      const productsData = await productsRes.json()

      setFinance(financeData.finance)
      const sales = salesData.sales || []
      setRecentSales(sales.slice(0, 10))

      const products = productsData.products || []
      const active = products.filter((p: { active: boolean }) => p.active)
      setTotalProducts(active.length)
      setLowStockCount(active.filter((p: { stock: number }) => p.stock < 10).length)
      const totalVal = active.reduce((sum: number, p: { costPrice: number; stock: number }) => sum + p.costPrice * p.stock, 0)
      setInventoryValue(totalVal)

      // Calculate top products
      const productMap: Record<string, { name: string; count: number; revenue: number }> = {}
      for (const sale of sales) {
        for (const item of sale.items) {
          const name = item.product.name
          if (!productMap[name]) productMap[name] = { name, count: 0, revenue: 0 }
          productMap[name].count += item.quantity
          productMap[name].revenue += item.price * item.quantity
        }
      }
      setTopProducts(Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8))
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const paymentPieData = finance
    ? [
        { name: '现金', value: finance.cashTotal }, { name: '微信', value: finance.wechatTotal },
        { name: '支付宝', value: finance.alipayTotal }, { name: '其他', value: finance.otherTotal },
      ].filter(d => d.value > 0)
    : []

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><DollarSign className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">今日营收</p><p className="text-lg font-bold">{loading ? <Skeleton className="h-5 w-16" /> : `¥${(finance?.totalRevenue||0).toFixed(2)}`}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0"><TrendingUp className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-xs text-muted-foreground">今日利润</p><p className="text-lg font-bold text-green-600">{loading ? <Skeleton className="h-5 w-16" /> : `¥${(finance?.profit||0).toFixed(2)}`}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-xs text-muted-foreground">今日订单</p><p className="text-lg font-bold">{loading ? <Skeleton className="h-5 w-8" /> : finance?.salesCount||0}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0"><Warehouse className="h-5 w-5 text-purple-600" /></div>
          <div><p className="text-xs text-muted-foreground">库存总值</p><p className="text-lg font-bold">{loading ? <Skeleton className="h-5 w-16" /> : `¥${inventoryValue.toFixed(0)}`}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0"><Package className="h-5 w-5 text-red-600" /></div>
          <div><p className="text-xs text-muted-foreground">商品/低库存</p><p className="text-lg font-bold">{totalProducts} <span className="text-red-500 text-sm">({lowStockCount}低)</span></p></div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">支付方式分布</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48" /> : paymentPieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">今日暂无销售数据</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {paymentPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `¥${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {finance && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(['cash','wechat','alipay','other'] as const).map(m => {
                  const t = m==='cash'?finance.cashTotal:m==='wechat'?finance.wechatTotal:m==='alipay'?finance.alipayTotal:finance.otherTotal
                  return <div key={m} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-stone-50">{PAYMENT_ICONS[m]}<span className="text-muted-foreground">{PAYMENT_LABELS[m]}</span><span className="ml-auto font-medium">¥{t.toFixed(2)}</span></div>
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">今日热销商品</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48" /> : topProducts.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">今日暂无销售数据</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={11} />
                    <YAxis type="category" dataKey="name" fontSize={11} width={80} />
                    <Tooltip formatter={(v: number, name: string) => [name === 'revenue' ? `¥${v.toFixed(2)}` : `${v}件`, name === 'revenue' ? '营收' : '数量']} />
                    <Bar dataKey="count" fill="#f59e0b" name="数量" radius={[0,4,4,0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {!loading && topProducts.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {topProducts.slice(0, 5).map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2 text-sm p-1.5 rounded-lg bg-stone-50">
                    <span className="text-base">{PRODUCT_ICONS[p.name] || '📦'}</span>
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-muted-foreground text-xs">{p.count}件</span>
                    <span className="font-medium text-amber-600">¥{p.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">今日销售记录</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-4 space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-8" />)}</div> : recentSales.length===0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">今日暂无销售记录</div>
          ) : (
            <ScrollArea className="max-h-64">
              <Table>
                <TableHeader><TableRow><TableHead>时间</TableHead><TableHead>商品明细</TableHead><TableHead>操作员</TableHead><TableHead>支付</TableHead><TableHead className="text-right">金额</TableHead><TableHead className="text-right">利润</TableHead></TableRow></TableHeader>
                <TableBody>
                  {recentSales.map(s => {
                    const profit = s.items.reduce((sum, item) => sum + (item.price - item.costPrice) * item.quantity, 0)
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs">{new Date(s.createdAt).toLocaleTimeString('zh-CN')}</TableCell>
                        <TableCell className="text-sm">
                          {s.items.map(i => `${PRODUCT_ICONS[i.product.name]||''} ${i.product.name}×${i.quantity}`).join(', ')}
                        </TableCell>
                        <TableCell className="text-sm">{s.operator.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{PAYMENT_LABELS[s.paymentMethod]||s.paymentMethod}</Badge></TableCell>
                        <TableCell className="text-right font-medium">¥{s.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">¥{profit.toFixed(2)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
