import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const defaultUsers = [
  { username: 'admin', password: 'admin123', name: '管理员', role: 'admin' },
  { username: 'mamatjan', password: 'm123', name: '麦麦提江', role: 'employee' },
  { username: 'aishanjan', password: 'a123', name: '艾萨江', role: 'employee' },
]

const defaultProducts = [
  // 饮料类（22种）
  { name: '青瓜味饮料1升', price: 7, costPrice: 3.5, stock: 50, category: '饮料', icon: '🥒' },
  { name: '老汉瓜味饮料1升', price: 7, costPrice: 3.5, stock: 50, category: '饮料', icon: '🍈' },
  { name: '东方树叶1升', price: 7, costPrice: 3.5, stock: 50, category: '饮料', icon: '🍃' },
  { name: '黑卡', price: 6, costPrice: 3, stock: 50, category: '饮料', icon: '⚫' },
  { name: '红牛', price: 6, costPrice: 3, stock: 50, category: '饮料', icon: '🐂' },
  { name: '咖啡', price: 6, costPrice: 3, stock: 50, category: '饮料', icon: '☕' },
  { name: '茉莉蜜茶1升', price: 5, costPrice: 2.5, stock: 50, category: '饮料', icon: '🍵' },
  { name: '绿茶1升', price: 5, costPrice: 2.5, stock: 50, category: '饮料', icon: '🍵' },
  { name: '红茶1升', price: 5, costPrice: 2.5, stock: 50, category: '饮料', icon: '🍵' },
  { name: '奶皮', price: 5, costPrice: 2.5, stock: 50, category: '饮料', icon: '🥛' },
  { name: '激活', price: 4, costPrice: 2, stock: 50, category: '饮料', icon: '💧' },
  { name: '奶茶', price: 4, costPrice: 2, stock: 50, category: '饮料', icon: '🥤' },
  { name: '百岁山', price: 4, costPrice: 2, stock: 50, category: '饮料', icon: '💧' },
  { name: '鲜橙多', price: 4, costPrice: 2, stock: 50, category: '饮料', icon: '🍊' },
  { name: '可乐', price: 4, costPrice: 2, stock: 50, category: '饮料', icon: '🥤' },
  { name: '红茶', price: 3, costPrice: 1.5, stock: 50, category: '饮料', icon: '🍵' },
  { name: '绿茶', price: 3, costPrice: 1.5, stock: 50, category: '饮料', icon: '🍵' },
  { name: '黑加仑', price: 3, costPrice: 1.5, stock: 50, category: '饮料', icon: '🍇' },
  { name: '茉莉蜜茶', price: 3, costPrice: 1.5, stock: 50, category: '饮料', icon: '🍵' },
  { name: '健力宝', price: 3, costPrice: 1.5, stock: 50, category: '饮料', icon: '🥤' },
  { name: '农夫山泉', price: 2, costPrice: 1, stock: 50, category: '饮料', icon: '💧' },
  { name: '娃哈哈', price: 2, costPrice: 1, stock: 50, category: '饮料', icon: '💧' },
  // 食品类（9种）
  { name: '包面', price: 6, costPrice: 3, stock: 50, category: '食品', icon: '🍜' },
  { name: '鸡腿', price: 2, costPrice: 1, stock: 50, category: '食品', icon: '🍗' },
  { name: '火腿肠', price: 1.5, costPrice: 0.75, stock: 50, category: '食品', icon: '🌭' },
  { name: '可可派', price: 1.5, costPrice: 0.75, stock: 50, category: '食品', icon: '🍫' },
  { name: '卤鸡蛋', price: 1.5, costPrice: 0.75, stock: 50, category: '食品', icon: '🥚' },
  { name: '卷豆腐', price: 1.5, costPrice: 0.75, stock: 50, category: '食品', icon: '🧈' },
  { name: '豆腐干', price: 1.5, costPrice: 0.75, stock: 50, category: '食品', icon: '🧈' },
  { name: '碎翠虾', price: 1.5, costPrice: 0.75, stock: 50, category: '食品', icon: '🦐' },
  { name: '馕伴', price: 1, costPrice: 0.5, stock: 50, category: '食品', icon: '🍞' },
]

export async function POST() {
  try {
    // Seed users with upsert
    for (const user of defaultUsers) {
      await db.user.upsert({
        where: { username: user.username },
        update: {
          password: user.password,
          name: user.name,
          role: user.role,
          active: true,
        },
        create: {
          username: user.username,
          password: user.password,
          name: user.name,
          role: user.role,
        },
      })
    }

    // Delete old products that are not in the new list
    const newNames = defaultProducts.map(p => p.name)
    const existingProducts = await db.product.findMany()
    for (const ep of existingProducts) {
      if (!newNames.includes(ep.name)) {
        await db.product.delete({ where: { id: ep.id } })
      }
    }

    // Seed products
    for (const product of defaultProducts) {
      const existing = await db.product.findFirst({
        where: { name: product.name },
      })

      if (existing) {
        await db.product.update({
          where: { id: existing.id },
          data: {
            price: product.price,
            costPrice: product.costPrice,
            stock: product.stock,
            category: product.category,
            active: true,
          },
        })
      } else {
        await db.product.create({
          data: {
            name: product.name,
            price: product.price,
            costPrice: product.costPrice,
            stock: product.stock,
            category: product.category,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `初始化完成：${defaultUsers.length} 个用户，${defaultProducts.length} 个商品`,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: '初始化数据失败' },
      { status: 500 }
    )
  }
}
