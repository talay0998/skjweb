import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeVoided = searchParams.get('includeVoided') === 'true'

    const where: Record<string, unknown> = {}

    if (!includeVoided) {
      where.voided = false
    }

    if (date) {
      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999)
      where.createdAt = { gte: dayStart.toISOString(), lte: dayEnd.toISOString() }
    } else if (startDate && endDate) {
      const start = new Date(startDate); start.setHours(0, 0, 0, 0)
      const end = new Date(endDate); end.setHours(23, 59, 59, 999)
      where.createdAt = { gte: start.toISOString(), lte: end.toISOString() }
    }

    const sales = await db.sale.findMany({
      where,
      include: {
        operator: { select: { id: true, username: true, name: true, role: true } },
        items: { include: { product: { select: { id: true, name: true, category: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ sales })
  } catch (error) {
    console.error('Get sales error:', error)
    return NextResponse.json({ error: '获取销售记录失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operatorId, paymentMethod, items, note } = body

    if (!operatorId || !paymentMethod || !items || items.length === 0) {
      return NextResponse.json({ error: '请填写完整的销售信息' }, { status: 400 })
    }

    const validMethods = ['cash', 'wechat', 'alipay', 'other']
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: '无效的支付方式' }, { status: 400 })
    }

    const operator = await db.user.findUnique({ where: { id: operatorId } })
    if (!operator || !operator.active) {
      return NextResponse.json({ error: '操作员不存在或已被禁用' }, { status: 400 })
    }

    for (const item of items) {
      const product = await db.product.findUnique({ where: { id: item.productId } })
      if (!product) {
        return NextResponse.json({ error: `商品不存在: ${item.productId}` }, { status: 400 })
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `商品 "${product.name}" 库存不足，当前库存: ${product.stock}` }, { status: 400 })
      }
    }

    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; price: number }) => sum + item.quantity * item.price, 0
    )

    const sale = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const newSale = await tx.sale.create({
        data: {
          operatorId,
          totalAmount,
          paymentMethod,
          note: note || null,
          items: {
            create: items.map((item: { productId: string; quantity: number; price: number; costPrice: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              costPrice: item.costPrice,
            })),
          },
        },
        include: {
          operator: { select: { id: true, username: true, name: true, role: true } },
          items: { include: { product: { select: { id: true, name: true, category: true } } } },
        },
      })

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      return newSale
    })

    // Log operation
    await db.operationLog.create({
      data: {
        userId: operatorId,
        action: 'sale',
        detail: JSON.stringify({
          saleId: sale.id,
          totalAmount,
          paymentMethod,
          items: items.map((i: { productId: string; quantity: number; price: number }) => ({ productId: i.productId, qty: i.quantity, price: i.price })),
          note: note || null,
        }),
      },
    })

    return NextResponse.json({ sale }, { status: 201 })
  } catch (error) {
    console.error('Create sale error:', error)
    return NextResponse.json({ error: '创建销售记录失败' }, { status: 500 })
  }
}
