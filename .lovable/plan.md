
# Promote Account to Admin

I'll update your newly registered account to have admin privileges.

---

## Account Details
- **Email**: devadeekshithgs@gmail.com
- **Current Role**: client
- **Current Status**: pending

## Changes to Make

### 1. Update Role to Admin
Change the role in `user_roles` table from `client` to `admin`.

### 2. Approve the Account
Update `approval_status` in `profiles` table from `pending` to `approved`.

---

## After Promotion

Once complete, you'll be able to:
- Log in and access the Admin Dashboard
- View and manage all orders
- Approve/reject client registrations
- Manage products and inventory
- View sales analytics

---

## Technical Details

Two SQL updates will be executed:

```text
1. UPDATE user_roles SET role = 'admin' WHERE user_id = 'ed18a7c0-...'
2. UPDATE profiles SET approval_status = 'approved' WHERE id = 'ed18a7c0-...'
```

After this, log in with your credentials and you'll be redirected to the admin portal.
