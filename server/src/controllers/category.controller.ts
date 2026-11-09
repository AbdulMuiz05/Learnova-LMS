import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Category } from '../models/Category';
import { Course } from '../models/Course';
import { ApiError } from '../utils/ApiError';
import { asyncHandler, sendSuccess } from '../utils/response';
import { ensureUniqueSlug } from '../utils/slug';
import { cache, cacheKeys } from '../config/redis';

async function countsMap(publishedOnly: boolean): Promise<Map<string, number>> {
  const match = publishedOnly ? { status: 'published' } : {};
  const rows = await Course.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: match },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const cached = await cache.get<unknown[]>(cacheKeys.categories);
  if (cached) {
    sendSuccess(res, { categories: cached });
    return;
  }
  const [categories, counts] = await Promise.all([
    Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean(),
    countsMap(true),
  ]);
  const payload = categories.map((category) => ({
    ...category,
    courseCount: counts.get(String(category._id)) ?? 0,
  }));
  await cache.set(cacheKeys.categories, payload, 300);
  sendSuccess(res, { categories: payload });
});

export const listAllCategories = asyncHandler(async (_req: Request, res: Response) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).lean(),
    countsMap(false),
  ]);
  sendSuccess(res, {
    categories: categories.map((category) => ({
      ...category,
      courseCount: counts.get(String(category._id)) ?? 0,
    })),
  });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;
  const existing = await Category.findOne({ name: body.name }).lean();
  if (existing) throw ApiError.conflict('A category with this name already exists', 'CATEGORY_EXISTS');
  const slug = await ensureUniqueSlug(Category, body.name);
  const category = await Category.create({ ...body, slug });
  await cache.del(cacheKeys.categories);
  await cache.del(cacheKeys.homepage);
  sendSuccess(res, { category }, 'Category created', 201);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.categoryId);
  if (!category) throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND');

  if (req.body.name && req.body.name !== category.name) {
    const duplicate = await Category.findOne({ name: req.body.name, _id: { $ne: category._id } }).lean();
    if (duplicate) throw ApiError.conflict('A category with this name already exists', 'CATEGORY_EXISTS');
  }
  Object.assign(category, req.body);
  await category.save();
  await cache.del(cacheKeys.categories);
  await cache.del(cacheKeys.homepage);
  sendSuccess(res, { category }, 'Category updated');
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.categoryId);
  if (!category) throw ApiError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
  const courses = await Course.countDocuments({ category: category._id });
  if (courses > 0) {
    throw ApiError.conflict(
      `This category is used by ${courses} course${courses === 1 ? '' : 's'}. Move them first.`,
      'CATEGORY_IN_USE'
    );
  }
  await category.deleteOne();
  await cache.del(cacheKeys.categories);
  await cache.del(cacheKeys.homepage);
  sendSuccess(res, null, 'Category deleted');
});
