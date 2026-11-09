import { Schema, model, Document, Types } from 'mongoose';

export interface IAnswer {
  user: Types.ObjectId;
  content: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface IQuestion extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  course: Types.ObjectId;
  lesson: Types.ObjectId;
  content: string;
  answers: IAnswer[];
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<IAnswer>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const questionSchema = new Schema<IQuestion>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    content: { type: String, required: true, trim: true, minlength: 3, maxlength: 3000 },
    answers: { type: [answerSchema], default: [] },
    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

questionSchema.index({ lesson: 1, createdAt: -1 });
questionSchema.index({ course: 1, createdAt: -1 });

export const Question = model<IQuestion>('Question', questionSchema);
