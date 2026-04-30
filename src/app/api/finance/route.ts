import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}

    if (date) {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      where.createdAt = {
        gte: dayStart.toISOString(),
        lte: dayEnd.toISOString(),
      }
    } else if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.createdAt = {
        gte: start.toISOString(),
        lte: end.toISOString(),
      }
    }

    // Get all sales in the date range with items
    const sales = await db.sale.findMany({
      where,
      include: {
        items: true,
      },
    })

    // Calculate totals
    let totalRevenue = 0
    let totalCost = 0
    let cashTotal = 0
    let wechatTotal = 0
    let alipayTotal = 0
    let otherTotal = 0

    for (const sale of sales) {
      totalRevenue += sale.totalAmount

      // Calculate cost from items
      const saleCost = sale.items.reduce(
        (sum, item) => sum + item.costPrice * item.quantity,
        0
      )
      totalCost += saleCost

      // Payment method breakdown
      switch (sale.paymentMethod) {
        case 'cash':
          cashTotal += sale.totalAmount
          break
        case 'wechat':
          wechatTotal += sale.totalAmount
          break
        case 'alipay':
          alipayTotal += sale.totalAmount
          break
        case 'other':
          otherTotal += sale.totalAmount
          break
      }
    }

    const profit = totalRevenue - totalCost

    // Round to 2 decimal places
    const round2 = (n: number) => Math.round(n * 100) / 100

    const finance = {
      totalRevenue: round2(totalRevenue),
      totalCost: round2(totalCost),
      profit: round2(profit),
      cashTotal: round2(cashTotal),
      wechatTotal: round2(wechatTotal),
      alipayTotal: round2(alipayTotal),
      otherTotal: round2(otherTotal),
      salesCount: sales.length,
    }

    return NextResponse.json({ finance })
  } catch (error) {
    console.error('Get finance error:', error)
    return NextResponse.json(
      { error: '获取财务统计失败' },
      { status: 500 }
    )
  }
}
