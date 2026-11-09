import { Schema, model, Document } from 'mongoose';

export interface ISiteSettings extends Document {
  key: string;
  siteName: string;
  tagline: string;
  supportEmail: string;
  phone: string;
  address: string;
  footerText: string;
  currency: string;
  socials: {
    twitter: string;
    facebook: string;
    linkedin: string;
    youtube: string;
    instagram: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, default: 'site', unique: true },
    siteName: { type: String, default: 'Learnova' },
    tagline: { type: String, default: 'Learn. Build. Ship.' },
    supportEmail: { type: String, default: 'support@learnova.local' },
    phone: { type: String, default: '+1 (555) 010-2030' },
    address: { type: String, default: 'Remote-first · Worldwide' },
    footerText: {
      type: String,
      default: 'Learnova — practical, project-based education for modern engineers.',
    },
    currency: { type: String, default: 'usd', lowercase: true },
    socials: {
      twitter: { type: String, default: '' },
      facebook: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      youtube: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
  },
  { timestamps: true, versionKey: false }
);

export const SiteSettings = model<ISiteSettings>('SiteSettings', siteSettingsSchema);
