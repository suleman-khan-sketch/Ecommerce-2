-- =====================================================
-- SIMPLIFY ROLES - Run this in Supabase SQL Editor
-- =====================================================
-- 
-- FINAL ROLE STRUCTURE:
-- 1. admin - Full access to admin dashboard, can manage everything
-- 2. customer - Can browse products, add to cart, place orders
--
-- =====================================================

-- Step 1: Update all existing staff to use role_id = 2 (admin)
UPDATE staff SET role_id = 2 WHERE role_id IN (1, 3);

-- Step 2: Delete unused roles (super_admin and cashier)
-- First, check if any staff still references these roles
DELETE FROM staff_roles WHERE name IN ('super_admin', 'cashier');

-- Step 3: Update the admin role to be the default for staff
UPDATE staff_roles SET is_default = true WHERE name = 'admin';
UPDATE staff_roles SET is_default = false WHERE name = 'customer';

-- =====================================================
-- ADMIN USER SETUP
-- =====================================================
-- 
-- STEP 1: Create user in Supabase Auth
-- Go to: Authentication > Users > Add User
-- 
-- ADMIN CREDENTIALS:
--   Email: admin@zorvex.com
--   Password: Admin@123
--   ✓ Check "Auto Confirm User"
--
-- =====================================================

-- STEP 2: Run this SQL to add admin to staff table:
INSERT INTO staff (name, email, phone, role_id, published) VALUES
    ('Admin', 'admin@zorvex.com', '+1234567890', 
     (SELECT id FROM staff_roles WHERE name = 'admin'), true)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role_id = EXCLUDED.role_id;

-- Delete old test users if they exist
DELETE FROM staff WHERE email IN ('superadmin@zorvex.com', 'cashier@zorvex.com');

-- =====================================================
-- VERIFY SETUP
-- =====================================================

-- Check roles
SELECT id, name, display_name, is_default FROM staff_roles ORDER BY id;

-- Check staff
SELECT s.name, s.email, sr.name as role 
FROM staff s 
JOIN staff_roles sr ON s.role_id = sr.id;

-- =====================================================
-- ROLE PERMISSIONS SUMMARY
-- =====================================================
--
-- ADMIN (role: admin)
-- ✓ Access admin dashboard (/admin)
-- ✓ Manage products (create, edit, delete)
-- ✓ Manage categories
-- ✓ Manage coupons
-- ✓ View and manage orders
-- ✓ View and manage customers
-- ✓ Manage staff
--
-- CUSTOMER (role: customer)
-- ✓ Browse products
-- ✓ Add to cart
-- ✓ Place orders (min $200)
-- ✓ View own orders
-- ✓ Manage own profile
-- ✗ NO admin access
--
-- =====================================================
