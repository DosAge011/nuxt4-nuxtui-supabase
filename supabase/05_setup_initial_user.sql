-- ============================================
-- INITIAL USER SETUP
-- ============================================
-- Run this manually after setting up tables to create the first admin/webmaster user
-- This bypasses normal registration since you need at least one elevated user to manage others

-- ⚠️ IMPORTANT: After promoting a user, they MUST log out and log back in 
-- for the new role to appear in their JWT token!

-- Instructions:
-- 1. First, register a user through the app (they'll get 'user' role by default)
-- 2. Get their user UUID from the authentication page or Supabase Auth dashboard
-- 3. Replace the UUID below with the actual user ID
-- 4. Run this SQL to promote them to webmaster
-- 5. Have them LOG OUT and LOG BACK IN to refresh their JWT with the new role

-- Uncomment and modify the following:

-- -- Promote a specific user to webmaster (full control)
-- UPDATE public.user_roles 
-- SET role = 'webmaster' 
-- WHERE user_id = '00000000-0000-0000-0000-000000000000';  -- REPLACE WITH ACTUAL UUID

-- -- Alternative: Promote to director (can manage admin/user roles)
-- UPDATE public.user_roles 
-- SET role = 'director' 
-- WHERE user_id = '00000000-0000-0000-0000-000000000000';  -- REPLACE WITH ACTUAL UUID

-- -- Alternative: Promote to admin (read-only user management)
-- UPDATE public.user_roles 
-- SET role = 'admin' 
-- WHERE user_id = '00000000-0000-0000-0000-000000000000';  -- REPLACE WITH ACTUAL UUID


-- ============================================
-- OPTION 2: Create initial user via SQL (if you know the email)
-- ============================================
-- Only use this if you want to create the auth user via SQL
-- Note: The user will need to reset their password

-- -- 1. Create the auth user (they'll get a random UUID)
-- INSERT INTO auth.users (
--   instance_id,
--   id,
--   aud,
--   role,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   recovery_sent_at,
--   last_sign_in_at,
--   raw_app_meta_data,
--   raw_user_meta_data,
--   created_at,
--   updated_at,
--   confirmation_token,
--   email_change,
--   email_change_token_new,
--   recovery_token
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   gen_random_uuid(),
--   'authenticated',
--   'authenticated',
--   'webmaster@example.com',  -- REPLACE WITH YOUR EMAIL
--   crypt('temporary-password', gen_salt('bf')),  -- REPLACE WITH TEMP PASSWORD
--   now(),
--   now(),
--   now(),
--   '{"provider":"email","providers":["email"]}',
--   '{}',
--   now(),
--   now(),
--   '',
--   '',
--   '',
--   ''
-- )
-- ON CONFLICT (email) DO NOTHING
-- RETURNING id;

-- -- 2. The trigger will auto-create profile and assign 'user' role
-- -- 3. Then run this to promote to webmaster (replace with the UUID from step 1)
-- UPDATE public.user_roles 
-- SET role = 'webmaster' 
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'webmaster@example.com'
-- );


-- ============================================
-- QUICK START COMMAND
-- ============================================
-- Run this to see all users and their current roles:
-- 
-- SELECT 
--   u.id,
--   u.email,
--   ur.role
-- FROM auth.users u
-- LEFT JOIN public.user_roles ur ON u.id = ur.user_id;
