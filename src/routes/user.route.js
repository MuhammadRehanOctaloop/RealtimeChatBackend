import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { searchUsers } from '../controllers/user.controller.js';

const router = express.Router();

router.use(authenticate);
router.get('/search', searchUsers);

export default router; 