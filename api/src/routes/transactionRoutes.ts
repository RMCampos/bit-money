import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
  getMonthlySummary,
  createTransactionValidation,
  updateTransactionValidation
} from '../controllers/transactionsController';

const router = Router();

/**
 * @route POST /api/transactions
 * @description Create a new transaction
 * @access Private (requires authentication)
 * @validation createTransactionValidation
 */
router.post('/', authenticateToken, createTransactionValidation, createTransaction);

/**
 * @route GET /api/transactions
 * @description Get all transactions for the authenticated user
 * @access Private (requires authentication)
 * @query transactionType - Filter by transaction type ('E', 'I', 'T')
 * @query accountId - Filter by account ID
 * @query categoryId - Filter by category ID
 * @query paid - Filter by paid status (true/false)
 * @query startDate - Filter by start date (ISO8601)
 * @query endDate - Filter by end date (ISO8601)
 * @query limit - Maximum number of transactions to return (default: 50)
 * @query offset - Offset for pagination (default: 0)
 */
router.get('/', authenticateToken, getTransactions);

/**
 * @route GET /api/transactions/summary
 * @description Get transaction summary for the authenticated user
 * @access Private (requires authentication)
 * @query startDate - Filter by start date (ISO8601)
 * @query endDate - Filter by end date (ISO8601)
 */
router.get('/summary', authenticateToken, getTransactionSummary);

/**
 * @route GET /api/transactions/monthly/:year/:month
 * @description Get monthly transaction summary
 * @access Private (requires authentication)
 * @param year - Year (4 digits)
 * @param month - Month (1-12)
 */
router.get('/monthly/:year/:month', authenticateToken, getMonthlySummary);

/**
 * @route GET /api/transactions/:id
 * @description Get a specific transaction by ID
 * @access Private (requires authentication)
 * @param id - The transaction ID
 */
router.get('/:id', authenticateToken, getTransaction);

/**
 * @route PUT /api/transactions/:id
 * @description Update a transaction
 * @access Private (requires authentication)
 * @param id - The transaction ID
 * @validation updateTransactionValidation
 */
router.put('/:id', authenticateToken, updateTransactionValidation, updateTransaction);

/**
 * @route DELETE /api/transactions/:id
 * @description Delete a transaction
 * @access Private (requires authentication)
 * @param id - The transaction ID
 */
router.delete('/:id', authenticateToken, deleteTransaction);

export default router;
