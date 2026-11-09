import { Schema, model, Document, Types } from 'mongoose';

export interface IHomepage extends Document {
  key: string;
  hero: {
    headline: string;
    subheadline: string;
    description: string;
    image: { url: string; publicId: string };
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    badge: string;
  };
  featuredCourses: Types.ObjectId[];
  benefits: { title: string; description: string; icon: string }[];
  updatedAt: Date;
  createdAt: Date;
}

const homepageSchema = new Schema<IHomepage>(
  {
    key: { type: String, default: 'homepage', unique: true },
    hero: {
      headline: { type: String, default: 'Learn the skills that move your career forward' },
      subheadline: { type: String, default: 'Industry-grade courses, taught by engineers who ship.' },
      description: {
        type: String,
        default:
          'Master full-stack engineering, cloud, data and design with project-based courses built for the modern workplace.',
      },
      image: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
      primaryCta: { label: { type: String, default: 'Browse courses' }, href: { type: String, default: '/courses' } },
      secondaryCta: { label: { type: String, default: 'Join for free' }, href: { type: String, default: '/register' } },
      badge: { type: String, default: 'Trusted by 12,000+ learners worldwide' },
    },
    featuredCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    benefits: {
      type: [
        new Schema(
          {
            title: { type: String, required: true, maxlength: 120 },
            description: { type: String, required: true, maxlength: 300 },
            icon: { type: String, default: 'Award' },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

export const Homepage = model<IHomepage>('Homepage', homepageSchema);
