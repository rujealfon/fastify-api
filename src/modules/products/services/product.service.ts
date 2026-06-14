import { eq } from 'drizzle-orm'
import type { Db } from '../../../db/index.js'
import { products } from '../../../db/schema/index.js'
import { NotFoundError } from '../../../common/errors/NotFoundError.js'
import type { CreateProductBody, UpdateProductBody } from '../schemas/index.js'

function toProduct(row: {
  id: string
  name: string
  price: string
  stock: number
  createdAt: Date
}) {
  return { ...row, createdAt: row.createdAt.toISOString() }
}

export async function findAllProducts(db: Db, page: number, limit: number) {
  const rows = await db.query.products.findMany({
    offset: (page - 1) * limit,
    limit,
  })
  return rows.map(toProduct)
}

export async function findProductById(db: Db, id: string) {
  const row = await db.query.products.findFirst({ where: eq(products.id, id) })
  if (!row) throw new NotFoundError('Product', id)
  return toProduct(row)
}

export async function createProduct(db: Db, body: CreateProductBody) {
  const [row] = await db
    .insert(products)
    .values({ name: body.name, price: String(body.price), stock: body.stock })
    .returning()
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
    .returning()
  return toProduct(row)
}

export async function deleteProduct(db: Db, id: string) {
  await findProductById(db, id)
  await db.delete(products).where(eq(products.id, id))
}
