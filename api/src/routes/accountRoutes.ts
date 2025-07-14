import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
  getTotalBalance,
  updateAccountBalance,
  createAccountValidation,
  updateAccountValidation
} from '../controllers/accountsController';

const router = Router();

/**
 * @route POST /api/accounts
 * @description Create a new account
 * @access Private (requires authentication)
 * @validation createAccountValidation
 */
router.post('/', authenticateToken, createAccountValidation, createAccount);

/**
 * @route GET /api/accounts
 * @description Get all accounts for the authenticated user
 * @access Private (requires authentication)
 * @query limit - Maximum number of accounts to return (default: 20)
 * @query offset - Offset for pagination (default: 0)
 */
router.get('/', authenticateToken, getAccounts);

/**
 * @route GET /api/accounts/total-balance
 * @description Get total balance across all accounts for the authenticated user
 * @access Private (requires authentication)
 */
router.get('/total-balance', authenticateToken, getTotalBalance);

/**
 * @route GET /api/accounts/:id
 * @description Get a specific account by ID
 * @access Private (requires authentication)
 * @param id - The account ID
 */
router.get('/:id', authenticateToken, getAccount);

/**
 * @route PUT /api/accounts/:id
 * @description Update an account
 * @access Private (requires authentication)
 * @param id - The account ID
 * @validation updateAccountValidation
 */
router.put('/:id', authenticateToken, updateAccountValidation, updateAccount);

/**
 * @route PUT /api/accounts/:id/balance
 * @description Update an account's balance by adding/subtracting an amount
 * @access Private (requires authentication)
 * @param id - The account ID
 * @body amount - The amount to add (positive) or subtract (negative)
 */
router.put('/:id/balance', authenticateToken, updateAccountBalance);

/**
 * @route DELETE /api/accounts/:id
 * @description Delete an account
 * @access Private (requires authentication)
 * @param id - The account ID
 */
router.delete('/:id', authenticateToken, deleteAccount);

export default router;
