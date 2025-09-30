# CommunityPledges

A web application where community members can pledge towards server costs and share the expenses fairly. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **User Authentication**: Secure signup and login system with NextAuth.js
- **Server Management**: Create and manage community servers with transparent cost sharing
- **Pledge System**: Users can pledge towards servers and costs are automatically divided
- **User Profiles**: Public profiles at `/user/<username>` showing user activity
- **Dashboard**: Personal dashboard for managing pledges and servers
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS with custom design system

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd communitypledges
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── servers/           # Server management
│   ├── user/              # User profile pages
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   └── Navbar.tsx         # Navigation component
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   └── prisma.ts         # Prisma client
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema
└── public/               # Static assets
```

## Database Schema

The application uses the following main entities:

- **User**: User accounts with authentication
- **Server**: Community servers with cost information
- **Pledge**: User pledges towards servers
- **Account/Session**: NextAuth.js authentication data

## Features Overview

### Authentication
- User registration with email, username, and password
- Secure login with password hashing
- Session management with NextAuth.js
- Public user profiles at `/user/<username>`

### Server Management
- Create servers with monthly cost information
- Set target number of pledges
- Track current pledges and progress
- Server listing and browsing

### Pledge System
- Users can pledge towards servers
- Automatic cost calculation per person
- Pledge tracking and management
- Dashboard for viewing all pledges

### User Interface
- Responsive design for all screen sizes
- Modern UI with Tailwind CSS
- Intuitive navigation and user experience
- Real-time progress tracking

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Management

- `npx prisma studio` - Open Prisma Studio for database management
- `npx prisma db push` - Push schema changes to database
- `npx prisma generate` - Generate Prisma client

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.



