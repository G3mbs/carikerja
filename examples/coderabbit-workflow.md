# 🔄 CodeRabbit Workflow Examples

## Example 1: Adding New Feature

### Step 1: Create Branch
```bash
git checkout -b feature/job-alerts-enhancement
```

### Step 2: Write Code
```typescript
// src/lib/job-alerts-enhanced.ts
export class JobAlertsService {
  private apiKey = process.env.MISTRAL_API_KEY; // ⚠️ CodeRabbit akan detect ini
  
  async createAlert(userId: string, criteria: any) { // ⚠️ CodeRabbit akan suggest type
    // Missing input validation - CodeRabbit akan detect
    const query = `INSERT INTO alerts VALUES (${userId}, '${criteria}')`; // ⚠️ SQL Injection risk
    
    return await this.executeQuery(query);
  }
}
```

### Step 3: Commit & Push
```bash
git add .
git commit -m "Add enhanced job alerts service"
git push origin feature/job-alerts-enhancement
```

### Step 4: Create Pull Request
- Go to GitHub → Create PR
- CodeRabbit akan otomatis review dalam 2-3 menit

### Step 5: CodeRabbit Review Results
CodeRabbit akan memberikan comments seperti:

**🔒 Security Issue:**
```
⚠️ Potential API key exposure detected
Line 3: private apiKey = process.env.MISTRAL_API_KEY;

Suggestion: Store API keys in secure environment variables and validate they exist:
private apiKey = this.validateApiKey(process.env.MISTRAL_API_KEY);
```

**🚨 Critical Security:**
```
🚨 SQL Injection vulnerability detected
Line 7: const query = `INSERT INTO alerts VALUES (${userId}, '${criteria}')`;

Suggestion: Use parameterized queries:
const { data, error } = await supabase
  .from('alerts')
  .insert({ user_id: userId, criteria: criteria });
```

**📝 Type Safety:**
```
💡 TypeScript improvement
Line 5: criteria: any

Suggestion: Define proper interface:
interface AlertCriteria {
  keywords: string[];
  location: string;
  salary_range: { min: number; max: number };
}
```

### Step 6: Address CodeRabbit Suggestions
```typescript
// Improved code based on CodeRabbit suggestions
interface AlertCriteria {
  keywords: string[];
  location: string;
  salary_range: { min: number; max: number };
}

export class JobAlertsService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = this.validateApiKey(process.env.MISTRAL_API_KEY);
  }
  
  private validateApiKey(key: string | undefined): string {
    if (!key) throw new Error('MISTRAL_API_KEY is required');
    return key;
  }
  
  async createAlert(userId: string, criteria: AlertCriteria) {
    // Input validation
    if (!userId || !criteria.keywords.length) {
      throw new Error('Invalid input parameters');
    }
    
    // Safe database query using Supabase
    const { data, error } = await supabase
      .from('job_alerts')
      .insert({
        user_id: userId,
        criteria: criteria,
        created_at: new Date().toISOString()
      });
      
    if (error) throw error;
    return data;
  }
}
```

### Step 7: CodeRabbit Re-review
Setelah fix, CodeRabbit akan review lagi dan memberikan:
```
✅ Security issues resolved
✅ Type safety improved
✅ Best practices implemented
💡 Consider adding unit tests for this service
```

## Example 2: Bug Fix Workflow

### Step 1: Create Bug Fix Branch
```bash
git checkout -b bugfix/cv-upload-validation
```

### Step 2: Fix Code
```typescript
// Before (buggy code)
export async function uploadCV(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/cv/upload', {
    method: 'POST',
    body: formData
  });
  
  return response.json(); // ⚠️ No error handling
}

// After (CodeRabbit will approve this)
export async function uploadCV(file: File): Promise<CVUploadResponse> {
  // Input validation
  if (!file) throw new Error('File is required');
  if (file.size > 10 * 1024 * 1024) throw new Error('File too large');
  if (!['application/pdf', 'application/msword'].includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/cv/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result as CVUploadResponse;
  } catch (error) {
    console.error('CV upload error:', error);
    throw error;
  }
}
```

### Step 3: CodeRabbit Feedback
```
✅ Excellent error handling implementation
✅ Input validation added
✅ Type safety improved
💡 Consider adding progress callback for large files
⭐ This follows React/Next.js best practices
```

## Example 3: Performance Optimization

### CodeRabbit Performance Suggestions:
```typescript
// CodeRabbit akan suggest optimization untuk:

// 1. React Component Performance
const JobList = ({ jobs }: { jobs: Job[] }) => {
  // ⚠️ CodeRabbit: Use useMemo for expensive calculations
  const filteredJobs = jobs.filter(job => job.isActive);
  
  return (
    <div>
      {filteredJobs.map(job => (
        <JobCard key={job.id} job={job} /> // ✅ Good: proper key
      ))}
    </div>
  );
};

// CodeRabbit suggestion:
const JobList = ({ jobs }: { jobs: Job[] }) => {
  const filteredJobs = useMemo(
    () => jobs.filter(job => job.isActive),
    [jobs]
  );
  
  return (
    <div>
      {filteredJobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
};
```

## Example 4: Database Query Optimization

```typescript
// Before - CodeRabbit akan flag ini
async function getJobApplications(userId: string) {
  const { data } = await supabase
    .from('job_applications')
    .select('*') // ⚠️ Select all columns
    .eq('user_id', userId);
    
  return data;
}

// After - CodeRabbit akan approve
async function getJobApplications(userId: string) {
  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      id,
      company_name,
      position_title,
      status,
      application_date,
      created_at
    `) // ✅ Select only needed columns
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50); // ✅ Add pagination
    
  if (error) throw error;
  return data;
}
```
