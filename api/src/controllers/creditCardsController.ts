import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { CreateCreditCardData, UpdateCreditCardData } from '../types';
import { AuthRequest } from '../types';
import { CreditCardModel } from '../models/CreditCard';

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
