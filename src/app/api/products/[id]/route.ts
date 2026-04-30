import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, price, costPrice, stock, category, active } = body

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: '商品不存在' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (price !== undefined) updateData.price = Number(price)
    if (costPrice !== undefined) updateData.costPrice = Number(costPrice)
    if (stock !== undefined) updateData.stock = Number(stock)
    if (category !== undefined) updateData.category = category
    if (active !== undefined) updateData.active = active

    const product = await db.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: '更新商品失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: '商品不存在' },
        { status: 404 }
      )
    }

    // Soft delete
    await db.product.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: '删除商品失败' },
      { status: 500 }
    )
  }
}
