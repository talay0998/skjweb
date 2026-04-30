'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowRightLeft, Calculator, Loader2, History, CheckCircle2,
  Banknote, Smartphone, CreditCard, HelpCircle, Plus, Trash2, Receipt,
} from 'lucide-react'
import { toast } from 'sonner'

interface SaleRecord {
  id: string; totalAmount: number; paymentMethod: string; createdAt: string
  operator: { id: string; name: string }
  items: { quantity: number; price: number; costPrice: number }[]
  voided: boolean
}

interface ShiftRecord {
  id: string; startBalance: number; endBalance: number; totalSales: number
  totalCash: number; totalWechat: number; totalAlipay: number; totalOther: number
  totalExpense: number; difference: number; note: string | null
  createdAt: string; operator: { id: string; name: string }
  expenses: { id: string; amount: number; category: string; note: string }[]
}

interface ExpenseItem {
  id?: string; amount: number; category: string; note: string
}

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />, wechat: <Smartphone className="h-4 w-4" />,
  alipay: <CreditCard className="h-4 w-4" />, other: <HelpCircle className="h-4 w-4" />,
}
const PAYMENT_LABELS: Record<string, string> = { cash: '现金', wechat: '微信', alipay: '支付宝', other: '其他' }
const EXPENSE_CATEGORIES = ['水电费', '维修费', '网费', '房租', '物品采购', '其他支出']

