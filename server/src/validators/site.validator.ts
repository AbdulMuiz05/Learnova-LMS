import { z } from 'zod';

export const homepageSchema = z.object({
  hero: z
    .object({
      headline: z.string().trim().min(5).max(200).optional(),
      subheadline: z.string().trim().max(300).optional(),
      description: z.string().trim().max(1000).optional(),
      badge: z.string().trim().max(160).optional(),
      image: z
        .object({
          url: z.string().trim().max(2000).optional(),
          publicId: z.string().trim().max(500).optional(),
        })
        .optional(),
      primaryCta: z
        .object({ label: z.string().trim().max(60), href: z.string().trim().max(300) })
        .optional(),
      secondaryCta: z
        .object({ label: z.string().trim().max(60), href: z.string().trim().max(300) })
        .optional(),
    })
    .optional(),
  featuredCourses: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).max(12).optional(),
  benefits: z
    .array(
      z.object({
        title: z.string().trim().min(2).max(120),
        description: z.string().trim().min(2).max(300),
        icon: z.string().trim().max(60).default('Award'),
      })
    )
    .max(8)
    .optional(),
});

export const faqSchema = z.object({
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(5).max(3000),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateFaqSchema = faqSchema.partial();

export const settingsSchema = z.object({
  siteName: z.string().trim().min(2).max(80).optional(),
  tagline: z.string().trim().max(160).optional(),
  supportEmail: z.string().trim().email().optional(),
  phone: z.string().trim().max(60).optional(),
  address: z.string().trim().max(200).optional(),
  footerText: z.string().trim().max(400).optional(),
  currency: z.string().trim().length(3).toLowerCase().optional(),
  socials: z
    .object({
      twitter: z.string().trim().max(300).optional(),
      facebook: z.string().trim().max(300).optional(),
      linkedin: z.string().trim().max(300).optional(),
      youtube: z.string().trim().max(300).optional(),
      instagram: z.string().trim().max(300).optional(),
    })
    .optional(),
});
