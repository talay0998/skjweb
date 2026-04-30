import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { voidReason, voidedBy } = body

    if (!voidReason || !voidedBy) {
      return NextResponse.json({ error: '请填写作废原因' }, { status: 400 })
    }

    // Find the sale
    const sale = await db.sale.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!sale) {
      return NextResponse.json({ error: '销售记录不存在' }, { status: 404 })
    }

    if (sale.voided) {
      return NextResponse.json({ error: '该销售已作废' }, { status: 400 })
    }

    // Use transaction to void sale and restore stock
    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Mark sale as voided
      await tx.sale.update({
        where: { id },
        data: {
          voided: true,
          voidReason,
          voidedAt: new Date().toISOString(),
          voidedBy,
        },
      })

      // Restore stock for each item
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    })

    // Log operation
    await db.operationLog.create({
      data: {
        userId: voidedBy,
        action: 'void_sale',
        detail: JSON.stringify({
          saleId: id,
          totalAmount: sale.totalAmount,
          paymentMethod: sale.paymentMethod,
          reason: voidReason,
          items: sale.items.map(i => ({ product: i.productId, qty: i.quantity, price: i.price })),
        }),
      },
    })

    return NextResponse.json({ success: true, message: '销售已作废，库存已恢复' })
  } catch (error) {
    console.error('Void sale error:', error)
    return NextResponse.json({ error: '作废销售失败' }, { status: 500 })
  }
}
