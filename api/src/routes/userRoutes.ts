import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  updateProfileValidation, 
  getUserAccounts,
  getUserCreditCards
} from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/:id', getProfile);
router.put('/profile', authenticateToken, updateProfileValidation, updateProfile);
router.get('/:id/accounts', getUserAccounts);
router.get('/:id/credit-cards', getUserCreditCards);

export { router as userRoutes };
