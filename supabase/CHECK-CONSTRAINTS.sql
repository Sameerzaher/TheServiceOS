-- ========================================
-- CHECK: What constraints exist on appointments?
-- ========================================

SELECT 
  conname as constraint_name,
  pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
WHERE con.conrelid = 'public.appointments'::regclass
ORDER BY conname;
