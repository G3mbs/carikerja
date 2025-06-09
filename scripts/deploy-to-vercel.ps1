# Deploy CariKerja to Vercel
# This script helps with Vercel deployment setup

Write-Host "🚀 CariKerja Vercel Deployment Helper" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    
    if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Failed to install Vercel CLI. Please install manually:" -ForegroundColor Red
        Write-Host "npm install -g vercel" -ForegroundColor White
        exit 1
    }
}

Write-Host "✅ Vercel CLI found" -ForegroundColor Green

# Check if project builds successfully
Write-Host ""
Write-Host "🔨 Testing build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix build errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Login to Vercel
Write-Host ""
Write-Host "🔐 Vercel login required..." -ForegroundColor Yellow
vercel login

# Deploy to Vercel
Write-Host ""
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host ""
Write-Host "🎉 Deployment initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "2. Update NEXTAUTH_URL with your deployment URL" -ForegroundColor White
Write-Host "3. Test all features in production" -ForegroundColor White
Write-Host ""
Write-Host "Environment variables needed:" -ForegroundColor Cyan
Write-Host "- NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor White
Write-Host "- NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor White
Write-Host "- SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
Write-Host "- MISTRAL_API_KEY" -ForegroundColor White
Write-Host "- MISTRAL_MODEL" -ForegroundColor White
Write-Host "- BROWSER_USE_API_KEY" -ForegroundColor White
Write-Host "- BROWSER_USE_BASE_URL" -ForegroundColor White
Write-Host "- NEXTAUTH_SECRET" -ForegroundColor White
Write-Host "- NEXTAUTH_URL" -ForegroundColor White
Write-Host ""
Write-Host "📚 See docs/deployment-guide.md for detailed instructions" -ForegroundColor Cyan
