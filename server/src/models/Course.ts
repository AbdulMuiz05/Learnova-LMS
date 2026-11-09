import { Schema, model, Document, Types } from 'mongoose';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published';

export interface IInstructor {
  name: string;
  title: string;
  bio: string;
  avatar: string;
}

export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: { url: string; publicId: string };
  category: Types.ObjectId;
  level: CourseLevel;
  price: number;
  discountPrice: number | null;
  benefits: string[];
  requirements: string[];
  instructor: IInstructor;
  status: CourseStatus;
  featured: boolean;
  language: string;
  rating: { average: number; count: number };
  enrollmentCount: number;
  totalDuration: number;
  totalLessons: number;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, maxlength: 20000 },
    shortDescription: { type: String, required: true, maxlength: 400 },
    thumbnail: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    price: { type: Number, required: true, min: 0, default: 0 },
    discountPrice: { type: Number, min: 0, default: null },
    benefits: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    instructor: {
      name: { type: String, default: 'Learnova Instructor' },
      title: { type: String, default: 'Senior Engineer' },
      bio: { type: String, default: '' },
      avatar: { type: String, default: '' },
    },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    featured: { type: Boolean, default: false, index: true },
    language: { type: String, default: 'English' },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    enrollmentCount: { type: Number, default: 0, min: 0 },
    totalDuration: { type: Number, default: 0, min: 0 },
    totalLessons: { type: Number, default: 0, min: 0 },
    publishedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        return ret;
      },
    },
  }
);

courseSchema.index({ status: 1, featured: -1, createdAt: -1 });
courseSchema.index({ title: 'text', description: 'text' });

courseSchema.pre('validate', function (next) {
  const course = this as unknown as ICourse;
  if (
    course.discountPrice !== null &&
    course.discountPrice !== undefined &&
    course.price > 0 &&
    course.discountPrice >= course.price
  ) {
    return next(new Error('Discount price must be lower than the regular price.'));
  }
  next();
});

export const Course = model<ICourse>('Course', courseSchema);
