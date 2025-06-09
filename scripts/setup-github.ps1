# GitHub Repository Setup Script for CariKerja
# This script helps set up the GitHub repository and initial commit

Write-Host "Setting up GitHub repository for CariKerja..." -ForegroundColor Green

# Check if git is installed
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Git is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Add remote repository
Write-Host "Adding GitHub remote repository..." -ForegroundColor Yellow
git remote add origin https://github.com/G3mbs/carikerja.git

# Check if remote was added successfully
$remotes = git remote -v
if ($remotes -match "origin") {
    Write-Host "✓ Remote repository added successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to add remote repository" -ForegroundColor Red
    exit 1
}

# Stage all files
Write-Host "Staging files for commit..." -ForegroundColor Yellow
git add .

# Create initial commit
Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: CariKerja job search automation system

- Next.js 15.3.3 application with TypeScript
- Supabase integration for database
- Mistral AI for CV analysis and job matching
- Browser Use API for job scraping
- GitHub Actions deployment workflow
- Comprehensive job application management system"

# Create and switch to main branch
Write-Host "Setting up main branch..." -ForegroundColor Yellow
git branch -M main

Write-Host "Repository setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Push to GitHub: git push -u origin main" -ForegroundColor White
Write-Host "2. Configure GitHub Secrets (see docs/deployment-guide.md)" -ForegroundColor White
Write-Host "3. Enable GitHub Pages in repository settings" -ForegroundColor White
Write-Host ""
Write-Host "Your application will be available at: https://g3mbs.github.io/carikerja" -ForegroundColor Green
