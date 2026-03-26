
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view companies" ON public.companies
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage companies" ON public.companies
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Supervisors can manage companies" ON public.companies
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Admins can delete leads" ON public.leads
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));
