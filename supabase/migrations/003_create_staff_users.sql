-- =====================================================
-- CREATE STAFF USERS - Run this in Supabase SQL Editor
-- =====================================================

-- STEP 1: First, you need to create these users in Supabase Auth
-- Go to: Authentication > Users > Add User (or use the invite option)
-- Create users with these emails and passwords:

-- =====================================================
-- USER CREDENTIALS (Create these in Auth first!)
-- =====================================================
-- 
-- SUPER ADMIN:
--   Email: superadmin@zorvex.com
--   Password: SuperAdmin@123
--
-- ADMIN:
--   Email: admin@zorvex.com  
--   Password: Admin@123
--
-- CASHIER:
--   Email: cashier@zorvex.com
--   Password: Cashier@123
--
-- =====================================================

-- STEP 2: After creating users in Auth, run this SQL to add them to staff table:

INSERT INTO staff (name, email, phone, role_id, published) VALUES
    ('Super Admin', 'superadmin@zorvex.com', '+1111111111', 1, true),
    ('Admin User', 'admin@zorvex.com', '+2222222222', 2, true),
    ('Cashier User', 'cashier@zorvex.com', '+3333333333', 3, true)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role_id = EXCLUDED.role_id;

-- Verify the staff was created:
SELECT s.name, s.email, sr.name as role, sr.display_name 
FROM staff s 
JOIN staff_roles sr ON s.role_id = sr.id;
