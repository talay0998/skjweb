'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Plus,
  Minus,
  Loader2,
  Package,
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

// Product icon mapping
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

const CATEGORIES = ['全部', '饮料', '食品']

const PAYMENT_LABELS: Record<string, string> = {
  cash: '现金', wechat: '微信', alipay: '支付宝', other: '其他',
}

const PAYMENT_ICONS: Record<string, string> = {
  cash: '💵', wechat: '💚', alipay: '💙', other: '🔄',
}

export default function SalesPanel() {
  const { user } = useAppStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wechat' | 'alipay' | 'other'>('cash')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch {
      toast.error('获取商品列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const filteredProducts = products
    .filter((p) => p.active)
    .filter((p) => category === '全部' || p.category === category)
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setPaymentMethod('cash')
    setNote('')
    setDialogOpen(true)
  }

  const handleSubmitSale = async () => {
    if (!selectedProduct || !user) return
    if (quantity > selectedProduct.stock) {
      toast.error('库存不足')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: user.id,
          paymentMethod,
          items: [{
            productId: selectedProduct.id,
            quantity,
            price: selectedProduct.price,
            costPrice: selectedProduct.costPrice,
          }],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '销售失败')
      }

      const total = selectedProduct.price * quantity
      toast.success(`销售成功！${selectedProduct.name} × ${quantity}，合计 ¥${total.toFixed(2)}`)
      setDialogOpen(false)
      fetchProducts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '销售失败')
    } finally {
      setSubmitting(false)
    }
  }

  const getIcon = (name: string) => PRODUCT_ICONS[name] || '📦'

  return (
    <div className="flex flex-col h-full">
      {/* Search & Filter */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索商品..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat)}
              className={category === cat ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'text-xs'}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">暂无商品</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pr-1 pb-2">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-amber-400 group border border-stone-200"
                onClick={() => handleProductClick(product)}
              >
                <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                  <span className="text-3xl leading-none">{getIcon(product.name)}</span>
                  <span className="font-medium text-sm leading-tight line-clamp-1 w-full">{product.name}</span>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-amber-600 font-bold text-base">¥{product.price.toFixed(2)}</span>
                    {product.stock < 10 && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0">库存{product.stock}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Sale Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProduct && <span className="text-2xl">{getIcon(selectedProduct.name)}</span>}
              确认销售
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-5">
              {/* Product Info */}
              <div className="rounded-lg bg-stone-50 p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-base">{selectedProduct.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">单价：<span className="text-amber-600 font-medium">¥{selectedProduct.price.toFixed(2)}</span></p>
                  </div>
                  <Badge variant={selectedProduct.stock < 10 ? 'destructive' : 'secondary'}>
                    库存 {selectedProduct.stock}
                  </Badge>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">购买数量</Label>
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
                    max={selectedProduct.stock}
                    value={quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 1
                      setQuantity(Math.min(Math.max(1, v), selectedProduct.stock))
                    }}
                    className="w-20 text-center h-9"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => setQuantity(Math.min(quantity + 1, selectedProduct.stock))}
                    disabled={quantity >= selectedProduct.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">支付方式</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as 'cash' | 'wechat' | 'alipay' | 'other')}
                  className="grid grid-cols-4 gap-2"
                >
                  {(['cash', 'wechat', 'alipay', 'other'] as const).map((method) => (
                    <Label
                      key={method}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-2.5 cursor-pointer transition-all ${
                        paymentMethod === method
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <RadioGroupItem value={method} className="sr-only" />
                      <span className="text-lg mb-0.5">{PAYMENT_ICONS[method]}</span>
                      <span className="text-xs font-medium">{PAYMENT_LABELS[method]}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">备注</Label>
                <Textarea
                  placeholder="可选备注信息"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedProduct.name} × {quantity}
                </span>
                <span className="text-2xl font-bold text-amber-600">
                  ¥{(selectedProduct.price * quantity).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white min-w-[120px]"
              onClick={handleSubmitSale}
              disabled={submitting || !selectedProduct}
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />提交中...</>
              ) : (
                '确认销售'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
