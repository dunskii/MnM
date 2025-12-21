// ===========================================
// Database Seed Script
// ===========================================
// Creates demo data for development and testing
// Run: npx prisma db seed

import { PrismaClient, UserRole, AgeGroup, LessonTypeEnum } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ===========================================
// SEED DATA CONFIGURATION
// ===========================================

const BCRYPT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Password123!';

// Helper function to calculate age group
function calculateAgeGroup(birthDate: Date): AgeGroup {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age <= 5) return AgeGroup.PRESCHOOL;
  if (age <= 11) return AgeGroup.KIDS;
  if (age <= 17) return AgeGroup.TEENS;
  return AgeGroup.ADULT;
}

async function main() {
  console.log('Starting database seed...\n');

  // Hash password once for all users
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);
  const passwordHistory = JSON.stringify([passwordHash]);

  // ===========================================
  // 1. CREATE SCHOOL
  // ===========================================
  console.log('Creating school...');
  const school = await prisma.school.upsert({
    where: { slug: 'musicnme-demo' },
    update: {},
    create: {
      name: "Music 'n Me Demo",
      slug: 'musicnme-demo',
      email: 'demo@musicnme.com.au',
      phone: '+61 2 1234 5678',
      website: 'https://musicnme.com.au',
      timezone: 'Australia/Sydney',
      settings: JSON.stringify({
        registrationPrice: 50,
        currency: 'AUD',
      }),
      branding: JSON.stringify({
        primaryColor: '#4580E4',
        secondaryColor: '#FFCE00',
        accentMint: '#96DAC9',
        accentCoral: '#FFAE9E',
        accentCream: '#FCF6E6',
      }),
    },
  });
  console.log(`  Created school: ${school.name} (${school.slug})`);

  // ===========================================
  // 2. CREATE INSTRUMENTS
  // ===========================================
  console.log('Creating instruments...');
  const instrumentData = [
    { name: 'Piano', sortOrder: 1 },
    { name: 'Guitar', sortOrder: 2 },
    { name: 'Drums', sortOrder: 3 },
    { name: 'Singing', sortOrder: 4 },
    { name: 'Bass', sortOrder: 5 },
    { name: 'Preschool', sortOrder: 6 },
  ];

  const instruments: Record<string, string> = {};
  for (const inst of instrumentData) {
    const instrument = await prisma.instrument.upsert({
      where: {
        schoolId_name: {
          schoolId: school.id,
          name: inst.name,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        name: inst.name,
        sortOrder: inst.sortOrder,
      },
    });
    instruments[inst.name] = instrument.id;
  }
  console.log(`  Created ${instrumentData.length} instruments`);

  // ===========================================
  // 3. CREATE LESSON TYPES
  // ===========================================
  console.log('Creating lesson types...');
  const lessonTypesData = [
    { name: 'Individual', type: LessonTypeEnum.INDIVIDUAL, defaultDuration: 45, description: 'One-on-one private lesson' },
    { name: 'Group', type: LessonTypeEnum.GROUP, defaultDuration: 60, description: 'Small group lesson (3-6 students)' },
    { name: 'Band', type: LessonTypeEnum.BAND, defaultDuration: 60, description: 'Band rehearsal and performance' },
    { name: 'Hybrid', type: LessonTypeEnum.HYBRID, defaultDuration: 60, description: 'Alternating group and individual sessions' },
  ];

  for (let i = 0; i < lessonTypesData.length; i++) {
    await prisma.lessonType.upsert({
      where: {
        schoolId_name: {
          schoolId: school.id,
          name: lessonTypesData[i].name,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        name: lessonTypesData[i].name,
        type: lessonTypesData[i].type,
        defaultDuration: lessonTypesData[i].defaultDuration,
        description: lessonTypesData[i].description,
        sortOrder: i,
      },
    });
  }
  console.log(`  Created ${lessonTypesData.length} lesson types`);

  // ===========================================
  // 4. CREATE LESSON DURATIONS
  // ===========================================
  console.log('Creating lesson durations...');
  const durations = [30, 45, 60];

  for (const minutes of durations) {
    await prisma.lessonDuration.upsert({
      where: {
        schoolId_minutes: {
          schoolId: school.id,
          minutes,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        minutes,
      },
    });
  }
  console.log(`  Created ${durations.length} lesson durations`);

  // ===========================================
  // 5. CREATE TERMS (4 x 10-week terms for 2025)
  // ===========================================
  console.log('Creating terms...');
  const termsData = [
    { name: 'Term 1 2025', startDate: new Date('2025-01-27'), endDate: new Date('2025-04-04') },
    { name: 'Term 2 2025', startDate: new Date('2025-04-21'), endDate: new Date('2025-06-27') },
    { name: 'Term 3 2025', startDate: new Date('2025-07-14'), endDate: new Date('2025-09-19') },
    { name: 'Term 4 2025', startDate: new Date('2025-10-06'), endDate: new Date('2025-12-12') },
  ];

  // Delete existing terms first to avoid duplicates
  await prisma.term.deleteMany({ where: { schoolId: school.id } });

  for (const term of termsData) {
    await prisma.term.create({
      data: {
        schoolId: school.id,
        name: term.name,
        startDate: term.startDate,
        endDate: term.endDate,
      },
    });
  }
  console.log(`  Created ${termsData.length} terms`);

  // ===========================================
  // 6. CREATE LOCATIONS AND ROOMS (2 locations, 3 rooms each)
  // ===========================================
  console.log('Creating locations and rooms...');
  const locationsData = [
    {
      name: 'North Shore Studio',
      address: '123 Music Lane, Sydney NSW 2060',
      phone: '+61 2 1234 5678',
      rooms: [
        { name: 'Studio A', capacity: 1 },
        { name: 'Studio B', capacity: 1 },
        { name: 'Studio C', capacity: 6 },
      ],
    },
    {
      name: 'City Centre Studio',
      address: '456 Harmony Street, Sydney NSW 2000',
      phone: '+61 2 8765 4321',
      rooms: [
        { name: 'Room 1', capacity: 1 },
        { name: 'Room 2', capacity: 1 },
        { name: 'Room 3', capacity: 8 },
      ],
    },
  ];

  // Delete existing locations and rooms
  await prisma.room.deleteMany({
    where: { location: { schoolId: school.id } },
  });
  await prisma.location.deleteMany({ where: { schoolId: school.id } });

  for (const loc of locationsData) {
    const location = await prisma.location.create({
      data: {
        schoolId: school.id,
        name: loc.name,
        address: loc.address,
        phone: loc.phone,
      },
    });

    for (const room of loc.rooms) {
      await prisma.room.create({
        data: {
          locationId: location.id,
          name: room.name,
          capacity: room.capacity,
        },
      });
    }
    console.log(`  Created location: ${loc.name} with ${loc.rooms.length} rooms`);
  }

  // ===========================================
  // 7. CREATE ADMIN USER
  // ===========================================
  console.log('Creating admin user...');
  const adminUser = await prisma.user.upsert({
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
      passwordHistory,
      firstName: 'Sarah',
      lastName: 'Admin',
      phone: '+61 400 111 111',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      lastPasswordChange: new Date(),
    },
  });
  console.log(`  Created admin: ${adminUser.email}`);

  // ===========================================
  // 8. CREATE TEACHERS (3 teachers with instrument assignments)
  // ===========================================
  console.log('Creating teachers...');
  const teachersData = [
    {
      email: 'michael.piano@musicnme.com.au',
      firstName: 'Michael',
      lastName: 'Piano',
      phone: '+61 400 222 222',
      bio: 'Experienced piano teacher with 10+ years of teaching experience. Specializes in classical and contemporary styles.',
      instruments: ['Piano'],
    },
    {
      email: 'emma.guitar@musicnme.com.au',
      firstName: 'Emma',
      lastName: 'Guitar',
      phone: '+61 400 333 333',
      bio: 'Guitar and bass specialist, loves teaching beginners to advanced students. Rock, jazz, and acoustic styles.',
      instruments: ['Guitar', 'Bass'],
    },
    {
      email: 'david.drums@musicnme.com.au',
      firstName: 'David',
      lastName: 'Drums',
      phone: '+61 400 444 444',
      bio: 'Professional drummer with touring experience. Expert in various percussion instruments.',
      instruments: ['Drums'],
    },
  ];

  for (const teacherData of teachersData) {
    const user = await prisma.user.upsert({
      where: {
        schoolId_email: {
          schoolId: school.id,
          email: teacherData.email,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        email: teacherData.email,
        passwordHash,
        passwordHistory,
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        phone: teacherData.phone,
        role: UserRole.TEACHER,
        isActive: true,
        emailVerified: true,
        lastPasswordChange: new Date(),
      },
    });

    // Check if teacher record exists
    let teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: {
          userId: user.id,
          schoolId: school.id,
          bio: teacherData.bio,
        },
      });
    }

    // Assign instruments
    for (let i = 0; i < teacherData.instruments.length; i++) {
      const instName = teacherData.instruments[i];
      const instrumentId = instruments[instName];
      if (instrumentId) {
        await prisma.teacherInstrument.upsert({
          where: {
            teacherId_instrumentId: {
              teacherId: teacher.id,
              instrumentId,
            },
          },
          update: {},
          create: {
            teacherId: teacher.id,
            instrumentId,
            isPrimary: i === 0,
          },
        });
      }
    }
    console.log(`  Created teacher: ${user.firstName} ${user.lastName} (${teacherData.instruments.join(', ')})`);
  }

  // ===========================================
  // 9. CREATE FAMILIES, PARENTS, AND STUDENTS
  // ===========================================
  console.log('Creating families, parents, and students...');
  const familiesData = [
    {
      name: 'The Smith Family',
      parent: {
        email: 'john.smith@example.com',
        firstName: 'John',
        lastName: 'Smith',
        phone: '+61 400 555 555',
        contact1Name: 'John Smith',
        contact1Email: 'john.smith@example.com',
        contact1Phone: '+61 400 555 555',
        contact1Relationship: 'Father',
        contact2Name: 'Mary Smith',
        contact2Email: 'mary.smith@example.com',
        contact2Phone: '+61 400 555 556',
        contact2Relationship: 'Mother',
        emergencyName: 'Robert Smith',
        emergencyPhone: '+61 400 555 557',
        emergencyRelationship: 'Grandfather',
      },
      students: [
        { firstName: 'Emily', lastName: 'Smith', birthDate: new Date('2015-03-15'), notes: 'Loves piano, very enthusiastic learner' },
        { firstName: 'Oliver', lastName: 'Smith', birthDate: new Date('2019-07-22'), notes: 'Starting preschool music program' },
      ],
    },
    {
      name: 'The Johnson Family',
      parent: {
        email: 'lisa.johnson@example.com',
        firstName: 'Lisa',
        lastName: 'Johnson',
        phone: '+61 400 666 666',
        contact1Name: 'Lisa Johnson',
        contact1Email: 'lisa.johnson@example.com',
        contact1Phone: '+61 400 666 666',
        contact1Relationship: 'Mother',
        contact2Name: null,
        contact2Email: null,
        contact2Phone: null,
        contact2Relationship: null,
        emergencyName: 'Tom Johnson',
        emergencyPhone: '+61 400 666 667',
        emergencyRelationship: 'Father',
      },
      students: [
        { firstName: 'Sophia', lastName: 'Johnson', birthDate: new Date('2012-11-08'), notes: 'Advanced guitar student, interested in band' },
      ],
    },
    {
      name: 'The Williams Family',
      parent: {
        email: 'kate.williams@example.com',
        firstName: 'Kate',
        lastName: 'Williams',
        phone: '+61 400 777 777',
        contact1Name: 'Kate Williams',
        contact1Email: 'kate.williams@example.com',
        contact1Phone: '+61 400 777 777',
        contact1Relationship: 'Mother',
        contact2Name: 'James Williams',
        contact2Email: 'james.williams@example.com',
        contact2Phone: '+61 400 777 778',
        contact2Relationship: 'Father',
        emergencyName: 'Susan Williams',
        emergencyPhone: '+61 400 777 779',
        emergencyRelationship: 'Grandmother',
      },
      students: [
        { firstName: 'Liam', lastName: 'Williams', birthDate: new Date('2010-02-20'), notes: 'Drums enthusiast, considering joining band' },
        { firstName: 'Ava', lastName: 'Williams', birthDate: new Date('2014-09-10'), notes: 'Singing lessons, shy but talented' },
      ],
    },
  ];

  for (const familyData of familiesData) {
    // Check if parent user already exists
    let parentUser = await prisma.user.findUnique({
      where: {
        schoolId_email: {
          schoolId: school.id,
          email: familyData.parent.email,
        },
      },
    });

    if (!parentUser) {
      parentUser = await prisma.user.create({
        data: {
          schoolId: school.id,
          email: familyData.parent.email,
          passwordHash,
          passwordHistory,
          firstName: familyData.parent.firstName,
          lastName: familyData.parent.lastName,
          phone: familyData.parent.phone,
          role: UserRole.PARENT,
          isActive: true,
          emailVerified: true,
          lastPasswordChange: new Date(),
        },
      });
    }

    // Check if family already exists
    let family = await prisma.family.findFirst({
      where: {
        schoolId: school.id,
        name: familyData.name,
      },
    });

    if (!family) {
      family = await prisma.family.create({
        data: {
          schoolId: school.id,
          name: familyData.name,
          primaryParentId: parentUser.id,
        },
      });
    }

    // Check if parent record exists
    let parent = await prisma.parent.findUnique({
      where: { userId: parentUser.id },
    });

    if (!parent) {
      parent = await prisma.parent.create({
        data: {
          userId: parentUser.id,
          schoolId: school.id,
          familyId: family.id,
          isPrimary: true,
          contact1Name: familyData.parent.contact1Name,
          contact1Email: familyData.parent.contact1Email,
          contact1Phone: familyData.parent.contact1Phone,
          contact1Relationship: familyData.parent.contact1Relationship,
          contact2Name: familyData.parent.contact2Name,
          contact2Email: familyData.parent.contact2Email,
          contact2Phone: familyData.parent.contact2Phone,
          contact2Relationship: familyData.parent.contact2Relationship,
          emergencyName: familyData.parent.emergencyName,
          emergencyPhone: familyData.parent.emergencyPhone,
          emergencyRelationship: familyData.parent.emergencyRelationship,
        },
      });
    }

    console.log(`  Created family: ${familyData.name}`);
    console.log(`    Parent: ${parentUser.firstName} ${parentUser.lastName} (${parentUser.email})`);

    // Create students
    for (const studentData of familyData.students) {
      // Check if student already exists
      const existingStudent = await prisma.student.findFirst({
        where: {
          schoolId: school.id,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          familyId: family.id,
        },
      });

      if (!existingStudent) {
        const student = await prisma.student.create({
          data: {
            schoolId: school.id,
            familyId: family.id,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            birthDate: studentData.birthDate,
            ageGroup: calculateAgeGroup(studentData.birthDate),
            notes: studentData.notes,
          },
        });
        console.log(`    Student: ${student.firstName} ${student.lastName} (${student.ageGroup})`);
      } else {
        console.log(`    Student: ${existingStudent.firstName} ${existingStudent.lastName} (already exists)`);
      }
    }
  }

  // ===========================================
  // 10. CREATE SCHOOL RETENTION POLICY
  // ===========================================
  console.log('Creating school retention policy...');
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

  // ===========================================
  // SUMMARY
  // ===========================================
  console.log('\n===========================================');
  console.log('SEED COMPLETED SUCCESSFULLY');
  console.log('===========================================');
  console.log(`\nSchool: ${school.name}`);
  console.log(`Slug: ${school.slug}`);
  console.log(`\nDefault Password for all users: ${DEFAULT_PASSWORD}`);
  console.log('\nLogin Credentials:');
  console.log('  Admin: admin@musicnme.com.au');
  console.log('  Teachers:');
  console.log('    - michael.piano@musicnme.com.au');
  console.log('    - emma.guitar@musicnme.com.au');
  console.log('    - david.drums@musicnme.com.au');
  console.log('  Parents:');
  console.log('    - john.smith@example.com');
  console.log('    - lisa.johnson@example.com');
  console.log('    - kate.williams@example.com');
  console.log('===========================================\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
