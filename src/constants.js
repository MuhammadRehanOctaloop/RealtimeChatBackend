import dotenv from 'dotenv';

dotenv.config();

export const {
    PORT = 3001,
    MONGODB_URI,
    CORS_ORIGIN = 'http://localhost:3000',
    JWT_SECRET,
    JWT_EXPIRY = '7d',
    NODE_ENV = 'development'
} = process.env;

export const DB_NAME = "chatboard";
 