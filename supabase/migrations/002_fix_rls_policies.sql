-- =====================================================
-- FIX RLS POLICIES - Run this in Supabase SQL Editor
-- This fixes the infinite recursion error
-- =====================================================

-- First, drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Anyone can view published categories" ON categories;
DROP POLICY IF EXISTS "Staff can manage categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view published products" ON products;
DROP POLICY IF EXISTS "Staff can manage products" ON products;
DROP POLICY IF EXISTS "Customers can view own profile" ON customers;
DROP POLICY IF EXISTS "Customers can update own profile" ON customers;
DROP POLICY IF EXISTS "Customers can insert own profile" ON customers;
DROP POLICY IF EXISTS "Staff can manage customers" ON customers;
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Staff can manage orders" ON orders;
DROP POLICY IF EXISTS "Customers can view own order items" ON order_items;
DROP POLICY IF EXISTS "Staff can manage order items" ON order_items;
DROP POLICY IF EXISTS "Staff can view staff" ON staff;
DROP POLICY IF EXISTS "Super admin can manage staff" ON staff;
DROP POLICY IF EXISTS "Anyone can view published coupons" ON coupons;
DROP POLICY IF EXISTS "Staff can manage coupons" ON coupons;
DROP POLICY IF EXISTS "Staff can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Staff can manage own notifications" ON notifications;

-- =====================================================
-- SIMPLE RLS POLICIES (No recursion)
-- =====================================================

-- CATEGORIES: Public read for published, authenticated users can manage
CREATE POLICY "categories_select_published" ON categories
    FOR SELECT USING (published = true);

CREATE POLICY "categories_all_authenticated" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

-- PRODUCTS: Public read for published, authenticated users can manage
CREATE POLICY "products_select_published" ON products
    FOR SELECT USING (published = true);

CREATE POLICY "products_all_authenticated" ON products
    FOR ALL USING (auth.role() = 'authenticated');

-- CUSTOMERS: Users can manage their own data, authenticated can view all
CREATE POLICY "customers_select_own" ON customers
    FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'authenticated');

CREATE POLICY "customers_insert_own" ON customers
    FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = 'authenticated');

CREATE POLICY "customers_update_own" ON customers
    FOR UPDATE USING (user_id = auth.uid() OR auth.role() = 'authenticated');

CREATE POLICY "customers_delete_authenticated" ON customers
    FOR DELETE USING (auth.role() = 'authenticated');

-- ORDERS: Users can view their own orders, authenticated can manage all
CREATE POLICY "orders_select" ON orders
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
        OR auth.role() = 'authenticated'
    );

CREATE POLICY "orders_all_authenticated" ON orders
    FOR ALL USING (auth.role() = 'authenticated');

-- ORDER ITEMS: Same as orders
CREATE POLICY "order_items_select" ON order_items
    FOR SELECT USING (
        order_id IN (
            SELECT o.id FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE c.user_id = auth.uid()
        )
        OR auth.role() = 'authenticated'
    );

CREATE POLICY "order_items_all_authenticated" ON order_items
    FOR ALL USING (auth.role() = 'authenticated');

-- STAFF: Only authenticated users (staff) can access
CREATE POLICY "staff_select_authenticated" ON staff
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "staff_all_authenticated" ON staff
    FOR ALL USING (auth.role() = 'authenticated');

-- COUPONS: Public read for published, authenticated can manage
CREATE POLICY "coupons_select_published" ON coupons
    FOR SELECT USING (published = true);

CREATE POLICY "coupons_all_authenticated" ON coupons
    FOR ALL USING (auth.role() = 'authenticated');

-- NOTIFICATIONS: Authenticated users can manage
CREATE POLICY "notifications_all_authenticated" ON notifications
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- ALSO: Allow anonymous users to read public data
-- =====================================================

-- Allow anonymous/public access to published products
CREATE POLICY "products_anon_select" ON products
    FOR SELECT TO anon USING (published = true);

-- Allow anonymous/public access to published categories  
CREATE POLICY "categories_anon_select" ON categories
    FOR SELECT TO anon USING (published = true);

-- Allow anonymous/public access to published coupons
CREATE POLICY "coupons_anon_select" ON coupons
    FOR SELECT TO anon USING (published = true);

-- =====================================================
-- DONE! Refresh your app and it should work now.
-- =====================================================
