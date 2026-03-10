# Migrate Nodemailer to Resend - Reusable Prompt

Copy and paste this prompt into Claude Code for any project that uses Nodemailer and needs to switch to Resend.

---

## Prompt

```
I need you to migrate all email sending in this project from Nodemailer (SMTP) to Resend (API-based).

Follow these exact steps:

### 1. Install Resend, remove Nodemailer
```bash
npm install resend
npm uninstall nodemailer @types/nodemailer
```

### 2. Create a shared email utility at `lib/resend.ts`
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export type EmailOptions = {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions) {
  const from = process.env.EMAIL_FROM || 'Your App <noreply@yourdomain.com>'

  const { data, error } = await resend.emails.send({
    from,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
    text: options.text,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}
```

### 3. Find and replace all Nodemailer usage
Search the entire codebase for:
- `import nodemailer` or `require('nodemailer')`
- `nodemailer.createTransport` or `nodemailer.default.createTransport`
- `transporter.sendMail`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

For each file found:
1. Replace `import nodemailer` with `import { sendEmail } from '@/lib/resend'` (or dynamic import if in a server action: `const { sendEmail } = await import('@/lib/resend')`)
2. Remove the entire `createTransport(...)` block
3. Remove the `from` field from all mail option objects (it's now handled centrally)
4. Replace `transporter.sendMail(mailOptions)` with `sendEmail(mailOptions)`
5. Replace any SMTP config checks like `if (!process.env.SMTP_HOST)` with `if (!process.env.RESEND_API_KEY)`

### 4. Update environment variables
In `.env`:
```
# Remove these:
# SMTP_HOST=...
# SMTP_PORT=...
# SMTP_SECURE=...
# SMTP_USER=...
# SMTP_PASS=...
# SMTP_FROM=...

# Add these:
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=Your App <noreply@yourdomain.com>
```

Update `.env.example` the same way.

### 5. Create a test endpoint at `app/api/test-email/route.ts`
Create a GET endpoint that:
- Checks if `RESEND_API_KEY` is configured
- Sends a test email to `CONTACT_EMAIL` or a hardcoded fallback
- Returns success/error JSON response
- Uses the same `sendEmail` utility

### 6. Verify the build compiles
Run `npm run build` or `npx tsc --noEmit` to ensure no TypeScript errors.

### Important notes:
- Resend requires a verified domain. You get the API key from https://resend.com/api-keys
- For development/testing, Resend provides a free tier and you can use `onboarding@resend.dev` as FROM while testing
- The `from` address domain must match a verified domain in your Resend dashboard
- Keep all existing HTML email templates exactly as they are - only change the transport layer
- The Resend `to` field accepts `string | string[]` so array recipients work natively
```

---

## Resend Setup Checklist

1. Sign up at https://resend.com
2. Verify your sending domain (add DNS records: SPF, DKIM, DMARC)
3. Create an API key at https://resend.com/api-keys
4. Add `RESEND_API_KEY=re_xxxxx` to your `.env`
5. Set `EMAIL_FROM=Your Name <email@yourdomain.com>` (must match verified domain)
6. Test by visiting `/api/test-email` in your browser

## Key Differences from Nodemailer

| Feature | Nodemailer | Resend |
|---------|-----------|--------|
| Transport | SMTP (host, port, auth) | API key |
| Setup | `createTransport({...})` | `new Resend(apiKey)` |
| Send | `transporter.sendMail(opts)` | `resend.emails.send(opts)` |
| Auth | SMTP user/password | API key |
| `from` field | Required per email | Required per email |
| `to` field | String (comma-separated) | `string \| string[]` |
| Error handling | Throws on failure | Returns `{ data, error }` |
| Dependencies | `nodemailer` + `@types/nodemailer` | `resend` (includes types) |
