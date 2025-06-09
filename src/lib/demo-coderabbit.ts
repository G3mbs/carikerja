// Demo file untuk test CodeRabbit AI
// File ini sengaja dibuat dengan beberapa issues yang akan di-detect CodeRabbit

export class JobSearchDemo {
  // ⚠️ CodeRabbit akan detect: API key exposure risk
  private apiKey = process.env.MISTRAL_API_KEY;
  
  // ⚠️ CodeRabbit akan suggest: proper typing instead of 'any'
  async searchJobs(criteria: any) {
    // ⚠️ CodeRabbit akan detect: missing input validation
    
    // ⚠️ CodeRabbit akan detect: SQL injection risk
    const query = `SELECT * FROM jobs WHERE title LIKE '%${criteria.title}%'`;
    
    // ⚠️ CodeRabbit akan detect: missing error handling
    const response = await fetch('/api/jobs/search', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
    
    return response.json();
  }
  
  // ⚠️ CodeRabbit akan suggest: async/await instead of Promise
  processJobData(data: any): Promise<any> {
    return new Promise((resolve) => {
      // ⚠️ CodeRabbit akan detect: inefficient processing
      const processed = data.map((job: any) => {
        return {
          ...job,
          // ⚠️ CodeRabbit akan suggest: proper date handling
          formattedDate: new Date(job.created_at).toString()
        };
      });
      
      resolve(processed);
    });
  }
  
  // ⚠️ CodeRabbit akan detect: missing return type
  calculateSalaryRange(jobs) {
    let total = 0;
    let count = 0;
    
    // ⚠️ CodeRabbit akan suggest: use reduce or proper iteration
    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i].salary) {
        total += jobs[i].salary;
        count++;
      }
    }
    
    // ⚠️ CodeRabbit akan detect: division by zero risk
    return total / count;
  }
}

// ⚠️ CodeRabbit akan suggest: proper export pattern
export default JobSearchDemo;
