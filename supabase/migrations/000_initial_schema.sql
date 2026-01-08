-- =====================================================
-- ECOMMERCE DATABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- 1. Create ENUM types
CREATE TYPE notification_type AS ENUM ('order', 'product', 'category', 'coupon', 'customer', 'staff');
CREATE TYPE staff_role AS ENUM ('super_admin', 'admin', 'cashier', 'customer');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'delivered', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'bank_transfer');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- 2. Create staff_roles table
CREATE TABLE staff_roles (
    id SERIAL PRIMARY KEY,
    name staff_role NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO staff_roles (name, display_name, is_default) VALUES
    ('super_admin', 'Super Admin', false),
    ('admin', 'Admin', false),
    ('cashier', 'Cashier', true),
    ('customer', 'Customer', false);

-- 3. Create staff table
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    image_url TEXT,
    role_id INTEGER REFERENCES staff_roles(id) DEFAULT 3,
    joining_date DATE DEFAULT CURRENT_DATE,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT NOT NULL,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sku TEXT NOT NULL UNIQUE,
    image_url TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock_threshold INTEGER DEFAULT 10,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    store_name TEXT,
    ein TEXT,
    age_verified BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create coupons table
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type discount_type NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    image_url TEXT,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    payment_method payment_method DEFAULT 'cash',
    status order_status DEFAULT 'pending',
    order_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type notification_type NOT NULL,
    image_url TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Create inventory_logs table (for tracking stock changes)
CREATE TABLE "**inventory_logs" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    change INTEGER,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_published ON products(published);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_published ON categories(published);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_staff_email ON staff(email);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT sr.name INTO user_role
    FROM staff s
    JOIN staff_roles sr ON s.role_id = sr.id
    WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid());
    
    IF user_role IS NULL THEN
        -- Check if user is a customer
        SELECT 'customer' INTO user_role
        FROM customers
        WHERE user_id = auth.uid();
    END IF;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile (for staff and customers)
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS JSON AS $$
DECLARE
    profile_data JSON;
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

-- Function to authorize super admin
CREATE OR REPLACE FUNCTION authorize_super_admin_or_error()
RETURNS VOID AS $$
BEGIN
    IF get_user_role() != 'super_admin' THEN
        RAISE EXCEPTION 'Unauthorized: Super admin access required';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Categories: Public read, staff write
CREATE POLICY "Anyone can view published categories" ON categories
    FOR SELECT USING (published = true);

CREATE POLICY "Staff can manage categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff s
            JOIN staff_roles sr ON s.role_id = sr.id
            WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND sr.name IN ('super_admin', 'admin')
        )
    );

-- Products: Public read, staff write
CREATE POLICY "Anyone can view published products" ON products
    FOR SELECT USING (published = true);

CREATE POLICY "Staff can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff s
            JOIN staff_roles sr ON s.role_id = sr.id
            WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND sr.name IN ('super_admin', 'admin')
        )
    );

-- Customers: Own data + staff access
CREATE POLICY "Customers can view own profile" ON customers
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Customers can update own profile" ON customers
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Customers can insert own profile" ON customers
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can manage customers" ON customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff s
            JOIN staff_roles sr ON s.role_id = sr.id
            WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND sr.name IN ('super_admin', 'admin', 'cashier')
        )
    );

-- Orders: Own orders + staff access
CREATE POLICY "Customers can view own orders" ON orders
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

CREATE POLICY "Staff can manage orders" ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff s
            JOIN staff_roles sr ON s.role_id = sr.id
            WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND sr.name IN ('super_admin', 'admin', 'cashier')
        )
    );

-- Order items: Same as orders
CREATE POLICY "Customers can view own order items" ON order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE customer_id IN (
                SELECT id FROM customers WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Staff can manage order items" ON order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff s
            JOIN staff_roles sr ON s.role_id = sr.id
            WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND sr.name IN ('super_admin', 'admin', 'cashier')
        )
    );

