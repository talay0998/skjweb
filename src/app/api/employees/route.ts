import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const employees = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ employees })
  } catch (error) {
    console.error('Get employees error:', error)
    return NextResponse.json(
      { error: '获取员工列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, name, role } = body

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: '请填写完整的员工信息' },
        { status: 400 }
      )
    }

    // Check username uniqueness
    const existing = await db.user.findUnique({
      where: { username },
    })

    if (existing) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 409 }
      )
    }

    // Validate role
    const validRole = role === 'admin' ? 'admin' : 'employee'

    const employee = await db.user.create({
      data: {
        username,
        password,
        name,
        role: validRole,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ employee }, { status: 201 })
  } catch (error) {
    console.error('Create employee error:', error)
    return NextResponse.json(
      { error: '创建员工失败' },
      { status: 500 }
    )
  }
}
