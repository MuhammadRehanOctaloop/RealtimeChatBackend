import { User } from '../models/index.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { Notification } from '../models/Notification.js';

export const getFriends = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('friends', 'username email online');

        res.json({
            status: 'success',
            data: user.friends
        });
    } catch (error) {
        next(error);
    }
};

export const searchUsers = async (req, res, next) => {
    try {
        const { username } = req.query;
        const users = await User.find({
            username: { $regex: username, $options: 'i' },
            _id: { $ne: req.user._id }
        }).select('username email online');

        res.json({
            status: 'success',
            data: users
        });
    } catch (error) {
        next(error);
    }
};

export const sendFriendRequest = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const senderId = req.user._id;

        // Check if users are already friends
        const sender = await User.findById(senderId);
        if (sender.friends.includes(userId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Users are already friends'
            });
        }

        // Check if request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, recipient: userId },
                { sender: userId, recipient: senderId }
            ],
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                status: 'error',
                message: 'Friend request already exists'
            });
        }

        const request = await FriendRequest.create({
            sender: senderId,
            recipient: userId
        });

        // Get sender details for notification
        const senderDetails = await User.findById(senderId)
            .select('username email');

        // Create notification for recipient
        const notification = await Notification.create({
            recipient: userId,
            sender: senderId,
            type: 'friend_request',
            content: `${senderDetails.username} sent you a friend request`
        });

        // Emit socket events
        const io = req.app.get('io');
        
        // Emit friend request event
        io.to(userId).emit('friend_request', {
            type: 'friend_request',
            sender: senderDetails,
            requestId: request._id
        });

        // Emit notification event
        io.to(userId).emit('newNotification', {
            notification: {
                _id: notification._id,
                sender: senderDetails,
                type: 'friend_request',
                content: notification.content,
                createdAt: notification.createdAt
            }
        });

        res.status(201).json({
            status: 'success',
            data: {
                request,
                notification
            }
        });
    } catch (error) {
        next(error);
    }
};

export const acceptFriendRequest = async (req, res, next) => {
    try {
        const { requestId } = req.body;
        const userId = req.user._id;

        const request = await FriendRequest.findOne({
            _id: requestId,
            recipient: userId,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({
                status: 'error',
                message: 'Friend request not found'
            });
        }

        // Update request status
        request.status = 'accepted';
        await request.save();

        // Add users to each other's friends list
        await User.findByIdAndUpdate(request.sender, {
            $addToSet: { friends: request.recipient }
        });
        await User.findByIdAndUpdate(request.recipient, {
            $addToSet: { friends: request.sender }
        });

        // Get user details for notification
        const recipient = await User.findById(userId)
            .select('username email');

        // Create notification for sender
        const notification = await Notification.create({
            recipient: request.sender,
            sender: userId,
            type: 'friend_accepted',
            content: `${recipient.username} accepted your friend request`
        });

        // Emit socket events
        const io = req.app.get('io');
        
        // Emit friend request accepted event
        io.to(request.sender.toString()).emit('friend_request_accepted', {
            type: 'friend_accepted',
            user: recipient,
            requestId: request._id
        });

        // Emit notification event
        io.to(request.sender.toString()).emit('newNotification', {
            notification: {
                _id: notification._id,
                sender: recipient,
                type: 'friend_accepted',
                content: notification.content,
                createdAt: notification.createdAt
            }
        });

        res.json({
            status: 'success',
            data: {
                request,
                notification
            }
        });
    } catch (error) {
        next(error);
    }
};

export const declineFriendRequest = async (req, res, next) => {
    try {
        const { requestId } = req.body;
        const userId = req.user._id;

        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                status: 'error',
                message: 'Friend request not found'
            });
        }

        request.status = 'declined';
        await request.save();

        // Emit socket event to notify sender
        const io = req.app.get('io');
        io.to(request.sender.toString()).emit('friend_request_declined', {
            type: 'friend_declined',
            userId: userId
        });

        res.json({
            status: 'success',
            data: request
        });
    } catch (error) {
        next(error);
    }
};

export const getFriendsList = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).populate('friends', 'username email');

        res.json({
            status: 'success',
            data: {
                friends: user.friends
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getPendingRequests = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const pendingRequests = await FriendRequest.find({
            recipient: userId,
            status: 'pending'
        })
        .populate('sender', 'username email')
        .sort('-createdAt');

        res.json({
            status: 'success',
            data: pendingRequests
        });
    } catch (error) {
        next(error);
    }
};

export const getReceivedRequests = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const receivedRequests = await FriendRequest.find({
            recipient: userId,
            status: 'pending'
        })
        .populate('sender', 'username email online')
        .sort('-createdAt');

        res.json({
            status: 'success',
            data: receivedRequests
        });
    } catch (error) {
        next(error);
    }
}; 