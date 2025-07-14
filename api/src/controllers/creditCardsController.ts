import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { CreditCard, CreateCreditCardData, UpdateCreditCardData } from '../types';
import { AuthRequest } from '../types';

/**
 * Validation rules for creating a credit card.
 * These rules will be applied to the request body.
 * - Name is required and must be less than 100 characters.
 * - Current value is optional and must be a valid decimal number.
 * - Limit value is required and must be a valid decimal number.
 * - Due date and closing date are required and must be valid dates.
 * - Paid is optional and must be a boolean.
 */
export const createCreditCardValidation = [
  body('name')
    .notEmpty()
    .withMessage('Credit card name is required')
    .isLength({ max: 100 })
    .withMessage('Credit card name must be less than 100 characters'),
  body('currentValue')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Current value must be a valid decimal number with up to 2 decimal places'),
  body('limitValue')
    .notEmpty()
    .withMessage('Limit value is required')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Limit value must be a valid decimal number with up to 2 decimal places'),
  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('closingDate')
    .notEmpty()
    .withMessage('Closing date is required')
    .isISO8601()
    .withMessage('Closing date must be a valid date'),
  body('paid')
    .optional()
    .isBoolean()
    .withMessage('Paid must be a boolean value')
];

/**
 * Validation rules for updating a credit card.
 * These rules will be applied to the request body.
 * - Name is optional and must be less than 100 characters.
 * - Current value is optional and must be a valid decimal number.
 * - Limit value is optional and must be a valid decimal number.
 * - Due date and closing date are optional and must be valid dates.
 * - Paid is optional and must be a boolean.
 */
export const updateCreditCardValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Credit card name must be between 1 and 100 characters'),
  body('currentValue')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Current value must be a valid decimal number with up to 2 decimal places'),
  body('limitValue')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Limit value must be a valid decimal number with up to 2 decimal places'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('closingDate')
    .optional()
    .isISO8601()
    .withMessage('Closing date must be a valid date'),
  body('paid')
    .optional()
    .isBoolean()
    .withMessage('Paid must be a boolean value')
];

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
      INSERT INTO credit_cards (user_id, name, current_value, limit_value, due_date, closing_date, paid)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
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

/**
 * Handles the creation of a new credit card.
 * Validates the request body and creates the credit card if valid.
 *
 * @param {AuthRequest} req - The authenticated request object containing the credit card data.
 * @param {Response} res - The response object to send the result.
 */
