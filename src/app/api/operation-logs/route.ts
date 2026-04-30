import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (action) where.action = action
    if (startDate || endDate) {
      const created: Record<string, string> = {}
      if (startDate) {
        const s = new Date(startDate); s.setHours(0,0,0,0); created.gte = s.toISOString()
      }
      if (endDate) {
        const e = new Date(endDate); e.setHours(23,59,59,999); created.lte = e.toISOString()
      }
      where.createdAt = created
    }

    const logs = await db.operationLog.findMany({
      where,
      include: { user: { select: { id: true, username: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Get operation logs error:', error)
    return NextResponse.json({ error: '获取操作日志失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, detail } = body
    if (!userId || !action) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }
    const log = await db.operationLog.create({
      data: { userId, action, detail: detail || '' },
      include: { user: { select: { id: true, username: true, name: true, role: true } } },
    })
    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    console.error('Create operation log error:', error)
    return NextResponse.json({ error: '记录操作日志失败' }, { status: 500 })
  }
}
