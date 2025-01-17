import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['message', 'friend_request', 'friend_accepted', 'system'],
        required: true
    },
    messageId: {  // Reference to the message if type is 'message'
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: function() {
            return this.type === 'message';
        }
    },
    content: String,
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create index for faster queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification || 
    mongoose.model('Notification', notificationSchema); 