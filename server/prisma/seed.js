// CentralHub seed script.
// Populates the 6 categories and 11 platforms with PLACEHOLDER URLs
// (https://example.com/...). The admin updates real URLs after deployment.
// If ADMIN_CLERK_USER_ID is set, an admin User record is created/updated.
//
// Idempotent: safe to run repeatedly (upserts by unique slug/id).

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const slugify = (s) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const CATEGORIES = [
  { name: 'Property Management', displayOrder: 1 },
  { name: 'Leasing', displayOrder: 2 },
  { name: 'Communication', displayOrder: 3 },
  { name: 'Resident Services', displayOrder: 4 },
  { name: 'Operations', displayOrder: 5 },
  { name: 'HR & Payroll', displayOrder: 6 },
];

// category = category name; icon = Lucide component name.
const PLATFORMS = [
  {
    name: 'Waves',
    category: 'Property Management',
    iconName: 'Building2',
    description:
      'Property management system for unit tracking, work orders, and resident accounts',
    searchKeywords: ['property management', 'units', 'work orders', 'maintenance', 'residents', 'PMS'],
  },
  {
    name: 'Lease Flow',
    category: 'Leasing',
    iconName: 'FileText',
    description: 'Leasing platform for applications, lease agreements, and prospect management',
    searchKeywords: ['leasing', 'applications', 'lease', 'prospects', 'renewals', 'move-in'],
  },
  {
    name: 'Leasing Messages',
    category: 'Leasing',
    iconName: 'MessageSquare',
    description: 'Messaging platform for leasing prospect communication',
    searchKeywords: ['messages', 'prospects', 'leads', 'inquiries', 'leasing communication', 'texts'],
  },
  {
    name: 'Zendesk',
    category: 'Communication',
    iconName: 'Headphones',
    description: 'Support ticket system for resident requests and issue tracking',
    searchKeywords: ['support', 'tickets', 'help desk', 'resident requests', 'issues', 'service'],
  },
  {
    name: 'HubSpot',
    category: 'Leasing',
    iconName: 'Target',
    description: 'CRM for lead tracking, marketing, and prospect engagement',
    searchKeywords: ['CRM', 'leads', 'marketing', 'prospects', 'pipeline', 'outreach', 'campaigns'],
  },
  {
    name: 'Parking Log',
    category: 'Operations',
    iconName: 'Car',
    description: 'Parking spot management and vehicle registration tracking',
    searchKeywords: ['parking', 'vehicles', 'spots', 'garage', 'registration', 'towing'],
  },
  {
    name: 'ButterflyMX',
    category: 'Resident Services',
    iconName: 'DoorOpen',
    description: 'Access control for building entry, visitor management, and garage access',
    searchKeywords: ['access', 'entry', 'doors', 'visitors', 'garage', 'guest', 'buzzer', 'intercom'],
  },
  {
    name: 'Gmail',
    category: 'Communication',
    iconName: 'Mail',
    description: 'Flow team email for internal and external communication',
    searchKeywords: ['email', 'mail', 'inbox', 'messages', 'correspondence'],
  },
  {
    name: 'Slack',
    category: 'Communication',
    iconName: 'Hash',
    description: 'Team messaging and collaboration workspace',
    searchKeywords: ['chat', 'messaging', 'channels', 'team', 'collaboration', 'instant message'],
  },
  {
    name: 'Foxen',
    category: 'Operations',
    iconName: 'Shield',
    description: "Insurance compliance and renter's insurance verification",
    searchKeywords: ['insurance', 'compliance', "renter's insurance", 'verification', 'coverage'],
  },
  {
    name: 'Rippling',
    category: 'HR & Payroll',
    iconName: 'Users',
    description: 'HR, payroll, benefits, and employee management platform',
    searchKeywords: ['HR', 'payroll', 'benefits', 'time off', 'PTO', 'onboarding', 'employee', 'pay'],
  },
];

async function main() {
  console.log('Seeding categories...');
  const categoryBySlug = {};
  for (const c of CATEGORIES) {
    const slug = slugify(c.name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name: c.name, displayOrder: c.displayOrder },
      create: { name: c.name, slug, displayOrder: c.displayOrder },
    });
    categoryBySlug[c.name] = category;
  }

  console.log('Seeding platforms...');
  let order = 0;
  for (const p of PLATFORMS) {
    const slug = slugify(p.name);
    const category = categoryBySlug[p.category];
    if (!category) throw new Error(`Missing category for platform ${p.name}`);
    await prisma.platform.upsert({
      where: { slug },
      update: {
        name: p.name,
        description: p.description,
        iconName: p.iconName,
        categoryId: category.id,
        searchKeywords: p.searchKeywords,
      },
      create: {
        name: p.name,
        slug,
        description: p.description,
        url: `https://example.com/${slug}`, // PLACEHOLDER — admin updates after deploy
        iconName: p.iconName,
        categoryId: category.id,
        displayOrder: order++,
        searchKeywords: p.searchKeywords,
      },
    });
  }

  const adminClerkId = process.env.ADMIN_CLERK_USER_ID;
  if (adminClerkId) {
    console.log('Seeding admin user...');
    await prisma.user.upsert({
      where: { clerkUserId: adminClerkId },
      update: { role: 'ADMIN' },
      create: {
        clerkUserId: adminClerkId,
        email: 'admin@flow.life',
        displayName: 'Admin',
        role: 'ADMIN',
      },
    });
  } else {
    console.log('ADMIN_CLERK_USER_ID not set — skipping admin user seed.');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
