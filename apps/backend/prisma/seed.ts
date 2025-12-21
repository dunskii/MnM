// ===========================================
// Database Seed Script
// ===========================================

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create test school
  const school = await prisma.school.upsert({
    where: { slug: 'musicnme' },
    update: {},
    create: {
      name: "Music 'n Me",
      slug: 'musicnme',
      email: 'admin@musicnme.com.au',
      phone: '0400 000 000',
      website: 'https://musicnme.com.au',
      timezone: 'Australia/Sydney',
      settings: JSON.stringify({
        registrationPrice: 50,
        currency: 'AUD',
      }),
      branding: JSON.stringify({
        primaryColor: '#4580E4',
        secondaryColor: '#FFCE00',
      }),
    },
  });

  console.log(`✅ School created: ${school.name} (${school.slug})`);

  // Hash password for admin user
  const adminPassword = 'Admin123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: {
      schoolId_email: {
        schoolId: school.id,
        email: 'admin@musicnme.com.au',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      email: 'admin@musicnme.com.au',
      passwordHash,
      passwordHistory: JSON.stringify([passwordHash]),
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      lastPasswordChange: new Date(),
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);
  console.log(`   Password: ${adminPassword}\n`);

  // Create default instruments
  const instruments = [
    'Piano',
    'Guitar',
    'Drums',
    'Singing',
    'Bass',
    'Preschool',
  ];

  for (let i = 0; i < instruments.length; i++) {
    await prisma.instrument.upsert({
      where: {
        schoolId_name: {
          schoolId: school.id,
          name: instruments[i],
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        name: instruments[i],
        sortOrder: i,
      },
    });
  }

  console.log(`✅ Created ${instruments.length} instruments`);

  // Create default lesson types
  const lessonTypes = [
    { name: 'Individual', type: 'INDIVIDUAL' as const, duration: 45 },
    { name: 'Group', type: 'GROUP' as const, duration: 60 },
    { name: 'Band', type: 'BAND' as const, duration: 60 },
    { name: 'Hybrid', type: 'HYBRID' as const, duration: 60 },
  ];

  for (let i = 0; i < lessonTypes.length; i++) {
    await prisma.lessonType.upsert({
      where: {
        schoolId_name: {
          schoolId: school.id,
          name: lessonTypes[i].name,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        name: lessonTypes[i].name,
        type: lessonTypes[i].type,
        defaultDuration: lessonTypes[i].duration,
        sortOrder: i,
      },
    });
  }

  console.log(`✅ Created ${lessonTypes.length} lesson types`);

  // Create default lesson durations
  const durations = [30, 45, 60];

  for (const duration of durations) {
    await prisma.lessonDuration.upsert({
      where: {
        schoolId_minutes: {
          schoolId: school.id,
          minutes: duration,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        minutes: duration,
      },
    });
  }

  console.log(`✅ Created ${durations.length} lesson durations`);

  // Create a test location with rooms
  const location = await prisma.location.upsert({
    where: {
      id: 'location-1', // dummy id for upsert
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Main Studio',
      address: '123 Music Street, Sydney NSW 2000',
      phone: '0400 000 001',
    },
  });

  console.log(`✅ Created location: ${location.name}`);

  // Create rooms
  const rooms = ['Room 1', 'Room 2', 'Room 3'];
  for (const roomName of rooms) {
    await prisma.room.create({
      data: {
        locationId: location.id,
        name: roomName,
        capacity: 10,
      },
    });
  }

  console.log(`✅ Created ${rooms.length} rooms`);

  // Create school retention policy
  await prisma.schoolRetentionPolicy.upsert({
    where: { schoolId: school.id },
    update: {},
    create: {
      schoolId: school.id,
      gracePeriodDays: 30,
      financialRetentionYears: 7,
      attendanceRetentionYears: 3,
      notesRetentionDays: 365,
    },
  });

  console.log(`✅ Created retention policy`);

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Test Credentials:');
  console.log('   Email: admin@musicnme.com.au');
  console.log(`   Password: ${adminPassword}`);
  console.log('   School Slug: musicnme');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
