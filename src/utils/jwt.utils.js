import jwt from 'jsonwebtoken';

const generateTokens = (userId) => {
    // Generate access token
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
        return null;
    }
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
};

export { generateTokens, verifyAccessToken, verifyRefreshToken }; 