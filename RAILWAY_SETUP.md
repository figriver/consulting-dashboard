# Railway PostgreSQL Setup - Manual Steps

**Status:** ⏳ Waiting for Michael to execute

## Step 1: Create Railway Account (5 mins)

1. Go to https://railway.app
2. Click "Start Free" (top right)
3. Sign up with:
   - Email: your-email@example.com
   - Password: (create strong password)
4. Verify email
5. Skip the "invite" prompt if it appears

## Step 2: Create New Project (2 mins)

1. After login, you'll see "Projects" page
2. Click "Create New Project" or the "+" button
3. Select "Provision from Template"
4. Choose **PostgreSQL**
5. Click "Deploy"

Railway will:
- Automatically create a PostgreSQL instance
- Generate credentials
- Show you the connection URL

**⏰ Wait time: ~1-2 minutes for deployment**

## Step 3: Get DATABASE_URL (2 mins)

1. Once deployment completes, you'll see the PostgreSQL service in your project
2. Click on "PostgreSQL" service
3. Go to the **Variables** tab
4. Copy the `DATABASE_URL` value
   - Format: `postgresql://user:password@host:5432/railway`
5. **Send this URL to the agent** (copy-paste the full string)

---

## Step 4: (Agent will execute this)

Once the agent has the `DATABASE_URL`, they will:

1. Set environment variable locally
2. Run Prisma migrations: `npx prisma migrate deploy`
3. Seed test data: `npx ts-node prisma/seed.ts`
4. Verify all tables created
5. Deploy to Vercel with the DATABASE_URL

---

## 🎯 Checkpoint

Once you complete steps 1-3 above:

1. **Paste the DATABASE_URL here** (in a message)
2. Agent will complete migrations + Vercel deployment
3. You'll get a live dashboard URL in ~5-10 minutes

---

## Troubleshooting

### "I see a purple "Add a database" button instead"
- That's okay! Click it and select PostgreSQL from the template

### "Railway deployment is taking >5 minutes"
- That's unusual, but railway.app status might be slow
- Wait a bit longer, refresh the page
- If stuck >10 min, restart: delete project and create new one

### "I don't see Variables tab"
- Make sure you clicked on the PostgreSQL service itself (not the project)
- The "Variables" tab should be visible next to "Settings"

---

**⏱️ Estimated Time:** 10 minutes  
**Difficulty:** Very Easy (just clicking buttons)  
**Risk Level:** None (you can delete and recreate the project)
