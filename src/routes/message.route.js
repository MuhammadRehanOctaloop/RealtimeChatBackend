import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { upload } from '../utils/upload.utils.js';
import { 
    sendMessage, 
    getConversation,
    deleteMessage,
    editMessage 
} from '../controllers/message.controller.js';

const router = express.Router();

router.use(authenticate); // Protect all message routes

router.post('/', upload.single('file'), sendMessage);
router.get('/conversation/:userId', getConversation);
router.patch('/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);

export default router; 