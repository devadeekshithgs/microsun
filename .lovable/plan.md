

# Security Fixes, Database Migration & Admin Access Plan

## Overview

This plan addresses three major areas:
1. **Security vulnerabilities** - Fix all RLS policies exposing data to unauthenticated users + enable leaked password protection
2. **External Supabase migration** - Switch from Lovable Cloud to your own Supabase project
3. **Admin access** - Grant admin role to microsun2013@gmail.com when they register

---

## Part 1: Security Fixes

### Current Security Issues

The security scan found **10 vulnerabilities**:

| Issue | Severity | Description |
|-------|----------|-------------|
| Profiles table | ERROR | Customer PII exposed to unauthenticated users |
| Orders table | ERROR | Order data accessible without auth |
| Order items table | ERROR | Order details exposed without auth |
| Order status history | ERROR | Processing history exposed |
| Notifications table | ERROR | Private messages exposed |
| Worker assignments | ERROR | Internal operations exposed |
| Worker output | ERROR | Production metrics exposed |
| User roles | WARN | Role assignments discoverable |
| Product variants | WARN | Inventory levels visible to all |
| Leaked password protection | WARN | Disabled in auth settings |

### Root Cause

Current RLS policies only check `auth.uid()` for authenticated users, but don't explicitly **deny unauthenticated access**. This means anonymous users could potentially query these tables.

### Solution

Add explicit **deny policies** for unauthenticated users on all sensitive tables:

```text
Tables to secure:
┌─────────────────────┬─────────────────────────────────────────┐
│ Table               │ Fix                                     │
├─────────────────────┼─────────────────────────────────────────┤
│ profiles            │ Add auth.uid() IS NOT NULL check        │
│ orders              │ Add auth.uid() IS NOT NULL check        │
│ order_items         │ Add auth.uid() IS NOT NULL check        │
│ order_status_history│ Add auth.uid() IS NOT NULL check        │
│ notifications       │ Add auth.uid() IS NOT NULL check        │
│ worker_assignments  │ Add auth.uid() IS NOT NULL check        │
│ worker_output       │ Add auth.uid() IS NOT NULL check        │
│ user_roles          │ Add auth.uid() IS NOT NULL check        │
│ product_variants    │ Create public view hiding stock fields  │
└─────────────────────┴─────────────────────────────────────────┘
```

### Product Variants - Special Case

For `product_variants`, we'll create a **public view** that exposes only non-sensitive fields:

```sql
CREATE VIEW public.product_variants_public AS
SELECT id, product_id, variant_name, sku, image_url, is_active
FROM public.product_variants
WHERE is_active = true;
-- Excludes: stock_quantity, low_stock_threshold, reorder_point
```

### Leaked Password Protection

This must be enabled manually in the Cloud Dashboard under **Users → Authentication Settings → Password Protection**.

---

## Part 2: External Supabase Migration

### Current Setup
- App uses Lovable Cloud (auto-configured Supabase)
- Credentials in `.env` point to `cfwghouliuuvvfvfdftg.supabase.co`

### Your External Supabase Credentials
Stored in secrets:
- `supabase_project_url` - Your Supabase project URL
- `supabse_anon_key` - Your Supabase anon key (note: typo in secret name)
- `supabse_secret_key` - Your Supabase service role key

### Migration Steps

1. **Create new Supabase client file** - `src/integrations/supabase/external-client.ts` that uses your credentials
2. **Update `.env`** - Point to your external Supabase project
3. **Important**: You'll need to manually run the database migrations on your external Supabase project to create all the tables, functions, and policies

### Before Migration - Required Database Setup

Your external Supabase project must have:
- All tables (profiles, orders, products, etc.)
- All RLS policies
- All triggers and functions
- Storage bucket for product images

I'll provide you with a **complete SQL migration script** to run in your external Supabase dashboard.

---

## Part 3: Admin Access for microsun2013@gmail.com

### Solution

Modify the `handle_new_user()` trigger function to automatically:
1. Grant **admin role** when this email registers
2. Set **approval_status = 'approved'** immediately

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'microsun2013@gmail.com' THEN
    INSERT INTO public.profiles (id, email, full_name, approval_status)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'approved');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Normal user flow
    INSERT INTO public.profiles (id, email, full_name, approval_status)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'pending');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Technical Implementation

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/integrations/supabase/external-client.ts` | Create | New client using your Supabase credentials |
| Update all imports | Modify | Switch from `client.ts` to `external-client.ts` |
| Migration SQL | Create | Security fixes + admin email trigger |

### Database Migration SQL

A single migration will:
1. Update RLS policies on 8 tables to require authentication
2. Create public view for product variants
3. Update `handle_new_user()` for admin email detection

### Code Changes

1. Create external Supabase client that reads from your secrets
2. Update client import across ~9 files that use Supabase

---

## Execution Order

1. **Security fixes first** - Apply RLS policy updates to current database
2. **Test security** - Verify unauthenticated access is blocked
3. **Export migration script** - For your external Supabase
4. **Create external client** - Point to your Supabase project
5. **Switch client imports** - Update all files to use external client
6. **Enable leaked password protection** - Manual step in dashboard
7. **Test admin registration** - Register with microsun2013@gmail.com

---

## Important Notes

1. **Data Migration**: Your external Supabase will start empty. You'll need to manually migrate any existing data from Lovable Cloud
2. **Google OAuth**: May need to reconfigure OAuth in your external Supabase project
3. **Storage**: Product images bucket needs to be created in your external project
4. **Secrets Access**: The external client will need to access secrets from edge functions or environment variables

Would you like me to proceed with this implementation?

