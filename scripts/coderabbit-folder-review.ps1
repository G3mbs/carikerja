# CodeRabbit Folder-Specific Review Script
# Script untuk trigger review pada folder tertentu

param(
    [Parameter(Mandatory=$true)]
    [string]$FolderPath,
    
    [Parameter(Mandatory=$false)]
    [string]$ReviewType = "comprehensive",
    
    [Parameter(Mandatory=$false)]
    [string]$BranchName = ""
)

Write-Host "🤖 CodeRabbit Folder Review Tool" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Validate folder exists
if (!(Test-Path $FolderPath)) {
    Write-Host "❌ Error: Folder '$FolderPath' not found" -ForegroundColor Red
    exit 1
}

# Generate branch name if not provided
if ($BranchName -eq "") {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $folderName = Split-Path $FolderPath -Leaf
    $BranchName = "review/$folderName-$timestamp"
}

Write-Host "📁 Target Folder: $FolderPath" -ForegroundColor Cyan
Write-Host "🔍 Review Type: $ReviewType" -ForegroundColor Cyan
Write-Host "🌿 Branch Name: $BranchName" -ForegroundColor Cyan
Write-Host ""

# Create new branch for review
Write-Host "🌿 Creating review branch..." -ForegroundColor Yellow
git checkout -b $BranchName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create branch" -ForegroundColor Red
    exit 1
}

# Add a comment to trigger CodeRabbit review
$reviewComment = @"
// CodeRabbit Review Request for $FolderPath
// Review Type: $ReviewType
// Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

/*
@coderabbitai Please review this folder with focus on:
- Security vulnerabilities
- Performance optimizations  
- Code quality and best practices
- TypeScript type safety
- Indonesian market context

Folder: $FolderPath
Priority: High
*/
"@

$commentFile = Join-Path $FolderPath "coderabbit-review-request.md"
$reviewComment | Out-File -FilePath $commentFile -Encoding UTF8

Write-Host "✅ Review request file created: $commentFile" -ForegroundColor Green

# Stage and commit changes
Write-Host "📝 Committing review request..." -ForegroundColor Yellow
git add $commentFile

$commitMessage = @"
CodeRabbit: Request review for $FolderPath

Review focus areas:
- Security analysis
- Performance optimization
- Code quality assessment
- Best practices validation

Folder: $FolderPath
Type: $ReviewType
"@

git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to commit changes" -ForegroundColor Red
    exit 1
}

# Push branch
Write-Host "🚀 Pushing branch to remote..." -ForegroundColor Yellow
git push origin $BranchName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push branch" -ForegroundColor Red
    exit 1
}

# Generate PR URL
$repoUrl = "https://github.com/G3mbs/carikerja"
$prUrl = "$repoUrl/pull/new/$BranchName"

Write-Host ""
Write-Host "🎉 Review request completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create Pull Request: $prUrl" -ForegroundColor White
Write-Host "2. CodeRabbit will review within 2-3 minutes" -ForegroundColor White
Write-Host "3. Check PR for detailed feedback" -ForegroundColor White
Write-Host ""

# Open PR creation page
$openBrowser = Read-Host "Open PR creation page in browser? (y/n)"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Process $prUrl
}

Write-Host "📊 Review Statistics:" -ForegroundColor Cyan
$fileCount = (Get-ChildItem -Path $FolderPath -Recurse -File | Where-Object { $_.Extension -match '\.(ts|tsx|js|jsx)$' }).Count
Write-Host "Files to review: $fileCount" -ForegroundColor White
Write-Host "Estimated review time: $([math]::Ceiling($fileCount / 10)) minutes" -ForegroundColor White

Write-Host ""
Write-Host "🤖 CodeRabbit will analyze:" -ForegroundColor Cyan
Write-Host "✅ Security vulnerabilities" -ForegroundColor White
Write-Host "✅ Performance issues" -ForegroundColor White
Write-Host "✅ Code quality problems" -ForegroundColor White
Write-Host "✅ Best practice violations" -ForegroundColor White
Write-Host "✅ TypeScript type safety" -ForegroundColor White
Write-Host ""

# Cleanup
Remove-Item $commentFile -Force
git reset HEAD~1 --soft
git reset HEAD $commentFile

Write-Host "🧹 Cleanup completed" -ForegroundColor Green
Write-Host "Ready for CodeRabbit review! 🚀" -ForegroundColor Green
