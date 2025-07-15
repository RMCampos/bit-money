import { pool } from '../config/database';
import { CreateCreditCardData, CreditCard, UpdateCreditCardData } from '../types';

/**
 * CreditCardModel handles database operations related to credit cards.
 * It provides methods to create, find, update, and delete credit cards.
 */
export class CreditCardModel {
  /**
   * Creates a new credit card in the database.
   *
   * @param userId - The ID of the user creating the credit card.
   * @param creditCardData - The data for the new credit card.
   * @returns The created CreditCard object.
   */
  static async create(userId: number, creditCardData: CreateCreditCardData): Promise<CreditCard> {
    const query = `
      INSERT INTO credit_cards (user_id, name, current_value, limit_value, due_date, closing_date, paid, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, user_id, name, current_value, limit_value, due_date, closing_date, paid, created_at, updated_at
    `;
    
    const values = [
      userId,
      creditCardData.name,
      creditCardData.currentValue || 0.00,
      creditCardData.limitValue,
      creditCardData.dueDate,
      creditCardData.closingDate,
      creditCardData.paid || false
    ];
    
    const result = await pool.query(query, values);
    return this.mapRowToCreditCard(result.rows[0]);
  }

  /**
   * Finds a credit card by its ID and user ID.
   *
   * @param id - The ID of the credit card to find.
   * @param userId - The ID of the user who owns the credit card.
   * @returns The CreditCard object or null if not found.
   */
  static async findById(id: number, userId: number): Promise<CreditCard | null> {
    const query = `
      SELECT id, user_id, name, current_value, limit_value, due_date, closing_date, paid, created_at, updated_at
      FROM credit_cards WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] ? this.mapRowToCreditCard(result.rows[0]) : null;
  }

  /**
   * Finds all credit cards for a specific user.
   *
   * @param userId - The ID of the user whose credit cards to find.
   * @param limit - The maximum number of credit cards to return.
   * @param offset - The offset for pagination.
   * @returns An array of CreditCard objects.
   */
  static async findByUserId(userId: number, limit: number = 20, offset: number = 0): Promise<CreditCard[]> {
    const query = `
      SELECT id, user_id, name, current_value, limit_value, due_date, closing_date, paid, created_at, updated_at
      FROM credit_cards WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows.map(row => this.mapRowToCreditCard(row));
  }

  /**
   * Updates a credit card's information.
   *
   * @param id - The ID of the credit card to update.
   * @param userId - The ID of the user who owns the credit card.
   * @param updates - The updates to apply to the credit card.
   * @returns The updated CreditCard object or null if not found.
   */
  static async update(id: number, userId: number, updates: UpdateCreditCardData): Promise<CreditCard | null> {
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }

    if (updates.currentValue !== undefined) {
      updateFields.push(`current_value = $${paramIndex++}`);
      values.push(updates.currentValue);
    }

    if (updates.limitValue !== undefined) {
      updateFields.push(`limit_value = $${paramIndex++}`);
      values.push(updates.limitValue);
    }

    if (updates.dueDate !== undefined) {
      updateFields.push(`due_date = $${paramIndex++}`);
      values.push(updates.dueDate);
    }

    if (updates.closingDate !== undefined) {
      updateFields.push(`closing_date = $${paramIndex++}`);
      values.push(updates.closingDate);
    }

    if (updates.paid !== undefined) {
      updateFields.push(`paid = $${paramIndex++}`);
      values.push(updates.paid);
    }

