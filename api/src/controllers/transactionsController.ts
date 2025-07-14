import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { Transaction, CreateTransactionData, UpdateTransactionData, TransactionSummary } from '../types';
import { AuthRequest } from '../types';

/**
 * Validation rules for creating a transaction.
 * These rules will be applied to the request body.
 */
export const createTransactionValidation = [
  body('transactionType')
    .notEmpty()
    .withMessage('Transaction type is required')
    .isIn(['E', 'I', 'T'])
    .withMessage('Transaction type must be E (expense), I (income), or T (transfer)'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Amount must be a valid decimal number with up to 2 decimal places')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    }),
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('Transaction date must be a valid date'),
  body('paid')
    .optional()
    .isBoolean()
    .withMessage('Paid must be a boolean value'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comment must be less than 500 characters'),
  body('accountId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Account ID must be a positive integer'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('transferAccountId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Transfer account ID must be a positive integer'),
  // Custom validation for transaction type requirements
  body().custom((body) => {
    const { transactionType, accountId, categoryId, transferAccountId } = body;
    
    if (transactionType === 'T') {
      // Transfer requires transferAccountId and accountId
      if (!accountId || !transferAccountId) {
        throw new Error('Transfer transactions require both accountId and transferAccountId');
      }
      if (accountId === transferAccountId) {
        throw new Error('Transfer cannot be between the same account');
      }
      if (categoryId) {
        throw new Error('Transfer transactions cannot have a category');
      }
    } else if (transactionType === 'E' || transactionType === 'I') {
      // Expense/Income requires accountId and categoryId
      if (!accountId || !categoryId) {
        throw new Error('Expense and income transactions require both accountId and categoryId');
      }
      if (transferAccountId) {
        throw new Error('Expense and income transactions cannot have a transfer account');
      }
    }
    
    return true;
  })
];

/**
 * Validation rules for updating a transaction.
 */
export const updateTransactionValidation = [
  body('transactionType')
    .optional()
    .isIn(['E', 'I', 'T'])
    .withMessage('Transaction type must be E (expense), I (income), or T (transfer)'),
  body('amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Amount must be a valid decimal number with up to 2 decimal places')
    .custom((value) => {
      if (value !== undefined && parseFloat(value) <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    }),
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('Transaction date must be a valid date'),
  body('paid')
    .optional()
    .isBoolean()
    .withMessage('Paid must be a boolean value'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comment must be less than 500 characters'),
  body('accountId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Account ID must be a positive integer'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('transferAccountId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Transfer account ID must be a positive integer')
];

/**
 * TransactionModel handles database operations related to transactions.
 */
export class TransactionModel {
  /**
   * Creates a new transaction in the database.
   */
  static async create(userId: number, transactionData: CreateTransactionData): Promise<Transaction> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validate that accounts and categories belong to the user
      if (transactionData.accountId) {
        const accountCheck = await client.query(
          'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
          [transactionData.accountId, userId]
        );
        if (accountCheck.rows.length === 0) {
          throw new Error('Account not found or does not belong to user');
        }
      }
      
      if (transactionData.transferAccountId) {
        const transferAccountCheck = await client.query(
          'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
          [transactionData.transferAccountId, userId]
        );
        if (transferAccountCheck.rows.length === 0) {
          throw new Error('Transfer account not found or does not belong to user');
        }
      }
      
      if (transactionData.categoryId) {
        const categoryCheck = await client.query(
          'SELECT id, account_type FROM categories WHERE id = $1 AND user_id = $2',
          [transactionData.categoryId, userId]
        );
        if (categoryCheck.rows.length === 0) {
          throw new Error('Category not found or does not belong to user');
        }
        
        // Validate category type matches transaction type
        const categoryType = categoryCheck.rows[0].account_type;
        if (categoryType !== transactionData.transactionType) {
          throw new Error('Category type must match transaction type');
        }
      }
      
      // Create the transaction
      const query = `
        INSERT INTO transactions (
          user_id, transaction_type, amount, transaction_date, paid, comment,
          account_id, category_id, transfer_account_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, user_id, transaction_type, amount, transaction_date, paid, comment,
                  account_id, category_id, transfer_account_id, created_at, updated_at
      `;
      
      const values = [
        userId,
        transactionData.transactionType,
        transactionData.amount,
        transactionData.transactionDate || new Date(),
        transactionData.paid || false,
        transactionData.comment || null,
        transactionData.accountId || null,
        transactionData.categoryId || null,
        transactionData.transferAccountId || null
      ];
      
      const result = await client.query(query, values);
      
      // Update account balances
      if (transactionData.transactionType === 'E') {
        // Expense: subtract from account
        await client.query(
          'UPDATE accounts SET current_value = current_value - $1 WHERE id = $2',
          [transactionData.amount, transactionData.accountId]
        );
      } else if (transactionData.transactionType === 'I') {
        // Income: add to account
        await client.query(
          'UPDATE accounts SET current_value = current_value + $1 WHERE id = $2',
          [transactionData.amount, transactionData.accountId]
        );
      } else if (transactionData.transactionType === 'T') {
        // Transfer: subtract from source, add to destination
        await client.query(
          'UPDATE accounts SET current_value = current_value - $1 WHERE id = $2',
          [transactionData.amount, transactionData.accountId]
        );
        await client.query(
          'UPDATE accounts SET current_value = current_value + $1 WHERE id = $2',
          [transactionData.amount, transactionData.transferAccountId]
        );
      }
      
      await client.query('COMMIT');
      return this.mapRowToTransaction(result.rows[0]);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Finds a transaction by its ID and user ID.
   */
  static async findById(id: number, userId: number): Promise<Transaction | null> {
    const query = `
      SELECT 
        t.id, t.user_id, t.transaction_type, t.amount, t.transaction_date, t.paid, t.comment,
        t.account_id, t.category_id, t.transfer_account_id, t.created_at, t.updated_at,
        a.name as account_name, c.name as category_name, ta.name as transfer_account_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts ta ON t.transfer_account_id = ta.id
      WHERE t.id = $1 AND t.user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] ? this.mapRowToTransactionWithDetails(result.rows[0]) : null;
  }

  /**
   * Finds all transactions for a specific user with filters.
   */
  static async findByUserId(
    userId: number,
    filters: {
      transactionType?: 'E' | 'I' | 'T';
      accountId?: number;
      categoryId?: number;
      paid?: boolean;
      startDate?: Date;
      endDate?: Date;
    } = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    let query = `
      SELECT 
        t.id, t.user_id, t.transaction_type, t.amount, t.transaction_date, t.paid, t.comment,
        t.account_id, t.category_id, t.transfer_account_id, t.created_at, t.updated_at,
        a.name as account_name, c.name as category_name, ta.name as transfer_account_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts ta ON t.transfer_account_id = ta.id
      WHERE t.user_id = $1
    `;
    
    const values: any[] = [userId];
    let paramIndex = 2;

    if (filters.transactionType) {
      query += ` AND t.transaction_type = $${paramIndex++}`;
      values.push(filters.transactionType);
    }

    if (filters.accountId) {
      query += ` AND (t.account_id = $${paramIndex} OR t.transfer_account_id = $${paramIndex})`;
      values.push(filters.accountId);
      paramIndex++;
    }

    if (filters.categoryId) {
      query += ` AND t.category_id = $${paramIndex++}`;
      values.push(filters.categoryId);
    }

    if (filters.paid !== undefined) {
      query += ` AND t.paid = $${paramIndex++}`;
      values.push(filters.paid);
    }

    if (filters.startDate) {
      query += ` AND t.transaction_date >= $${paramIndex++}`;
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND t.transaction_date <= $${paramIndex++}`;
      values.push(filters.endDate);
    }

    query += ` ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    return result.rows.map(row => this.mapRowToTransactionWithDetails(row));
  }

  /**
   * Updates a transaction.
   */
  static async update(id: number, userId: number, updates: UpdateTransactionData): Promise<Transaction | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current transaction
      const currentResult = await client.query(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (currentResult.rows.length === 0) {
        return null;
      }
      
      const currentTransaction = currentResult.rows[0];
      
      // Validate new accounts and categories if provided
      if (updates.accountId) {
        const accountCheck = await client.query(
          'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
          [updates.accountId, userId]
        );
        if (accountCheck.rows.length === 0) {
          throw new Error('Account not found or does not belong to user');
        }
      }
      
      if (updates.transferAccountId) {
        const transferAccountCheck = await client.query(
          'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
          [updates.transferAccountId, userId]
        );
        if (transferAccountCheck.rows.length === 0) {
          throw new Error('Transfer account not found or does not belong to user');
        }
      }
      
      if (updates.categoryId) {
        const categoryCheck = await client.query(
          'SELECT id, account_type FROM categories WHERE id = $1 AND user_id = $2',
          [updates.categoryId, userId]
        );
        if (categoryCheck.rows.length === 0) {
          throw new Error('Category not found or does not belong to user');
        }
        
        const categoryType = categoryCheck.rows[0].account_type;
        const newTransactionType = updates.transactionType || currentTransaction.transaction_type;
        if (categoryType !== newTransactionType) {
          throw new Error('Category type must match transaction type');
        }
      }
      
      // Reverse previous account balance changes
      if (currentTransaction.transaction_type === 'E') {
        await client.query(
          'UPDATE accounts SET current_value = current_value + $1 WHERE id = $2',
          [currentTransaction.amount, currentTransaction.account_id]
        );
      } else if (currentTransaction.transaction_type === 'I') {
        await client.query(
          'UPDATE accounts SET current_value = current_value - $1 WHERE id = $2',
          [currentTransaction.amount, currentTransaction.account_id]
        );
      } else if (currentTransaction.transaction_type === 'T') {
        await client.query(
          'UPDATE accounts SET current_value = current_value + $1 WHERE id = $2',
          [currentTransaction.amount, currentTransaction.account_id]
        );
        await client.query(
          'UPDATE accounts SET current_value = current_value - $1 WHERE id = $2',
          [currentTransaction.amount, currentTransaction.transfer_account_id]
        );
      }
      
      // Build update query
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (updates.transactionType !== undefined) {
        updateFields.push(`transaction_type = $${paramIndex++}`);
        values.push(updates.transactionType);
      }

      if (updates.amount !== undefined) {
        updateFields.push(`amount = $${paramIndex++}`);
        values.push(updates.amount);
      }

      if (updates.transactionDate !== undefined) {
        updateFields.push(`transaction_date = $${paramIndex++}`);
        values.push(updates.transactionDate);
      }

      if (updates.paid !== undefined) {
        updateFields.push(`paid = $${paramIndex++}`);
        values.push(updates.paid);
      }

      if (updates.comment !== undefined) {
        updateFields.push(`comment = $${paramIndex++}`);
        values.push(updates.comment);
      }

      if (updates.accountId !== undefined) {
        updateFields.push(`account_id = $${paramIndex++}`);
        values.push(updates.accountId);
      }

      if (updates.categoryId !== undefined) {
        updateFields.push(`category_id = $${paramIndex++}`);
        values.push(updates.categoryId);
      }

      if (updates.transferAccountId !== undefined) {
        updateFields.push(`transfer_account_id = $${paramIndex++}`);
        values.push(updates.transferAccountId);
      }

      if (updateFields.length === 0) {
        await client.query('ROLLBACK');
        return this.findById(id, userId);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id, userId);

      const query = `
        UPDATE transactions
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
        RETURNING id, user_id, transaction_type, amount, transaction_date, paid, comment,
                  account_id, category_id, transfer_account_id, created_at, updated_at
      `;

      const result = await client.query(query, values);
      const updatedTransaction = result.rows[0];
      
      // Apply new account balance changes
      const newAmount = updatedTransaction.amount;
      const newType = updatedTransaction.transaction_type;
      
      if (newType === 'E') {
        await client.query(
          'UPDATE accounts SET current_value = current_value - $1 WHERE id = $2',
          [newAmount, updatedTransaction.account_id]
        );
      } else if (newType === 'I') {
        await client.query(
          'UPDATE accounts SET current_value = current_value + $1 WHERE id = $2',
          [newAmount, updatedTransaction.account_id]
        );
      } else if (newType === 'T') {
        await client.query(
          'UPDATE accounts SET current_value = current_value - $1 WHERE id = $2',
          [newAmount, updatedTransaction.account_id]
        );
        await client.query(
          'UPDATE accounts SET current_value = current_value + $1 WHERE id = $2',
          [newAmount, updatedTransaction.transfer_account_id]
        );
      }
      
      await client.query('COMMIT');
      return this.mapRowToTransaction(updatedTransaction);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Deletes a transaction.
   */
  static async delete(id: number, userId: number): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get transaction to reverse account balance changes
      const transactionResult = await client.query(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (transactionResult.rows.length === 0) {
        return false;
      }
      
      const transaction = transactionResult.rows[0];
      
      // Reverse account balance changes
      if (transaction.transaction_type === 'E') {
        await client.query(
          'UPDATE accounts SET current_value = current_value + $1 WHERE id = $2',
          [transaction.amount, transaction.account_id]
        );
      } else if (transaction.transaction_type === 'I') {
        await client.query(
          'UPDATE accounts SET current_value = current_value - $1 WHERE id = $2',
          [transaction.amount, transaction.account_id]
        );
      } else if (transaction.transaction_type === 'T') {
        await client.query(
          'UPDATE accounts SET current_value = current_value + $1 WHERE id = $2',
          [transaction.amount, transaction.account_id]
        );
        await client.query(
          'UPDATE accounts SET current_value = current_value - $1 WHERE id = $2',
          [transaction.amount, transaction.transfer_account_id]
        );
      }
      
      // Delete the transaction
      const deleteResult = await client.query(
        'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      await client.query('COMMIT');
      return deleteResult.rowCount ? deleteResult.rowCount > 0 : false;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Gets transaction summary for a user.
   */
  static async getSummary(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<TransactionSummary> {
    let query = `
      SELECT 
        transaction_type,
        SUM(amount) as total_amount,
        COUNT(*) as count
      FROM transactions 
      WHERE user_id = $1
    `;
    
    const values: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND transaction_date >= $${paramIndex++}`;
      values.push(startDate);
    }

    if (endDate) {
      query += ` AND transaction_date <= $${paramIndex++}`;
      values.push(endDate);
    }

    query += ` GROUP BY transaction_type`;
    
    const result = await pool.query(query, values);
    
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransfers = 0;
    let transactionCount = 0;
    
    result.rows.forEach(row => {
      const amount = parseFloat(row.total_amount) || 0;
      const count = parseInt(row.count) || 0;
      
      transactionCount += count;
      
      switch (row.transaction_type) {
        case 'I':
          totalIncome = amount;
          break;
        case 'E':
          totalExpenses = amount;
          break;
        case 'T':
          totalTransfers = amount;
          break;
      }
    });
    
    return {
      totalIncome,
      totalExpenses,
      totalTransfers,
      netAmount: totalIncome - totalExpenses,
      transactionCount
    };
  }

  /**
   * Gets monthly transaction summary.
   */
  static async getMonthlySummary(userId: number, year: number, month: number): Promise<TransactionSummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return this.getSummary(userId, startDate, endDate);
  }

  /**
   * Maps a database row to a Transaction object.
   */
  private static mapRowToTransaction(row: any): Transaction {
    return {
      id: row.id,
      userId: row.user_id,
      transactionType: row.transaction_type,
      amount: parseFloat(row.amount),
      transactionDate: row.transaction_date,
      paid: row.paid,
      comment: row.comment,
      accountId: row.account_id,
      categoryId: row.category_id,
      transferAccountId: row.transfer_account_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Maps a database row to a Transaction object with details.
   */
  private static mapRowToTransactionWithDetails(row: any): Transaction {
    const transaction = this.mapRowToTransaction(row);
    
    if (row.account_name) {
      transaction.account = {
        id: row.account_id,
        name: row.account_name,
        userId: row.user_id,
        currentValue: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    if (row.category_name) {
      transaction.category = {
        id: row.category_id,
        name: row.category_name,
        userId: row.user_id,
        accountType: row.transaction_type as 'E' | 'I',
        displayAtHome: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    if (row.transfer_account_name) {
      transaction.transferAccount = {
        id: row.transfer_account_id,
        name: row.transfer_account_name,
        userId: row.user_id,
        currentValue: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    return transaction;
  }
}

/**
 * Handles the creation of a new transaction.
 */
export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const transactionData: CreateTransactionData = {
      transactionType: req.body.transactionType,
      amount: parseFloat(req.body.amount),
      transactionDate: req.body.transactionDate ? new Date(req.body.transactionDate) : undefined,
      paid: req.body.paid,
      comment: req.body.comment,
      accountId: req.body.accountId,
      categoryId: req.body.categoryId,
      transferAccountId: req.body.transferAccountId
    };

    const transaction = await TransactionModel.create(req.user.id, transactionData);
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Handles the retrieval of all transactions for the authenticated user.
 */
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const filters = {
      transactionType: req.query.transactionType as 'E' | 'I' | 'T' | undefined,
      accountId: req.query.accountId ? parseInt(req.query.accountId as string) : undefined,
      categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
      paid: req.query.paid ? req.query.paid === 'true' : undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const transactions = await TransactionModel.findByUserId(req.user.id, filters, limit, offset);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of a specific transaction.
 */
export const getTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      res.status(400).json({ error: 'Invalid transaction ID' });
      return;
    }

    const transaction = await TransactionModel.findById(transactionId, req.user.id);
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the update of a transaction.
 */
export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      res.status(400).json({ error: 'Invalid transaction ID' });
      return;
    }

    const updates: UpdateTransactionData = {};
    if (req.body.transactionType !== undefined) {
      updates.transactionType = req.body.transactionType;
    }
    if (req.body.amount !== undefined) {
      updates.amount = parseFloat(req.body.amount);
    }
    if (req.body.transactionDate !== undefined) {
      updates.transactionDate = new Date(req.body.transactionDate);
    }
    if (req.body.paid !== undefined) {
      updates.paid = req.body.paid;
    }
    if (req.body.comment !== undefined) {
      updates.comment = req.body.comment;
    }
    if (req.body.accountId !== undefined) {
      updates.accountId = req.body.accountId;
    }
    if (req.body.categoryId !== undefined) {
      updates.categoryId = req.body.categoryId;
    }
    if (req.body.transferAccountId !== undefined) {
      updates.transferAccountId = req.body.transferAccountId;
    }

    const transaction = await TransactionModel.update(transactionId, req.user.id, updates);
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Handles the deletion of a transaction.
 */
export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      res.status(400).json({ error: 'Invalid transaction ID' });
      return;
    }

    const deleted = await TransactionModel.delete(transactionId, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of transaction summary.
 */
export const getTransactionSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const summary = await TransactionModel.getSummary(req.user.id, startDate, endDate);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of monthly transaction summary.
 */
export const getMonthlySummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ error: 'Invalid year or month' });
      return;
    }

    const summary = await TransactionModel.getMonthlySummary(req.user.id, year, month);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
