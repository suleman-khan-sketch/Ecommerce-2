-- Migration: Add customer role and extend user profiles for customers
-- This migration adds customer-specific fields and the customer role

-- 1. Add customer role to staff_roles enum and table
ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'customer';

-- 2. Insert customer role into staff_roles table
INSERT INTO staff_roles (name, display_name, is_default)
VALUES ('customer', 'Customer', false)
ON CONFLICT (name) DO NOTHING;

-- 3. Add customer-specific fields to the customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS store_name TEXT,
ADD COLUMN IF NOT EXISTS ein TEXT,
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Create index for user_id lookup
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- 5. Create a function to link customer to auth user
CREATE OR REPLACE FUNCTION link_customer_to_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user signs up with a matching email, link them to existing customer
  UPDATE customers
  SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger to auto-link customers on signup
DROP TRIGGER IF EXISTS on_auth_user_created_link_customer ON auth.users;
CREATE TRIGGER on_auth_user_created_link_customer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_customer_to_auth_user();

-- 7. Create function to get customer profile
CREATE OR REPLACE FUNCTION get_customer_profile()
RETURNS JSON AS $$
DECLARE
  customer_data JSON;
BEGIN
  SELECT json_build_object(
    'id', c.id,
    'name', c.name,
    'email', c.email,
    'phone', c.phone,
    'address', c.address,
    'store_name', c.store_name,
    'ein', c.ein,
    'age_verified', c.age_verified,
    'role', 'customer'
  ) INTO customer_data
  FROM customers c
  WHERE c.user_id = auth.uid();
  
  RETURN customer_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update get_my_profile to handle customers
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS JSON AS $$
DECLARE
  profile_data JSON;
  user_email TEXT;
BEGIN
  -- First check if user is staff
  SELECT json_build_object(
    'name', s.name,
    'image_url', s.image_url,
    'role', sr.name
  ) INTO profile_data
  FROM staff s
  JOIN staff_roles sr ON s.role_id = sr.id
  WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid());
  
  IF profile_data IS NOT NULL THEN
    RETURN profile_data;
  END IF;
  
  -- Check if user is customer
  SELECT json_build_object(
    'name', c.name,
    'image_url', NULL,
    'role', 'customer',
    'store_name', c.store_name,
    'address', c.address,
    'phone', c.phone,
    'ein', c.ein,
    'age_verified', c.age_verified
  ) INTO profile_data
  FROM customers c
  WHERE c.user_id = auth.uid();
  
  RETURN profile_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create RLS policies for customers to view their own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own orders
CREATE POLICY "Customers can view own orders"
ON orders FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  )
);

-- Policy: Staff can view all orders
CREATE POLICY "Staff can view all orders"
ON orders FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staff s
    JOIN staff_roles sr ON s.role_id = sr.id
    WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND sr.name IN ('super_admin', 'admin', 'cashier')
  )
);

-- 10. Create RLS policies for customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view and update their own profile
CREATE POLICY "Customers can view own profile"
ON customers FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Customers can update own profile"
ON customers FOR UPDATE
USING (user_id = auth.uid());

-- Policy: Staff can view and manage all customers
CREATE POLICY "Staff can manage customers"
ON customers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staff s
    JOIN staff_roles sr ON s.role_id = sr.id
    WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND sr.name IN ('super_admin', 'admin', 'cashier')
  )
);

-- 11. Create function to register a new customer
CREATE OR REPLACE FUNCTION register_customer(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_store_name TEXT,
  p_ein TEXT,
  p_age_verified BOOLEAN
)
RETURNS UUID AS $$
DECLARE
  new_customer_id UUID;
BEGIN
  INSERT INTO customers (
    name,
    email,
    phone,
    address,
    store_name,
    ein,
    age_verified,
    user_id
  ) VALUES (
    p_name,
    p_email,
    p_phone,
    p_address,
    p_store_name,
    p_ein,
    p_age_verified,
    auth.uid()
  )
  RETURNING id INTO new_customer_id;
  
  RETURN new_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
