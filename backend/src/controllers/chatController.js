import Chat from '../models/Chat.js';
import User from '../models/User.js';

// Access two-party chat (or create one if it doesn't exist)
export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'UserId parameter is required' });
  }

  try {
    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { participants: { $elemMatch: { $eq: req.user._id } } },
        { participants: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('participants', '-password')
      .populate('latestMessage');

    isChat = await User.populate(isChat, {
      path: 'latestMessage.sender',
      select: 'username email profilePic bio',
    });

    if (isChat.length > 0) {
      res.status(200).json(isChat[0]);
    } else {
      const chatData = {
        chatName: 'sender',
        isGroupChat: false,
        participants: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findById(createdChat._id).populate('participants', '-password');
      res.status(200).json(fullChat);
    }
  } catch (error) {
    console.error('Error in accessChat:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Fetch all chats for a specific user
export const fetchChats = async (req, res) => {
  try {
    let chats = await Chat.find({
      participants: { $elemMatch: { $eq: req.user._id } },
    })
      .populate('participants', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: 'latestMessage.sender',
      select: 'username email profilePic bio',
    });

    res.status(200).json(chats);
  } catch (error) {
    console.error('Error in fetchChats:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Create a group chat
export const createGroupChat = async (req, res) => {
  const { participants, chatName } = req.body;

  if (!participants || !chatName) {
    return res.status(400).json({ message: 'Please fill all fields (participants, chatName)' });
  }

  let users = JSON.parse(participants);

  if (users.length < 2) {
    return res.status(400).json({ message: 'A group chat requires at least 2 other users' });
  }

  // Include the current logged-in user in the group
  users.push(req.user._id);

  try {
    const groupChat = await Chat.create({
      chatName,
      isGroupChat: true,
      participants: users,
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate('participants', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json(fullGroupChat);
  } catch (error) {
    console.error('Error in createGroupChat:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Rename a Group Room
export const renameGroup = async (req, res) => {
  const { chatId, chatName } = req.body;

  if (!chatId || !chatName) {
    return res.status(400).json({ message: 'ChatId and chatName are required' });
  }

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate('participants', '-password')
      .populate('groupAdmin', '-password');

    if (!updatedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.status(200).json(updatedChat);
  } catch (error) {
    console.error('Error in renameGroup:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Add user to Group
export const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    return res.status(400).json({ message: 'ChatId and userId are required' });
  }

  try {
    // Check if the current user is admin of the group
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admins can add participants' });
    }

    const added = await Chat.findByIdAndUpdate(
      chatId,
      { $addToSet: { participants: userId } }, // prevent duplicate adding
      { new: true }
    )
      .populate('participants', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json(added);
  } catch (error) {
    console.error('Error in addToGroup:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Remove user from Group (or leave group)
export const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    return res.status(400).json({ message: 'ChatId and userId are required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Only allow admins to remove users, OR let a user leave their own group
    const isSelfLeaving = userId.toString() === req.user._id.toString();
    const isAdmin = chat.groupAdmin.toString() === req.user._id.toString();

    if (!isAdmin && !isSelfLeaving) {
      return res.status(403).json({ message: 'Only admins can remove users' });
    }

    const removed = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { participants: userId } },
      { new: true }
    )
      .populate('participants', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json(removed);
  } catch (error) {
    console.error('Error in removeFromGroup:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
