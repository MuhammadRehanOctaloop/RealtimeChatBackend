import { Router } from 'express';
import { register, login, googleAuth, logout } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google-auth', googleAuth);
router.post('/logout', verifyToken, logout);

export default router;