export const createCreditCard = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const creditCardData: CreateCreditCardData = {
      name: req.body.name,
      currentValue: req.body.currentValue ? parseFloat(req.body.currentValue) : undefined,
      limitValue: parseFloat(req.body.limitValue),
      dueDate: req.body.dueDate,
      closingDate: req.body.closingDate,
      paid: req.body.paid
    };

    const creditCard = await CreditCardModel.create(req.user.id, creditCardData);
    res.status(201).json(creditCard);
  } catch (error) {
    console.error('Error creating credit card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of all credit cards for the authenticated user.
 *
 * @param {AuthRequest} req - The authenticated request object.
 * @param {Response} res - The response object to send the result.
 */
export const getCreditCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const creditCards = await CreditCardModel.findByUserId(req.user.id, limit, offset);
    res.json(creditCards);
  } catch (error) {
    console.error('Error fetching credit cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of a specific credit card.
 *
 * @param {AuthRequest} req - The authenticated request object containing the credit card ID.
 * @param {Response} res - The response object to send the result.
 */
export const getCreditCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const creditCardId = parseInt(id);

    if (isNaN(creditCardId)) {
      res.status(400).json({ error: 'Invalid credit card ID' });
      return;
    }

    const creditCard = await CreditCardModel.findById(creditCardId, req.user.id);
    if (!creditCard) {
      res.status(404).json({ error: 'Credit card not found' });
      return;
    }

    res.json(creditCard);
  } catch (error) {
    console.error('Error fetching credit card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the update of a credit card.
 *
 * @param {AuthRequest} req - The authenticated request object containing the credit card ID and update data.
 * @param {Response} res - The response object to send the result.
 */
export const updateCreditCard = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const creditCardId = parseInt(id);

    if (isNaN(creditCardId)) {
      res.status(400).json({ error: 'Invalid credit card ID' });
      return;
    }

    const updates: UpdateCreditCardData = {};
    if (req.body.name !== undefined) {
      updates.name = req.body.name;
    }
    if (req.body.currentValue !== undefined) {
      updates.currentValue = parseFloat(req.body.currentValue);
    }
    if (req.body.limitValue !== undefined) {
      updates.limitValue = parseFloat(req.body.limitValue);
    }
    if (req.body.dueDate !== undefined) {
      updates.dueDate = req.body.dueDate;
    }
    if (req.body.closingDate !== undefined) {
      updates.closingDate = req.body.closingDate;
    }
    if (req.body.paid !== undefined) {
      updates.paid = req.body.paid;
    }

    const creditCard = await CreditCardModel.update(creditCardId, req.user.id, updates);
    if (!creditCard) {
      res.status(404).json({ error: 'Credit card not found' });
      return;
    }

    res.json(creditCard);
  } catch (error) {
    console.error('Error updating credit card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the deletion of a credit card.
 *
 * @param {AuthRequest} req - The authenticated request object containing the credit card ID.
 * @param {Response} res - The response object to send the result.
 */
export const deleteCreditCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const creditCardId = parseInt(id);

    if (isNaN(creditCardId)) {
      res.status(400).json({ error: 'Invalid credit card ID' });
      return;
    }

    const deleted = await CreditCardModel.delete(creditCardId, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: 'Credit card not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting credit card:', error);
    if (error instanceof Error && error.message.includes('Cannot delete credit card with existing transactions')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Handles the retrieval of total debt across all credit cards for the authenticated user.
 *
 * @param {AuthRequest} req - The authenticated request object.
 * @param {Response} res - The response object to send the result.
 */
export const getTotalDebt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const totalDebt = await CreditCardModel.getTotalDebt(req.user.id);
    res.json({ totalDebt });
  } catch (error) {
    console.error('Error fetching total debt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of total available credit across all credit cards for the authenticated user.
 *
 * @param {AuthRequest} req - The authenticated request object.
 * @param {Response} res - The response object to send the result.
 */
export const getTotalAvailableCredit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const totalAvailable = await CreditCardModel.getTotalAvailableCredit(req.user.id);
    res.json({ totalAvailable });
  } catch (error) {
    console.error('Error fetching total available credit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles updating a credit card's balance by adding/subtracting an amount.
 *
 * @param {AuthRequest} req - The authenticated request object containing the credit card ID and amount.
 * @param {Response} res - The response object to send the result.
 */
export const updateCreditCardBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const creditCardId = parseInt(id);
    const amount = parseFloat(req.body.amount);

    if (isNaN(creditCardId)) {
      res.status(400).json({ error: 'Invalid credit card ID' });
      return;
    }

    if (isNaN(amount)) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    const creditCard = await CreditCardModel.updateBalance(creditCardId, req.user.id, amount);
    if (!creditCard) {
      res.status(404).json({ error: 'Credit card not found' });
      return;
    }

    res.json(creditCard);
  } catch (error) {
    console.error('Error updating credit card balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of credit cards that are due soon.
 *
 * @param {AuthRequest} req - The authenticated request object.
 * @param {Response} res - The response object to send the result.
 */
export const getCreditCardsDueSoon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const daysAhead = parseInt(req.query.days as string) || 7;
    const creditCards = await CreditCardModel.getDueSoon(req.user.id, daysAhead);
    res.json(creditCards);
  } catch (error) {
    console.error('Error fetching credit cards due soon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of overdue credit cards.
 *
 * @param {AuthRequest} req - The authenticated request object.
 * @param {Response} res - The response object to send the result.
 */
export const getOverdueCreditCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const creditCards = await CreditCardModel.getOverdue(req.user.id);
    res.json(creditCards);
  } catch (error) {
    console.error('Error fetching overdue credit cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of credit utilization summary.
 *
 * @param {AuthRequest} req - The authenticated request object.
 * @param {Response} res - The response object to send the result.
 */
export const getUtilizationSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const summary = await CreditCardModel.getUtilizationSummary(req.user.id);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching utilization summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
