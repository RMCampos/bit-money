import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { Category, CreateCategoryData, UpdateCategoryData } from '../types';
import { AuthRequest } from '../types';

/**
 * Validation rules for creating a category.
 * These rules will be applied to the request body.
 * - Name is required and must be less than 100 characters.
 * - Account type is required and must be either 'E' (expense) or 'I' (income).
 * - Display at home is optional and must be a boolean.
 */
export const createCategoryValidation = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 100 })
    .withMessage('Category name must be less than 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_&]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands'),
  body('accountType')
    .notEmpty()
    .withMessage('Account type is required')
    .isIn(['E', 'I'])
    .withMessage('Account type must be either E (expense) or I (income)'),
  body('displayAtHome')
    .optional()
    .isBoolean()
    .withMessage('Display at home must be a boolean value')
];

/**
 * Validation rules for updating a category.
 * These rules will be applied to the request body.
 * - Name is optional and must be less than 100 characters.
 * - Account type is optional and must be either 'E' (expense) or 'I' (income).
 * - Display at home is optional and must be a boolean.
 */
export const updateCategoryValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_&]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands'),
  body('accountType')
    .optional()
    .isIn(['E', 'I'])
    .withMessage('Account type must be either E (expense) or I (income)'),
  body('displayAtHome')
    .optional()
    .isBoolean()
    .withMessage('Display at home must be a boolean value')
];

/**
 * CategoryModel handles database operations related to categories.
 * It provides methods to create, find, update, and delete categories.
 */
export class CategoryModel {
  /**
   * Creates a new category in the database.
   *
   * @param userId - The ID of the user creating the category.
   * @param categoryData - The data for the new category.
   * @returns The created Category object.
   */
  static async create(userId: number, categoryData: CreateCategoryData): Promise<Category> {
    const query = `
      INSERT INTO categories (user_id, name, account_type, display_at_home)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, name, account_type, display_at_home, created_at, updated_at
    `;
    
    const values = [
      userId,
      categoryData.name,
      categoryData.accountType,
      categoryData.displayAtHome || false
    ];
    
    const result = await pool.query(query, values);
    return this.mapRowToCategory(result.rows[0]);
  }

  /**
   * Finds a category by its ID and user ID.
   *
   * @param id - The ID of the category to find.
   * @param userId - The ID of the user who owns the category.
   * @returns The Category object or null if not found.
   */
  static async findById(id: number, userId: number): Promise<Category | null> {
    const query = `
      SELECT id, user_id, name, account_type, display_at_home, created_at, updated_at
      FROM categories WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] ? this.mapRowToCategory(result.rows[0]) : null;
  }

  /**
   * Finds all categories for a specific user.
   *
   * @param userId - The ID of the user whose categories to find.
   * @param accountType - Optional filter by account type ('E' or 'I').
   * @param displayAtHome - Optional filter by display at home flag.
   * @param limit - The maximum number of categories to return.
   * @param offset - The offset for pagination.
   * @returns An array of Category objects.
   */
  static async findByUserId(
    userId: number, 
    accountType?: 'E' | 'I', 
    displayAtHome?: boolean,
    limit: number = 50, 
    offset: number = 0
  ): Promise<Category[]> {
    let query = `
      SELECT id, user_id, name, account_type, display_at_home, created_at, updated_at
      FROM categories WHERE user_id = $1
    `;
    
    const values: any[] = [userId];
    let paramIndex = 2;

    if (accountType) {
      query += ` AND account_type = $${paramIndex++}`;
      values.push(accountType);
    }

    if (displayAtHome !== undefined) {
      query += ` AND display_at_home = $${paramIndex++}`;
      values.push(displayAtHome);
    }

    query += ` ORDER BY name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    return result.rows.map(row => this.mapRowToCategory(row));
  }

  /**
   * Updates a category's information.
   *
   * @param id - The ID of the category to update.
   * @param userId - The ID of the user who owns the category.
   * @param updates - The updates to apply to the category.
   * @returns The updated Category object or null if not found.
   */
  static async update(id: number, userId: number, updates: UpdateCategoryData): Promise<Category | null> {
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }

    if (updates.accountType !== undefined) {
      updateFields.push(`account_type = $${paramIndex++}`);
      values.push(updates.accountType);
    }

    if (updates.displayAtHome !== undefined) {
      updateFields.push(`display_at_home = $${paramIndex++}`);
      values.push(updates.displayAtHome);
    }

