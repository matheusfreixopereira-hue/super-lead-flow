
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-files', 'knowledge-files', true);

CREATE POLICY "Authenticated users can upload knowledge files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'knowledge-files');

CREATE POLICY "Anyone authenticated can view knowledge files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'knowledge-files');

CREATE POLICY "Admins and supervisors can delete knowledge files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'knowledge-files' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'))
);

CREATE TABLE public.knowledge_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'document',
  file_size bigint DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view knowledge files metadata"
ON public.knowledge_files FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage knowledge files metadata"
ON public.knowledge_files FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can manage knowledge files metadata"
ON public.knowledge_files FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Admins can delete knowledge base entries"
ON public.knowledge_base FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can delete knowledge base entries"
ON public.knowledge_base FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Admins can insert knowledge base entries"
ON public.knowledge_base FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can insert knowledge base entries"
ON public.knowledge_base FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'supervisor'));
