# Supabase Setup Guide

This guide will help you set up Supabase for cloud persistence with the least expensive option (free tier).

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Create a new organization (if needed)
5. Click "New Project"

## Step 2: Create Project

1. **Project Name**: `starfox-calendar` (or your choice)
2. **Database Password**: Generate a strong password (save it!)
3. **Region**: Choose closest to your users
4. **Pricing Plan**: Select **Free** tier
5. Click "Create new project"

Wait 2-3 minutes for project to initialize.

## Step 3: Run Database Migrations

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New query"
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" (or press Cmd/Ctrl + Enter)
5. Verify success (should see "Success. No rows returned")

## Step 4: Configure Authentication

### Enable Email/Password Auth
1. Go to **Authentication** > **Providers**
2. **Email** should already be enabled
3. Configure email templates if desired

### Configure OAuth Providers

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: 
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   (Find your project ref in Supabase Settings > API)
7. Copy **Client ID** and **Client Secret**
8. In Supabase: **Authentication** > **Providers** > **Google**
   - Enable Google provider
   - Paste Client ID and Client Secret
   - Save

#### Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com)
2. **Azure Active Directory** > **App registrations** > **New registration**
3. Name: `Starfox Calendar`
4. Redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
5. Copy **Application (client) ID** and create a **Client secret**
6. In Supabase: **Authentication** > **Providers** > **Microsoft**
   - Enable Microsoft provider
   - Paste Client ID and Client Secret
   - Save

#### Apple OAuth
1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Create App ID and Service ID
3. Configure redirect URI
4. In Supabase: **Authentication** > **Providers** > **Apple**
   - Enable Apple provider
   - Configure with your Apple credentials
   - Save

## Step 5: Get API Keys

1. Go to **Settings** > **API**
2. Copy these values (you'll need them for the frontend):
   - **Project URL**: `https://<your-project-ref>.supabase.co`
   - **anon/public key**: (starts with `eyJ...`)
   - **service_role key**: (keep secret! Only for server-side)

## Step 6: Configure Environment Variables

Create a `.env.local` file in `web-app/`:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

**Important**: Never commit `.env.local` to git! It's already in `.gitignore`.

## Step 7: Install Supabase Client

The Supabase client is already included in the project dependencies. If not, install it:

```bash
cd web-app
npm install @supabase/supabase-js
```

## Step 8: Test Connection

1. Start your dev server: `npm run dev`
2. Try signing up with email/password
3. Check Supabase dashboard > **Authentication** > **Users** to see the new user
4. Check **Table Editor** > **user_profiles** to see the profile was created

## Free Tier Limits

- **Database**: 500MB storage
- **Bandwidth**: 2GB/month
- **Monthly Active Users**: 50,000
- **API Requests**: Unlimited
- **Real-time**: Unlimited connections
- **File Storage**: 1GB

**Note**: For most small-to-medium applications, the free tier is sufficient. You can upgrade later if needed.

## Troubleshooting

### Migration Errors
- Make sure you're running migrations in the correct order
- Check that extensions are enabled
- Verify RLS policies are created

### Authentication Issues
- Verify OAuth redirect URIs match exactly
- Check that providers are enabled in Supabase dashboard
- Ensure API keys are correct in `.env.local`

### RLS Policy Errors
- Make sure user is authenticated before making requests
- Verify policies allow the operation you're trying to perform
- Check Supabase logs for detailed error messages

## Next Steps

1. Integrate Supabase client in the React app (see `src/services/supabase.ts`)
2. Replace IndexedDB storage with Supabase API calls
3. Implement real-time subscriptions for live updates
4. Add conflict resolution logic

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

