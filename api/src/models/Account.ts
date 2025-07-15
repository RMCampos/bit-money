import { pool } from '../config/database';
import { Account, CreateAccountData, UpdateAccountData } from '../types';

/**
 * AccountModel handles database operations related to accounts.
 * It provides methods to create, find, update, and delete accounts.
 */
export class AccountModel {
  /**
   * Creates a new account in the database.
   *
   * @param userId - The ID of the user creating the account.
   * @param accountData - The data for the new account.
   * @returns The created Account object.
   */
  static async create(userId: number, accountData: CreateAccountData): Promise<Account> {
    const { name, currentValue = 0 } = accountData;
    const query = `
      INSERT INTO accounts (user_id, name, current_value, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, user_id, name, current_value, created_at, updated_at
    `;

    const values = [userId, name, currentValue];
    const result = await pool.query(query, values);
    const row = result.rows[0];
    return this.mapRowToAccount(row);
  }

  /**
   * Finds an account by its ID and user ID.
   *
   * @param id - The ID of the account to find.
   * @param userId - The ID of the user who owns the account.
   * @returns The Account object or null if not found.
   */
  static async findById(id: number, userId: number): Promise<Account | null> {
    const query = `
      SELECT id, user_id, name, current_value, created_at, updated_at
      FROM accounts WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] ? this.mapRowToAccount(result.rows[0]) : null;
  }

  /**
   * Finds all accounts for a specific user.
   *
   * @param userId - The ID of the user whose accounts to find.
   * @param limit - The maximum number of accounts to return.
   * @param offset - The offset for pagination.
   * @returns An array of Account objects.
   */
  static async findByUserId(userId: number, limit: number = 20, offset: number = 0): Promise<Account[]> {
    const query = `
      SELECT id, user_id, name, current_value, created_at, updated_at
      FROM accounts WHERE user_id = $1
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows.map(row => this.mapRowToAccount(row));
  }

  /**
   * Updates an account's information.
   *
   * @param id - The ID of the account to update.
   * @param userId - The ID of the user who owns the account.
   * @param updates - The updates to apply to the account.
   * @returns The updated Account object or null if not found.
   */
  static async update(id: number, userId: number, updates: UpdateAccountData): Promise<Account | null> {
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

    if (updateFields.length === 0) {
      return this.findById(id, userId);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    const query = `
      UPDATE accounts
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
      RETURNING id, user_id, name, current_value, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] ? this.mapRowToAccount(result.rows[0]) : null;
  }

  /**
   * Deletes an account.
   *
   * @param id - The ID of the account to delete.
   * @param userId - The ID of the user who owns the account.
   * @returns True if the account was deleted, false otherwise.
   */
  static async delete(id: number, userId: number): Promise<boolean> {
    const transactionCheck = `
      SELECT COUNT(*) as count FROM transactions 
      WHERE account_id = $1 OR transfer_account_id = $1
    `;
    const transactionResult = await pool.query(transactionCheck, [id]);
    
    if (parseInt(transactionResult.rows[0].count) > 0) {
      throw new Error('Cannot delete account with existing transactions');
    }

    const query = `DELETE FROM accounts WHERE id = $1 AND user_id = $2`;
    const result = await pool.query(query, [id, userId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Gets the total balance across all accounts for a user.
   *
   * @param userId - The ID of the user.
   * @returns The total balance as a number.
   */
  static async getTotalBalance(userId: number): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(current_value), 0) as total_balance
      FROM accounts WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return parseFloat(result.rows[0].total_balance) || 0;
  }

  /**
   * Updates an account's balance by adding/subtracting an amount.
   *
   * @param id - The ID of the account to update.
   * @param userId - The ID of the user who owns the account.
   * @param amount - The amount to add (positive) or subtract (negative).
   * @returns The updated Account object or null if not found.
   */
  static async updateBalance(id: number, userId: number, amount: number): Promise<Account | null> {
    const query = `
      UPDATE accounts
      SET current_value = current_value + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING id, user_id, name, current_value, created_at, updated_at
    `;

    const result = await pool.query(query, [amount, id, userId]);
    return result.rows[0] ? this.mapRowToAccount(result.rows[0]) : null;
  }

  /**
   * Maps a database row to an Account object.
   *
   * @param row - The database row to map.
   * @returns The Account object.
   */
  private static mapRowToAccount(row: any): Account {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      currentValue: row.current_value,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  };
}