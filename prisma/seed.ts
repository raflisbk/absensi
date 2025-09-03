import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@faceattend.com' },
    update: {},
    create: {
      email: 'admin@faceattend.com',
      name: 'System Administrator',
      password: adminPassword,
      role: 'ADMIN',
      studentId: 'ADM001',
      status: 'ACTIVE',
      emailVerified: true,
      faceEnrollmentStatus: 'NOT_ENROLLED'
    }
  })
  console.log('✅ Admin user created:', admin.email)

  // Create sample lecturer
  const lecturerPassword = await bcrypt.hash('Lecturer123!', 12)
  const lecturer = await prisma.user.upsert({
    where: { email: 'lecturer@faceattend.com' },
    update: {},
    create: {
      email: 'lecturer@faceattend.com',
      name: 'Dr. Sarah Wijaya',
      password: lecturerPassword,
      role: 'LECTURER',
      studentId: 'LEC001',
      phone: '+62812345678',
      status: 'ACTIVE',
      emailVerified: true,
      faceEnrollmentStatus: 'ENROLLED'
    }
  })
  console.log('✅ Lecturer user created:', lecturer.email)

  // Create sample student
  const studentPassword = await bcrypt.hash('Student123!', 12)
  const student = await prisma.user.upsert({
    where: { email: 'student@faceattend.com' },
    update: {},
    create: {
      email: 'student@faceattend.com',
      name: 'Ahmad Rizki',
      password: studentPassword,
      role: 'STUDENT',
      studentId: '2021001234',
      phone: '+62812345679',
      status: 'ACTIVE',
      emailVerified: true,
      faceEnrollmentStatus: 'ENROLLED'
    }
  })
  console.log('✅ Student user created:', student.email)

  // Create sample locations
  const location1 = await prisma.location.upsert({
    where: { id: 'location-1' },
    update: {},
    create: {
      id: 'location-1',
      name: 'Room A101',
      building: 'Building A',
      floor: '1st Floor',
      wifiSsid: 'Campus-WiFi-A101',
      wifiSecurity: 'WPA2-PSK',
      gpsLat: -6.2088,
      gpsLng: 106.8456,
      capacity: 50
    }
  })

  const location2 = await prisma.location.upsert({
    where: { id: 'location-2' },
    update: {},
    create: {
      id: 'location-2',
      name: 'Room B205',
      building: 'Building B',
      floor: '2nd Floor',
      wifiSsid: 'Campus-WiFi-B205',
      wifiSecurity: 'WPA2-PSK',
      gpsLat: -6.2089,
      gpsLng: 106.8457,
      capacity: 40
    }
  })
  console.log('✅ Sample locations created')

  // Create sample classes
  const class1 = await prisma.class.upsert({
    where: { code: 'CS101' },
    update: {},
    create: {
      name: 'Introduction to Programming',
      code: 'CS101',
      lecturerId: lecturer.id,
      locationId: location1.id,
      schedule: {
        dayOfWeek: 1, // Monday
        startTime: '08:00',
        endTime: '10:00',
        recurring: true
      },
      duration: 120, // 2 hours
      capacity: 40
    }
  })

  const class2 = await prisma.class.upsert({
    where: { code: 'CS102' },
    update: {},
    create: {
      name: 'Data Structures & Algorithms',
      code: 'CS102',
      lecturerId: lecturer.id,
      locationId: location2.id,
      schedule: {
        dayOfWeek: 3, // Wednesday
        startTime: '10:00',
        endTime: '12:00',
        recurring: true
      },
      duration: 120, // 2 hours
      capacity: 35
    }
  })
  console.log('✅ Sample classes created')

  // Create sample enrollments
  await prisma.enrollment.upsert({
    where: {
      userId_classId: {
        userId: student.id,
        classId: class1.id
      }
    },
    update: {},
    create: {
      userId: student.id,
      classId: class1.id,
      status: 'ACTIVE'
    }
  })

  await prisma.enrollment.upsert({
    where: {
      userId_classId: {
        userId: student.id,
        classId: class2.id
      }
    },
    update: {},
    create: {
      userId: student.id,
      classId: class2.id,
      status: 'ACTIVE'
    }
  })
  console.log('✅ Sample enrollments created')

  // Create sample face profile for student
  await prisma.faceProfile.upsert({
    where: {
      id: 'face-profile-student'
    },
    update: {},
    create: {
      id: 'face-profile-student',
      userId: student.id,
      faceDescriptors: Array.from({ length: 128 }, () => Math.random()),
      qualityScore: 0.95,
      confidenceThreshold: 0.8
    }
  })

  // Create sample face profile for lecturer
  await prisma.faceProfile.upsert({
    where: {
      id: 'face-profile-lecturer'
    },
    update: {},
    create: {
      id: 'face-profile-lecturer',
      userId: lecturer.id,
      faceDescriptors: Array.from({ length: 128 }, () => Math.random()),
      qualityScore: 0.92,
      confidenceThreshold: 0.8
    }
  })
  console.log('✅ Sample face profiles created')

  // Create completed registration steps for active users
  const registrationSteps = [
    'BASIC_INFO',
    'DOCUMENT_VERIFICATION',
    'FACE_ENROLLMENT',
    'EMAIL_VERIFICATION'
  ]

  for (const user of [admin, lecturer, student]) {
    for (const stepName of registrationSteps) {
      await prisma.registrationStep.upsert({
        where: {
          userId_stepName: {
            userId: user.id,
            stepName: stepName as any
          }
        },
        update: {},
        create: {
          userId: user.id,
          stepName: stepName as any,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })
    }
  }
  console.log('✅ Registration steps created')

  // Create sample attendance records
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  await prisma.attendance.create({
    data: {
      userId: student.id,
      classId: class1.id,
      timestamp: today,
      method: 'FACE_RECOGNITION',
      ipAddress: '192.168.1.100',
      wifiSsid: 'Campus-WiFi-A101',
      confidenceScore: 0.94,
      status: 'PRESENT'
    }
  })

  await prisma.attendance.create({
    data: {
      userId: student.id,
      classId: class2.id,
      timestamp: yesterday,
      method: 'FACE_RECOGNITION',
      ipAddress: '192.168.1.101',
      wifiSsid: 'Campus-WiFi-B205',
      confidenceScore: 0.89,
      status: 'PRESENT'
    }
  })
  console.log('✅ Sample attendance records created')

  console.log('🎉 Database seeding completed!')
  console.log('\n📧 Default accounts created:')
  console.log('Admin: admin@faceattend.com / Admin123!')
  console.log('Lecturer: lecturer@faceattend.com / Lecturer123!')
  console.log('Student: student@faceattend.com / Student123!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })