/*
  # Create Peer-to-Peer Rental Platform with Comprehensive KYC System

  ## Overview
  Complete rental platform schema with full KYC verification for hosts including:
  - Government ID document upload
  - Video verification
  - Phone number verification
  - Admin approval workflow

  ## Tables

  1. **profiles**
    - User profile information
    - KYC status tracking
    - Phone verification fields

  2. **categories**
    - Product categories

  3. **kyc_documents**
    - Government ID uploads (images/PDFs)
    - Document type tracking
    - Admin review status

  4. **kyc_verifications**
    - Video verification recordings
    - Phone verification tracking
    - Admin review notes

  5. **products**
    - Rental items (requires KYC approval to create)

  6. **rentals**
    - Rental transactions

  7. **reviews**
    - Product reviews

  ## Security
  - RLS enabled on all tables
  - KYC approval required for hosting products
  - Admins can review and approve KYC submissions
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table with KYC fields
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  phone_number text,
  phone_verified boolean DEFAULT false,
  phone_verified_at timestamptz,
  is_admin boolean DEFAULT false,
  kyc_status text DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  kyc_submitted_at timestamptz,
  kyc_document_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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

-- Categories table
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

-- KYC Documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('passport', 'drivers_license', 'national_id', 'other')),
  document_url text NOT NULL,
  file_name text,
  file_size integer,
  mime_type text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON kyc_documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
  ON kyc_documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all documents"
  ON kyc_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update documents"
  ON kyc_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- KYC Verifications table
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_url text,
  video_uploaded_at timestamptz,
  phone_verification_code text,
  phone_code_sent_at timestamptz,
  phone_code_verified_at timestamptz,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'in_review', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification"
  ON kyc_verifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own verification"
  ON kyc_verifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own verification"
  ON kyc_verifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all verifications"
  ON kyc_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update verifications"
  ON kyc_verifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Products table
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

CREATE POLICY "Approved hosts can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = host_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND kyc_status = 'approved'
    )
  );

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

-- Rentals table
CREATE TABLE IF NOT EXISTS rentals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  renter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_price numeric(10, 2) NOT NULL CHECK (total_price >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT rentals_dates_check CHECK (end_date > start_date)
);

ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rentals"
  ON rentals FOR SELECT
  TO authenticated
  USING (renter_id = auth.uid() OR host_id = auth.uid());

CREATE POLICY "Renters can insert rentals"
  ON rentals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Users can update rental status"
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

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, reviewer_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users who rented can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM rentals
      WHERE rentals.product_id = reviews.product_id
        AND rentals.renter_id = auth.uid()
        AND rentals.status = 'completed'
    )
  );

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (reviewer_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified ON profiles(phone_verified);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON kyc_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_products_host_id ON products(host_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_rentals_renter_id ON rentals(renter_id);
CREATE INDEX IF NOT EXISTS idx_rentals_host_id ON rentals(host_id);
CREATE INDEX IF NOT EXISTS idx_rentals_product_id ON rentals(product_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Cameras, laptops, gaming consoles, and other electronic devices'),
  ('Tools', 'Power tools, hand tools, and equipment for DIY projects'),
  ('Sports Equipment', 'Bikes, camping gear, fitness equipment, and sports accessories'),
  ('Vehicles', 'Cars, motorcycles, boats, and other vehicles'),
  ('Party Supplies', 'Tables, chairs, decorations, and event equipment'),
  ('Musical Instruments', 'Guitars, keyboards, drums, and other instruments')
ON CONFLICT (name) DO NOTHING;
