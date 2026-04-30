import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shiftId = searchParams.get('shiftId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}
    if (shiftId) where.shiftId = shiftId
    if (startDate || endDate) {
      const created: Record<string, string> = {}
      if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); created.gte = s.toISOString() }
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); created.lte = e.toISOString() }
      where.createdAt = created
    }

    const expenses = await db.expense.findMany({
      where,
      include: { operator: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error('Get expenses error:', error)
    return NextResponse.json({ error: '获取支出记录失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shiftId, amount, category, note, operatorId } = body

    if (!amount || !category || !note || !operatorId) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }

    const expense = await db.expense.create({
      data: { shiftId: shiftId || null, amount: parseFloat(amount), category, note, operatorId },
      include: { operator: { select: { id: true, name: true } } },
    })

    // Log operation
    await db.operationLog.create({
      data: {
        userId: operatorId,
        action: 'expense',
        detail: JSON.stringify({ amount: parseFloat(amount), category, note }),
      },
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    console.error('Create expense error:', error)
    return NextResponse.json({ error: '创建支出记录失败' }, { status: 500 })
  }
}
