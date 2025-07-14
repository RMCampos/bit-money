import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { Account, CreateAccountData, UpdateAccountData } from '../types';
import { AuthRequest } from '../types';

/**
 * Validation rules for creating an account.
 * These rules will be applied to the request body.
 * - Name is required and must be less than 100 characters.
 * - Current value is optional and must be a valid decimal number.
 */
export const createAccountValidation = [
  body('name')
    .notEmpty()
    .withMessage('Account name is required')
    .isLength({ max: 100 })
    .withMessage('Account name must be less than 100 characters'),
  body('currentValue')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Current value must be a valid decimal number with up to 2 decimal places')
];

/**
 * Validation rules for updating an account.
 * These rules will be applied to the request body.
 * - Name is optional and must be less than 100 characters.
 * - Current value is optional and must be a valid decimal number.
 */
export const updateAccountValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Account name must be between 1 and 100 characters'),
  body('currentValue')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Current value must be a valid decimal number with up to 2 decimal places')
];

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
    const query = `
      INSERT INTO accounts (user_id, name, current_value)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, name, current_value, created_at, updated_at
    `;
    
    const values = [userId, accountData.name, accountData.currentValue || 0.00];
    const result = await pool.query(query, values);
    return this.mapRowToAccount(result.rows[0]);
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
      ORDER BY created_at DESC
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
    // First check if the account has any transactions
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
      currentValue: parseFloat(row.current_value),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

/**
 * Handles the creation of a new account.
 * Validates the request body and creates the account if valid.
 *
 * @param {AuthRequest} req - The authenticated request object containing the account data.
 * @param {Response} res - The response object to send the result.
 */
export const createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const accountData: CreateAccountData = {
      name: req.body.name,
      currentValue: req.body.currentValue ? parseFloat(req.body.currentValue) : undefined
    };

    const account = await AccountModel.create(req.user.id, accountData);
    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of all accounts for the authenticated user.
 *
 * @param {AuthRequest} req - The authenticated request object.
 * @param {Response} res - The response object to send the result.
 */
export const getAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const accounts = await AccountModel.findByUserId(req.user.id, limit, offset);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of a specific account.
 *
 * @param {AuthRequest} req - The authenticated request object containing the account ID.
 * @param {Response} res - The response object to send the result.
 */
export const getAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const accountId = parseInt(id);

    if (isNaN(accountId)) {
      res.status(400).json({ error: 'Invalid account ID' });
      return;
    }

    const account = await AccountModel.findById(accountId, req.user.id);
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    res.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the update of an account.
 *
 * @param {AuthRequest} req - The authenticated request object containing the account ID and update data.
 * @param {Response} res - The response object to send the result.
 */
export const updateAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const accountId = parseInt(id);

    if (isNaN(accountId)) {
      res.status(400).json({ error: 'Invalid account ID' });
      return;
    }

    const updates: UpdateAccountData = {};
    if (req.body.name !== undefined) {
      updates.name = req.body.name;
    }
    if (req.body.currentValue !== undefined) {
      updates.currentValue = parseFloat(req.body.currentValue);
    }

    const account = await AccountModel.update(accountId, req.user.id, updates);
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    res.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the deletion of an account.
 *
 * @param {AuthRequest} req - The authenticated request object containing the account ID.
 * @param {Response} res - The response object to send the result.
 */
export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const accountId = parseInt(id);

    if (isNaN(accountId)) {
      res.status(400).json({ error: 'Invalid account ID' });
      return;
    }

    const deleted = await AccountModel.delete(accountId, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting account:', error);
    if (error instanceof Error && error.message.includes('Cannot delete account with existing transactions')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Handles the retrieval of total balance across all accounts for the authenticated user.
 *
 * @param {AuthRequest} req - The authenticated request object.
 * @param {Response} res - The response object to send the result.
 */
export const getTotalBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const totalBalance = await AccountModel.getTotalBalance(req.user.id);
    res.json({ totalBalance });
  } catch (error) {
    console.error('Error fetching total balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles updating an account's balance by adding/subtracting an amount.
 *
 * @param {AuthRequest} req - The authenticated request object containing the account ID and amount.
 * @param {Response} res - The response object to send the result.
 */
export const updateAccountBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const accountId = parseInt(id);
    const amount = parseFloat(req.body.amount);

    if (isNaN(accountId)) {
      res.status(400).json({ error: 'Invalid account ID' });
      return;
    }

    if (isNaN(amount)) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    const account = await AccountModel.updateBalance(accountId, req.user.id, amount);
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    res.json(account);
  } catch (error) {
    console.error('Error updating account balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
