import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  const email = 'dannguyen@dut.udn.vn';
  const userName = 'Dân Nguyễn';
  const password = '123456';

  console.log('Checking if default test user exists...');
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('Default test user already exists.');
    return;
  }

  console.log('Hashing password...');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  console.log('Creating default verified test user in database...');
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      userName,
      isVerified: true,
      verifyToken: null,
      tokenExpires: null,
    },
  });

  console.log(`Success! Test user created:`);
  console.log(`- Email: ${user.email}`);
  console.log(`- Password: ${password}`);
  console.log(`- UserName: ${user.userName}`);
  console.log(`- Verified: ${user.isVerified}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
