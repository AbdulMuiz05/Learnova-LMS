import { Schema, model, Document, Types } from 'mongoose';

export interface IVideo {
  publicId: string;
  provider: 'cloudinary' | 'external';
  type: 'upload' | 'authenticated';
  url: string;
  duration: number;
  poster: string;
}

export interface IResource {
  title: string;
  url: string;
}

export interface ILesson extends Document {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  section: Types.ObjectId;
  title: string;
  description: string;
  video: IVideo;
  duration: number;
  resources: IResource[];
  order: number;
  isPreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    section: { type: Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 5000 },
    video: {
      publicId: { type: String, default: '' },
      provider: { type: String, enum: ['cloudinary', 'external'], default: 'external' },
      type: { type: String, enum: ['upload', 'authenticated'], default: 'upload' },
      url: { type: String, default: '' },
      duration: { type: Number, default: 0, min: 0 },
      poster: { type: String, default: '' },
    },
    duration: { type: Number, default: 0, min: 0 },
    resources: {
      type: [
        new Schema<IResource>(
          {
            title: { type: String, required: true, maxlength: 160 },
            url: { type: String, required: true, maxlength: 2000 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    order: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

lessonSchema.index({ course: 1, order: 1 });
lessonSchema.index({ section: 1, order: 1 });

export const Lesson = model<ILesson>('Lesson', lessonSchema);
