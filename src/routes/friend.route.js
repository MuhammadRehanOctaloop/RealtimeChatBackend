import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { 
    getFriends,
    searchUsers,
    sendFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest,
    getPendingRequests,
    getReceivedRequests
} from '../controllers/friend.controller.js';

const router = express.Router();

router.use(authenticate); // Protect all friend routes

router.get('/', getFriends);
router.get('/search', searchUsers);
router.get('/requests/received', getReceivedRequests);
router.get('/pending', getPendingRequests);
router.post('/request', sendFriendRequest);
router.post('/accept', acceptFriendRequest);
router.post('/decline', declineFriendRequest);

export default router; 