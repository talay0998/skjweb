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

    const logs = await db.inventoryLog.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, category: true },
        },
        operator: {
          select: { id: true, username: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Get inventory logs error:', error)
    return NextResponse.json(
      { error: '获取入库记录失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity, costPrice, operatorId, note } = body

    if (!productId || !quantity || costPrice === undefined || !operatorId) {
      return NextResponse.json(
        { error: '请填写完整的入库信息' },
        { status: 400 }
      )
    }

    // Validate product
    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json(
        { error: '商品不存在' },
        { status: 404 }
      )
    }

    // Validate operator
    const operator = await db.user.findUnique({ where: { id: operatorId } })
    if (!operator || !operator.active) {
      return NextResponse.json(
        { error: '操作员不存在或已被禁用' },
        { status: 400 }
      )
    }

    // Create inventory log and update stock in a transaction
    const log = await db.$transaction(async (tx) => {
      // Increment product stock
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: { increment: quantity },
          costPrice: Number(costPrice),
        },
      })

      // Create inventory log
      const newLog = await tx.inventoryLog.create({
        data: {
          productId,
          quantity,
          costPrice: Number(costPrice),
          operatorId,
          note: note || null,
        },
        include: {
          product: {
            select: { id: true, name: true, category: true },
          },
          operator: {
            select: { id: true, username: true, name: true, role: true },
          },
        },
      })

      return newLog
    })

    // Log operation
    await db.operationLog.create({
      data: {
        userId: operatorId,
        action: 'inventory',
        detail: JSON.stringify({ productId, productName: product.name, quantity, costPrice: Number(costPrice), note: note || null }),
      },
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    console.error('Create inventory log error:', error)
    return NextResponse.json(
      { error: '创建入库记录失败' },
      { status: 500 }
    )
  }
}
