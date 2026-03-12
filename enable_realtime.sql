-- Enable real-time for metal_rates table
-- This allows Supabase to broadcast changes to connected clients

-- 1. Create the publication if it doesn't exist (Supabase standard)
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- 2. Add the metal_rates table to the publication
alter publication supabase_realtime add table public.metal_rates;
