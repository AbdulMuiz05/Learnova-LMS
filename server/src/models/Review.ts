import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  course: Types.ObjectId;
  rating: number;
  comment: string;
  adminReply?: { content: string; repliedAt: Date } | null;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 3, maxlength: 2000 },
    adminReply: {
      type: new Schema(
        {
          content: { type: String, maxlength: 2000 },
          repliedAt: { type: Date },
        },
        { _id: false }
      ),
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

reviewSchema.index({ user: 1, course: 1 }, { unique: true });
reviewSchema.index({ course: 1, createdAt: -1 });

export const Review = model<IReview>('Review', reviewSchema);
