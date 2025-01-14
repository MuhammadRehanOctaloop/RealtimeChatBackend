import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app, server } from './app.js';
import { PORT } from './constants.js';

dotenv.config({ path: './.env' });

connectDB()
.then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error("MongoDB connection failed!", error);
    process.exit(1);
});





