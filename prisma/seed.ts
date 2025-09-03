import { PrismaClient } from '@prisma/client'
import { AuthService } from '../lib/auth-service'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create admin user
  const adminPassword = await AuthService.hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@campus.edu' },
    update: {},
    create: {
      email: 'admin@campus.edu',
      name: 'System Administrator',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      faceEnrollmentStatus: 'NOT_REQUIRED',
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  console.log('✅ Created admin user:', admin.email)

  // Create sample lecturer
  const lecturerPassword = await AuthService.hashPassword('lecturer123')
  const lecturer = await prisma.user.upsert({
    where: { email: 'john.doe@campus.edu' },
    update: {},
    create: {
      email: 'john.doe@campus.edu',
      name: 'Dr. John Doe',
      password: lecturerPassword,
      role: 'LECTURER',
      status: 'ACTIVE',
      emailVerified: true,
      faceEnrollmentStatus: 'COMPLETED',
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  console.log('✅ Created lecturer user:', lecturer.email)

  // Create sample student
  const studentPassword = await AuthService.hashPassword('student123')
  const student = await prisma.user.upsert({
    where: { email: 'jane.smith@student.campus.edu' },
    update: {},
    create: {
      email: 'jane.smith@student.campus.edu',
      name: 'Jane Smith',
      studentId: 'STU001',
      password: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: true,
      faceEnrollmentStatus: 'PENDING',
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  console.log('✅ Created student user:', student.email)

  // Create sample room
  const room = await prisma.room.upsert({
    where: { code: 'LAB001' },
    update: {},
    create: {
      code: 'LAB001',
      name: 'Computer Laboratory 1',
      building: 'Engineering Building',
      floor: 2,
      capacity: 40,
      latitude: -6.2088,
      longitude: 106.8456,
      radius: 30,
      allowedWifiSSIDs: ['CAMPUS-WIFI', 'LAB-NETWORK'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  console.log('✅ Created room:', room.name)

  // Create sample class
  const classStartTime = new Date()
  classStartTime.setHours(9, 0, 0, 0) // 9:00 AM
  
  const classEndTime = new Date()
  classEndTime.setHours(11, 0, 0, 0) // 11:00 AM

  const sampleClass = await prisma.class.upsert({
    where: { code: 'CS101' },
    update: {},
    create: {
      code: 'CS101',
      name: 'Introduction to Computer Science',
      description: 'Fundamental concepts of computer science and programming',
      lecturerId: lecturer.id,
      roomId: room.id,
      startTime: classStartTime,
      endTime: classEndTime,
      dayOfWeek: 1, // Monday
      capacity: 30,
      semester: 'Fall 2024',
      academicYear: '2024/2025',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  console.log('✅ Created class:', sampleClass.name)

  // Create enrollment
  const enrollment = await prisma.enrollment.upsert({
    where: {
      userId_classId: {
        userId: student.id,
        classId: sampleClass.id
      }
    },
    update: {},
    create: {
      userId: student.id,
      classId: sampleClass.id,
      status: 'ACTIVE',
      enrolledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  console.log('✅ Created enrollment for student:', student.name)

  // Create sample face profile for lecturer
  const lecturerFaceDescriptors = Array(128).fill(0).map(() => Math.random())
  
  await prisma.faceProfile.upsert({
    where: { userId: lecturer.id },
    update: {},
    create: {
      userId: lecturer.id,
      faceDescriptors: JSON.stringify(lecturerFaceDescriptors),
      qualityScore: 0.95,
      confidenceThreshold: 0.8,
      enrollmentStatus: 'COMPLETED',
      enrolledAt: new Date(),
      lastUpdated: new Date(),
      version: 1
    }
  })

  console.log('✅ Created face profile for lecturer')

  // Create sample attendance record
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(9, 30, 0, 0) // 9:30 AM yesterday

  await prisma.attendance.create({
    data: {
      userId: student.id,
      classId: sampleClass.id,
      status: 'PRESENT',
      checkInTime: yesterday,
      faceMatchScore: 0.87,
      wifiSsid: 'CAMPUS-WIFI',
      createdAt: yesterday,
      updatedAt: yesterday
    }
  })

  console.log('✅ Created sample attendance record')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📝 Default credentials:')
  console.log('Admin: admin@campus.edu / admin123')
  console.log('Lecturer: john.doe@campus.edu / lecturer123')
  console.log('Student: jane.smith@student.campus.edu / student123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })