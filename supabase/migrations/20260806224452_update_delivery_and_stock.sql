-- Add delivery_method to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'pickup';

-- Update all products to have 20 stock for beta testing
UPDATE products SET stock = 20 WHERE stock < 20 OR stock IS NULL;
