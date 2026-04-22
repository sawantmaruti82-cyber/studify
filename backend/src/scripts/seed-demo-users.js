import bcrypt from 'bcryptjs';

import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { User } from '../models/user.js';

const demoUsers = [
  {
    fullName: 'Aarav Student',
    email: 'student@college.edu',
    password: 'Password@123',
    role: 'student',
  },
  {
    fullName: 'Meera Faculty',
    email: 'faculty@college.edu',
    password: 'Password@123',
    role: 'faculty',
  },
];

async function seed() {
  await connectDatabase();

  for (const demoUser of demoUsers) {
    const passwordHash = await bcrypt.hash(demoUser.password, 10);

    await User.findOneAndUpdate(
      { email: demoUser.email },
      {
        fullName: demoUser.fullName,
        email: demoUser.email,
        passwordHash,
        role: demoUser.role,
        department: env.departmentSlug,
        isActive: true,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  console.log('Seeded demo users for the Computer Science department.');
  console.log('Student: student@college.edu / Password@123');
  console.log('Faculty: faculty@college.edu / Password@123');
}

seed()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
