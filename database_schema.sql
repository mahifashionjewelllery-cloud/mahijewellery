-- =========================================================================================
-- COMPLETE DATABASE SCHEMA AND RLS POLICIES FOR MAHI FASHION JEWELLERY
-- =========================================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. PROFILES & AUTHENTICATION
-- ==========================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  address text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Trigger to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.phone, 
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it was created previously
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- 2. METAL RATES
-- ==========================================
create table public.metal_rates (
  id uuid default uuid_generate_v4() primary key,
  metal_type text not null check (metal_type in ('gold', 'silver')),
  purity text not null,
  rate_per_gram numeric not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.metal_rates enable row level security;
alter table public.metal_rates add constraint metal_rates_type_purity_key UNIQUE (metal_type, purity);

create policy "Anyone can view metal rates" on public.metal_rates
  for select using (true);

create policy "Only admins can insert metal rates" on public.metal_rates
  for insert with check (public.is_admin());

create policy "Only admins can update metal rates" on public.metal_rates
  for update using (public.is_admin());

create policy "Only admins can delete metal rates" on public.metal_rates
  for delete using (public.is_admin());

-- Insert default standard rates (uncomment to apply initially)
-- INSERT INTO public.metal_rates (metal_type, purity, rate_per_gram) VALUES
-- ('gold', '24K', 7200),
-- ('gold', '22K', 6800),
-- ('gold', '18K', 5600),
-- ('silver', '92.5', 85),
-- ('silver', 'pure', 90);


-- ==========================================
-- 3. PRODUCTS & IMAGES
-- ==========================================
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  metal_type text not null check (metal_type in ('gold', 'silver', 'diamond')),
  purity text not null,
  weight numeric not null,
  making_charge_type text not null check (making_charge_type in ('percentage', 'fixed')),
  making_charge_value numeric not null,
  stock integer not null default 0,
  is_featured boolean default false,
  collection_id uuid references public.collections(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.products enable row level security;

create policy "Products are viewable by everyone" on public.products
  for select using (true);

create policy "Admins can manage products" on public.products
  for all using (is_admin());

create table public.product_images (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.product_images enable row level security;

create policy "Product images are viewable by everyone" on public.product_images
  for select using (true);

create policy "Admins can manage product images" on public.product_images
  for all using (is_admin());


-- ==========================================
-- 4. ORDERS
-- ==========================================
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  -- Note: ON DELETE CASCADE is crucial so admins can delete users who have orders
  user_id uuid references auth.users(id) on delete cascade,
  total_amount numeric not null,
  payment_status text not null default 'cod',
  payment_method text default 'cod',
  order_status text not null default 'processing',
  shipping_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders enable row level security;

create policy "Users can view their own orders" on public.orders
  for select using (auth.uid() = user_id);

create policy "Admins can view all orders" on public.orders
  for select using (is_admin());

create policy "Admins can update orders" on public.orders
  for update using (is_admin());
  
create policy "Users can create orders" on public.orders
  for insert with check (auth.uid() = user_id OR auth.uid() IS NULL); 


create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null default 1,
  price_at_purchase numeric not null,
  metal_rate_at_purchase numeric
);

alter table public.order_items enable row level security;

create policy "Users can view their own order items" on public.order_items
  for select using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));

create policy "Admins can view all order items" on public.order_items
  for select using (is_admin());
  
create policy "Users can insert order items" on public.order_items
  for insert with check (
    exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()) 
    OR auth.uid() IS NULL
  );


-- ==========================================
-- 5. COLLECTIONS
-- ==========================================
create table public.collections (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  image_url text not null,
  link text not null,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.collections enable row level security;

create policy "Public can view active collections" on public.collections
  for select using (is_active = true);

create policy "Admins can manage collections" on public.collections
  for all using (is_admin());

grant select on public.collections to anon, authenticated;
grant all on public.collections to authenticated;


-- ==========================================
-- 6. CONTACT MESSAGES
-- ==========================================
create table public.contact_messages (
  id uuid default uuid_generate_v4() primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  message text not null,
  status text default 'new' check (status in ('new', 'read', 'replied')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.contact_messages enable row level security;

create policy "Anyone can submit contact messages" on public.contact_messages
  for insert with check (true);

create policy "Admins can view contact messages" on public.contact_messages
  for select using (is_admin());

create policy "Admins can update contact messages" on public.contact_messages
  for update using (is_admin());
  
create policy "Admins can delete contact messages" on public.contact_messages
  for delete using (is_admin());

grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;


-- ==========================================
-- 7. SOCIAL LINKS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.social_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    icon VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active social links" on public.social_links 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage social links" on public.social_links 
  FOR ALL USING (is_admin());


-- ==========================================
-- 8. SITE SETTINGS
-- ==========================================
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.site_settings enable row level security;

create policy "Anyone can view site settings" on public.site_settings
  for select using (true);

create policy "Only admins can update site settings" on public.site_settings
  for all using (is_admin());


-- ==========================================
-- 10. WISHLISTS
-- ==========================================
create table public.wishlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

alter table public.wishlists enable row level security;

create policy "Users can view their own wishlists" on public.wishlists
  for select using (auth.uid() = user_id);

create policy "Users can insert into their own wishlists" on public.wishlists
  for insert with check (auth.uid() = user_id);

create policy "Users can delete from their own wishlists" on public.wishlists
  for delete using (auth.uid() = user_id);


-- ==========================================
-- APPENDIX: USEFUL UTILITY SCRIPTS
-- ==========================================

/*
-- A. Make a specific user an Admin Forcefully (replace email)
UPDATE public.profiles SET role = 'admin' FROM auth.users
WHERE public.profiles.id = auth.users.id
AND auth.users.email ILIKE 'mahifashionjewelllery@gmail.com';

-- B. Delete all users completely (DANGER)
BEGIN;
DELETE FROM public.orders;
DELETE FROM public.wishlists;
DELETE FROM public.profiles;
DELETE FROM auth.users;
COMMIT;

-- C. Check roles of all users
SELECT au.id, au.email, au.created_at, p.role as profile_role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;
*/
