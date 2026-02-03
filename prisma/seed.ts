import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Create a sample app
  const app = await prisma.app.create({
    data: {
      name: 'Demo App',
      domains: ['localhost:3000']
    }
  })

  console.log('Created app:', app.name, 'with API key:', app.apiKey)

  // Create a sample course
  const course = await prisma.course.create({
    data: {
      title: 'Introduction to Course Builder',
      description: 'Learn how to use the Course Builder platform to create engaging video courses.',
      published: true,
      appId: app.id,
      videos: {
        create: [
          {
            title: 'Getting Started',
            description: 'Overview of the platform and key features',
            bunnyId: 'sample-video-1',
            duration: 300,
            order: 0
          },
          {
            title: 'Creating Your First Course',
            description: 'Step-by-step guide to creating courses',
            bunnyId: 'sample-video-2',
            duration: 450,
            order: 1
          },
          {
            title: 'Managing Videos',
            description: 'How to upload and organize your video content',
            bunnyId: 'sample-video-3',
            duration: 600,
            order: 2
          }
        ]
      }
    },
    include: {
      videos: true
    }
  })

  console.log('Created course:', course.title)
  console.log('With', course.videos.length, 'videos')

  // Create an unpublished course as well
  const draftCourse = await prisma.course.create({
    data: {
      title: 'Advanced Features (Draft)',
      description: 'Coming soon - advanced customization options',
      published: false,
      appId: app.id
    }
  })

  console.log('Created draft course:', draftCourse.title)
  console.log('\n✅ Seed completed!')
  console.log('\nAPI Key for testing:', app.apiKey)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
