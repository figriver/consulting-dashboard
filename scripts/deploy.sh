#!/bin/bash
# Consulting Dashboard - Semi-Automated Deployment Script
# This script handles the automated steps; manual steps are noted

set -e  # Exit on error

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 Consulting Dashboard Deployment Helper"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Generate NEXTAUTH_SECRET
echo -e "${BLUE}Step 1: Generating NEXTAUTH_SECRET${NC}"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}✓ Generated: $NEXTAUTH_SECRET${NC}"
echo ""

# Step 2: Verify GitHub repo
echo -e "${BLUE}Step 2: GitHub Repository${NC}"
if [ -z "$(git remote get-url origin 2>/dev/null)" ]; then
  echo -e "${YELLOW}⚠ No Git remote configured.${NC}"
  echo "Run these commands:"
  echo "  git remote add origin https://github.com/figriver/consulting-dashboard.git"
  echo "  git push -u origin master"
else
  echo -e "${GREEN}✓ Git remote: $(git remote get-url origin)${NC}"
  echo ""
  echo -e "${YELLOW}To push code to GitHub:${NC}"
  echo "  git push origin master"
fi
echo ""

# Step 3: Check Node/npm
echo -e "${BLUE}Step 3: Verifying environment${NC}"
echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo -e "${GREEN}✓ Node/npm OK${NC}"
echo ""

# Step 4: Check if build works
echo -e "${BLUE}Step 4: Verify build (this may take 1-2 minutes)${NC}"
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Build successful${NC}"
else
  echo -e "${RED}✗ Build failed - check errors above${NC}"
  exit 1
fi
echo ""

# Step 5: Show database setup instructions
echo -e "${BLUE}Step 5: Database Setup (Railway)${NC}"
echo -e "${YELLOW}Manual setup required:${NC}"
echo "1. Go to https://railway.app"
echo "2. Create new project → Add PostgreSQL from marketplace"
echo "3. Copy PostgreSQL connection string"
echo ""
echo -e "${YELLOW}Then run these commands:${NC}"
echo "  export DATABASE_URL='postgresql://user:password@host:port/db'"
echo "  npx prisma migrate deploy"
echo "  npx ts-node scripts/seed.ts"
echo ""

# Step 6: Show Vercel deployment instructions
echo -e "${BLUE}Step 6: Vercel Deployment${NC}"
echo -e "${YELLOW}Manual setup required:${NC}"
echo "1. Go to https://vercel.com"
echo "2. Create project → Import Git Repository → Select 'consulting-dashboard'"
echo "3. Add these environment variables:"
echo "   - DATABASE_URL: (from Railway)"
echo "   - NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
echo "   - NEXTAUTH_URL: https://[your-vercel-app].vercel.app"
echo "   - GOOGLE_CLIENT_ID: (from Google Cloud Console)"
echo "   - GOOGLE_CLIENT_SECRET: (from Google Cloud Console)"
echo "4. Click Deploy"
echo ""

# Step 7: Summary
echo -e "${BLUE}========================================== ${NC}"
echo -e "${GREEN}✅ Pre-deployment checks passed!${NC}"
echo -e "${BLUE}========================================== ${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Create GitHub repository at https://github.com/new"
echo "2. Push code: git push origin master"
echo "3. Set up Railway PostgreSQL at https://railway.app"
echo "4. Run migrations: npx prisma migrate deploy"
echo "5. Seed data: npx ts-node scripts/seed.ts"
echo "6. Deploy to Vercel: https://vercel.com"
echo "7. Set environment variables in Vercel"
echo "8. Verify OAuth and login"
echo ""
echo "📖 Detailed guide: See DEPLOYMENT_CHECKLIST.md"
echo ""
echo "⏱️  Estimated time: 45 minutes"
echo ""
echo -e "${YELLOW}NEXTAUTH_SECRET (save this):${NC}"
echo "$NEXTAUTH_SECRET"
echo ""
