# Vercel Deployment Guide - Japan Bar System

## Pre-Deployment Checklist

### 1. Remove Demo Navigation (IN PROGRESS)
The demo navigation bar needs to be removed from all pages so each role only sees their designated interface.

**Files to update (remove DemoNavHeader):**
- ✓ src/pages/CastLoginPage.tsx
- ✓ src/pages/StaffLoginPage.tsx
- ✓ src/pages/CastStoreSelectPage.tsx
- ✓ src/pages/CastTableLayoutPage.tsx
- ✓ src/pages/CastOrderAddPage.tsx
- ✓ src/pages/CastEarningsPage.tsx
- ✓ src/pages/StaffDashboard.tsx
- ✓ src/pages/StaffReportsPage.tsx
- ✓ src/pages/StaffShiftApprovalsPage.tsx
- ✓ src/pages/CastManagementPage.tsx
- ✓ src/pages/SettingsPage.tsx
- ✓ src/pages/CustomerBillPage.tsx

**For each file:**
1. Remove: `import DemoNavHeader from '@/components/layout/DemoNavHeader';`
2. Remove: `<DemoNavHeader />` from JSX

### 2. Configure Supabase Environment Variables

Create `.env.production` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

Or use Vercel Dashboard:
1. Go to vercel.com
2. Import your GitHub repository
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

## Post-Deployment: QR Code Generation

### Access URLs After Deployment

Assuming your Vercel URL is: `https://japan-bar.vercel.app`

**Table QR Codes (25 tables):**
- Table A1: `https://japan-bar.vercel.app/table/a1`
- Table A2: `https://japan-bar.vercel.app/table/a2`
- ...
- Table B10: `https://japan-bar.vercel.app/table/b10`

**Cast Login:**
- URL: `https://japan-bar.vercel.app/cast/login`

**Staff Login:**
- URL: `https://japan-bar.vercel.app/staff/login`

### Generate QR Codes (2 Options)

#### Option 1: Use Built-in QR Generator Page (RECOMMENDED)

After deployment, I'll create a staff page at `/staff/qr-codes` that:
- Shows all 25 table QR codes
- Shows cast login QR code
- Allows printing/downloading each QR code
- Uses your production Vercel domain

#### Option 2: Manual Generation

Use these free tools:
1. **qr-code-generator.com**
2. **qr.io**
3. **qrcode-monkey.com**

Generate QR codes for each URL and print them.

## Table ID Reference

### Store 1 (1号店) - 13 Tables
- Counter: A1, A2, A3, A4, A5, A6, A7
- Sofa: B1, B2, B3, B4, B5, B6

### Store 2 (2号店) - 12 Tables
- Counter: A1, A2, A3, A4, A5, A6
- Sofa: B1, B2, B3, B4, B5, B6

## Security Checklist

✓ Row Level Security (RLS) enabled on all tables
✓ Cast can only see their own data
✓ Staff authentication required for management
✓ Customer access limited to their table only
✓ API keys use anon key (safe for public)

## Post-Deployment Testing

1. **Test Customer Flow:**
   - Scan table QR code
   - Verify bill displays correctly
   - Test ordering
   - Test calling cast

2. **Test Cast Flow:**
   - Login with cast credentials
   - Clock in (needs staff approval)
   - Select store
   - Add orders to table
   - View earnings

3. **Test Staff Flow:**
   - Login with staff credentials
   - Approve cast clock-in
   - Start session
   - Complete session with payment
   - View daily reports

## Troubleshooting

**QR codes show localhost:**
- Clear browser cache
- Regenerate QR codes using production URL

**Environment variables not working:**
- Check Vercel dashboard → Settings → Environment Variables
- Redeploy after adding variables

**Database connection fails:**
- Verify Supabase URL and anon key
- Check RLS policies are enabled
- Verify MCP is configured correctly

## Next Steps After Deployment

1. Print all 27 QR codes (25 tables + cast + staff)
2. Place table QR codes on each table
3. Give cast QR code to all cast members
4. Bookmark staff URL on staff device
5. Test complete workflow end-to-end
