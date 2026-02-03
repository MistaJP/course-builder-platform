# Course Builder Studio

A web-based platform for creating, storing, and distributing video-based e-learning courses.

## Features

- **Course Studio**: Create and manage courses with drag-and-drop video ordering
- **Multi-App Support**: Organize courses by app with unique API keys
- **Secure Distribution**: API-key protected endpoints for external apps
- **Bunny.net Integration**: Built for Bunny Stream video hosting

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Prisma + PostgreSQL
- @dnd-kit for drag-and-drop
- React Query for data fetching

## Quick Start

### 1. Database Setup

```bash
# Set up your PostgreSQL database and update .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/coursebuilder?schema=public"

# Run migrations
npx prisma migrate dev --name init
```

### 2. Environment Variables

Create `.env.local`:

```env
DATABASE_URL="postgresql://..."
BUNNY_API_KEY="your-bunny-api-key"
BUNNY_LIBRARY_ID="your-bunny-library-id"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### 1. Create an App

Go to `/apps` and create a new app. This generates an API key for external access.

### 2. Create a Course

Click "New Course", select your app, and add course details.

### 3. Add Videos

In the course editor, add videos using your Bunny.net video IDs. Drag to reorder.

### 4. Publish

Once your course is ready, click "Publish" to make it available via the API.

## API Usage

External apps can fetch courses using their API key:

```bash
# List all published courses
curl -H "x-api-key: YOUR_API_KEY" \
  https://your-domain.com/api/public/courses

# Get specific course with videos
curl -H "x-api-key: YOUR_API_KEY" \
  https://your-domain.com/api/public/courses/COURSE_ID

# Get video stream info
curl -H "x-api-key: YOUR_API_KEY" \
  https://your-domain.com/api/public/videos/VIDEO_ID/stream
```

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Course Studio  │────▶│  PostgreSQL  │◄────│  Public API │
│  (Next.js App)  │     │  (Metadata)  │     │  (App Auth) │
└─────────────────┘     └──────────────┘     └─────────────┘
                               │                      │
                               ▼                      ▼
                        ┌──────────────┐      ┌─────────────┐
                        │   Courses    │      │  External   │
                        │    Videos    │      │    Apps     │
                        └──────────────┘      └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ Bunny Stream │
                        │  (Videos)    │
                        └──────────────┘
```

## Project Structure

```
course-builder/
├── app/
│   ├── api/
│   │   ├── apps/           # App management
│   │   ├── courses/        # Course CRUD
│   │   ├── videos/         # Video CRUD + reorder
│   │   └── public/         # Public API (app-facing)
│   ├── courses/
│   │   ├── [id]/           # Course editor
│   │   └── new/            # Create course
│   ├── apps/               # Apps list
│   ├── layout.tsx
│   ├── page.tsx            # Dashboard
│   └── providers.tsx
├── lib/
│   └── prisma.ts           # Database client
├── prisma/
│   └── schema.prisma       # Database schema
└── types/
    └── index.ts            # TypeScript types
```

## Security

- API keys are unique per app and validated on every request
- Courses must be published before they're accessible via public API
- Videos can only be accessed through their parent course's app
- Bunny.net handles video security (token authentication recommended)

## Next Steps

1. Set up Bunny Stream account and configure library
2. Deploy to Vercel/Railway/Render
3. Configure domain whitelist for embeds
4. Add analytics/tracking as needed

## License

MIT
