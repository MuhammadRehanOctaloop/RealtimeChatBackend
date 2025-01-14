import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import { 
    authRoute, 
    friendRoute, 
    messageRoute, 
    healthCheckRouter,
    notificationRoute 
} from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { Notification } from './models/Notification.js';
import { User } from './models/index.js';
import userRoute from './routes/user.route.js';

// Initialize dotenv
dotenv.config();

const app = express();
const server = http.createServer(app);

// Update CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Socket.io setup with updated CORS
const io = new Server(server, {
    cors: corsOptions
});

// Make io accessible in routes
app.set('io', io);

// Add socket middleware
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Apply CORS middleware
app.use(cors(corsOptions));

// Other middleware
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Chat Board API' });
});

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/friends', friendRoute);
app.use('/api/v1/messages', messageRoute);
app.use('/api/v1/notifications', notificationRoute);
app.use('/api/v1', healthCheckRouter);
app.use('/api/v1/users', userRoute);

// Error handling middleware (should be last)
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', async (socket) => {
    console.log('A user connected');

    // Get user ID from auth token
    const userId = socket.handshake.auth.userId;
    if (userId) {
        // Store socket id for user and update online status
        await User.findByIdAndUpdate(userId, {
            socketId: socket.id,
            online: true
        });

        // Join user's room
        socket.join(userId);

        // Notify friends about online status
        const user = await User.findById(userId).populate('friends');
        user.friends.forEach(friend => {
            io.to(friend._id.toString()).emit('friend_status_change', {
                userId,
                online: true
            });
        });
    }

    // Combined join handler for both chat and notifications
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their rooms`);
    });

    socket.on('typing', (data) => {
        socket.to(data.receiverId).emit('userTyping', {
            senderId: data.senderId,
            typing: true
        });
    });

    socket.on('stopTyping', (data) => {
        socket.to(data.receiverId).emit('userTyping', {
            senderId: data.senderId,
            typing: false
        });
    });

    // Add notification sending functionality
    socket.on('sendNotification', async (data) => {
        try {
            const { recipientId, senderId, type, content } = data;
            
            // Create new notification in database
            const notification = await Notification.create({
                recipient: recipientId,
                sender: senderId,
                type: type, // e.g., 'friend_request', 'message', etc.
                content: content,
                read: false
            });

            // Emit to recipient's notification room
            io.to(recipientId).emit('newNotification', {
                notification: {
                    _id: notification._id,
                    sender: senderId,
                    type: type,
                    content: content,
                    createdAt: notification.createdAt
                }
            });
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    });

    // Enhanced notification read handler
    socket.on('notificationRead', async (data) => {
        try {
            const { notificationId, userId } = data;
            
            const notification = await Notification.findByIdAndUpdate(
                notificationId,
                { read: true },
                { new: true }
            );

            if (notification) {
                // Emit back to confirm notification was read
                io.to(userId).emit('notificationUpdated', {
                    notificationId,
                    read: true
                });
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    });

    // Add handler for getting unread notifications
    socket.on('getUnreadNotifications', async (userId) => {
        try {
            const unreadNotifications = await Notification.find({
                recipient: userId,
                read: false
            }).sort({ createdAt: -1 });

            socket.emit('unreadNotifications', unreadNotifications);
        } catch (error) {
            console.error('Error fetching unread notifications:', error);
        }
    });

    // Add specific friend request handling
    socket.on('sendFriendRequest', async (data) => {
        try {
            const { senderId, recipientId } = data;
            
            // Create friend request notification
            const notification = await Notification.create({
                recipient: recipientId,
                sender: senderId,
                type: 'friend_request',
                content: 'sent you a friend request',
                read: false
            });

            // Emit to recipient's notification room
            io.to(recipientId).emit('newNotification', {
                notification: {
                    _id: notification._id,
                    sender: senderId,
                    type: 'friend_request',
                    content: 'sent you a friend request',
                    createdAt: notification.createdAt
                }
            });

            // Emit success back to sender
            socket.emit('friendRequestSent', {
                success: true,
                recipientId
            });

        } catch (error) {
            console.error('Error sending friend request:', error);
            socket.emit('friendRequestError', {
                message: 'Failed to send friend request'
            });
        }
    });

    // Handle friend request response (accept/decline)
    socket.on('respondToFriendRequest', async (data) => {
        try {
            const { senderId, recipientId, response, notificationId } = data;
            
            // Update the original notification as read
            await Notification.findByIdAndUpdate(notificationId, { read: true });

            // Create notification for the response
            const notificationType = response === 'accept' ? 'friend_accepted' : 'friend_declined';
            const notificationContent = response === 'accept' ? 
                'accepted your friend request' : 
                'declined your friend request';

            const notification = await Notification.create({
                recipient: senderId, // Original sender receives the response
                sender: recipientId, // Original recipient sends the response
                type: notificationType,
                content: notificationContent,
                read: false
            });

            // Notify the original sender about the response
            io.to(senderId).emit('newNotification', {
                notification: {
                    _id: notification._id,
                    sender: recipientId,
                    type: notificationType,
                    content: notificationContent,
                    createdAt: notification.createdAt
                }
            });

            // Emit friend request response status
            io.to(senderId).emit('friendRequestResponse', {
                status: response,
                userId: recipientId
            });

        } catch (error) {
            console.error('Error responding to friend request:', error);
        }
    });

    socket.on('disconnect', async () => {
        if (userId) {
            // Update user's online status and clear socket ID
            await User.findByIdAndUpdate(userId, {
                socketId: null,
                online: false
            });
            
            // Notify friends about offline status
            const user = await User.findById(userId).populate('friends');
            user.friends.forEach(friend => {
                io.to(friend._id.toString()).emit('friend_status_change', {
                    userId,
                    online: false
                });
            });
        }
        console.log('User disconnected');
    });
});

export { app, server };