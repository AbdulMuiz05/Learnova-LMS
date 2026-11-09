import { Schema, model, Document, Types } from 'mongoose';

export interface IEnrollment extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  course: Types.ObjectId;
  completedLessons: Types.ObjectId[];
  progress: number;
  lastLesson: Types.ObjectId | null;
  lastAccessedAt: Date | null;
  enrolledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    progress: { type: Number, default: 0, min: 0, max: 100 },
    lastLesson: { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
    lastAccessedAt: { type: Date, default: null },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export const Enrollment = model<IEnrollment>('Enrollment', enrollmentSchema);
