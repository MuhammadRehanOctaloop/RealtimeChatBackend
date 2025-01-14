import { generateTokens, verifyRefreshToken } from '../utils/jwt.utils.js';
import { hashPassword, comparePassword } from '../utils/password.utils.js';
import { User } from '../models/index.js';

export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'Email is already registered'
            });
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(password);
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Return response
        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.createdAt
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Return response
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

export const googleAuth = async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const { email, name, picture } = ticket.getPayload();

        let user = await User.findOne({ email });
        if (!user) {
            // Create new user if doesn't exist
            user = await User.create({
                username: name.replace(/\s+/g, '').toLowerCase(),
                email,
                googleId: ticket.getUserId(),
                avatar: picture,
                password: Math.random().toString(36).slice(-8) // Random password for Google users
            });
        }

        // Generate token
        const jwtToken = generateToken(user._id);

        res.json({
            success: true,
            token: jwtToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(400).json({
                status: 'error',
                message: 'Refresh token is required'
            });
        }

        // Verify the refresh token
        const decoded = verifyRefreshToken(token);
        if (!decoded) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid or expired refresh token'
            });
        }

        // Check if user exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

        res.json({
            status: 'success',
            data: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        // Since we're using JWT, we don't need to do anything server-side
        // The client should remove the tokens
        res.json({
            status: 'success',
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
}; 