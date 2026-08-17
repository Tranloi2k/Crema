# Crema

Crema is a drag and drop email builder. You drop blocks on a canvas, check desktop and mobile, send yourself a test, then export HTML that still works in real inboxes.

Live site: [cremastudio.work](https://cremastudio.work)

## What it does

The editor is block based: text, image, button, divider, spacer, stack, and social icons. Stacks can nest. You get undo/redo, autosave, and version history if you need to roll back.

Other bits:

- Desktop and mobile preview, plus a test send through Resend
- HTML export (table based, because email clients) and a plain text version
- Starter templates: Welcome, Newsletter, Announcement, Promotion
- Guest drafts in localStorage, no account required until you want to save for real
- Google, GitHub, or email/password with a 6-digit OTP
- Optional public link at `/p/[slug]`
- Merge tags for Brevo, Mailchimp, SendGrid, Klaviyo, or a generic format
- Billing through Lemon Squeezy (Free / Pro / Pro+)

## Stack

Next.js 15 (App Router), React 19, TypeScript. Tailwind and shadcn for UI, TipTap for text, Zustand + @dnd-kit for the editor.

Database is Drizzle on Turso. Auth is NextAuth (JWT). Images go to Cloudinary. Email is Resend. Payments are Lemon Squeezy.

## Getting started

You need Node 18+ and a [Turso](https://turso.tech) database.

```bash
git clone https://github.com/Tranloi2k/Crema.git
cd Crema
npm install
cp .env.example .env.local
```

Fill in `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `NEXTAUTH_SECRET` at minimum. Then:

```bash
npm run db:push
npm run dev
```

App runs at [http://localhost:3001](http://localhost:3001), not 3000.

Locally you get a "Continue as Dev User" button. That stays off on Vercel. Set `ALLOW_DEV_BYPASS=false` if you don't want it even on your machine.

## Scripts

```bash
npm run dev        # port 3001
npm run build
npm start
npm run lint
npm run db:push    # push schema to Turso
npm run db:studio
```

## Where things live

```
src/app/          pages and API routes
src/components/   builder, dashboard, auth, marketing
src/lib/          auth, billing, schema, HTML export, editor store
```

Editor is `/editor/[templateId]`. Dashboard is `/dashboard`. Public preview is `/p/[slug]`. Schema sits in `src/lib/db/schema.ts`, HTML export in `src/lib/export/toHtml.ts`.

## License

Private. All rights reserved.
