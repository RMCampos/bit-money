import { addAbortSignal } from 'stream';
import { pool } from '../config/database';
import { CreateCreditCardData, CreditCard } from '../types';

export class CreditCardModel {
  static async create(userId: number, cardData: CreateCreditCardData): Promise<any> {
    const { name, currentValue = 0, limitValue, dueDate, closingDate, paid = false } = cardData;
    const query = `
      INSERT INTO credit_cards (user_id, name, current_value, limit_value, due_date, closing_date, paid, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, user_id, name, current_value, limit_value, due_date, closing_date, paid, created_at, updated_at
    `;

    const values = [userId, name, currentValue, limitValue, dueDate, closingDate, paid];
    const result = await pool.query(query, values);
    return this.mapRowToCreditCard(result.rows[0]);
  }

  static async findById(cardId: number): Promise<any | null> {
    const query = `
      SELECT id, user_id, name, current_value, limit_value, due_date, closing_date, paid, created_at, updated_at
      FROM credit_cards WHERE id = $1
    `;
    const result = await pool.query(query, [cardId]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToCreditCard(result.rows[0]);
  }

  static async findByUserId(userId: number, limit: number = 20, offset: number = 0): Promise<CreditCard[]> {
    const query = `
      SELECT id, user_id, name, current_value, limit_value, due_date, closing_date, paid, created_at, updated_at
      FROM credit_cards WHERE user_id = $1
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows.map(this.mapRowToCreditCard);
  }

  static async update(cardId: number, userId: number, cardData: Partial<CreateCreditCardData>): Promise<CreditCard | null> {
    const { name, currentValue, limitValue, dueDate, closingDate, paid } = cardData;
    const query = `
      UPDATE credit_cards
      SET name = COALESCE($1, name),
          current_value = COALESCE($2, current_value),
          limit_value = COALESCE($3, limit_value),
          due_date = COALESCE($4, due_date),
          closing_date = COALESCE($5, closing_date),
          paid = COALESCE($6, paid),
          updated_at = NOW()
      WHERE id = $7 AND user_id = $8
      RETURNING id, user_id, name, current_value, limit_value, due_date, closing_date, paid, created_at, updated_at
    `;
    const values = [name, currentValue, limitValue, dueDate, closingDate, paid, cardId, userId];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToCreditCard(result.rows[0]);
  }

  static async delete(cardId: number, userId: number): Promise<void> {
    const query = 'DELETE FROM credit_cards WHERE id = $1 AND user_id = $2';
    await pool.query(query, [cardId, userId]);
  }

  private static mapRowToCreditCard(row: any): CreditCard {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      currentValue: row.current_value,
      limitValue: row.limit_value,
      dueDate: row.due_date,
      closingDate: row.closing_date,
      paid: row.paid,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

