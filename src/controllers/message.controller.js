import { Message } from '../models/Message.js';
import { User } from '../models/index.js';

export const sendMessage = async (req, res, next) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.user._id;

        const message = await Message.create({
            sender: senderId,
            recipient: recipientId,
            content
        });

        // Populate sender details
        await message.populate('sender', 'username');

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        io.to(recipientId).emit('newMessage', message);

        res.status(201).json({
            status: 'success',
            data: { message }
        });
    } catch (error) {
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