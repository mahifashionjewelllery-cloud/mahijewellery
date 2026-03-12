-- 1. Initial Site Settings
INSERT INTO public.site_settings (key, value) VALUES
('site_name', '"Mahi Fashion Jewellery"'),
('contact_email', '"mahifashionjewelllery@gmail.com"'),
('contact_phone', '"+91 1234567890"'),
('address', '"City, State, India"'),
('about_text', '"Crafting timeless elegance in gold and silver. Each piece tells a story of heritage, purity, and unmatched artistry."'),
('logo_url', '"/mahilogo.png"'),
('announcement_bar', '"Free shipping on orders above ₹10,000!"')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Grant permissions
GRANT SELECT ON public.site_settings TO anon, authenticated;

-- 3. Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
