# CariKerja Deployment Guide

## Overview
This guide explains how to deploy the CariKerja web application using Vercel (recommended) or other hosting platforms that support Next.js applications with API routes.

## Prerequisites
- GitHub account
- Git installed locally
- Node.js 18+ installed locally
- Vercel account (for recommended deployment)

## Deployment Options

### Option 1: Vercel Deployment (Recommended)
Vercel is the recommended platform for Next.js applications as it provides:
- Automatic deployments from GitHub
- Built-in support for Next.js API routes
- Edge functions and serverless deployment
- Automatic HTTPS and CDN

#### Setup Steps:
1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com) and sign up
2. **Connect GitHub**: Link your GitHub account to Vercel
3. **Import Project**: Import the `carikerja` repository
4. **Configure Environment Variables** (see section below)
5. **Deploy**: Vercel will automatically deploy on every push to main branch

### Option 2: Alternative Platforms
- **Netlify**: Supports Next.js with serverless functions
- **Railway**: Full-stack deployment platform
- **Render**: Static sites and web services
- **Heroku**: Container-based deployment

## Initial Setup

### 1. Repository Setup
The repository is configured at: `https://github.com/G3mbs/carikerja.git`

### 2. Environment Variables Configuration

#### For Vercel Deployment:
1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add the following variables:

#### For GitHub Secrets (CI/CD):
1. Go to your GitHub repository: `https://github.com/G3mbs/carikerja`
2. Click on "Settings" tab
3. In the left sidebar, click "Secrets and variables" → "Actions"
4. Click "New repository secret" for each of the following:

#### Required Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://bddswfuvxkpxixbrazay.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkZHN3ZnV2eGtweGl4YnJhemF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzUzNTAsImV4cCI6MjA2NDk1MTM1MH0.9o4B1tUgqmV_W-9XpIRpWUZcoTgLz9_X9UIaAYMDUpU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkZHN3ZnV2eGtweGl4YnJhemF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM3NTM1MCwiZXhwIjoyMDY0OTUxMzUwfQ.o_heZJRk7U2YSyLyZS-4TRkKIOUHHhNdd1giv3_HHtI
MISTRAL_API_KEY=x6ay6gt6Y5bA6codUJzIJtOKut4RF70j
MISTRAL_MODEL=mistral-large-latest
BROWSER_USE_API_KEY=bu_xlmmLOgEAdh_EUZEd7BSDiACpKen7fTqe2NeRe56qvI
BROWSER_USE_BASE_URL=https://api.browser-use.com/api/v1
NEXTAUTH_SECRET=carikerja-secret-key-2024-very-secure-random-string
NEXTAUTH_URL=https://your-app-name.vercel.app
```

**Note**: Update `NEXTAUTH_URL` with your actual deployment URL

## Deployment Process

### Automatic Deployment
The application automatically deploys when:
- Code is pushed to the `main` branch
- A pull request is merged to `main`
- Manual trigger via GitHub Actions tab

### Manual Deployment
1. Go to "Actions" tab in your GitHub repository
2. Click on "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button
4. Select the branch and click "Run workflow"

## Local Development

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Fill in your actual API keys and configuration
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start development server

### Testing Build Locally
```bash
npm run build
npm run start
```

## Troubleshooting

### Common Issues
1. **Build Failures**: Check that all environment variables are properly set in GitHub Secrets
2. **404 Errors**: Ensure `basePath` is correctly configured in `next.config.ts`
3. **API Errors**: Verify that NEXTAUTH_URL points to the correct GitHub Pages URL

### Checking Deployment Status
1. Go to "Actions" tab to see deployment progress
2. Check "Pages" section in repository settings for deployment URL
3. View deployment logs for detailed error information

## Security Notes
- Never commit `.env.local` or any files containing API keys
- All sensitive data is stored in GitHub Secrets
- Public environment variables (NEXT_PUBLIC_*) are visible in the client-side code

## Future Deployments
After initial setup, deployments are automatic. Simply push code to the main branch and GitHub Actions will handle the rest.

## Support
For deployment issues, check:
1. GitHub Actions logs
2. Repository Issues tab
3. Next.js deployment documentation