-- Staff: Only staff can view/manage
CREATE POLICY "Staff can view staff" ON staff
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff s
            JOIN staff_roles sr ON s.role_id = sr.id
            WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Super admin can manage staff" ON staff
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff s
            JOIN staff_roles sr ON s.role_id = sr.id
            WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND sr.name = 'super_admin'
        )
    );

-- Coupons: Public read, staff write
CREATE POLICY "Anyone can view published coupons" ON coupons
    FOR SELECT USING (published = true);

CREATE POLICY "Staff can manage coupons" ON coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff s
            JOIN staff_roles sr ON s.role_id = sr.id
            WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND sr.name IN ('super_admin', 'admin')
        )
    );

-- Notifications: Own notifications
CREATE POLICY "Staff can view own notifications" ON notifications
    FOR SELECT USING (staff_id IN (
        SELECT id FROM staff WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ));

CREATE POLICY "Staff can manage own notifications" ON notifications
    FOR ALL USING (staff_id IN (
        SELECT id FROM staff WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ));

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample categories
INSERT INTO categories (name, slug, description, image_url, published) VALUES
    ('Electronics', 'electronics', 'Electronic devices and gadgets', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800', true),
    ('Clothing', 'clothing', 'Fashion and apparel', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800', true),
    ('Home & Garden', 'home-garden', 'Home decor and garden supplies', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800', true),
    ('Sports', 'sports', 'Sports equipment and accessories', 'https://images.unsplash.com/photo-1461896836934- voices-of-the-past?w=800', true);

-- Insert sample products
INSERT INTO products (name, slug, description, sku, image_url, category_id, cost_price, selling_price, stock, published) VALUES
    ('Wireless Headphones', 'wireless-headphones', 'Premium wireless headphones with noise cancellation', 'WH-001', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', (SELECT id FROM categories WHERE slug = 'electronics'), 79.99, 149.99, 50, true),
    ('Smart Watch', 'smart-watch', 'Feature-rich smartwatch with health tracking', 'SW-001', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', (SELECT id FROM categories WHERE slug = 'electronics'), 149.99, 299.99, 30, true),
    ('Laptop Stand', 'laptop-stand', 'Ergonomic aluminum laptop stand', 'LS-001', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800', (SELECT id FROM categories WHERE slug = 'electronics'), 29.99, 59.99, 100, true),
    ('Cotton T-Shirt', 'cotton-tshirt', 'Comfortable 100% cotton t-shirt', 'CT-001', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', (SELECT id FROM categories WHERE slug = 'clothing'), 9.99, 24.99, 200, true),
    ('Denim Jeans', 'denim-jeans', 'Classic fit denim jeans', 'DJ-001', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', (SELECT id FROM categories WHERE slug = 'clothing'), 29.99, 69.99, 75, true),
    ('Running Shoes', 'running-shoes', 'Lightweight running shoes', 'RS-001', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', (SELECT id FROM categories WHERE slug = 'sports'), 49.99, 99.99, 60, true),
    ('Yoga Mat', 'yoga-mat', 'Non-slip yoga mat', 'YM-001', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800', (SELECT id FROM categories WHERE slug = 'sports'), 14.99, 34.99, 150, true),
    ('Table Lamp', 'table-lamp', 'Modern LED table lamp', 'TL-001', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800', (SELECT id FROM categories WHERE slug = 'home-garden'), 24.99, 49.99, 80, true);

-- Insert a sample customer
INSERT INTO customers (name, email, phone, address, store_name, age_verified) VALUES
    ('John Doe', 'john@example.com', '+1234567890', '123 Main St, New York, NY 10001', 'Johns Store', true);

-- Insert sample coupons
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, start_date, end_date, image_url, published) VALUES
    ('WELCOME10', 'percentage', 10, 50, NOW(), NOW() + INTERVAL '30 days', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800', true),
    ('SAVE20', 'fixed', 20, 100, NOW(), NOW() + INTERVAL '60 days', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800', true);

-- =====================================================
-- DONE! Your database is now set up.
-- =====================================================
