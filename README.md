# Vibe Auction

## Setup

1. Clone the repository
2. Create a Supabase project
3. Copy `.env.example` to `.env`
4. Add your Supabase URL and anon key
5. Run database migrations

## Development

- Recommended Node.js version: 18+
- Backend: Supabase
- Recommended frontend: Next.js

## Database

Migrations are in `supabase/migrations/`

## Deployment

### Vercel Deployment Troubleshooting

- Ensure Node.js version is set to 18.x
- Add `vercel.json` for custom configuration
- Set environment variables in Vercel project settings
- Verify build scripts in `package.json`

Potential build issues:
- Check Vercel build logs
- Confirm all dependencies are installed
- Verify environment variable configurations