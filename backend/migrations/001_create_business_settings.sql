-- Create business_settings table for storing FJL business configuration
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name VARCHAR(255) NOT NULL DEFAULT 'Famous Jelly Luxe',
  bank_name VARCHAR(255) NOT NULL DEFAULT 'Access Bank',
  account_number VARCHAR(50) NOT NULL DEFAULT '1770816426',
  account_type VARCHAR(100) NOT NULL DEFAULT 'Business Account',
  store_email VARCHAR(255) NOT NULL DEFAULT 'hello@fjlclothing.shop',
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 7.5,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,`
  currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  currency_symbol VARCHAR(5) NOT NULL DEFAULT '$',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_business_settings_created_at ON public.business_settings(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (needed for email service)
CREATE POLICY "Allow anyone to read business settings"
  ON public.business_settings
  FOR SELECT
  USING (true);

-- Allow only authenticated admin users to update settings
CREATE POLICY "Allow admin users to update business settings"
  ON public.business_settings
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert default settings
INSERT INTO public.business_settings
  (account_name, bank_name, account_number, account_type, store_email, tax_rate, shipping_cost, currency, currency_symbol)
VALUES
  ('Famous Jelly Luxe', 'Access Bank', '1770816426', 'Business Account', 'hello@fjlclothing.shop', 7.5, 0, 'CAD', '$')
ON CONFLICT DO NOTHING;
