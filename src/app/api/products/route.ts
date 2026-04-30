import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: Record<string, unknown> = { active: true }
    if (category) {
      where.category = category
    }

    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: '获取商品列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, price, costPrice, stock, category } = body

    if (!name || price === undefined || costPrice === undefined) {
      return NextResponse.json(
        { error: '请填写完整的商品信息' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        name,
        price: Number(price),
        costPrice: Number(costPrice),
        stock: stock ? Number(stock) : 0,
        category: category || '默认',
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: '创建商品失败' },
      { status: 500 }
    )
  }
}
