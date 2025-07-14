import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createCreditCard,
  getCreditCards,
  getCreditCard,
  updateCreditCard,
  deleteCreditCard,
  getTotalDebt,
  getTotalAvailableCredit,
  updateCreditCardBalance,
  getCreditCardsDueSoon,
  getOverdueCreditCards,
  getUtilizationSummary,
  createCreditCardValidation,
  updateCreditCardValidation
} from '../controllers/creditCardsController';

const router = Router();

/**
 * @route POST /api/credit-cards
 * @description Create a new credit card
 * @access Private (requires authentication)
 * @validation createCreditCardValidation
 */
router.post('/', authenticateToken, createCreditCardValidation, createCreditCard);

/**
 * @route GET /api/credit-cards
 * @description Get all credit cards for the authenticated user
 * @access Private (requires authentication)
 * @query limit - Maximum number of credit cards to return (default: 20)
 * @query offset - Offset for pagination (default: 0)
 */
router.get('/', authenticateToken, getCreditCards);

/**
 * @route GET /api/credit-cards/total-debt
 * @description Get total debt across all credit cards for the authenticated user
 * @access Private (requires authentication)
 */
router.get('/total-debt', authenticateToken, getTotalDebt);

/**
 * @route GET /api/credit-cards/total-available
 * @description Get total available credit across all credit cards for the authenticated user
 * @access Private (requires authentication)
 */
router.get('/total-available', authenticateToken, getTotalAvailableCredit);

/**
 * @route GET /api/credit-cards/due-soon
 * @description Get credit cards that are due soon
 * @access Private (requires authentication)
 * @query days - Number of days to look ahead (default: 7)
 */
router.get('/due-soon', authenticateToken, getCreditCardsDueSoon);

/**
 * @route GET /api/credit-cards/overdue
 * @description Get overdue credit cards
 * @access Private (requires authentication)
 */
router.get('/overdue', authenticateToken, getOverdueCreditCards);

/**
 * @route GET /api/credit-cards/utilization-summary
 * @description Get credit utilization summary
 * @access Private (requires authentication)
 */
router.get('/utilization-summary', authenticateToken, getUtilizationSummary);

/**
 * @route GET /api/credit-cards/:id
 * @description Get a specific credit card by ID
 * @access Private (requires authentication)
 * @param id - The credit card ID
 */
router.get('/:id', authenticateToken, getCreditCard);

/**
 * @route PUT /api/credit-cards/:id
 * @description Update a credit card
 * @access Private (requires authentication)
 * @param id - The credit card ID
 * @validation updateCreditCardValidation
 */
router.put('/:id', authenticateToken, updateCreditCardValidation, updateCreditCard);

/**
 * @route PUT /api/credit-cards/:id/balance
 * @description Update a credit card's balance by adding/subtracting an amount
 * @access Private (requires authentication)
 * @param id - The credit card ID
 * @body amount - The amount to add (positive) or subtract (negative)
 */
router.put('/:id/balance', authenticateToken, updateCreditCardBalance);

/**
 * @route DELETE /api/credit-cards/:id
 * @description Delete a credit card
 * @access Private (requires authentication)
 * @param id - The credit card ID
 */
router.delete('/:id', authenticateToken, deleteCreditCard);

export default router;
