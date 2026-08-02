
-- ===== roles =====
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ===== subscriptions =====
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  hotmart_user_id text,
  hotmart_subscriber_code text,
  hotmart_transaction text,
  product_id text,
  plan_type text NOT NULL DEFAULT 'free',
  billing_cycle text,
  status text NOT NULL DEFAULT 'FREE',
  trial_active boolean NOT NULL DEFAULT false,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  subscription_start_date timestamptz,
  next_payment_date timestamptz,
  cancelled_date timestamptz,
  price_usd numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);

-- ===== hotmart raw events =====
CREATE TABLE IF NOT EXISTS public.hotmart_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE,
  event_type text NOT NULL,
  email text,
  user_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hotmart_events TO authenticated;
GRANT ALL ON public.hotmart_events TO service_role;
ALTER TABLE public.hotmart_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read hotmart events" ON public.hotmart_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ===== analytics =====
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert own events" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "read own events" ON public.analytics_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read events" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS analytics_events_name_idx ON public.analytics_events(name, created_at DESC);

-- ===== plan settings =====
CREATE TABLE IF NOT EXISTS public.plan_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_usd numeric NOT NULL DEFAULT 0,
  checkout_url text,
  trial_days integer NOT NULL DEFAULT 7,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plan_settings TO authenticated;
GRANT ALL ON public.plan_settings TO service_role;
ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone signed in reads plans" ON public.plan_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage plans" ON public.plan_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER plan_settings_updated_at BEFORE UPDATE ON public.plan_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.plan_settings (key, name, description, price_usd, checkout_url, trial_days)
VALUES
  ('monthly','Neura AI Premium Monthly','Full access, billed monthly',4.99,NULL,7),
  ('annual','Neura AI Premium Annual','Full access, billed yearly — best value',39.99,NULL,7)
ON CONFLICT (key) DO NOTHING;

-- ===== profiles extras =====
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS acquisition_source text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;
CREATE POLICY "admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ===== premium helper =====
CREATE OR REPLACE FUNCTION public.has_premium(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND (
        s.status = 'PREMIUM'
        OR (s.status = 'TRIAL' AND COALESCE(s.trial_end_date, now()) > now())
        OR (s.status = 'CANCELLED' AND COALESCE(s.next_payment_date, now()) > now())
      )
  )
$$;

-- create subscription row automatically for new profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.subscriptions (user_id, status, plan_type)
  VALUES (NEW.id, 'FREE', 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $function$;
