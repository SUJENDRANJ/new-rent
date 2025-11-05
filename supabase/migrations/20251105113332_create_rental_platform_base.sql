/*
  # Create Rental Platform Database Schema

  1. New Tables
    - `users` - User profiles and authentication data
    - `products` - Rental items/products
    - `rentals` - Rental transactions
    - `reviews` - User reviews for products and rentals
    - `kyc_submissions` - KYC verification documents

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access and ownership
    - Restrict KYC data to admins and verified users

  3. Key Features
    - User authentication with email
    - Product hosting and rental management
    - Review system for trust and ratings
    - KYC verification for enhanced security
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  profile_image_url text,
  bio text,
  phone_number text,
  date_of_birth date,
  is_kyc_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price_per_day numeric NOT NULL CHECK (price_per_day > 0),
  images jsonb DEFAULT '[]'::jsonb,
  location text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available products"
  ON products FOR SELECT
  USING (is_available = true OR auth.uid() = host_id);

CREATE POLICY "Hosts can create products"
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

-- Create rentals table
CREATE TABLE IF NOT EXISTS rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  renter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_price numeric NOT NULL CHECK (total_price > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rentals"
  ON rentals FOR SELECT
  TO authenticated
  USING (auth.uid() = renter_id OR auth.uid() = host_id);

CREATE POLICY "Renters can create rentals"
  ON rentals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Users can update own rentals"
  ON rentals FOR UPDATE
  TO authenticated
  USING (auth.uid() = renter_id OR auth.uid() = host_id)
  WITH CHECK (auth.uid() = renter_id OR auth.uid() = host_id);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_host_review boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for completed rentals"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM rentals
      WHERE rentals.id = rental_id
      AND rentals.status = 'completed'
      AND (rentals.renter_id = auth.uid() OR rentals.host_id = auth.uid())
    )
  );

-- Create KYC submissions table
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('passport', 'driving_license', 'national_id')),
  document_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id)
);

ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC submissions"
  ON kyc_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit KYC documents"
  ON kyc_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS products_host_id_idx ON products(host_id);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS rentals_renter_id_idx ON rentals(renter_id);
CREATE INDEX IF NOT EXISTS rentals_host_id_idx ON rentals(host_id);
CREATE INDEX IF NOT EXISTS rentals_product_id_idx ON rentals(product_id);
CREATE INDEX IF NOT EXISTS reviews_reviewee_id_idx ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS kyc_submissions_user_id_idx ON kyc_submissions(user_id);