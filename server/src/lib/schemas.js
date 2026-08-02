import { z } from 'zod';

// https-only URL. Rejects http://, javascript:, data:, ftp:, etc.
const httpsUrl = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .refine((val) => {
    try {
      return new URL(val).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'URL must use https://');

const nonEmptyId = z.string().trim().min(1, 'Required');

export const platformCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  url: httpsUrl,
  iconName: z.string().trim().min(1).max(100),
  categoryId: nonEmptyId,
  displayOrder: z.coerce.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  searchKeywords: z
    .array(z.string().trim().min(1).max(50))
    .max(20)
    .default([]),
});

// All fields optional for updates, but the same constraints when present.
export const platformUpdateSchema = platformCreateSchema.partial();

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const preferenceUpdateSchema = z
  .object({
    isVisible: z.boolean().optional(),
    isFavorite: z.boolean().optional(),
  })
  .refine((d) => d.isVisible !== undefined || d.isFavorite !== undefined, {
    message: 'Provide isVisible and/or isFavorite',
  });

export const roleUpdateSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export const idParamSchema = z.object({ id: nonEmptyId });
export const platformIdParamSchema = z.object({ platformId: nonEmptyId });
