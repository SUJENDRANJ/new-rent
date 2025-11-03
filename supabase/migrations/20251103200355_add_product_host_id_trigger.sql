/*
  # Add Automatic Host ID Trigger for Products

  ## Overview
  Adds a database trigger that automatically sets the host_id to the authenticated user's ID
  when inserting a product. This ensures the RLS policy check (auth.uid() = host_id) passes
  and prevents foreign key constraint violations.

  ## Changes
  - Create trigger function to set host_id from auth.uid()
  - Apply trigger to products table on INSERT
  - Ensures host_id is always set correctly even if not provided by client

  ## Security
  - Trigger runs with SECURITY DEFINER to access auth.uid()
  - Cannot be bypassed by client-side code
  - Complies with RLS policies
*/

CREATE OR REPLACE FUNCTION set_product_host_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.host_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_product_host_id_trigger ON products;

CREATE TRIGGER set_product_host_id_trigger
BEFORE INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION set_product_host_id();
