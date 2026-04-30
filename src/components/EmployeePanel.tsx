'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Users, Plus, Trash2, Loader2, Shield, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'

interface Employee {
  id: string
  username: string
  name: string
  role: string
  active: boolean
  createdAt: string
}

export default function EmployeePanel() {
  const { user } = useAppStore()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState('employee')

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      setEmployees(data.employees || [])
    } catch {
      toast.error('获取员工列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const handleAdd = async () => {
    if (!formUsername || !formPassword || !formName) {
      toast.warning('请填写完整信息')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formUsername, password: formPassword, name: formName, role: formRole }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '添加失败')
      }
      toast.success('员工添加成功')
      setDialogOpen(false)
      setFormUsername('')
      setFormPassword('')
      setFormName('')
      setFormRole('employee')
      fetchEmployees()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (id === user?.id) {
      toast.warning('不能删除自己')
      return
    }
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '删除失败')
      }
      toast.success('员工已删除')
      fetchEmployees()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold">员工管理</h3>
          <Badge variant="outline">{employees.length} 人</Badge>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-1" />添加员工
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>添加员工</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>用户名</Label>
                <Input placeholder="用户名" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>密码</Label>
                <Input type="password" placeholder="密码" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input placeholder="姓名" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>角色</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">员工</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleAdd} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}添加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {emp.role === 'admin' ? <Shield className="h-4 w-4 text-amber-500" /> : <UserCircle className="h-4 w-4 text-muted-foreground" />}
                          {emp.name}
                        </div>
                      </TableCell>
                      <TableCell>{emp.username}</TableCell>
                      <TableCell>
                        <Badge variant={emp.role === 'admin' ? 'default' : 'outline'} className="text-xs">
                          {emp.role === 'admin' ? '管理员' : '员工'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={emp.active ? 'default' : 'secondary'} className="text-xs">
                          {emp.active ? '正常' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(emp.createdAt).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right">
                        {emp.id !== user?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>确定要删除员工 &quot;{emp.name}&quot; 吗？</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => handleDelete(emp.id)}>删除</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
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
