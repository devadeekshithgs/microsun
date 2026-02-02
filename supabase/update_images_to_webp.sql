-- Update Products table
UPDATE products 
SET image_url = REPLACE(REPLACE(image_url, '.jpg', '.webp'), '.png', '.webp')
WHERE image_url LIKE '%.jpg' OR image_url LIKE '%.png';

-- Update Product Variants table
UPDATE product_variants 
SET image_url = REPLACE(REPLACE(image_url, '.jpg', '.webp'), '.png', '.webp')
WHERE image_url LIKE '%.jpg' OR image_url LIKE '%.png';
