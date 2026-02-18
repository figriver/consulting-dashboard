import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create medical client
  const medicalClient = await prisma.client.create({
    data: {
      name: 'Coastal Dental - MEDICAL',
      isMedical: true,
    },
  });
  console.log('✓ Created medical client:', medicalClient.name);

  // Create non-medical client
  const nonMedicalClient = await prisma.client.create({
    data: {
      name: 'Tech Startup Coaching - Non-Medical',
      isMedical: false,
    },
  });
  console.log('✓ Created non-medical client:', nonMedicalClient.name);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('✓ Created admin user:', adminUser.email);

  // Create client users
  const medicalUser = await prisma.user.create({
    data: {
      email: 'owner@coastaldental.com',
      name: 'Dr. Smith',
      role: 'CLIENT',
      clientId: medicalClient.id,
    },
  });
  console.log('✓ Created medical client user:', medicalUser.email);

  const techUser = await prisma.user.create({
    data: {
      email: 'owner@techstartup.com',
      name: 'Sarah Tech',
      role: 'CLIENT',
      clientId: nonMedicalClient.id,
    },
  });
  console.log('✓ Created tech client user:', techUser.email);

  // Create coaching configs
  const medicalConfig = await Promise.all([
    prisma.coachingConfig.create({
      data: {
        clientId: medicalClient.id,
        metricType: 'LEADS_TO_CONSULT_RATE',
        thresholdValue: 0.3, // 30%
        enabled: true,
      },
    }),
    prisma.coachingConfig.create({
      data: {
        clientId: medicalClient.id,
        metricType: 'LEADS_TO_SALE_RATE',
        thresholdValue: 0.1, // 10%
        enabled: true,
      },
    }),
    prisma.coachingConfig.create({
      data: {
        clientId: medicalClient.id,
        metricType: 'ROAS',
        thresholdValue: 2.5,
        enabled: true,
      },
    }),
  ]);
  console.log('✓ Created coaching configs for medical client');

  // Seed 3 months of mock metrics data
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 3);

  const mediums = ['Google Ads', 'Facebook', 'Instagram', 'Organic'];
  const sources = ['Search', 'Display', 'Social', 'Direct'];
  const campaigns = ['Campaign A', 'Campaign B', 'Campaign C'];
  const locations = ['Downtown', 'Midtown', 'Uptown'];
  const users = ['John', 'Jane', 'Bob', 'Alice'];

  let metricsCount = 0;
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    // Generate 3-5 metrics per day per client
    const metricsPerDay = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < metricsPerDay; i++) {
      const leads = Math.floor(Math.random() * 50) + 10;
      const consults = Math.floor(leads * (Math.random() * 0.5 + 0.2)); // 20-70% conversion
      const sales = Math.floor(consults * (Math.random() * 0.4 + 0.1)); // 10-50% conversion
      const spend = Math.floor(Math.random() * 500) + 100;
      const roas = sales / spend;

      // Create metrics for medical client (with PII-sensitive data)
      await prisma.metricsRaw.create({
        data: {
          clientId: medicalClient.id,
          date: new Date(d),
          medium: mediums[Math.floor(Math.random() * mediums.length)],
          source: sources[Math.floor(Math.random() * sources.length)],
          campaign: campaigns[Math.floor(Math.random() * campaigns.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          user: users[Math.floor(Math.random() * users.length)],
          servicePerson: users[Math.floor(Math.random() * users.length)],
          leads,
          consults,
          sales,
          spend,
          roas: parseFloat(roas.toFixed(4)),
          leadsToConsultRate: consults / leads,
          leadsToSaleRate: sales / leads,
          rawDataJson: {
            firstName: 'John', // This will be stripped for medical clients
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '555-1234',
          },
        },
      });

      // Create metrics for non-medical client
      await prisma.metricsRaw.create({
        data: {
          clientId: nonMedicalClient.id,
          date: new Date(d),
          medium: mediums[Math.floor(Math.random() * mediums.length)],
          source: sources[Math.floor(Math.random() * sources.length)],
          campaign: campaigns[Math.floor(Math.random() * campaigns.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          user: users[Math.floor(Math.random() * users.length)],
          servicePerson: users[Math.floor(Math.random() * users.length)],
          leads: Math.floor(Math.random() * 100) + 20,
          consults: Math.floor(Math.random() * 50) + 10,
          sales: Math.floor(Math.random() * 30) + 5,
          spend: Math.floor(Math.random() * 1000) + 200,
          roas: parseFloat((Math.random() * 4 + 1).toFixed(4)),
          leadsToConsultRate: Math.random() * 0.6 + 0.2,
          leadsToSaleRate: Math.random() * 0.3 + 0.05,
          rawDataJson: {
            companyName: 'Tech Startup Inc',
            industry: 'Software',
          },
        },
      });

      metricsCount += 2;
    }
  }
  console.log(`✓ Created ${metricsCount} metrics records (3 months of data)`);

  console.log('✅ Database seeded successfully!');
  console.log('\nTest accounts:');
  console.log('- Admin: admin@example.com');
  console.log('- Medical Client: owner@coastaldental.com');
  console.log('- Tech Client: owner@techstartup.com');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
