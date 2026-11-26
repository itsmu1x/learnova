import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(160),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

/** Store LinkedIn vanity username only (not a full URL). */
const linkedinUsernameSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .transform((value) => {
    const fromUrl = value.match(/linkedin\.com\/in\/([^/?#\s]+)/i);
    const username = (fromUrl ? decodeURIComponent(fromUrl[1]) : value.replace(/^@+/, ''))
      .replace(/\/+$/, '')
      .split(/[/?#]/)[0];
    return username;
  })
  .refine((value) => /^[a-zA-Z0-9-]{2,100}$/.test(value), {
    message: 'Enter your LinkedIn username only (letters, numbers, hyphens)',
  });

export const registerInstructorSchema = z.object({
  name: z.string().min(2).max(160),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  headline: z.string().max(200).optional(),
  bio: z.string().max(4000).optional(),
  expertise: z.string().min(10).max(2000),
  motivation: z.string().min(20).max(4000),
  experienceYears: z.number().int().min(0).max(60).optional(),
  portfolioUrl: z.string().url().max(500).optional(),
  linkedinUrl: z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    linkedinUsernameSchema.optional(),
  ),
  certificateUrl: z.string().url().max(1000).optional(),
  certificateFileName: z.string().max(255).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export const oauthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
});
