-- Tasks and Sub-tasks Schema for TimeForge SaaS

-- 1. Create Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date DATE,
    budgeted_hours DECIMAL(10, 2) DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Sub-tasks table (Checklist items)
CREATE TABLE IF NOT EXISTS public.sub_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    order_index INTEGER DEFAULT 0
);

-- 3. Update time_logs table to link to tasks
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_logs' AND column_name = 'task_id') THEN
        ALTER TABLE public.time_logs ADD COLUMN task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_tasks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Tasks
CREATE POLICY "Users can view tasks for their assigned projects or company" 
ON public.tasks FOR SELECT 
TO authenticated 
USING (
  true -- Simplified for now, or use: company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Managers and Admins can manage tasks" 
ON public.tasks FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'Admin' OR role = 'Project Manager' OR role = 'Project Lead')
  )
);

-- 6. RLS Policies for Sub-tasks
CREATE POLICY "Users can view sub-tasks" 
ON public.sub_tasks FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Managers and Admins can create sub-tasks" 
ON public.sub_tasks FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_id AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'Admin' OR role = 'Project Manager' OR role = 'Project Lead')
    )
  )
);

CREATE POLICY "Users can manage their own sub-tasks" 
ON public.sub_tasks FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = sub_tasks.task_id AND (
      t.assigned_to_id = auth.uid() OR 
      t.created_by_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'Admin' OR role = 'Project Manager' OR role = 'Project Lead')
      )
    )
  )
);

-- 7. Trigger for updated_at in tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
