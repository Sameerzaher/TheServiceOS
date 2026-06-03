-- Quick script to create first admin user
-- Run this in Supabase SQL Editor

-- Replace these values with your actual values:
-- 1. YOUR_BUSINESS_ID - get from public.businesses or environment
-- 2. YOUR_TEACHER_ID - get from public.teachers

-- Step 1: Create admin user
INSERT INTO public.users (
  id,
  business_id,
  email,
  password_hash,
  full_name,
  phone,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'YOUR_BUSINESS_ID'::uuid,  -- REPLACE THIS
  'admin@test.com',
  -- This is password hash for: Admin123!
  -- Salt:Hash format from PBKDF2
  '8a7d7c6b5a4e3d2c1b0a9f8e7d6c5b4a:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  'Admin User',
  '050-0000000',
  'admin',
  true,
  NOW(),
  NOW()
)
RETURNING id;

-- Note: The password hash above is just a placeholder
-- You should generate a real one using the passwordUtils

-- Step 2: Link admin to a teacher
-- Get the user_id from step 1 and insert here:
INSERT INTO public.user_teachers (
  user_id,
  teacher_id
) VALUES (
  'USER_ID_FROM_STEP_1'::uuid,  -- REPLACE THIS
  'YOUR_TEACHER_ID'::uuid        -- REPLACE THIS
);

-- For testing, you can also use this simpler approach:
-- Just run the signup API from your browser console:

/*
fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@test.com',
    password: 'Admin123!',
    fullName: 'Admin User',
    phone: '050-0000000',
    role: 'admin',
    teacherIds: ['YOUR_TEACHER_ID']  // Get from /api/teachers
  })
}).then(r => r.json()).then(console.log)
*/
