import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserModel } from '../models/User';
import { AuthRequest } from '../types';
import { AccountModel } from '../models/Accounts';

/**
 * Validation rules for updating user profile.
 * These rules will be applied to the request body.
 * - First name and last name must be less than 100 characters.
 * - Bio must be less than 500 characters.
 */
export const updateProfileValidation = [
  body('firstName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('First name must be less than 100 characters'),
  body('lastName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Last name must be less than 100 characters')
];

/**
 * Handles the retrieval of a user profile.
 * Validates the request parameters and returns the user profile if found.
 *
 * @param {Request} req - The request object containing the user ID in the parameters.
 * @param {Response} res - The response object to send the result.
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

/**
 * Handles the update of a user profile.
 * Validates the request body, checks for errors, and updates the user profile in the database.
 *
 * @param {AuthRequest} req - The request object containing user data and profile updates.
 * @param {Response} res - The response object to send the result.
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
      return;
    }

    const userId = req.user!.id;
    const updates = req.body;

    const updatedUser = await UserModel.updateProfile(userId, updates);
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// New
export const getUserAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const accounts = await AccountModel.findByUserId(userId, limit, offset);

    res.json({
      accounts,
      pagination: {
        page,
        limit,
        hasMore: accounts.length === limit
      }
    });
  } catch (error) {
    console.error('Get user accounts error:', error);
    res.status(500).json({ error: 'Failed to get user accounts' });
  }
};
