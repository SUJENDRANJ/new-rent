/*
  # Create Peer-to-Peer Rental Platform Schema

  1. **profiles**
    - User profile information
    
  2. **categories**
    - Product categories
    
  3. **products**
    - Rental items listed by hosts
    
  4. **rentals**
    - Rental transactions between renters and hosts

  5. Security
    - Row Level Security (RLS) enabled on all tables
    - Policies for authenticated users to manage their own data
    - Admin policies for user and product management
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  is_admin boolean DEFAULT false,
  kyc_status text DEFAULT 'pending',
  kyc_submitted_at timestamptz,
  kyc_document_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_kyc_status_check CHECK (kyc_status IN ('pending', 'approved', 'rejected'))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete users"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  price_per_day numeric(10, 2) NOT NULL CHECK (price_per_day > 0),
  image_url text,
  location text NOT NULL,
  location_url text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available products"
  ON products FOR SELECT
  TO authenticated
  USING (is_available = true OR host_id = auth.uid());

CREATE POLICY "Hosts can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id);

CREATE POLICY "Admins can delete any product"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE TABLE IF NOT EXISTS rentals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  renter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_price numeric(10, 2) NOT NULL CHECK (total_price >= 0),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT rentals_status_check CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled')),
  CONSTRAINT rentals_dates_check CHECK (end_date > start_date)
);

ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rentals as renter"
  ON rentals FOR SELECT
  TO authenticated
  USING (renter_id = auth.uid() OR host_id = auth.uid());

CREATE POLICY "Renters can insert rentals"
  ON rentals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Hosts can update rental status"
  ON rentals FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id OR auth.uid() = renter_id)
  WITH CHECK (auth.uid() = host_id OR auth.uid() = renter_id);

CREATE POLICY "Admins can view all rentals"
  ON rentals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_products_host_id ON products(host_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_rentals_renter_id ON rentals(renter_id);
CREATE INDEX IF NOT EXISTS idx_rentals_host_id ON rentals(host_id);
CREATE INDEX IF NOT EXISTS idx_rentals_product_id ON rentals(product_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);

INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Cameras, laptops, gaming consoles, and other electronic devices'),
  ('Tools', 'Power tools, hand tools, and equipment for DIY projects'),
  ('Sports Equipment', 'Bikes, camping gear, fitness equipment, and sports accessories'),
  ('Vehicles', 'Cars, motorcycles, boats, and other vehicles'),
  ('Party Supplies', 'Tables, chairs, decorations, and event equipment'),
  ('Musical Instruments', 'Guitars, keyboards, drums, and other instruments')
ON CONFLICT (name) DO NOTHING;
