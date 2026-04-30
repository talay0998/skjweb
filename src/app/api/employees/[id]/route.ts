import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: '员工不存在' },
        { status: 404 }
      )
    }

    // Soft delete - set active to false
    await db.user.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete employee error:', error)
    return NextResponse.json(
      { error: '删除员工失败' },
      { status: 500 }
    )
  }
}
