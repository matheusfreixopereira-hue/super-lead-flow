
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'closer', 'sdr');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sdr',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (separate from profiles per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Supervisors can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Supervisors can manage sdr and closer roles" ON public.user_roles
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'supervisor') 
    AND role IN ('sdr', 'closer')
  );

-- RLS for profiles
CREATE POLICY "Anyone authenticated can view profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Supervisors can insert sdr/closer profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'supervisor'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Leads table (new schema with SDR/Closer fields)
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'marketing',
  franchise TEXT NOT NULL DEFAULT 'Vinho 24h',
  sdr_id UUID REFERENCES auth.users(id),
  closer_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  stage TEXT NOT NULL DEFAULT 'sdr_received',
  temperature TEXT NOT NULL DEFAULT 'warm',
  score INTEGER NOT NULL DEFAULT 0,
  bant_budget TEXT,
  bant_authority TEXT,
  bant_need TEXT,
  bant_timing TEXT,
  bant_status TEXT NOT NULL DEFAULT 'pending',
  is_ai_controlled BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  meeting_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Leads RLS
CREATE POLICY "Admins and supervisors see all leads" ON public.leads
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );
CREATE POLICY "SDRs see their assigned leads" ON public.leads
  FOR SELECT USING (
    public.has_role(auth.uid(), 'sdr') AND (sdr_id = auth.uid() OR created_by = auth.uid())
  );
CREATE POLICY "Closers see their assigned leads" ON public.leads
  FOR SELECT USING (
    public.has_role(auth.uid(), 'closer') AND (closer_id = auth.uid() OR created_by = auth.uid())
  );
CREATE POLICY "Admins/supervisors can manage all leads" ON public.leads
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );
CREATE POLICY "SDRs can update their leads" ON public.leads
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'sdr') AND sdr_id = auth.uid()
  );
CREATE POLICY "Closers can update leads they created" ON public.leads
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'closer') AND created_by = auth.uid()
  );
CREATE POLICY "SDRs can insert leads" ON public.leads
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'sdr'));
CREATE POLICY "Closers can insert leads" ON public.leads
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'closer'));

-- Lead activity log
CREATE TABLE public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view activities" ON public.lead_activities
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert activities" ON public.lead_activities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Lead messages (chat history)
CREATE TABLE public.lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'ai',
  sender_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view messages" ON public.lead_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert messages" ON public.lead_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Knowledge base for SDR IA
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  franchise TEXT NOT NULL DEFAULT 'Vinho 24h',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view knowledge base" ON public.knowledge_base
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage knowledge base" ON public.knowledge_base
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Supervisors can manage knowledge base" ON public.knowledge_base
  FOR ALL USING (public.has_role(auth.uid(), 'supervisor'));

-- Appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  scheduled_by UUID REFERENCES auth.users(id),
  date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view appointments" ON public.appointments
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage appointments" ON public.appointments
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON public.knowledge_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
