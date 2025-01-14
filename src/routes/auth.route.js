import express from 'express';
import { body } from 'express-validator';
import { register, login, refreshToken, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Validation middleware
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
        .withMessage('Password must be at least 8 characters and contain uppercase, number, and special character')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticate, logout);

export default router; 