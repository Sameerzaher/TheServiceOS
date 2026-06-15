-- Stripe / online payment fields on appointments
alter table public.appointments
  add column if not exists payment_method text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_checkout_session_id text;

create index if not exists appointments_stripe_checkout_session_idx
  on public.appointments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

comment on column public.appointments.payment_method is 'cash | card | stripe | transfer | etc.';
comment on column public.appointments.stripe_payment_intent_id is 'Stripe PaymentIntent id after successful checkout';
comment on column public.appointments.stripe_checkout_session_id is 'Stripe Checkout Session id';
