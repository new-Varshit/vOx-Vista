import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({

  content: {
    type: String
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
<<<<<<< HEAD
  isSystem: {
    type: Boolean,
    default: false
  },
=======
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556
  deletedFor: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
<<<<<<< HEAD
  deliveredTo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  readBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
=======
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556
  attachments: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      mimeType: {
        type: String,
        required: true
      }
    },
  ],


}, { timestamps: true });

export const Message = mongoose.model('Message', messageSchema)