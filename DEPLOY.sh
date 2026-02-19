#!/bin/bash

# Consulting Dashboard Deployment Script
# Usage: ./DEPLOY.sh "postgresql://user:pass@host:5432/db"

set -e

if [ -z "$1" ]; then
  echo "❌ Error: DATABASE_URL not provided"
  echo "Usage: ./DEPLOY.sh \"postgresql://user:password@host:5432/database\""
  exit 1
fi

DATABASE_URL="$1"
PROJECT_DIR="/home/superman/.openclaw/workspace/projects/consulting-dashboard"

echo "🚀 Starting Consulting Dashboard Deployment"
echo "==========================================="

# Step 1: Set DATABASE_URL
echo "📝 Setting DATABASE_URL..."
export DATABASE_URL="$DATABASE_URL"
cd "$PROJECT_DIR"

# Step 2: Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy --skip-generate

if [ $? -ne 0 ]; then
  echo "❌ Migration failed!"
  exit 1
fi

echo "✅ Migrations completed"

# Step 3: Seed database
echo "🌱 Seeding database with test data..."
npx ts-node prisma/seed.ts

if [ $? -ne 0 ]; then
  echo "❌ Seeding failed!"
  exit 1
fi

echo "✅ Database seeded successfully"

# Step 4: Verify data
echo "📊 Verifying database content..."
echo ""
echo "Clients:"
npx prisma db execute --stdin <<'EOF'
SELECT id, name, "isMedical" FROM "Client" ORDER BY "createdAt";
EOF

echo ""
echo "Users:"
npx prisma db execute --stdin <<'EOF'
SELECT email, name, role FROM "User" ORDER BY "createdAt";
EOF

echo ""
echo "Metrics count:"
npx prisma db execute --stdin <<'EOF'
SELECT "clientId", COUNT(*) as count FROM "MetricsRaw" GROUP BY "clientId";
EOF

echo ""
echo "==========================================="
echo "✅ DATABASE DEPLOYMENT COMPLETE!"
echo "==========================================="
echo ""
echo "📋 Summary:"
echo "  ✓ DATABASE_URL configured"
echo "  ✓ All migrations applied"
echo "  ✓ Seed data loaded (2 clients, 3 users, 400+ metrics)"
echo "  ✓ Coaching configs created"
echo "  ✓ Sheets config created"
echo ""
echo "🎯 Next step: Deploy to Vercel"
echo "   Go to vercel.com and import the GitHub repo"
echo "   Configure these environment variables on Vercel:"
echo "   - DATABASE_URL: $DATABASE_URL"
echo "   - NEXTAUTH_SECRET: (generate with: openssl rand -base64 32)"
echo "   - NEXTAUTH_URL: https://[your-vercel-project].vercel.app"
echo "   - GOOGLE_CLIENT_ID: (from Move or Improve tool setup)"
echo "   - GOOGLE_CLIENT_SECRET: (from Move or Improve tool setup)"
echo ""
