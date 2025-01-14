import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { 
    sendMessage, 
    getConversation,
    deleteMessage,
    editMessage 
} from '../controllers/message.controller.js';

const router = express.Router();

router.use(authenticate); // Protect all message routes

router.post('/', sendMessage);
router.get('/conversation/:userId', getConversation);
router.patch('/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);

export default router; 