    if (updateFields.length === 0) {
      return this.findById(id, userId);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    const query = `
      UPDATE credit_cards
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
      RETURNING id, user_id, name, current_value, limit_value, due_date, closing_date, paid, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] ? this.mapRowToCreditCard(result.rows[0]) : null;
  }

  /**
   * Deletes a credit card.
   *
   * @param id - The ID of the credit card to delete.
   * @param userId - The ID of the user who owns the credit card.
   * @returns True if the credit card was deleted, false otherwise.
   */
  static async delete(id: number, userId: number): Promise<boolean> {
    // First check if the credit card has any transactions
    const transactionCheck = `
      SELECT COUNT(*) as count FROM transactions 
      WHERE account_id = $1 OR transfer_account_id = $1
    `;
    const transactionResult = await pool.query(transactionCheck, [id]);
    
    if (parseInt(transactionResult.rows[0].count) > 0) {
      throw new Error('Cannot delete credit card with existing transactions');
    }

    const query = `DELETE FROM credit_cards WHERE id = $1 AND user_id = $2`;
    const result = await pool.query(query, [id, userId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Gets the total debt across all credit cards for a user.
   *
   * @param userId - The ID of the user.
   * @returns The total debt as a number.
   */
  static async getTotalDebt(userId: number): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(current_value), 0) as total_debt
      FROM credit_cards WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return parseFloat(result.rows[0].total_debt) || 0;
  }

  /**
   * Gets the total available credit across all credit cards for a user.
   *
   * @param userId - The ID of the user.
   * @returns The total available credit as a number.
   */
  static async getTotalAvailableCredit(userId: number): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(limit_value - current_value), 0) as total_available
      FROM credit_cards WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return parseFloat(result.rows[0].total_available) || 0;
  }

  /**
   * Updates a credit card's balance by adding/subtracting an amount.
   *
   * @param id - The ID of the credit card to update.
   * @param userId - The ID of the user who owns the credit card.
   * @param amount - The amount to add (positive) or subtract (negative).
   * @returns The updated CreditCard object or null if not found.
   */
  static async updateBalance(id: number, userId: number, amount: number): Promise<CreditCard | null> {
    const query = `
      UPDATE credit_cards
      SET current_value = current_value + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING id, user_id, name, current_value, limit_value, due_date, closing_date, paid, created_at, updated_at
    `;

    const result = await pool.query(query, [amount, id, userId]);
    return result.rows[0] ? this.mapRowToCreditCard(result.rows[0]) : null;
  }

  /**
   * Gets credit cards that are due soon (within specified days).
   *
   * @param userId - The ID of the user.
   * @param daysAhead - Number of days to look ahead for due dates.
   * @returns An array of CreditCard objects that are due soon.
   */
  static async getDueSoon(userId: number, daysAhead: number = 7): Promise<CreditCard[]> {
    const query = `
      SELECT id, user_id, name, current_value, limit_value, due_date, closing_date, paid, created_at, updated_at
      FROM credit_cards 
      WHERE user_id = $1 AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${daysAhead} days'
      AND paid = false
      ORDER BY due_date ASC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => this.mapRowToCreditCard(row));
  }

  /**
   * Gets credit cards that are overdue (past due date and not paid).
   *
   * @param userId - The ID of the user.
   * @returns An array of CreditCard objects that are overdue.
   */
  static async getOverdue(userId: number): Promise<CreditCard[]> {
    const query = `
      SELECT id, user_id, name, current_value, limit_value, due_date, closing_date, paid, created_at, updated_at
      FROM credit_cards 
      WHERE user_id = $1 AND due_date < CURRENT_DATE AND paid = false
      ORDER BY due_date ASC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => this.mapRowToCreditCard(row));
  }

  /**
   * Gets credit utilization summary for a user.
   *
   * @param userId - The ID of the user.
   * @returns An object containing utilization statistics.
   */
  static async getUtilizationSummary(userId: number): Promise<{
    totalDebt: number;
    totalLimit: number;
    totalAvailable: number;
    utilizationPercentage: number;
  }> {
    const query = `
      SELECT 
        COALESCE(SUM(current_value), 0) as total_debt,
        COALESCE(SUM(limit_value), 0) as total_limit,
        COALESCE(SUM(limit_value - current_value), 0) as total_available
      FROM credit_cards WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    const row = result.rows[0];
    
    const totalDebt = parseFloat(row.total_debt) || 0;
    const totalLimit = parseFloat(row.total_limit) || 0;
    const totalAvailable = parseFloat(row.total_available) || 0;
    const utilizationPercentage = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;
    
    return {
      totalDebt,
      totalLimit,
      totalAvailable,
      utilizationPercentage
    };
  }

  /**
   * Maps a database row to a CreditCard object.
   *
   * @param row - The database row to map.
   * @returns The CreditCard object.
   */
  private static mapRowToCreditCard(row: any): CreditCard {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      currentValue: parseFloat(row.current_value),
      limitValue: parseFloat(row.limit_value),
      dueDate: row.due_date,
      closingDate: row.closing_date,
      paid: row.paid,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
