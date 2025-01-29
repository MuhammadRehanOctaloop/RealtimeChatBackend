import { Message } from '../models/Message.js';
import { User } from '../models/index.js';
import { v2 as cloudinary } from 'cloudinary';
import { Notification } from '../models/Notification.js';

export const sendMessage = async (req, res, next) => {
    try {
        const { recipientId, content, type } = req.body;
        const senderId = req.user._id;
        
        // Create message
        let messageData = {
            sender: senderId,
            recipient: recipientId,
            content,
            type: type || 'text'
        };

        if (req.file) {
            messageData = {
                ...messageData,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                fileUrl: req.file.path,
                type: req.file.mimetype.startsWith('image/') ? 'image' : 'file'
            };
        }

        const message = await Message.create(messageData);
        await message.populate('sender', 'username');

        // Create notification
        const sender = await User.findById(senderId).select('username');
        const notification = await Notification.create({
            recipient: recipientId,
            sender: senderId,
            type: 'message',
            messageId: message._id,
            content: `New message from ${sender.username}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`
        });

        // Emit socket events
        const io = req.app.get('io');
        
        // Emit new message event
        io.to(recipientId).emit('newMessage', message);
        
        // Emit notification event
        io.to(recipientId).emit('newNotification', {
            notification: {
                _id: notification._id,
                sender: {
                    _id: sender._id,
                    username: sender.username
                },
                type: 'message',
                content: notification.content,
                messageId: message._id,
                createdAt: notification.createdAt
            }
        });

        res.status(201).json({
            status: 'success',
            data: { 
                message,
                notification 
            }
        });
    } catch (error) {
        if (req.file?.path) {
            await cloudinary.uploader.destroy(req.file.filename);
        }
        next(error);
    }
};

export const getConversation = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, recipient: userId },
                { sender: userId, recipient: currentUserId }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('sender', 'username');

        res.json({
            status: 'success',
            data: { messages }
        });
    } catch (error) {
        next(error);
    }
};

export const editMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        const message = await Message.findOneAndUpdate(
            { _id: messageId, sender: userId },
            { 
                content,
                edited: true,
                editedAt: Date.now()
            },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                status: 'error',
                message: 'Message not found or unauthorized'
            });
        }

        res.json({
            status: 'success',
            data: { message }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findOneAndDelete({
            _id: messageId,
            sender: userId
        });

        if (!message) {
            return res.status(404).json({
                status: 'error',
                message: 'Message not found or unauthorized'
            });
        }

        res.json({
            status: 'success',
            message: 'Message deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const markMessageAsRead = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findOneAndUpdate(
            { _id: messageId, recipient: userId },
            { read: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                status: 'error',
                message: 'Message not found or unauthorized'
            });
        }

        res.json({
            status: 'success',
            data: { message }
        });
    } catch (error) {
        next(error);
    }
};