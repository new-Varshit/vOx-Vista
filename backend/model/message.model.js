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
        ref: 'chatRoom',
        required: true
    },
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
        },
      ],


}, { timestamps: true });

export const Message = mongoose.model('Message', messageSchema)