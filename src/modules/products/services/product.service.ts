import type { Db } from '@/db/index.js'
import type { CreateProductBody, UpdateProductBody } from '@/modules/products/schemas/index.js'
import { and, eq, isNull } from 'drizzle-orm'
import { NotFoundError } from '@/common/errors/NotFoundError.js'
import { products } from '@/db/schema/index.js'

const productColumns = {
  id: true,
  name: true,
  price: true,
  stock: true,
  createdAt: true,
  updatedAt: true,
} as const

function toProduct(row: {
  id: string
  name: string
  price: string
  stock: number
  createdAt: Date
  updatedAt: Date
}) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }
}

export async function findAllProducts(db: Db, page: number, limit: number) {
  const rows = await db.query.products.findMany({
    columns: productColumns,
    where: isNull(products.deletedAt),
    offset: (page - 1) * limit,
    limit,
  })
  return rows.map(toProduct)
}

export async function findProductById(db: Db, id: string) {
  const row = await db.query.products.findFirst({
    where: and(eq(products.id, id), isNull(products.deletedAt)),
    columns: productColumns,
  })
  if (!row)
    throw new NotFoundError('Product', id)
  return toProduct(row)
}

export async function createProduct(db: Db, body: CreateProductBody) {
  const [row] = await db
    .insert(products)
    .values({ name: body.name, price: String(body.price), stock: body.stock })
    .returning({ id: products.id, name: products.name, price: products.price, stock: products.stock, createdAt: products.createdAt, updatedAt: products.updatedAt })
  return toProduct(row)
}

export async function updateProduct(db: Db, id: string, body: UpdateProductBody) {
  await findProductById(db, id)
  const [row] = await db
    .update(products)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.price !== undefined && { price: String(body.price) }),
      ...(body.stock !== undefined && { stock: body.stock }),
    })
    .where(eq(products.id, id))
    .returning({ id: products.id, name: products.name, price: products.price, stock: products.stock, createdAt: products.createdAt, updatedAt: products.updatedAt })
  return toProduct(row)
}

export async function deleteProduct(db: Db, id: string) {
  await findProductById(db, id)
  await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, id))
}
