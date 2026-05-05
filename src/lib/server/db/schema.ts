import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const stories = sqliteTable('stories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  dek: text('dek').notNull(),
  body: text('body').notNull(),
  category: text('category', {
    enum: ['Klima', 'Gesundheit', 'Wissenschaft', 'Gemeinschaft', 'Tiere', 'Kultur', 'Innovation']
  }).notNull(),
  region: text('region').notNull(),
  country: text('country').notNull(),
  coordsX: real('coords_x').notNull(),
  coordsY: real('coords_y').notNull(),
  source: text('source').notNull(),
  sourceUrl: text('source_url').notNull(),
  publishedAt: text('published_at').notNull(),
  readingMinutes: integer('reading_minutes').notNull().default(3),
  impactScore: integer('impact_score').notNull().default(50),
  impactNote: text('impact_note').notNull().default(''),
  tone: text('tone', {
    enum: ['amber', 'sage', 'rose', 'sky']
  }).notNull().default('amber'),
  hero: text('hero').notNull().default('✨'),
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
  local: integer('local', { mode: 'boolean' }).notNull().default(false),
  featuredDate: text('featured_date'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP')
});

export const subscribers = sqliteTable('subscribers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  plan: text('plan', { enum: ['free', 'plus', 'b2b'] }).notNull().default('free'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP')
});

export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP')
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
});

export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;
