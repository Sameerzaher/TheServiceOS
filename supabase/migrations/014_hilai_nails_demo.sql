-- Demo tenant: Hilai Nails (public booking at /book/hilai-nails)

insert into public.teachers (
  id,
  business_id,
  full_name,
  business_name,
  phone,
  slug,
  business_type,
  created_at
)
values (
  '660e8400-e29b-41d4-a716-446655440203'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'הילי',
  'Hilai Nails',
  '050-0000000',
  'hilai-nails',
  'cosmetic_clinic',
  now()
)
on conflict (slug) do update set
  id = excluded.id,
  business_id = excluded.business_id,
  full_name = excluded.full_name,
  business_name = excluded.business_name,
  phone = excluded.phone,
  business_type = excluded.business_type;

insert into public.booking_settings (
  business_id,
  teacher_id,
  booking_enabled,
  weekly_availability,
  slot_duration_minutes,
  days_ahead,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '660e8400-e29b-41d4-a716-446655440203'::uuid,
  true,
  '{
    "sunday": {"enabled": true, "startTime": "10:00", "endTime": "20:00"},
    "monday": {"enabled": true, "startTime": "10:00", "endTime": "20:00"},
    "tuesday": {"enabled": true, "startTime": "10:00", "endTime": "20:00"},
    "wednesday": {"enabled": true, "startTime": "10:00", "endTime": "20:00"},
    "thursday": {"enabled": true, "startTime": "10:00", "endTime": "20:00"},
    "friday": {"enabled": false, "startTime": "10:00", "endTime": "20:00"},
    "saturday": {"enabled": false, "startTime": "10:00", "endTime": "20:00"}
  }'::jsonb,
  60,
  14,
  now()
)
on conflict (business_id, teacher_id) do update set
  booking_enabled = excluded.booking_enabled,
  weekly_availability = excluded.weekly_availability,
  slot_duration_minutes = excluded.slot_duration_minutes,
  days_ahead = excluded.days_ahead,
  updated_at = excluded.updated_at;
