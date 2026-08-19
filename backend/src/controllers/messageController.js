import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// Send a Message
export const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;
  let fileUrl = req.body.fileUrl || '';
  let fileType = req.body.fileType || 'text';

  if (!chatId) {
    return res.status(400).json({ message: 'ChatId parameter is required' });
  }

  if (req.file) {
    let picUrl = await uploadToCloudinary(req.file.path);
    if (!picUrl) {
      // Local fallback
      picUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    fileUrl = picUrl;

    const mime = req.file.mimetype;
    if (mime.startsWith('image/')) {
      fileType = 'image';
    } else if (mime.startsWith('video/')) {
      fileType = 'video';
    } else {
      fileType = 'file';
    }
  }

  if (!content && !fileUrl) {
    return res.status(400).json({ message: 'Message content or file is required' });
  }

  try {
    let newMessage = {
      sender: req.user._id,
      chat: chatId,
      content: content || '',
      fileUrl: fileUrl,
      fileType: fileType,
      readBy: [{ user: req.user._id }], // Creator has read it
    };

    let message = await Message.create(newMessage);

    message = await message.populate('sender', 'username email profilePic bio');
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.participants',
      select: 'username email profilePic bio',
    });

    // Update latestMessage reference in Chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(200).json(message);
  } catch (error) {
    console.error('Error in sendMessage:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Fetch all messages for a chat, marking unread ones as read
export const allMessages = async (req, res) => {
  const { chatId } = req.params;

  if (!chatId) {
    return res.status(400).json({ message: 'ChatId parameter is required' });
  }

  try {
    // Check if the chat exists and user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const isParticipant = chat.participants.some(
      (participantId) => participantId.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    // Mark all unread messages in this chat for the current user as read
    await Message.updateMany(
      { chat: chatId, 'readBy.user': { $ne: req.user._id } },
      { $addToSet: { readBy: { user: req.user._id, readAt: new Date() } } }
    );

    // Fetch messages
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'username email profilePic bio')
      .populate('chat');

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in allMessages:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
