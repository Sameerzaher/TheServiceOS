-- ========================================
-- CHECK: What tables exist in your database?
-- ========================================
-- Run this first to see what we have

SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns c 
   WHERE c.table_schema = 'public' 
   AND c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
