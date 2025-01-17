import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { 
    getAllNotifications,
    getUnreadNotifications,
    getMessageNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification 
} from '../controllers/notification.controller.js';
import { Notification } from '../models/Notification.js';

const router = express.Router();

router.use(authenticate); // Protect all notification routes

router.get('/', getAllNotifications);
router.get('/unread', getUnreadNotifications);
router.get('/messages', getMessageNotifications);
router.patch('/:notificationId/read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/:notificationId', deleteNotification);

export default router; 