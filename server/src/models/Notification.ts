import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType = 'order' | 'user' | 'question' | 'review' | 'system';

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['order', 'user', 'question', 'review', 'system'],
      default: 'system',
    },
    title: { type: String, required: true, maxlength: 160 },
    message: { type: String, required: true, maxlength: 500 },
    link: { type: String, default: '/admin' },
    isRead: { type: Boolean, default: false, index: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
