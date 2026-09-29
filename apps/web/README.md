# hy10 Web Dashboard

Admin and Staff web application for managing schedules, appointments, and business operations.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Build**: Turbopack

## Setup

### Install Dependencies
```bash
npm install
```

### Environment Variables
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build
```bash
npm run build
npm start
```

## Features

### Dashboard (`/dashboard`)
- View business occupancy metrics
- Total appointments and revenue
- Per-staff performance tracking
- Date range: Last 30 days

### Schedules (`/schedules`)
- View all staff schedules in grid layout
- See weekly availability blocks
- View active exceptions
- Edit any staff schedule (admin)

### Schedule Editor
- Add/edit/remove weekly blocks
- Configure day of week, start time, end time
- Add schedule exceptions:
  - **Block**: Mark unavailable time (vacation, day off)
  - **Opening**: Add extra availability
- Optional reason for exceptions

## Project Structure

```
apps/web/
├── app/
│   ├── dashboard/          # Occupancy dashboard
│   ├── schedules/          # Staff schedules
│   ├── layout.tsx          # Root layout with nav
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   └── schedule-editor.tsx # Schedule editing UI
├── lib/
│   └── api-client.ts       # Backend API client
└── public/                 # Static assets
```

## API Integration

The app communicates with the hy10 API at `/api/v1/agenda`:

- `GET /occupancy` - Business metrics
- `GET /staff/schedules/all` - All staff schedules
- `POST /staff/schedule` - Update schedule blocks
- `POST /staff/exception` - Add exception

## Authorization

Some features require authentication:
- Dashboard viewing: Admin only
- View all schedules: Admin only
- Edit own schedule: Staff
- Edit any schedule: Admin only

Pass JWT token in Authorization header:
```typescript
headers: {
  Authorization: `Bearer ${token}`
}
```

## Related Documentation

- Implementation Guide: `/workspace/US-11-IMPLEMENTATION-GUIDE.md`
- Linear Issue: HY1-34
- Backend API: `/workspace/apps/api`
