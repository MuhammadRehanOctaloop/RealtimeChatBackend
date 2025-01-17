import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    fileName: {
        type: String,
        // Required only for file type messages
        required: function() {
            return this.type === 'file';
        }
    },
    fileSize: {
        type: Number,
        // Required only for file type messages
        required: function() {
            return this.type === 'file';
        }
    },
    fileUrl: {
        type: String,
        // Required for image and file type messages
        required: function() {
            return ['image', 'file'].includes(this.type);
        }
    },
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Message = mongoose.models.Message || 
    mongoose.model('Message', messageSchema); 