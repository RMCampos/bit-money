import { pool } from '../config/database';
import { Category, CreateCategoryData } from '../types';

export class CategoryModel {
  static async create(userId: number, categoryData: CreateCategoryData): Promise<Category> {
    const { name, accountType, displayAtHome } = categoryData;
    const query = `
      INSERT INTO categories (userId, name, accountType, displayAtHome, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, created_at, updated_at
    `;
    const result = await pool.query(query, [userId, name, accountType, displayAtHome]);
    return this.mapRowToCategory(result.rows[0]);
  }

  static async findById(categoryId: number): Promise<Category | null> {
    const query = `
      SELECT id, name, accountType, displayAtHome, created_at, updated_at
      FROM categories WHERE id = $1
    `;
    const result = await pool.query(query, [categoryId]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToCategory(result.rows[0]);
  }

  static async findByUserId(userId: number, limit: number = 20, offset: number = 0): Promise<Category[]> {
    const query = `
      SELECT id, userId, name, accountType, displayAtHome, created_at, updated_at
      FROM categories WHERE userId = $1
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows.map(this.mapRowToCategory);
  }

  static async update(categoryId: number, categoryData: Partial<CreateCategoryData>): Promise<Category | null> {
    const { name, accountType, displayAtHome } = categoryData;
    const query = `
      UPDATE categories
      SET name = COALESCE($1, name),
          accountType = COALESCE($2, accountType),
          displayAtHome = COALESCE($3, displayAtHome),
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, name, accountType, displayAtHome, created_at, updated_at
    `;
    const result = await pool.query(query, [name, accountType, displayAtHome, categoryId]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToCategory(result.rows[0]);
  }

  static async delete(categoryId: number, userId: number): Promise<void> {
    const query = `
      DELETE FROM categories WHERE id = $1 AND userId = $2
    `;
    await pool.query(query, [categoryId, userId]);
  }

  private static mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      accountType: row.account_type,
      displayAtHome: row.display_at_home,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