    if (updateFields.length === 0) {
      return this.findById(id, userId);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    const query = `
      UPDATE categories
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
      RETURNING id, user_id, name, account_type, display_at_home, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] ? this.mapRowToCategory(result.rows[0]) : null;
  }

  /**
   * Deletes a category.
   *
   * @param id - The ID of the category to delete.
   * @param userId - The ID of the user who owns the category.
   * @returns True if the category was deleted, false otherwise.
   */
  static async delete(id: number, userId: number): Promise<boolean> {
    // First check if the category has any transactions
    const transactionCheck = `
      SELECT COUNT(*) as count FROM transactions 
      WHERE category_id = $1 AND user_id = $2
    `;
    const transactionResult = await pool.query(transactionCheck, [id, userId]);
    
    if (parseInt(transactionResult.rows[0].count) > 0) {
      throw new Error('Cannot delete category with existing transactions');
    }

    const query = `DELETE FROM categories WHERE id = $1 AND user_id = $2`;
    const result = await pool.query(query, [id, userId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Gets categories summary by account type for a user.
   *
   * @param userId - The ID of the user.
   * @returns An object containing category counts by type.
   */
  static async getCategorySummary(userId: number): Promise<{
    expenseCategories: number;
    incomeCategories: number;
    totalCategories: number;
    homeDisplayCategories: number;
  }> {
    const query = `
      SELECT 
        COUNT(CASE WHEN account_type = 'E' THEN 1 END) as expense_categories,
        COUNT(CASE WHEN account_type = 'I' THEN 1 END) as income_categories,
        COUNT(*) as total_categories,
        COUNT(CASE WHEN display_at_home = true THEN 1 END) as home_display_categories
      FROM categories WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    const row = result.rows[0];
    
    return {
      expenseCategories: parseInt(row.expense_categories) || 0,
      incomeCategories: parseInt(row.income_categories) || 0,
      totalCategories: parseInt(row.total_categories) || 0,
      homeDisplayCategories: parseInt(row.home_display_categories) || 0
    };
  }

  /**
   * Gets categories with transaction counts for a user.
   *
   * @param userId - The ID of the user.
   * @param accountType - Optional filter by account type ('E' or 'I').
   * @returns An array of categories with their transaction counts.
   */
  static async getCategoriesWithTransactionCounts(
    userId: number, 
    accountType?: 'E' | 'I'
  ): Promise<Array<Category & { transactionCount: number }>> {
    let query = `
      SELECT 
        c.id, c.user_id, c.name, c.account_type, c.display_at_home, 
        c.created_at, c.updated_at,
        COUNT(t.id) as transaction_count
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
      WHERE c.user_id = $1
    `;
    
    const values: any[] = [userId];
    let paramIndex = 2;

    if (accountType) {
      query += ` AND c.account_type = $${paramIndex++}`;
      values.push(accountType);
    }

    query += ` GROUP BY c.id, c.user_id, c.name, c.account_type, c.display_at_home, c.created_at, c.updated_at`;
    query += ` ORDER BY c.name ASC`;
    
    const result = await pool.query(query, values);
    return result.rows.map(row => ({
      ...this.mapRowToCategory(row),
      transactionCount: parseInt(row.transaction_count) || 0
    }));
  }

  /**
   * Finds categories by name (case-insensitive search).
   *
   * @param userId - The ID of the user.
   * @param searchTerm - The search term to match against category names.
   * @param accountType - Optional filter by account type ('E' or 'I').
   * @param limit - The maximum number of categories to return.
   * @returns An array of Category objects matching the search term.
   */
  static async searchByName(
    userId: number, 
    searchTerm: string, 
    accountType?: 'E' | 'I',
    limit: number = 20
  ): Promise<Category[]> {
    let query = `
      SELECT id, user_id, name, account_type, display_at_home, created_at, updated_at
      FROM categories 
      WHERE user_id = $1 AND LOWER(name) LIKE LOWER($2)
    `;
    
    const values: any[] = [userId, `%${searchTerm}%`];
    let paramIndex = 3;

    if (accountType) {
      query += ` AND account_type = $${paramIndex++}`;
      values.push(accountType);
    }

    query += ` ORDER BY name ASC LIMIT $${paramIndex}`;
    values.push(limit);
    
    const result = await pool.query(query, values);
    return result.rows.map(row => this.mapRowToCategory(row));
  }

