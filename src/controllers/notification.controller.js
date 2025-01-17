import { Notification } from '../models/Notification.js';

export const getAllNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .populate('sender', 'username')
            .limit(50); // Limit to last 50 notifications

        res.json({
            status: 'success',
            data: { notifications }
        });
    } catch (error) {
        next(error);
    }
};

export const getUnreadNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({
            recipient: userId,
            read: false
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'username');

        res.json({
            status: 'success',
            data: { notifications }
        });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            {
                _id: notificationId,
                recipient: userId
            },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                status: 'error',
                message: 'Notification not found'
            });
        }

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        io.to(userId).emit('notificationUpdated', {
            notificationId,
            read: true
        });

        res.json({
            status: 'success',
            data: { notification }
        });
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            {
                recipient: userId,
                read: false
            },
            { read: true }
        );

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        io.to(userId).emit('allNotificationsRead');

        res.json({
            status: 'success',
            message: 'All notifications marked as read'
        });
    } catch (error) {
        next(error);
    }
};

export const deleteNotification = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({
                status: 'error',
                message: 'Notification not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const getMessageNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({
            recipient: userId,
            type: 'message'
        })
        .populate('sender', 'username')
        .populate('messageId', 'content type fileName')
        .sort('-createdAt')
        .limit(50);

        res.json({
            status: 'success',
            data: notifications
        });
    } catch (error) {
        next(error);
    }
}; 