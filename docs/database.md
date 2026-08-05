# Database Schema & Structure

## Tables
- `profiles`: Stores user profile information (name, phone, avatar) and their `role` (admin or user).
- `addresses`: Stores multiple delivery addresses per user.
- `merchants`: Stores merchant details, location (lat, lng), and rating.
- `categories`: Product categories.
- `products`: Food items available for rescue, linked to merchants.
- `product_images`: Additional images for products.
- `favorites`: User's saved/favorite products.
- `orders`: Order tracking (pending, paid, preparing, ready, completed, cancelled, refunded).
- `order_items`: Line items within an order.
- `payments`: Payment transaction records.
- `refunds`: Refund requests tied to orders.
- `refund_evidence`: Images uploaded as evidence for refunds.
- `ai_food_reviews`: AI analysis records for refund fraud detection.
- `notifications`: User notifications.
- `audit_logs`: Admin logs for tracking system actions.

## Roles & RLS
- All tables have Row Level Security (RLS) enabled.
- `profiles` policy ensures users can only read and update their own profiles.
- `orders` and `order_items` check `auth.uid() = user_id`.
- `merchants` and `products` are publicly readable for browsing.
- Admin access is granted by assigning `role = 'admin'` in `profiles`. Admin routes on the Next.js side check this role.

## Migrations
- `00000000000000_initial_schema.sql`: Full base schema creation.
- `00000000000001_add_role_to_profiles.sql`: Added role tracking for Admin access.
