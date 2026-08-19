import User from '../models/User.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    // Find all users except the logged-in user, selecting only needed details
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select('-password');
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error('Error in getUsersForSidebar:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { bio } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      let picUrl = await uploadToCloudinary(req.file.path);
      if (!picUrl) {
        // Local fallback
        picUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      }
      updateData.profilePic = picUrl;
    } else if (req.body.profilePic !== undefined) {
      updateData.profilePic = req.body.profilePic;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error in updateProfile:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
