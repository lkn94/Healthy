import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  APP_PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
  DB_URL: z.string().default('file:../data/app.db'),
  SYNC_INTERVAL_MINUTES: z.coerce.number().default(30),
  DEFAULT_DAILY_GOAL: z.coerce.number().default(10000),
  DEFAULT_STEP_LENGTH_METERS: z.coerce.number().default(0.75)
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.parse(process.env);

const normalizeDbUrl = (url: string) => {
  if (!url.startsWith('file:')) {
    return url;
  }
  const filePath = url.replace('file:', '');
  if (path.isAbsolute(filePath)) {
    return url;
  }
  const prismaDir = path.resolve(__dirname, '../prisma');
  const absolutePath = path.resolve(prismaDir, filePath);
  return `file:${absolutePath}`;
};

parsed.DB_URL = normalizeDbUrl(parsed.DB_URL);

export const env: Env = parsed;
