import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  updateProfileValidation, 
  getUserAccounts
} from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/:id', getProfile);
router.put('/profile', authenticateToken, updateProfileValidation, updateProfile);
router.get('/:id/accounts', getUserAccounts);

export { router as userRoutes };
