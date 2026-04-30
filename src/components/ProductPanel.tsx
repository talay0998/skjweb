'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package, Plus, Search, Pencil, Trash2, Loader2, ArrowUpDown,
} from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string; name: string; price: number; costPrice: number; stock: number; category: string; active: boolean; createdAt: string
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

const CATEGORIES = ['饮料', '食品']

type SortKey = 'name' | 'price' | 'costPrice' | 'stock' | 'profit'
type SortDir = 'asc' | 'desc'

export default function ProductPanel() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [submitting, setSubmitting] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Add/Edit form
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formCostPrice, setFormCostPrice] = useState('')
  const [formStock, setFormStock] = useState('')
  const [formCategory, setFormCategory] = useState('饮料')

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch { toast.error('获取商品列表失败') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const filteredProducts = products
    .filter((p) => categoryFilter === '全部' || p.category === categoryFilter)
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const getVal = (p: Product) => {
        if (sortKey === 'profit') return p.price - p.costPrice
        return p[sortKey]
      }
      const va = getVal(a), vb = getVal(b)
      if (typeof va === 'string' && typeof vb === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const openAddDialog = () => {
    setEditingProduct(null)
    setFormName(''); setFormPrice(''); setFormCostPrice(''); setFormStock(''); setFormCategory('饮料')
    setDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormName(product.name); setFormPrice(product.price.toString()); setFormCostPrice(product.costPrice.toString())
    setFormStock(product.stock.toString()); setFormCategory(product.category)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formName || !formPrice || !formCostPrice) { toast.warning('请填写完整信息'); return }
    setSubmitting(true)
    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName, price: parseFloat(formPrice), costPrice: parseFloat(formCostPrice),
            stock: parseInt(formStock) || editingProduct.stock, category: formCategory,
          }),
        })
        if (!res.ok) { const data = await res.json(); throw new Error(data.error || '更新失败') }
        toast.success('商品更新成功')
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName, price: parseFloat(formPrice), costPrice: parseFloat(formCostPrice),
            stock: parseInt(formStock) || 0, category: formCategory,
          }),
        })
        if (!res.ok) { const data = await res.json(); throw new Error(data.error || '创建失败') }
        toast.success('商品添加成功')
      }
      setDialogOpen(false)
      fetchProducts()
    } catch (err) { toast.error(err instanceof Error ? err.message : '操作失败') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || '删除失败') }
      toast.success('商品已删除')
      fetchProducts()
    } catch (err) { toast.error(err instanceof Error ? err.message : '删除失败') }
  }

  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active }),
      })
      if (!res.ok) throw new Error('操作失败')
      toast.success(product.active ? '已下架' : '已上架')
      fetchProducts()
    } catch { toast.error('操作失败') }
  }

  const getIcon = (name: string) => PRODUCT_ICONS[name] || '📦'

  // Stats
  const totalProducts = products.filter(p => p.active).length
  const totalValue = products.filter(p => p.active).reduce((s, p) => s + p.costPrice * p.stock, 0)
  const lowStock = products.filter(p => p.active && p.stock < 10).length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">上架商品</p><p className="text-lg font-bold">{totalProducts}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">库存总值</p><p className="text-lg font-bold">¥{totalValue.toFixed(0)}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">低库存</p><p className="text-lg font-bold text-red-600">{lowStock}</p></CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索商品..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="全部">全部</SelectItem>
              {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}>
            {viewMode === 'grid' ? '📋' : '📊'}
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-1" />添加商品
          </Button>
        </div>
      </div>

      {/* Products Display */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : viewMode === 'grid' ? (
        <ScrollArea className="max-h-[500px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pr-1 pb-2">
            {filteredProducts.map((p) => (
              <Card key={p.id} className={`transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-amber-400 border ${!p.active ? 'opacity-50 border-dashed' : p.stock < 10 ? 'border-red-200' : 'border-stone-200'}`}>
                <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                  <span className="text-2xl leading-none">{getIcon(p.name)}</span>
                  <span className="font-medium text-sm leading-tight line-clamp-1 w-full">{p.name}</span>
                  <div className="flex items-center justify-between w-full text-xs">
                    <span className="text-amber-600 font-bold">¥{p.price}</span>
                    <span className={p.stock < 10 ? 'text-red-500 font-bold' : 'text-muted-foreground'}>库存{p.stock}</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditDialog(p)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleToggleActive(p)}>
                      {p.active ? '🔽' : '🔼'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500"><Trash2 className="h-3 w-3" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>确认删除</AlertDialogTitle><AlertDialogDescription>确定要删除 &quot;{p.name}&quot; 吗？</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => handleDelete(p.id)}>删除</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                      名称 <ArrowUpDown className="h-3 w-3 inline" />
                    </TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('costPrice')}>
                      进价 <ArrowUpDown className="h-3 w-3 inline" />
                    </TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('price')}>
                      售价 <ArrowUpDown className="h-3 w-3 inline" />
                    </TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('profit')}>
                      利润 <ArrowUpDown className="h-3 w-3 inline" />
                    </TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('stock')}>
                      库存 <ArrowUpDown className="h-3 w-3 inline" />
                    </TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(p => (
                    <TableRow key={p.id} className={!p.active ? 'opacity-50' : ''}>
                      <TableCell className="text-xl">{getIcon(p.name)}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                      <TableCell className="text-right">¥{p.costPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">¥{p.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">¥{(p.price - p.costPrice).toFixed(2)}</TableCell>
                      <TableCell className="text-right"><span className={p.stock < 10 ? 'text-red-600 font-bold' : ''}>{p.stock}</span></TableCell>
                      <TableCell><Badge variant={p.active ? 'default' : 'secondary'} className="text-xs">{p.active ? '上架' : '下架'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditDialog(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleToggleActive(p)}>{p.active ? '🔽' : '🔼'}</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>确认删除</AlertDialogTitle><AlertDialogDescription>确定要删除 &quot;{p.name}&quot; 吗？</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => handleDelete(p.id)}>删除</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingProduct ? '编辑商品' : '添加商品'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>商品名称</Label><Input placeholder="商品名称" value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>进价</Label><Input type="number" min="0" step="0.01" placeholder="进价" value={formCostPrice} onChange={(e) => setFormCostPrice(e.target.value)} /></div>
              <div className="space-y-2"><Label>售价</Label><Input type="number" min="0" step="0.01" placeholder="售价" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>库存</Label><Input type="number" min="0" placeholder="库存" value={formStock} onChange={(e) => setFormStock(e.target.value)} /></div>
              <div className="space-y-2"><Label>分类</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {formPrice && formCostPrice && (
              <div className="rounded-lg bg-green-50 p-3 text-sm border border-green-200">
                单件利润：¥{(parseFloat(formPrice) - parseFloat(formCostPrice)).toFixed(2)}
                {' | '}利润率：{((parseFloat(formPrice) - parseFloat(formCostPrice)) / parseFloat(formPrice) * 100).toFixed(1)}%
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingProduct ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
