-- Clean Database Setup for CariKerja (New Supabase Project)
-- Run this script in your NEW Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS job_results CASCADE;
DROP TABLE IF EXISTS job_searches CASCADE;
DROP TABLE IF EXISTS market_research CASCADE;
DROP TABLE IF EXISTS job_alerts CASCADE;
DROP TABLE IF EXISTS cvs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (if not using Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CVs table
CREATE TABLE cvs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Can be UUID or string for demo
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    content TEXT, -- Parsed CV content
    basic_info JSONB, -- Basic extracted info (name, email, phone)
    analysis JSONB, -- Full AI analysis result
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true
);

-- Job searches table
CREATE TABLE job_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    task_id VARCHAR(255) NOT NULL, -- Browser Use task ID
    search_params JSONB NOT NULL, -- Search parameters
    platforms TEXT[] NOT NULL, -- Array of platform names
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job results table
CREATE TABLE job_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    job_data JSONB NOT NULL, -- Full job information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Market research table
CREATE TABLE market_research (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    industry VARCHAR(255) NOT NULL,
    location VARCHAR(255) DEFAULT 'Indonesia',
    research_data JSONB NOT NULL, -- Full research results
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job alerts table
CREATE TABLE job_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    search_params JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly, instant
    last_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE INDEX idx_cvs_user_id ON cvs(user_id);
CREATE INDEX idx_cvs_is_active ON cvs(is_active);
CREATE INDEX idx_job_searches_user_id ON job_searches(user_id);
CREATE INDEX idx_job_searches_task_id ON job_searches(task_id);
CREATE INDEX idx_job_results_user_id ON job_results(user_id);
CREATE INDEX idx_job_results_task_id ON job_results(task_id);
CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX idx_job_applications_cv_id ON job_applications(cv_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_company ON job_applications(company_name);
CREATE INDEX idx_job_applications_position ON job_applications(position_title);
CREATE INDEX idx_job_applications_date ON job_applications(application_date);
CREATE INDEX idx_job_applications_linkedin_job ON job_applications(linkedin_job_id);
CREATE INDEX idx_market_research_user_id ON market_research(user_id);
CREATE INDEX idx_job_alerts_user_id ON job_alerts(user_id);
CREATE INDEX idx_job_alerts_is_active ON job_alerts(is_active);
CREATE INDEX idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX idx_application_documents_user_id ON application_documents(user_id);
CREATE INDEX idx_application_documents_type ON application_documents(document_type);
CREATE INDEX idx_application_activities_application_id ON application_activities(application_id);
CREATE INDEX idx_application_activities_user_id ON application_activities(user_id);
CREATE INDEX idx_application_activities_type ON application_activities(activity_type);

-- Create storage bucket for CV files (safe creation)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cv-files', 'cv-files', false)
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
CREATE TRIGGER update_cvs_updated_at BEFORE UPDATE ON cvs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_searches_updated_at BEFORE UPDATE ON job_searches
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_alerts_updated_at BEFORE UPDATE ON job_alerts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Additional storage buckets for application documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-documents', 'application-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Database tables created successfully!' as status;
