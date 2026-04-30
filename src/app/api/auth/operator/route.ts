import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Try to get userId from query param or cookie
    let targetUserId = userId
    if (!targetUserId) {
      targetUserId = request.cookies.get('userId')?.value
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: targetUserId },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    if (!user.active) {
      return NextResponse.json(
        { error: '该账号已被禁用' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Get operator error:', error)
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    )
  }
}
