-- 1. Grant permissions for social_links
grant select on public.social_links to anon, authenticated;

-- 2. Enable real-time for social_links
alter publication supabase_realtime add table public.social_links;
