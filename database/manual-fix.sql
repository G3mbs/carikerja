-- Manual fix for job_applications table
-- Copy and paste this into Supabase SQL Editor

-- First, let's see what the current table looks like
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'job_applications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop the existing table and recreate with proper structure
DROP TABLE IF EXISTS application_activities CASCADE;
DROP TABLE IF EXISTS application_documents CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;

-- Create the enhanced job_applications table
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    cv_id UUID,
    
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
    employment_type VARCHAR(50),
    work_arrangement VARCHAR(50),
    
    -- Contact and communication
    hr_contact VARCHAR(255),
    hr_email VARCHAR(255),
    hr_phone VARCHAR(50),
    
    -- Application tracking
    application_method VARCHAR(100),
    referral_source VARCHAR(255),
    
    -- Notes and documents
    notes TEXT,
    cover_letter_used TEXT,
    documents_submitted TEXT[],
    
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
    
    -- Integration fields
    task_id VARCHAR(255),
    linkedin_job_id UUID,
    cv_data JSONB,
    automation_results JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_salary_range CHECK (salary_offered >= 0),
    CONSTRAINT valid_offer_salary CHECK (offer_salary >= 0),
    CONSTRAINT valid_interview_rounds CHECK (interview_rounds >= 0)
);

-- Create application_documents table
CREATE TABLE application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create application_activities table
CREATE TABLE application_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX idx_job_applications_cv_id ON job_applications(cv_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_company ON job_applications(company_name);
CREATE INDEX idx_job_applications_position ON job_applications(position_title);
CREATE INDEX idx_job_applications_date ON job_applications(application_date);
CREATE INDEX idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX idx_application_documents_user_id ON application_documents(user_id);
CREATE INDEX idx_application_activities_application_id ON application_activities(application_id);
CREATE INDEX idx_application_activities_user_id ON application_activities(user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_job_applications_updated_at 
    BEFORE UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Test insert
INSERT INTO job_applications (
    user_id, 
    company_name, 
    position_title, 
    status
) VALUES (
    'test-user', 
    'Test Company', 
    'Software Engineer', 
    'applied'
);

-- Verify the insert worked
SELECT * FROM job_applications WHERE user_id = 'test-user';

-- Clean up test data
DELETE FROM job_applications WHERE user_id = 'test-user';

-- Show final table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'job_applications' 
AND table_schema = 'public'
ORDER BY ordinal_position;
