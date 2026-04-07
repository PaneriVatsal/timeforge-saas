-- Add project_phases table for multi-stage tracking
CREATE TABLE IF NOT EXISTS public.project_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed')),
    order_index INTEGER NOT NULL DEFAULT 0,
    budgeted_hours FLOAT DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add phase_id to time_logs for granular tracking
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='time_logs' AND column_name='phase_id') THEN
        ALTER TABLE public.time_logs ADD COLUMN phase_id UUID REFERENCES public.project_phases(id);
    END IF;
END $$;

-- Enable RLS for phases
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

-- Project members can view phases
CREATE POLICY "Users can view phases of assigned projects" ON public.project_phases
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.project_assignments
        WHERE project_id = project_phases.project_id AND user_id = auth.uid()
    )
);

-- Project managers and above can manage phases
CREATE POLICY "Managers can manage project phases" ON public.project_phases
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.project_assignments
        WHERE project_id = project_phases.project_id 
        AND user_id = auth.uid() 
        AND role IN ('Project Manager', 'PMO', 'Project Lead')
    )
);
