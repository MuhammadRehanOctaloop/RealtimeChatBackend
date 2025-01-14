import { verifyAccessToken } from '../utils/jwt.utils.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Authorization required'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        
        if (!decoded) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid or expired token'
            });
        }

        req.user = { _id: decoded.userId };
        next();
    } catch (error) {
        next(error);
    }
}; 