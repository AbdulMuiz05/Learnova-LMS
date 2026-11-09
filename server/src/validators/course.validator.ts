import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

const nullableNumber = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

export const courseQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  sort: z.enum(['newest', 'oldest', 'price-asc', 'price-desc', 'popular', 'rating']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createCourseSchema = z.object({
  title: z.string().trim().min(4, 'Title is too short').max(160),
  description: z.string().trim().min(20, 'Description should be at least 20 characters').max(20000),
  shortDescription: z.string().trim().min(10, 'Short description is too short').max(400),
  category: objectId,
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  price: z.coerce.number().min(0, 'Price cannot be negative').max(100000),
  discountPrice: nullableNumber,
  benefits: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  requirements: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  language: z.string().trim().max(40).default('English'),
  featured: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  instructor: z
    .object({
      name: z.string().trim().max(120).default('Learnova Instructor'),
      title: z.string().trim().max(120).default('Senior Engineer'),
      bio: z.string().trim().max(1000).default(''),
      avatar: z.string().trim().max(1000).default(''),
    })
    .optional(),
  thumbnail: z
    .object({
      url: z.string().trim().max(2000).default(''),
      publicId: z.string().trim().max(500).default(''),
    })
    .optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const publishCourseSchema = z.object({
  status: z.enum(['draft', 'published']),
});

export const sectionSchema = z.object({
  title: z.string().trim().min(2).max(160),
});

export const reorderSchema = z.object({
  orderedIds: z.array(objectId).min(1),
});

const videoSchema = z.object({
  publicId: z.string().trim().max(500).default(''),
  provider: z.enum(['cloudinary', 'external']).default('external'),
  type: z.enum(['upload', 'authenticated']).default('upload'),
  url: z.string().trim().max(3000).default(''),
  duration: z.coerce.number().min(0).default(0),
  poster: z.string().trim().max(2000).default(''),
});

const resourceSchema = z.object({
  title: z.string().trim().min(1).max(160),
  url: z.string().trim().url('Resource links must be valid URLs').max(2000),
});

export const lessonSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).default(''),
  section: objectId.optional(),
  video: videoSchema.optional(),
  duration: z.coerce.number().min(0).default(0),
  resources: z.array(resourceSchema).max(20).default([]),
  isPreview: z.boolean().default(false),
});

export const updateLessonSchema = lessonSchema.partial();

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).default(''),
  icon: z.string().trim().max(60).default('BookOpen'),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = categorySchema.partial();
