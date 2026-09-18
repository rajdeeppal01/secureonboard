import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SecureOnboard database...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { domain: 'acme.com' },
    update: {},
    create: {
      id: 'demo-org-id',
      name: 'Acme Corp',
      domain: 'acme.com',
      hrisType: 'manual',
      webhookSecret: 'secureonboard-dev-secret-change-in-prod',
    },
  });

  console.log(`✅ Organization: ${org.name} (${org.id})`);

  // Create integrations
  const integrationDefs = [
    { type: 'google', name: 'Google Workspace' },
    { type: 'slack', name: 'Slack' },
    { type: 'github', name: 'GitHub' },
  ];

  for (const def of integrationDefs) {
    await prisma.integration.upsert({
      where: { type_organizationId: { type: def.type, organizationId: org.id } },
      update: {},
      create: {
        type: def.type,
        name: def.name,
        isConnected: true,
        accessToken: `demo-token-${def.type}`,
        organizationId: org.id,
        lastTestedAt: new Date(),
        lastTestStatus: 'success',
      },
    });
  }

  console.log('✅ Integrations: Google Workspace, Slack, GitHub');

  // Create active employees
  const employees = [
    { name: 'Alice Martin', email: 'alice@acme.com', department: 'Engineering', role: 'Senior Engineer', status: 'active' },
    { name: 'Bob Kim', email: 'bob@acme.com', department: 'Product', role: 'Product Manager', status: 'active' },
    { name: 'Carol White', email: 'carol@acme.com', department: 'Design', role: 'UX Designer', status: 'active' },
    { name: 'Dan Torres', email: 'dan@acme.com', department: 'Sales', role: 'Account Executive', status: 'active' },
    { name: 'Eva Chen', email: 'eva@acme.com', department: 'Engineering', role: 'Frontend Engineer', status: 'active' },
    { name: 'Frank Liu', email: 'frank@acme.com', department: 'Marketing', role: 'Marketing Lead', status: 'active' },
    // Offboarded employees
    { name: 'Sarah Johnson', email: 'sarah@acme.com', department: 'Engineering', role: 'Staff Engineer', status: 'offboarded' },
    { name: 'Mike Chen', email: 'mike@acme.com', department: 'Sales', role: 'SDR', status: 'offboarded' },
    { name: 'Priya Sharma', email: 'priya@acme.com', department: 'Design', role: 'UI Designer', status: 'offboarded' },
  ];

  const createdEmployees: Record<string, string> = {};

  for (const emp of employees) {
    const e = await prisma.employee.upsert({
      where: { email_organizationId: { email: emp.email, organizationId: org.id } },
      update: {},
      create: {
        ...emp,
        organizationId: org.id,
        offboardedAt: emp.status === 'offboarded' ? new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000) : null,
      },
    });
    createdEmployees[emp.email] = e.id;
  }

  console.log(`✅ Employees: ${employees.length} created`);

  // Create past offboarding events for the offboarded employees
  const offboardedEmails = ['sarah@acme.com', 'mike@acme.com', 'priya@acme.com'];

  for (const email of offboardedEmails) {
    const employeeId = createdEmployees[email];
    const triggeredAt = new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000);
    const completedAt = new Date(triggeredAt.getTime() + (35000 + Math.random() * 20000));

    const isMike = email === 'mike@acme.com';

    const event = await prisma.offboardingEvent.create({
      data: {
        employeeId,
        organizationId: org.id,
        triggeredAt,
        completedAt,
        status: isMike ? 'partial' : 'completed',
        triggeredBy: 'manual',
        revocations: {
          create: [
            { integration: 'google', status: 'success', revokedAt: completedAt },
            { integration: 'slack', status: 'success', revokedAt: completedAt },
            { integration: 'github', status: isMike ? 'failed' : 'success', revokedAt: isMike ? null : completedAt, errorMessage: isMike ? 'API rate limit exceeded' : null },
          ],
        },
      },
    });

    console.log(`✅ Offboarding event for ${email}: ${event.status}`);
  }

  console.log('\n🎉 Seed complete!');
  console.log(`\n📋 Your Org ID: ${org.id}`);
  console.log('   → Update NEXT_PUBLIC_ORG_ID in frontend/.env.local if needed\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
