-- Add user_id to merchants to enforce 1 store per 1 account
ALTER TABLE merchants ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- We want to make it UNIQUE so one user can only have one merchant
ALTER TABLE merchants ADD CONSTRAINT merchants_user_id_key UNIQUE (user_id);

-- Update RLS policies for merchants to allow users to insert/update their own merchant profile
CREATE POLICY "Users can insert own merchant" ON merchants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own merchant" ON merchants FOR UPDATE USING (auth.uid() = user_id);
