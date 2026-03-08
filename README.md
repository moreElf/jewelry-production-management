# Jewelry Production Management

Internal web app for jewelry workshop production tracking built with Next.js App Router, TypeScript, Prisma, and PostgreSQL.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Set `DATABASE_URL` in `.env`.

3. Push the schema and seed sample data:

```bash
npx prisma db push
npm run db:seed
```

4. Start the app:

```bash
npm run dev
```

## Vercel deployment

Recommended setup:

- Vercel for the app
- Neon or Supabase for managed PostgreSQL

### 1. Create a production database

Create a hosted PostgreSQL database and copy its connection string.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

### 2. Import the repo into Vercel

- Open Vercel
- Import `moreElf/jewelry-production-management`
- Keep the default Next.js framework settings

### 3. Set environment variables in Vercel

Add:

```env
DATABASE_URL=your-production-postgres-url
```

`postinstall` already runs `prisma generate`, so Prisma Client will be generated during install.

### 4. Initialize the production database

This project currently uses `prisma db push` rather than checked-in SQL migrations.
Run this once against the production database before using the app:

```bash
npx prisma db push
```

If you want sample data in a staging environment:

```bash
npm run db:seed
```

Do not seed production unless you intentionally want the sample users, products, and orders.

### 5. Redeploy

After `DATABASE_URL` is set and the schema exists, redeploy from Vercel.

## Notes

- The app is server-rendered and uses Prisma directly from the Next.js server.
- The current local `.env` uses a Unix socket connection and should not be copied to production.
