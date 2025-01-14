import { User } from '../models/index.js';

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