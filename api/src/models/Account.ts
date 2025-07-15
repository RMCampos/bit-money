import { pool } from '../config/database';
import { Account, CreateAccountData } from '../types';

export class AccountModel {
  static async createAccount(userId: number, accountData: CreateAccountData): Promise<Account> {
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

  static async findById(accountId: number): Promise<Account | null> {
    const query = `
      SELECT id, user_id, name, current_value, created_at, updated_at
      FROM accounts WHERE id = $1
    `;
    const result = await pool.query(query, [accountId]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToAccount(result.rows[0]);
  }

  /**
   * Retrieves accounts associated with a user.
   *
   * @param userId - The ID of the user whose accounts are to be retrieved.
   * @returns An array of account objects associated with the user.
   */
  static async findByUserId(userId: number, limit: number = 20, offset: number = 0): Promise<Account[]> {
    const query = `
      SELECT id, user_id, name, current_value, created_at, updated_at
      FROM accounts WHERE user_id = $1
      LIMIT $2 OFFSET $3
    `;
    const values = [userId, limit, offset];
    const result = await pool.query(query, values);
    return result.rows.map(this.mapRowToAccount);
  }

  static async update(accountId: number, userId: number, updates: Partial<CreateAccountData>): Promise<Account | null> {
    const { name, currentValue } = updates;
    const query = `
      UPDATE accounts
      SET name = COALESCE($1, name),
          current_value = COALESCE($2, current_value),
          updated_at = NOW()
      WHERE id = $3 AND user_id = $4
      RETURNING id, user_id, name, current_value, created_at, updated_at
    `;

    const values = [name, currentValue, accountId, userId];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToAccount(result.rows[0]);
  }

  static async delete(accountId: number, userId: number): Promise<boolean> {
    const query = `
      DELETE FROM accounts WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [accountId, userId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

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