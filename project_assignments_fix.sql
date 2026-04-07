-- Fix project assignments RLS to prevent recursion and allow managers/admins to assign users
DROP POLICY IF EXISTS "Managers and admins can manage assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.project_assignments;

-- 1. Simple view policy
CREATE POLICY "Users can view all assignments" 
ON public.project_assignments FOR SELECT 
TO authenticated 
USING (true);

-- 2. Management policy WITHOUT recursive lookups
CREATE POLICY "Managers and admins can manage assignments" 
ON public.project_assignments FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'Admin' OR role = 'Project Manager' OR role = 'Project Lead')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'Admin' OR role = 'Project Manager' OR role = 'Project Lead')
  )
);
