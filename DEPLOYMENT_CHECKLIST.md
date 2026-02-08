# 🚀 Complete Deployment Checklist for Vercel

## ✅ Pre-Deployment Steps

### Step 1: Remove Demo Navigation Bar (REQUIRED)

**Why?** The demo navigation allows switching between cast/staff/customer roles. In production, each user should only access their designated interface.

**Files to Update (12 files):**

For each file below, remove these 2 lines:
```typescript
import DemoNavHeader from '@/components/layout/DemoNavHeader';  // ❌ REMOVE THIS
<DemoNavHeader />  // ❌ REMOVE THIS from JSX
```

**File List:**
1. `src/pages/CastLoginPage.tsx`
2. `src/pages/StaffLoginPage.tsx`
3. `src/pages/CastStoreSelectPage.tsx`
4. `src/pages/CastTableLayoutPage.tsx`
5. `src/pages/CastOrderAddPage.tsx`
6. `src/pages/CastEarningsPage.tsx`
7. `src/pages/StaffDashboard.tsx`
8. `src/pages/StaffReportsPage.tsx`
9. `src/pages/StaffShiftApprovalsPage.tsx`
10. `src/pages/CastManagementPage.tsx`
11. `src/pages/SettingsPage.tsx`
12. `src/pages/CustomerBillPage.tsx`

**Quick way to do this:**
```bash
# On Windows (PowerShell):
Get-ChildItem -Path "src\pages" -Filter "*.tsx" -Recurse |
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "import DemoNavHeader.*\n", ""
    $content = $content -replace "\s*<DemoNavHeader\s*/>\s*\n", ""
    Set-Content -Path $_.FullName -Value $content
  }

# Or manually edit each file
```

### Step 2: Verify Build

```bash
npm run build
```

✓ Should complete without errors

### Step 3: Commit Changes

```bash
git add .
git commit -m "Remove demo navigation and prepare for production"
git push
```

---

## 🌐 Vercel Deployment

### Option A: Deploy via Vercel Dashboard (RECOMMENDED)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"New Project"**
4. Import your GitHub repository
5. **Configure Project:**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **Add Environment Variables:**
   - `VITE_SUPABASE_URL` = `your_supabase_url`
   - `VITE_SUPABASE_ANON_KEY` = `your_supabase_anon_key`
7. Click **"Deploy"**

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 📱 Post-Deployment: Generate QR Codes

### Step 1: Access QR Generator

After your app is deployed, go to:
```
https://your-app.vercel.app/staff/login
```

1. Login as staff
2. Click **"QRコード"** button in dashboard
3. You'll see **25 table QR codes** + **cast login QR**

### Step 2: Print QR Codes

On the QR codes page:
1. Click **"印刷"** (Print) button
2. Print settings:
   - **Paper:** A4
   - **Orientation:** Portrait
   - **Scale:** 100%
3. Print all pages (will be organized by store)

### Step 3: QR Code Distribution

**Table QR Codes (25 total):**
- Cut and laminate each QR code
- Place on corresponding table
- Format: "1号店 A1", "2号店 B5", etc.

**Cast Login QR:**
- Print and give to all cast members
- Can scan to login from their phones

**Staff Login:**
- No QR needed
- Bookmark: `https://your-app.vercel.app/staff/login`

---

## 🔗 URL Structure Reference

### Customer Access (via table QR codes)
```
Store 1:
https://your-app.vercel.app/table/1-a1
https://your-app.vercel.app/table/1-a2
...
https://your-app.vercel.app/table/1-b6

Store 2:
https://your-app.vercel.app/table/2-a1
https://your-app.vercel.app/table/2-a2
...
https://your-app.vercel.app/table/2-b6
```

### Cast Access
```
Login: https://your-app.vercel.app/cast/login
```

### Staff Access
```
Login: https://your-app.vercel.app/staff/login
Dashboard: https://your-app.vercel.app/staff/dashboard
```

---

## ✅ Post-Deployment Testing

### Test 1: Customer Flow
1. Scan table A1 QR code
2. ✓ Should show table A1 bill page
3. ✓ Can place orders
4. ✓ Can call cast

### Test 2: Cast Flow
1. Scan cast QR code
2. Login with cast credentials
3. ✓ Clock in request sent
4. **Staff must approve clock-in**
5. ✓ Can select store
6. ✓ Can add orders to tables
7. ✓ Can view earnings

### Test 3: Staff Flow
1. Open staff login URL
2. Login with staff credentials
3. ✓ Approve cast clock-in
4. ✓ Start table session
5. ✓ Complete session with payment
6. ✓ View daily reports
7. ✓ Generate QR codes

---

## 🔧 Environment Variables

Required in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Where to find |
|----------|-------|---------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your anon/public key | Supabase Dashboard → Settings → API |

---

## 🛡️ Security Checklist

✓ Row Level Security (RLS) enabled on all tables
✓ Cast can only see their own data
✓ Staff authentication required for management
✓ Customer access limited to their table only
✓ Anon key safe for public use
✓ Demo navigation removed (users can't switch roles)

---

## 📊 Database Tables Verified

All tables are properly configured:
- ✓ `bills` - Session data
- ✓ `orders` - Order history
- ✓ `cast_shifts` - Approval system
- ✓ `cast_members` - With DELETE policy
- ✓ `daily_reports` - Historical data
- ✓ `store_settings` - Business hours, bonuses

---

## 🎯 Features Confirmed Working

✓ Cast approval system (clock-in/out)
✓ Complete session with payment
✓ Delete cast members
✓ Historical reports (calendar access)
✓ 25 table QR codes auto-generated
✓ Responsive design (mobile/tablet/desktop)
✓ All earnings calculations
✓ Auto-designation (3 extensions)
✓ Late pickup bonus
✓ Referral system

---

## 📞 Customer Support Flow

**Setup Instructions for Bar Owner:**

1. **Print & Place QR Codes:**
   - 25 table QR codes → Place on tables
   - 1 cast QR code → Give to cast members
   - 1 staff URL → Bookmark on staff device

2. **Train Staff:**
   - Show how to start/complete sessions
   - Demonstrate cast approval process
   - Practice daily report access

3. **Train Cast:**
   - Show how to scan QR and login
   - Explain approval wait time
   - Demonstrate order placement

4. **Customer Experience:**
   - Customer scans table QR
   - Automatically shows their bill
   - Can place orders
   - Can call cast

---

## 🚨 Troubleshooting

**Problem:** QR codes still show localhost
**Solution:** Regenerate QR codes from production `/staff/qr-codes` page

**Problem:** Cast can't delete
**Solution:** Verify DELETE policy is applied (fixed in latest migration)

**Problem:** Environment variables not working
**Solution:** Check Vercel dashboard → Redeploy after adding

**Problem:** Database connection fails
**Solution:** Verify Supabase URL and anon key in Vercel env vars

---

## ✨ You're Ready to Deploy!

1. ✓ Remove demo navigation (12 files)
2. ✓ Commit and push to GitHub
3. ✓ Deploy to Vercel
4. ✓ Add environment variables
5. ✓ Access `/staff/qr-codes` to print
6. ✓ Test complete workflow
7. ✓ Go live! 🎉

**Estimated Time:** 15-20 minutes
