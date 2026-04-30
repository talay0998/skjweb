import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    let data: Record<string, unknown> = {}

    if (type === 'sales' || type === 'all') {
      const sales = await db.sale.findMany({
        include: {
          operator: { select: { id: true, username: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, category: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      })
      data.sales = sales
    }

    if (type === 'inventory' || type === 'all') {
      const logs = await db.inventoryLog.findMany({
        include: {
          product: { select: { id: true, name: true, category: true } },
          operator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      data.inventoryLogs = logs
    }

    if (type === 'shifts' || type === 'all') {
      const shifts = await db.shiftLog.findMany({
        include: { operator: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      })
      data.shiftLogs = shifts
    }

    if (type === 'all') {
      const products = await db.product.findMany({ orderBy: { createdAt: 'desc' } })
      data.products = products
      const employees = await db.user.findMany({
        select: { id: true, username: true, name: true, role: true, active: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
      data.employees = employees
    }

    data.exportDate = new Date().toISOString()
    data.type = type

    return NextResponse.json(data)
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: '导出数据失败' }, { status: 500 })
  }
}
