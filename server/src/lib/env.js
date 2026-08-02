import dotenv from 'dotenv';

dotenv.config();

// Fail fast on startup if required configuration is missing.
const REQUIRED = [
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'CLERK_PUBLISHABLE_KEY',
  'FRONTEND_URL',
];

// ADMIN_CLERK_USER_ID is optional (only needed for seeding the admin record).
// CLERK_ORG_ID is optional - disambiguates which org grants access if a user
// belongs to more than one. If unset, any org membership is accepted.
const OPTIONAL = ['ADMIN_CLERK_USER_ID', 'CLERK_ORG_ID', 'PORT'];

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `\n[CentralHub] Missing required environment variables:\n  - ${missing.join(
        '\n  - '
      )}\n\nCopy server/.env.example to server/.env and fill in the values.\n`
    );
    process.exit(1);
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  ADMIN_CLERK_USER_ID: process.env.ADMIN_CLERK_USER_ID || null,
  CLERK_ORG_ID: process.env.CLERK_ORG_ID || null,
  FRONTEND_URL: process.env.FRONTEND_URL,
  PORT: parseInt(process.env.PORT || '3001', 10),
};

// Referenced so linters don't flag the optional list as unused documentation.
export const OPTIONAL_ENV = OPTIONAL;
