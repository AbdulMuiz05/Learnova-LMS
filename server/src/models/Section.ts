import { Schema, model, Document, Types } from 'mongoose';

export interface ISection extends Document {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  title: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema<ISection>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

sectionSchema.index({ course: 1, order: 1 });

export const Section = model<ISection>('Section', sectionSchema);
