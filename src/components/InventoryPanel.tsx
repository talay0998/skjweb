'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Package,
  Plus,
  Minus,
  AlertTriangle,
  TrendingUp,
  Loader2,
  History,
  Warehouse,
} from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  price: number
  costPrice: number
  stock: number
  category: string
  active: boolean
}

interface InventoryLog {
  id: string
  productId: string
  quantity: number
  costPrice: number
  note: string | null
  createdAt: string
  product: { id: string; name: string; category: string }
  operator: { id: string; name: string }
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

export default function InventoryPanel() {
  const { user } = useAppStore()
  const [products, setProducts] = useState<Product[]>([])
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [costPrice, setCostPrice] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // View toggle
  const [showHistory, setShowHistory] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, logsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/inventory'),
      ])
      const productsData = await productsRes.json()
      const logsData = await logsRes.json()
      setProducts(productsData.products || [])
      setLogs(logsData.logs || [])
    } catch {
      toast.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const activeProducts = products.filter((p) => p.active)
  const totalInventoryValue = activeProducts.reduce((sum, p) => sum + p.costPrice * p.stock, 0)
  const lowStockProducts = activeProducts.filter((p) => p.stock < 10)

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setCostPrice(product.costPrice.toString())
    setNote('')
    setDialogOpen(true)
  }

  const handleStockIn = async () => {
    if (!selectedProduct || !costPrice) {
      toast.warning('请填写进货单价')
      return
    }
    if (!user) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity,
          costPrice: parseFloat(costPrice),
          operatorId: user.id,
          note,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '入库失败')
      }

      toast.success(`入库成功！${selectedProduct.name} +${quantity}`)
      setDialogOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '入库失败')
    } finally {
      setSubmitting(false)
    }
  }

  const getIcon = (name: string) => PRODUCT_ICONS[name] || '📦'

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Warehouse className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">商品总数</p>
              <p className="text-xl font-bold">{activeProducts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">库存总值</p>
              <p className="text-xl font-bold">¥{totalInventoryValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">低库存商品</p>
              <p className="text-xl font-bold">{lowStockProducts.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toggle: Products / History */}
      <div className="flex gap-2">
        <Button
          variant={!showHistory ? 'default' : 'outline'}
          size="sm"
          className={!showHistory ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
          onClick={() => setShowHistory(false)}
        >
          <Package className="h-4 w-4 mr-1" />
          商品列表
        </Button>
        <Button
          variant={showHistory ? 'default' : 'outline'}
          size="sm"
          className={showHistory ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
          onClick={() => setShowHistory(true)}
        >
          <History className="h-4 w-4 mr-1" />
          入库记录
        </Button>
      </div>

      {!showHistory ? (
        /* Product Grid for Stock-in */
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">点击商品进行入库</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-lg" />
                ))}
              </div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pr-1 pb-2">
                  {activeProducts.map((product) => (
                    <Card
                      key={product.id}
                      className={`cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-amber-400 border ${
                        product.stock < 10 ? 'border-red-200 bg-red-50/30' : 'border-stone-200'
                      }`}
                      onClick={() => handleProductClick(product)}
                    >
                      <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                        <span className="text-3xl leading-none">{getIcon(product.name)}</span>
                        <span className="font-medium text-sm leading-tight line-clamp-1 w-full">{product.name}</span>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-stone-500 text-xs">进价 ¥{product.costPrice.toFixed(2)}</span>
                          <Badge variant={product.stock < 10 ? 'destructive' : 'secondary'} className="text-[10px] px-1 py-0">
                            库存 {product.stock}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Inventory History */
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">入库记录</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">暂无入库记录</div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>商品</TableHead>
                      <TableHead className="text-right">数量</TableHead>
                      <TableHead className="text-right">进价</TableHead>
                      <TableHead className="text-right">总价</TableHead>
                      <TableHead>操作员</TableHead>
                      <TableHead>备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">{new Date(log.createdAt).toLocaleString('zh-CN')}</TableCell>
                        <TableCell className="font-medium">{log.product.name}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">+{log.quantity}</TableCell>
                        <TableCell className="text-right">¥{log.costPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">¥{(log.costPrice * log.quantity).toFixed(2)}</TableCell>
                        <TableCell>{log.operator.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.note || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stock-in Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProduct && <span className="text-2xl">{getIcon(selectedProduct.name)}</span>}
              确认入库
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-5">
              <div className="rounded-lg bg-stone-50 p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-base">{selectedProduct.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">当前库存：<span className="font-medium">{selectedProduct.stock}</span></p>
                  </div>
                  <span className="text-3xl">{getIcon(selectedProduct.name)}</span>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">入库数量</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center h-9"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Cost Price */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">进货单价</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Preview */}
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-700">入库总价</span>
                  <span className="text-lg font-bold text-amber-600">
                    ¥{(parseFloat(costPrice || '0') * quantity).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  {selectedProduct.name} × {quantity} = {quantity}件
                </p>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">备注</Label>
                <Textarea
                  placeholder="可选备注"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white min-w-[120px]"
              onClick={handleStockIn}
              disabled={submitting}
            >
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />提交中...</> : '确认入库'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
