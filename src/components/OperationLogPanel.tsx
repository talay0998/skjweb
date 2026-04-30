'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { History, Search } from 'lucide-react'

interface OpLog {
  id: string; userId: string; action: string; detail: string; createdAt: string
  user: { id: string; username: string; name: string; role: string }
}

const ACTION_LABELS: Record<string, string> = {
  sale: '销售', void_sale: '作废销售', inventory: '入库',
  shift: '换班', expense: '支出', login: '登录',
}
const ACTION_COLORS: Record<string, string> = {
  sale: 'bg-green-100 text-green-700', void_sale: 'bg-red-100 text-red-700',
  inventory: 'bg-blue-100 text-blue-700', shift: 'bg-amber-100 text-amber-700',
  expense: 'bg-purple-100 text-purple-700', login: 'bg-stone-100 text-stone-700',
}

export default function OperationLogPanel() {
  const [logs, setLogs] = useState<OpLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (actionFilter !== 'all') params.set('action', actionFilter)
      if (userFilter !== 'all') params.set('userId', userFilter)
      const res = await fetch(`/api/operation-logs?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
    } catch { /* fail silently */ }
    finally { setLoading(false) }
  }, [actionFilter, userFilter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const parseDetail = (action: string, detail: string) => {
    try {
      const d = JSON.parse(detail)
      switch (action) {
        case 'sale': return `销售 ¥${d.totalAmount?.toFixed(2)||0} (${d.paymentMethod||''}) ${d.items?.length||0}件商品${d.note ? ` 备注:${d.note}` : ''}`
        case 'void_sale': return `作废销售 ¥${d.totalAmount?.toFixed(2)||0} 原因:${d.reason||''}`
        case 'inventory': return `入库 ${d.productName||''} +${d.quantity||0}件 @¥${d.costPrice||0}${d.note ? ` 备注:${d.note}` : ''}`
        case 'shift': return `换班 销售:¥${d.totalSales?.toFixed(2)||0} 支出:¥${d.totalExpense?.toFixed(2)||0} 差额:¥${d.difference?.toFixed(2)||0}`
        case 'expense': return `支出 ¥${d.amount?.toFixed(2)||0} (${d.category||''}) ${d.note||''}`
        default: return detail
      }
    } catch { return detail }
  }

  const users = [...new Map(logs.map(l => [l.user.id, l.user])).values()]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索操作记录..." className="pl-9" disabled />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="操作类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            {Object.entries(ACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="操作人" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部人员</SelectItem>
            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-amber-500" />
            操作审计日志
            <Badge variant="outline" className="text-xs">{logs.length} 条</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-10" />)}</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">暂无操作记录</div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>操作人</TableHead>
                    <TableHead>操作类型</TableHead>
                    <TableHead>详情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString('zh-CN')}</TableCell>
                      <TableCell className="font-medium text-sm">{log.user.name}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${ACTION_COLORS[log.action] || 'bg-stone-100 text-stone-700'}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[400px] truncate">
                        {parseDetail(log.action, log.detail)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
