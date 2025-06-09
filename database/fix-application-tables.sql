-- Fix Application Management Tables
-- Run this script to ensure all tables are created properly

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop and recreate job_applications table if it exists with wrong schema
DROP TABLE IF EXISTS application_activities CASCADE;
DROP TABLE IF EXISTS application_documents CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;

-- Job applications table (Enhanced for comprehensive application management)
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    cv_id UUID REFERENCES cvs(id),
    
    -- Basic job information
    company_name VARCHAR(255) NOT NULL,
    position_title VARCHAR(255) NOT NULL,
    job_url TEXT,
    application_date DATE DEFAULT CURRENT_DATE,
    
    -- Application status management
    status VARCHAR(50) DEFAULT 'wishlist' CHECK (status IN (
        'wishlist', 'applied', 'assessment', 'interview', 
        'offer', 'rejected', 'hired', 'withdrawn'
    )),
    
    -- Additional details
    location VARCHAR(255),
    salary_offered DECIMAL(15,2),
    salary_currency VARCHAR(10) DEFAULT 'IDR',
    employment_type VARCHAR(50), -- full-time, part-time, contract, internship
    work_arrangement VARCHAR(50), -- remote, hybrid, onsite
    
    -- Contact and communication
    hr_contact VARCHAR(255),
    hr_email VARCHAR(255),
    hr_phone VARCHAR(50),
    
    -- Application tracking
    application_method VARCHAR(100), -- direct, linkedin, jobstreet, etc.
    referral_source VARCHAR(255),
    
    -- Notes and documents
    notes TEXT,
    cover_letter_used TEXT,
    documents_submitted TEXT[], -- Array of document names/paths
    
    -- Interview and assessment tracking
    interview_rounds INTEGER DEFAULT 0,
    next_interview_date TIMESTAMP WITH TIME ZONE,
    assessment_type VARCHAR(100),
    assessment_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Offer details
    offer_received_date DATE,
    offer_deadline DATE,
    offer_salary DECIMAL(15,2),
    offer_benefits TEXT,
    
    -- Integration fields (for existing automation features)
    task_id VARCHAR(255), -- Browser Use task ID (nullable for manual entries)
    linkedin_job_id UUID, -- Reference to linkedin_jobs table
    cv_data JSONB, -- CV data used for application
    automation_results JSONB, -- Results from automation
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_salary_range CHECK (salary_offered >= 0),
    CONSTRAINT valid_offer_salary CHECK (offer_salary >= 0),
    CONSTRAINT valid_interview_rounds CHECK (interview_rounds >= 0)
);

-- Application documents table
CREATE TABLE application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- cv, cover_letter, portfolio, certificate
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- Supabase storage path
    file_size INTEGER,
    mime_type VARCHAR(100),
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application activity log table
CREATE TABLE application_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- status_change, note_added, document_uploaded, interview_scheduled
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX idx_job_applications_cv_id ON job_applications(cv_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_company ON job_applications(company_name);
CREATE INDEX idx_job_applications_position ON job_applications(position_title);
CREATE INDEX idx_job_applications_date ON job_applications(application_date);
CREATE INDEX idx_job_applications_linkedin_job ON job_applications(linkedin_job_id);
CREATE INDEX idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX idx_application_documents_user_id ON application_documents(user_id);
CREATE INDEX idx_application_documents_type ON application_documents(document_type);
CREATE INDEX idx_application_activities_application_id ON application_activities(application_id);
CREATE INDEX idx_application_activities_user_id ON application_activities(user_id);
CREATE INDEX idx_application_activities_type ON application_activities(activity_type);

-- Create storage bucket for application documents (safe creation)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('application-documents', 'application-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_applications
CREATE POLICY "Users can view their own applications" ON job_applications
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own applications" ON job_applications
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own applications" ON job_applications
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own applications" ON job_applications
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create RLS policies for application_documents
CREATE POLICY "Users can view their own application documents" ON application_documents
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own application documents" ON application_documents
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own application documents" ON application_documents
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own application documents" ON application_documents
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create RLS policies for application_activities
CREATE POLICY "Users can view their own application activities" ON application_activities
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own application activities" ON application_activities
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Success message
SELECT 'Application management tables created successfully!' as status;
