import { PrismaClient, Role } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (for fresh seed)
  console.log("Clearing existing data...");
  await prisma.auditLog.deleteMany({});
  await prisma.coachingAlert.deleteMany({});
  await prisma.coachingConfig.deleteMany({});
  await prisma.metricsRaw.deleteMany({});
  await prisma.sheetsConfig.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.client.deleteMany({});

  // Create 2 Clients
  console.log("📊 Creating clients...");
  const client1 = await prisma.client.create({
    data: {
      name: "Acme Consulting",
      isMedical: false,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: "HealthCare Partners",
      isMedical: true,
    },
  });

  console.log(`✅ Created ${client1.name} and ${client2.name}`);

  // Create 3 Users
  console.log("👥 Creating users...");
  const user1 = await prisma.user.create({
    data: {
      email: "admin@acmeconsulting.com",
      name: "Admin User",
      role: Role.ADMIN,
      clientId: client1.id,
      authProvider: "google",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "client1@acmeconsulting.com",
      name: "Client Manager",
      role: Role.CLIENT,
      clientId: client1.id,
      authProvider: "google",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: "admin@healthcarepartners.com",
      name: "Healthcare Admin",
      role: Role.ADMIN,
      clientId: client2.id,
      authProvider: "google",
    },
  });

  console.log(`✅ Created 3 users`);

  // Create 400+ metrics across both clients
  console.log("📈 Generating 400+ test metrics...");

  const metrics = [];
  const sources = ["organic", "paid", "direct", "referral"];
  const mediums = ["search", "social", "email", "display"];
  const campaigns = ["Q1-2024", "Q2-2024", "rebrand", "seasonal"];
  const locations = ["US-East", "US-West", "US-Central", "International"];
  const users = ["Agent-001", "Agent-002", "Agent-003"];
  const servicePersons = ["John", "Sarah", "Mike", "Lisa"];

  // Generate metrics for each client
  for (const client of [client1, client2]) {
    let metricsCount = 0;

    // Create daily metrics for past 90 days
    for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      // Multiple rows per day (different segments)
      for (let i = 0; i < 2; i++) {
        const source = sources[Math.floor(Math.random() * sources.length)];
        const medium = mediums[Math.floor(Math.random() * mediums.length)];
        const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        const servicePerson =
          servicePersons[Math.floor(Math.random() * servicePersons.length)];

        const leads = Math.floor(Math.random() * 100) + 10;
        const consults = Math.floor(leads * (Math.random() * 0.7 + 0.3));
        const sales = Math.floor(consults * (Math.random() * 0.6 + 0.2));
        const spend = Math.floor(Math.random() * 5000) + 500;
        const roas = sales > 0 ? spend / (sales * 150) : 0;

        metrics.push({
          clientId: client.id,
          date,
          medium,
          source,
          campaign,
          location,
          user,
          servicePerson,
          leads,
          consults,
          sales,
          spend: new Decimal(spend),
          roas: new Decimal(roas.toFixed(4)),
          leadsToConsultRate: new Decimal(
            (consults / leads).toFixed(4)
          ),
          leadsToSaleRate: new Decimal((sales / leads).toFixed(4)),
          rawDataJson: {
            source,
            medium,
            campaign,
            leads,
            consults,
            sales,
            spend,
          },
        });

        metricsCount++;
      }
    }

    console.log(
      `✅ Generated ${metricsCount} metrics for ${client.name}`
    );
  }

  // Batch insert metrics
  console.log("💾 Inserting metrics into database...");
  for (let i = 0; i < metrics.length; i += 100) {
    const batch = metrics.slice(i, i + 100);
    await prisma.metricsRaw.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  console.log(`✅ Inserted ${metrics.length} metrics total`);

  // Create coaching configs for both clients
  console.log("⚙️  Creating coaching configs...");
  await prisma.coachingConfig.createMany({
    data: [
      {
        clientId: client1.id,
        metricType: "LEADS_TO_CONSULT_RATE",
        thresholdValue: new Decimal("0.45"),
        enabled: true,
      },
      {
        clientId: client1.id,
        metricType: "LEADS_TO_SALE_RATE",
        thresholdValue: new Decimal("0.15"),
        enabled: true,
      },
      {
        clientId: client1.id,
        metricType: "ROAS",
        thresholdValue: new Decimal("2.0"),
        enabled: true,
      },
      {
        clientId: client2.id,
        metricType: "LEADS_TO_CONSULT_RATE",
        thresholdValue: new Decimal("0.50"),
        enabled: true,
      },
      {
        clientId: client2.id,
        metricType: "LEADS_TO_SALE_RATE",
        thresholdValue: new Decimal("0.20"),
        enabled: true,
      },
    ],
  });

  console.log("✅ Created coaching configs");

  // Create sheets config for testing
  console.log("📋 Creating sheets config...");
  await prisma.sheetsConfig.create({
    data: {
      clientId: client1.id,
      sheetId: "test-sheet-id-123",
      sheetName: "Test Metrics Sheet",
      tabNames: ["Daily Metrics", "Weekly Summary"],
      lastSyncedAt: new Date(),
      syncStatus: "SUCCESS",
    },
  });

  console.log("✅ Created sheets config");

  // Create audit logs
  console.log("📝 Creating audit logs...");
  await prisma.auditLog.createMany({
    data: [
      {
        clientId: client1.id,
        action: "SEED_DATA_LOADED",
        details: {
          metricsCount: Math.floor(metrics.length / 2),
          timestamp: new Date().toISOString(),
        },
      },
      {
        clientId: client2.id,
        action: "SEED_DATA_LOADED",
        details: {
          metricsCount: Math.floor(metrics.length / 2),
          timestamp: new Date().toISOString(),
        },
      },
    ],
  });

  console.log("✅ Created audit logs");

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 SEED COMPLETE!");
  console.log("=".repeat(50));
  console.log(`
Clients:
  1. ${client1.name} (ID: ${client1.id})
  2. ${client2.name} (ID: ${client2.id})

Users:
  1. ${user1.email} (ADMIN)
  2. ${user2.email} (CLIENT)
  3. ${user3.email} (ADMIN)

Metrics:
  - Total: ${metrics.length} rows
  - Per client: ~${Math.floor(metrics.length / 2)} rows
  - Date range: Last 90 days
  - Segments: source, medium, campaign, location, user, servicePerson

Coaching Configs:
  - LEADS_TO_CONSULT_RATE: ${client1.name} (45%), ${client2.name} (50%)
  - LEADS_TO_SALE_RATE: ${client1.name} (15%), ${client2.name} (20%)
  - ROAS: ${client1.name} (2.0x)

Sheets Integration:
  - 1 test sheets config for ${client1.name}
  - Status: SUCCESS

Ready for dashboard testing! ✅
  `);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("\n✨ Database connection closed.");
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
