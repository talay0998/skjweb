import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operatorId = searchParams.get('operatorId')

    const where: Record<string, unknown> = {}
    if (operatorId) where.operatorId = operatorId

    const shifts = await db.shiftLog.findMany({
      where,
      include: {
        operator: { select: { id: true, username: true, name: true, role: true } },
        expenses: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ shifts })
  } catch (error) {
    console.error('Get shifts error:', error)
    return NextResponse.json({ error: '获取交接班记录失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      operatorId, startBalance, endBalance, totalSales,
      totalCash, totalWechat, totalAlipay, totalOther,
      totalExpense, difference, note, expenses,
    } = body

    if (!operatorId || startBalance === undefined || endBalance === undefined) {
      return NextResponse.json({ error: '请填写完整的交接班信息' }, { status: 400 })
    }

    const operator = await db.user.findUnique({ where: { id: operatorId } })
    if (!operator || !operator.active) {
      return NextResponse.json({ error: '操作员不存在或已被禁用' }, { status: 400 })
    }

    const shift = await db.shiftLog.create({
      data: {
        operatorId,
        startBalance: Number(startBalance),
        endBalance: Number(endBalance),
        totalSales: Number(totalSales) || 0,
        totalCash: Number(totalCash) || 0,
        totalWechat: Number(totalWechat) || 0,
        totalAlipay: Number(totalAlipay) || 0,
        totalOther: Number(totalOther) || 0,
        totalExpense: Number(totalExpense) || 0,
        difference: Number(difference) || 0,
        note: note || null,
        expenses: expenses && expenses.length > 0 ? {
          create: expenses.map((e: { amount: number; category: string; note: string }) => ({
            amount: Number(e.amount),
            category: e.category,
            note: e.note,
            operatorId,
          })),
        } : undefined,
      },
      include: {
        operator: { select: { id: true, username: true, name: true, role: true } },
        expenses: true,
      },
    })

    // Log operation
    await db.operationLog.create({
      data: {
        userId: operatorId,
        action: 'shift',
        detail: JSON.stringify({
          shiftId: shift.id, totalSales, totalExpense, difference,
          note: note || null,
          expenseCount: expenses?.length || 0,
        }),
      },
    })

    return NextResponse.json({ shift }, { status: 201 })
  } catch (error) {
    console.error('Create shift log error:', error)
    return NextResponse.json({ error: '创建交接班记录失败' }, { status: 500 })
  }
}
