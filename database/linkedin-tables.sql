-- LinkedIn Scraping Tables Creation Script
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create linkedin_scraping_sessions table
CREATE TABLE IF NOT EXISTS public.linkedin_scraping_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    cv_id UUID,
    search_params JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    progress JSONB,
    total_jobs_found INTEGER DEFAULT 0,
    google_sheets_url TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create linkedin_jobs table
CREATE TABLE IF NOT EXISTS public.linkedin_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    cv_id UUID,
    linkedin_url TEXT UNIQUE NOT NULL,
    company_logo_url TEXT,
    job_title_short TEXT,
    insight_status TEXT,
    application_status TEXT DEFAULT 'not_applied',
    easy_apply BOOLEAN DEFAULT false,
    additional_insights TEXT[],
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    location TEXT,
    salary_range TEXT,
    posted_time TEXT,
    match_score INTEGER,
    notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE,
    interview_date TIMESTAMP WITH TIME ZONE,
    scraping_session_id VARCHAR(255),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_linkedin_sessions_user_id ON public.linkedin_scraping_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_sessions_status ON public.linkedin_scraping_sessions(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_sessions_created_at ON public.linkedin_scraping_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_linkedin_jobs_user_id ON public.linkedin_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_jobs_session_id ON public.linkedin_jobs(scraping_session_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_jobs_application_status ON public.linkedin_jobs(application_status);
CREATE INDEX IF NOT EXISTS idx_linkedin_jobs_scraped_at ON public.linkedin_jobs(scraped_at);

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_linkedin_jobs_updated_at 
    BEFORE UPDATE ON public.linkedin_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_linkedin_scraping_sessions_updated_at 
    BEFORE UPDATE ON public.linkedin_scraping_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.linkedin_scraping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for linkedin_scraping_sessions
CREATE POLICY "Users can view their own scraping sessions" ON public.linkedin_scraping_sessions
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own scraping sessions" ON public.linkedin_scraping_sessions
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own scraping sessions" ON public.linkedin_scraping_sessions
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own scraping sessions" ON public.linkedin_scraping_sessions
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create RLS policies for linkedin_jobs
CREATE POLICY "Users can view their own LinkedIn jobs" ON public.linkedin_jobs
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own LinkedIn jobs" ON public.linkedin_jobs
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own LinkedIn jobs" ON public.linkedin_jobs
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own LinkedIn jobs" ON public.linkedin_jobs
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Grant necessary permissions
GRANT ALL ON public.linkedin_scraping_sessions TO authenticated;
GRANT ALL ON public.linkedin_jobs TO authenticated;
GRANT ALL ON public.linkedin_scraping_sessions TO anon;
GRANT ALL ON public.linkedin_jobs TO anon;

SELECT 'LinkedIn tables created successfully!' as result;
