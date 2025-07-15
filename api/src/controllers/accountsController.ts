import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { CreateAccountData, UpdateAccountData } from '../types';
import { AuthRequest } from '../types';
import { AccountModel } from '../models/Account';

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
