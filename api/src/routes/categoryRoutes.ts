import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getCategorySummary,
  getCategoriesWithTransactionCounts,
  searchCategories,
  createCategoryValidation,
  updateCategoryValidation
} from '../controllers/categoriesController';

const router = Router();

/**
 * @route POST /api/categories
 * @description Create a new category
 * @access Private (requires authentication)
 * @validation createCategoryValidation
 */
router.post('/', authenticateToken, createCategoryValidation, createCategory);

/**
 * @route GET /api/categories
 * @description Get all categories for the authenticated user
 * @access Private (requires authentication)
 * @query accountType - Filter by account type ('E' for expense, 'I' for income)
 * @query displayAtHome - Filter by display at home flag (true/false)
 * @query limit - Maximum number of categories to return (default: 50)
 * @query offset - Offset for pagination (default: 0)
 */
router.get('/', authenticateToken, getCategories);

/**
 * @route GET /api/categories/summary
 * @description Get category summary for the authenticated user
 * @access Private (requires authentication)
 */
router.get('/summary', authenticateToken, getCategorySummary);

/**
 * @route GET /api/categories/with-transaction-counts
 * @description Get categories with transaction counts
 * @access Private (requires authentication)
 * @query accountType - Filter by account type ('E' for expense, 'I' for income)
 */
router.get('/with-transaction-counts', authenticateToken, getCategoriesWithTransactionCounts);

/**
 * @route GET /api/categories/search
 * @description Search categories by name
 * @access Private (requires authentication)
 * @query q - Search term (required)
 * @query accountType - Filter by account type ('E' for expense, 'I' for income)
 * @query limit - Maximum number of categories to return (default: 20)
 */
router.get('/search', authenticateToken, searchCategories);

/**
 * @route GET /api/categories/:id
 * @description Get a specific category by ID
 * @access Private (requires authentication)
 * @param id - The category ID
 */
router.get('/:id', authenticateToken, getCategory);

/**
 * @route PUT /api/categories/:id
 * @description Update a category
 * @access Private (requires authentication)
 * @param id - The category ID
 * @validation updateCategoryValidation
 */
router.put('/:id', authenticateToken, updateCategoryValidation, updateCategory);

/**
 * @route DELETE /api/categories/:id
 * @description Delete a category
 * @access Private (requires authentication)
 * @param id - The category ID
 */
router.delete('/:id', authenticateToken, deleteCategory);

export default router;
