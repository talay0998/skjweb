'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Monitor, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginView() {
  const { setUser, setCurrentView } = useAppStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '登录失败')
        return
      }

      setUser(data.user)
      setCurrentView(data.user.role === 'admin' ? 'admin-dashboard' : 'employee-dashboard')
      toast.success(`欢迎回来，${data.user.name}！`)
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-stone-200">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-200">
            <Monitor className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">时空网吧管理系统</CardTitle>
            <CardDescription className="mt-1.5 text-sm">
              请输入账号密码登录系统
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>
          </form>
          <div className="mt-6 rounded-lg bg-stone-50 p-3 text-xs text-muted-foreground border border-stone-200">
            <p className="font-medium text-stone-600 mb-1">演示账号：</p>
            <p>管理员：admin / admin123</p>
            <p>员工：mamatjan / m123</p>
            <p>员工：aishanjan / a123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
