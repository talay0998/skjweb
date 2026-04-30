'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, TrendingUp, ShoppingCart, Search, Banknote, Smartphone, CreditCard, HelpCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { toast } from 'sonner'

interface FinanceData {
  totalRevenue: number; totalCost: number; profit: number
  cashTotal: number; wechatTotal: number; alipayTotal: number; otherTotal: number; salesCount: number
}

interface SaleRecord {
  id: string; totalAmount: number; paymentMethod: string; createdAt: string
  operator: { name: string }; items: { product: { name: string }; quantity: number; price: number; costPrice: number }[]
}

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

export default function FinancePanel() {
  const [finance, setFinance] = useState<FinanceData | null>(null)
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [fRes, sRes] = await Promise.all([
        fetch(`/api/finance?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/sales?startDate=${startDate}&endDate=${endDate}`),
      ])
      const fData = await fRes.json()
      const sData = await sRes.json()
      setFinance(fData.finance)
      setSales(sData.sales || [])
    } catch { toast.error('获取数据失败') }
    finally { setLoading(false) }
  }, [startDate, endDate])

  const handleSearch = () => { if (startDate && endDate) fetchData() }

  // Calculate product breakdown
  const productBreakdown: Record<string, { name: string; count: number; revenue: number; cost: number }> = {}
  for (const sale of sales) {
    for (const item of sale.items) {
      const name = item.product.name
      if (!productBreakdown[name]) productBreakdown[name] = { name, count: 0, revenue: 0, cost: 0 }
      productBreakdown[name].count += item.quantity
      productBreakdown[name].revenue += item.price * item.quantity
      productBreakdown[name].cost += item.costPrice * item.quantity
    }
  }
  const topProducts = Object.values(productBreakdown).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

  const barData = finance ? [
    { name: '现金', 营收: finance.cashTotal }, { name: '微信', 营收: finance.wechatTotal },
    { name: '支付宝', 营收: finance.alipayTotal }, { name: '其他', 营收: finance.otherTotal },
  ].filter(d => d.营收 > 0) : []

  const profitRate = finance && finance.totalRevenue > 0 ? ((finance.profit / finance.totalRevenue) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="space-y-1 flex-1"><Label className="text-xs">开始日期</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div className="space-y-1 flex-1"><Label className="text-xs">结束日期</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSearch}><Search className="h-4 w-4 mr-1" />查询</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><DollarSign className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">总营收</p><p className="text-lg font-bold">{loading ? <Skeleton className="h-5 w-16" /> : `¥${(finance?.totalRevenue||0).toFixed(2)}`}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0"><ShoppingCart className="h-5 w-5 text-stone-600" /></div>
          <div><p className="text-xs text-muted-foreground">总成本</p><p className="text-lg font-bold">{loading ? <Skeleton className="h-5 w-16" /> : `¥${(finance?.totalCost||0).toFixed(2)}`}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0"><TrendingUp className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-xs text-muted-foreground">利润</p><p className="text-lg font-bold text-green-600">{loading ? <Skeleton className="h-5 w-16" /> : `¥${(finance?.profit||0).toFixed(2)}`}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">利润率</p>
          <p className="text-lg font-bold text-green-600">{loading ? <Skeleton className="h-5 w-10" /> : `${profitRate}%`}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">订单数</p>
          <p className="text-lg font-bold">{loading ? <Skeleton className="h-5 w-8" /> : finance?.salesCount||0}</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">支付方式分布</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48" /> : barData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">暂无数据</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(v: number) => `¥${v.toFixed(2)}`} />
                    <Bar dataKey="营收" fill="#f59e0b" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {finance && (
              <div className="grid grid-cols-2 gap-2 mt-3">
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
          <CardHeader className="pb-2"><CardTitle className="text-base">商品销售排行</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48" /> : topProducts.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">暂无数据</div>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={11} />
                      <YAxis type="category" dataKey="name" fontSize={11} width={70} />
                      <Tooltip formatter={(v: number, n: string) => [n==='revenue'?`¥${v.toFixed(2)}`:`${v}件`, n==='revenue'?'营收':'数量']} />
                      <Legend />
                      <Bar dataKey="count" name="数量" fill="#f59e0b" radius={[0,4,4,0]} barSize={12} />
                      <Bar dataKey="revenue" name="营收" fill="#10b981" radius={[0,4,4,0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ScrollArea className="max-h-48 mt-2">
                  <Table>
                    <TableHeader><TableRow><TableHead>商品</TableHead><TableHead className="text-right">数量</TableHead><TableHead className="text-right">营收</TableHead><TableHead className="text-right">利润</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {topProducts.map(p => (
                        <TableRow key={p.name}>
                          <TableCell className="font-medium text-sm"><span className="mr-1">{PRODUCT_ICONS[p.name]||'📦'}</span>{p.name}</TableCell>
                          <TableCell className="text-right">{p.count}件</TableCell>
                          <TableCell className="text-right">¥{p.revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-green-600">¥{(p.revenue-p.cost).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales list */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">销售明细</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-4 space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-8" />)}</div> : sales.length===0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">暂无销售记录</div>
          ) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader><TableRow><TableHead>时间</TableHead><TableHead>商品明细</TableHead><TableHead>操作员</TableHead><TableHead>支付</TableHead><TableHead className="text-right">金额</TableHead><TableHead className="text-right">利润</TableHead></TableRow></TableHeader>
                <TableBody>
                  {sales.map(s => {
                    const profit = s.items.reduce((sum, item) => sum + (item.price - item.costPrice) * item.quantity, 0)
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs">{new Date(s.createdAt).toLocaleString('zh-CN')}</TableCell>
                        <TableCell className="text-sm">{s.items.map(i => `${PRODUCT_ICONS[i.product.name]||''}${i.product.name}×${i.quantity}`).join(', ')}</TableCell>
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
