'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Download, FileJson, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ExportPanel() {
  const [exportType, setExportType] = useState('all')
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/export?type=${exportType}`)
      if (!res.ok) throw new Error('导出失败')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cybercafe_${exportType}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('数据导出成功')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '导出失败')
    } finally {
      setLoading(false)
    }
  }

  const exportOptions = [
    { value: 'sales', label: '销售记录', desc: '导出所有销售数据及明细' },
    { value: 'inventory', label: '库存记录', desc: '导出所有入库记录' },
    { value: 'shifts', label: '换班记录', desc: '导出所有换班对账记录' },
    { value: 'all', label: '全部数据', desc: '导出所有数据（商品、销售、库存、换班）' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Download className="h-5 w-5 text-amber-500" />
            数据导出
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={exportType} onValueChange={setExportType} className="space-y-3">
            {exportOptions.map(opt => (
              <Label key={opt.value} className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                exportType === opt.value ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:border-stone-300'
              }`}>
                <RadioGroupItem value={opt.value} className="mt-0.5" />
                <div>
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-sm text-muted-foreground">{opt.desc}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
          <Button
            className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileJson className="mr-2 h-4 w-4" />}
            导出 JSON 文件
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