  /**
   * Checks if a category name already exists for a user.
   *
   * @param userId - The ID of the user.
   * @param name - The category name to check.
   * @param excludeId - Optional ID to exclude from the check (for updates).
   * @returns True if the name exists, false otherwise.
   */
  static async nameExists(userId: number, name: string, excludeId?: number): Promise<boolean> {
    let query = `
      SELECT COUNT(*) as count FROM categories 
      WHERE user_id = $1 AND LOWER(name) = LOWER($2)
    `;
    
    const values = [userId, name];
    let paramIndex = 3;

    if (excludeId) {
      query += ` AND id != $${paramIndex}`;
      values.push(excludeId);
    }
    
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Maps a database row to a Category object.
   *
   * @param row - The database row to map.
   * @returns The Category object.
   */
  private static mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      accountType: row.account_type,
      displayAtHome: row.display_at_home,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

/**
 * Handles the creation of a new category.
 * Validates the request body and creates the category if valid.
 *
 * @param {AuthRequest} req - The authenticated request object containing the category data.
 * @param {Response} res - The response object to send the result.
 */
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Check if category name already exists
    const nameExists = await CategoryModel.nameExists(req.user.id, req.body.name);
    if (nameExists) {
      res.status(409).json({ error: 'Category name already exists' });
      return;
    }

    const categoryData: CreateCategoryData = {
      name: req.body.name,
      accountType: req.body.accountType,
      displayAtHome: req.body.displayAtHome
    };

    const category = await CategoryModel.create(req.user.id, categoryData);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of all categories for the authenticated user.
 *
 * @param {AuthRequest} req - The authenticated request object.
 * @param {Response} res - The response object to send the result.
 */
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const accountType = req.query.accountType as 'E' | 'I' | undefined;
    const displayAtHome = req.query.displayAtHome ? req.query.displayAtHome === 'true' : undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const categories = await CategoryModel.findByUserId(
      req.user.id, 
      accountType, 
      displayAtHome,
      limit, 
      offset
    );
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of a specific category.
 *
 * @param {AuthRequest} req - The authenticated request object containing the category ID.
 * @param {Response} res - The response object to send the result.
 */
export const getCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }

    const category = await CategoryModel.findById(categoryId, req.user.id);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the update of a category.
 *
 * @param {AuthRequest} req - The authenticated request object containing the category ID and update data.
 * @param {Response} res - The response object to send the result.
 */
export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }

    // Check if new name already exists (if name is being updated)
    if (req.body.name !== undefined) {
      const nameExists = await CategoryModel.nameExists(req.user.id, req.body.name, categoryId);
      if (nameExists) {
        res.status(409).json({ error: 'Category name already exists' });
        return;
      }
    }

    const updates: UpdateCategoryData = {};
    if (req.body.name !== undefined) {
      updates.name = req.body.name;
    }
    if (req.body.accountType !== undefined) {
      updates.accountType = req.body.accountType;
    }
    if (req.body.displayAtHome !== undefined) {
      updates.displayAtHome = req.body.displayAtHome;
    }

    const category = await CategoryModel.update(categoryId, req.user.id, updates);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the deletion of a category.
 *
 * @param {AuthRequest} req - The authenticated request object containing the category ID.
 * @param {Response} res - The response object to send the result.
 */
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }

    const deleted = await CategoryModel.delete(categoryId, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error instanceof Error && error.message.includes('Cannot delete category with existing transactions')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Handles the retrieval of category summary for the authenticated user.
 *
 * @param {AuthRequest} req - The authenticated request object.
 * @param {Response} res - The response object to send the result.
 */
export const getCategorySummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const summary = await CategoryModel.getCategorySummary(req.user.id);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching category summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the retrieval of categories with transaction counts.
 *
 * @param {AuthRequest} req - The authenticated request object.
 * @param {Response} res - The response object to send the result.
 */
export const getCategoriesWithTransactionCounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const accountType = req.query.accountType as 'E' | 'I' | undefined;
    const categories = await CategoryModel.getCategoriesWithTransactionCounts(req.user.id, accountType);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories with transaction counts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the search for categories by name.
 *
 * @param {AuthRequest} req - The authenticated request object.
 * @param {Response} res - The response object to send the result.
 */
export const searchCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const searchTerm = req.query.q as string;
    if (!searchTerm) {
      res.status(400).json({ error: 'Search term is required' });
      return;
    }

    const accountType = req.query.accountType as 'E' | 'I' | undefined;
    const limit = parseInt(req.query.limit as string) || 20;

    const categories = await CategoryModel.searchByName(req.user.id, searchTerm, accountType, limit);
    res.json(categories);
  } catch (error) {
    console.error('Error searching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