export default function ShiftPanel() {
  const { user } = useAppStore()
  const [todaySales, setTodaySales] = useState<SaleRecord[]>([])
  const [shifts, setShifts] = useState<ShiftRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [startBalance, setStartBalance] = useState('')
  const [endBalance, setEndBalance] = useState('')
  const [note, setNote] = useState('')

  // Expenses
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [expDialogOpen, setExpDialogOpen] = useState(false)
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState('水电费')
  const [expNote, setExpNote] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [salesRes, shiftsRes] = await Promise.all([
        fetch(`/api/sales?date=${today}&includeVoided=true`),
        fetch('/api/shifts'),
      ])
      const salesData = await salesRes.json()
      const shiftsData = await shiftsRes.json()
      setTodaySales((salesData.sales || []).filter((s: SaleRecord) => !s.voided))
      setShifts(shiftsData.logs || shiftsData.shifts || [])
    } catch { toast.error('获取数据失败') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Calculate totals
  const totalSales = todaySales.reduce((sum, s) => sum + s.totalAmount, 0)
  const totalCash = todaySales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.totalAmount, 0)
  const totalWechat = todaySales.filter(s => s.paymentMethod === 'wechat').reduce((sum, s) => sum + s.totalAmount, 0)
  const totalAlipay = todaySales.filter(s => s.paymentMethod === 'alipay').reduce((sum, s) => sum + s.totalAmount, 0)
  const totalOther = todaySales.filter(s => s.paymentMethod === 'other').reduce((sum, s) => sum + s.totalAmount, 0)
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)

  const startBal = parseFloat(startBalance) || 0
  const endBal = parseFloat(endBalance) || 0
  const difference = endBal - startBal - totalCash + totalExpense

  const addExpense = () => {
    if (!expAmount || !expNote) { toast.warning('请填写完整支出信息'); return }
    setExpenses([...expenses, { amount: parseFloat(expAmount), category: expCategory, note: expNote }])
    setExpAmount(''); setExpNote(''); setExpCategory('水电费')
    setExpDialogOpen(false)
  }

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index))
  }

  const handleSubmitShift = async () => {
    if (!startBalance || !endBalance) { toast.warning('请输入起止现金余额'); return }
    if (!user) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: user.id, startBalance: startBal, endBalance: endBal,
          totalSales, totalCash, totalWechat, totalAlipay, totalOther,
          totalExpense, difference, note,
          expenses: expenses.map(e => ({ amount: e.amount, category: e.category, note: e.note })),
        }),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || '提交失败') }
      toast.success('换班对账提交成功')
      setStartBalance(''); setEndBalance(''); setNote(''); setExpenses([])
      fetchData()
    } catch (err) { toast.error(err instanceof Error ? err.message : '提交失败') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calculator className="h-5 w-5 text-amber-500" />今日销售汇总
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-8" />)}</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-amber-50 p-3 border border-amber-100">
                    <p className="text-xs text-amber-700">总销售额</p>
                    <p className="text-lg font-bold text-amber-600">¥{totalSales.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 border border-red-100">
                    <p className="text-xs text-red-700">额外支出</p>
                    <p className="text-lg font-bold text-red-600">¥{totalExpense.toFixed(2)}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  {(['cash','wechat','alipay','other'] as const).map(method => {
                    const total = method==='cash'?totalCash:method==='wechat'?totalWechat:method==='alipay'?totalAlipay:totalOther
                    return (
                      <div key={method} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">{PAYMENT_ICONS[method]}{PAYMENT_LABELS[method]}</span>
                        <span className="font-medium">¥{total.toFixed(2)}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right: Shift Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-amber-500" />换班对账
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>起始现金</Label><Input type="number" min="0" step="0.01" placeholder="起始金额" value={startBalance} onChange={(e) => setStartBalance(e.target.value)} /></div>
              <div className="space-y-2"><Label>结束现金</Label><Input type="number" min="0" step="0.01" placeholder="结束金额" value={endBalance} onChange={(e) => setEndBalance(e.target.value)} /></div>
            </div>

            {/* Expenses */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-1"><Receipt className="h-4 w-4" />额外支出</Label>
                <Button size="sm" variant="outline" onClick={() => setExpDialogOpen(true)}><Plus className="h-3 w-3 mr-1" />添加支出</Button>
              </div>
              {expenses.length > 0 && (
                <div className="space-y-1.5">
                  {expenses.map((exp, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-sm border border-red-100">
                      <Badge variant="outline" className="text-xs shrink-0">{exp.category}</Badge>
                      <span className="flex-1 truncate text-muted-foreground">{exp.note}</span>
                      <span className="font-medium text-red-600">-¥{exp.amount.toFixed(2)}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400" onClick={() => removeExpense(i)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
              {expenses.length === 0 && <p className="text-xs text-muted-foreground">无额外支出</p>}
            </div>

            {startBalance && endBalance && (
              <div className={`rounded-lg p-3 border ${Math.abs(difference) < 0.01 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">差额</span>
                  <span className={`text-lg font-bold ${Math.abs(difference) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                    ¥{difference.toFixed(2)} {Math.abs(difference) < 0.01 && <CheckCircle2 className="inline h-4 w-4 ml-1" />}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">差额 = 结束现金 - 起始现金 - 现金收入 + 支出</p>
              </div>
            )}

            <div className="space-y-2"><Label>备注</Label><Textarea placeholder="换班说明..." value={note} onChange={(e) => setNote(e.target.value)} rows={2} /></div>

            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSubmitShift} disabled={submitting || !startBalance || !endBalance}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />提交中...</> : '提交换班对账'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Shift History */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><History className="h-5 w-5 text-amber-500" />换班记录</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-4 space-y-2">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-10" />)}</div> : shifts.length===0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">暂无换班记录</div>
          ) : (
            <ScrollArea className="max-h-64">
              <Table>
                <TableHeader><TableRow><TableHead>时间</TableHead><TableHead>操作员</TableHead><TableHead className="text-right">起始</TableHead><TableHead className="text-right">结束</TableHead><TableHead className="text-right">销售</TableHead><TableHead className="text-right">支出</TableHead><TableHead className="text-right">差额</TableHead><TableHead>备注</TableHead></TableRow></TableHeader>
                <TableBody>
                  {shifts.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs">{new Date(s.createdAt).toLocaleString('zh-CN')}</TableCell>
                      <TableCell>{s.operator.name}</TableCell>
                      <TableCell className="text-right">¥{s.startBalance.toFixed(2)}</TableCell>
                      <TableCell className="text-right">¥{s.endBalance.toFixed(2)}</TableCell>
                      <TableCell className="text-right">¥{s.totalSales.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-red-600">¥{s.totalExpense.toFixed(2)}</TableCell>
                      <TableCell className="text-right"><span className={Math.abs(s.difference)<0.01?'text-green-600':'text-red-600'}>¥{s.difference.toFixed(2)}</span></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{s.note||'-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Expense Dialog */}
      <Dialog open={expDialogOpen} onOpenChange={setExpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>添加额外支出</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>支出金额</Label><Input type="number" min="0" step="0.01" placeholder="金额" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} /></div>
            <div className="space-y-2"><Label>支出类别</Label>
              <Select value={expCategory} onValueChange={setExpCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>支出说明</Label><Textarea placeholder="详细说明这笔支出..." value={expNote} onChange={(e) => setExpNote(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpDialogOpen(false)}>取消</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={addExpense}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
