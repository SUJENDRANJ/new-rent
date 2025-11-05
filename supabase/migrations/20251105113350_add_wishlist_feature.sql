/*
  # Add Wishlist Feature

  1. New Tables
    - `wishlists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `product_id` (uuid, references products)
      - `created_at` (timestamptz)
      - Unique constraint on (user_id, product_id) to prevent duplicates

  2. Security
    - Enable RLS on `wishlists` table
    - Add policy for users to view their own wishlist items
    - Add policy for users to add items to their wishlist
    - Add policy for users to remove items from their wishlist

  3. Indexes
    - Add index on user_id for efficient wishlist queries
    - Add index on product_id for efficient product lookup

  4. Important Notes
    - Users can only have one instance of each product in their wishlist
    - Deleting a product automatically removes it from all wishlists (CASCADE)
    - Deleting a user removes all their wishlist items (CASCADE)
*/

-- Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- Enable RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own wishlist items
CREATE POLICY "Users can view own wishlist"
  ON wishlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can add items to their wishlist
CREATE POLICY "Users can add to own wishlist"
  ON wishlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove items from their wishlist
CREATE POLICY "Users can remove from own wishlist"
  ON wishlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);