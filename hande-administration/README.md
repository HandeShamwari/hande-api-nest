# HANDE Administration Panel

> Modern admin dashboard for managing the Hande ride-sharing platform

## 🎯 Overview

The HANDE Administration Panel is a web-based dashboard for managing drivers, monitoring analytics, and overseeing the Hande ride-sharing platform. Built with React, TypeScript, and Tailwind CSS, it provides real-time insights into platform performance and driver management tools.

## ✨ Features

- **Real-time Dashboard**: Live metrics for trips, drivers, and revenue
- **Driver Management**: Verify, suspend, and manage driver accounts
- **Analytics**: Weekly trends, cancellation analysis, and driver leaderboards
- **Content Management**: Manage platform content and documentation
- **Settings**: Configure platform settings and preferences
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Hande API server running (default: http://localhost:8000)

### Installation

```bash
# Navigate to the administration directory
cd hande-administration

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your API URL
# VITE_API_BASE_URL=http://localhost:8000/api

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## 🎨 Brand Identity

The admin panel uses the HANDE brand colors:

- **Primary Green** (`#7ED957`): CTAs, active elements
- **Gold** (`#FFB800`): Highlights, pricing
- **Black** (`#000000`): Primary text
- **White** (`#FFFFFF`): Backgrounds
- **Neutral Gray** (`#F5F5F5`): Secondary backgrounds
- **Dark Gray** (`#333333`): Secondary text

## 📁 Project Structure

```
hande-administration/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, icons
│   ├── components/      # Reusable components
│   │   ├── layout/      # Layout components (sidebar, header)
│   │   └── ui/          # UI components (buttons, cards)
│   ├── lib/             # Utilities
│   │   ├── api.ts       # API client configuration
│   │   ├── auth.tsx     # Authentication context
│   │   └── utils.ts     # Helper functions
│   ├── pages/           # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Users.tsx
│   │   ├── Analytics.tsx
│   │   ├── Content.tsx
│   │   ├── Settings.tsx
│   │   └── Login.tsx
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables (create from .env.example)
├── package.json         # Dependencies and scripts
└── tailwind.config.js   # Tailwind CSS configuration
```

## 🔐 Authentication

The admin panel uses JWT-based authentication:

1. Login with admin credentials at `/login`
2. Token is stored in localStorage
3. Token is automatically included in API requests
4. Protected routes redirect to login if not authenticated

### Default Admin Credentials

Set up admin user in the Hande API:

```bash
# In hande-api directory
php artisan admin:create
```

## 📊 Pages

### Dashboard
- Real-time trip and driver metrics
- Marketplace liquidity status
- Daily performance overview
- Platform quality indicators

### Users (Drivers)
- List all drivers with search and filters
- Verify pending driver documents
- Suspend/activate driver accounts
- View driver statistics and ratings

### Analytics
- Weekly trend analysis
- Cancellation analysis
- Top driver leaderboard
- Revenue and trip metrics

### Content
- Manage platform content
- Documentation and guides
- Media library

### Settings
- Platform configuration
- Notification preferences
- Security settings
- System maintenance tools

## 🔌 API Integration

The admin panel connects to the Hande API endpoints:

```typescript
// Authentication
POST   /api/admin/login

// Analytics
GET    /api/admin/analytics/realtime
GET    /api/admin/analytics/daily
GET    /api/admin/analytics/trends
GET    /api/admin/analytics/cancellations
GET    /api/admin/analytics/drivers/leaderboard

// Driver Management
GET    /api/admin/drivers
GET    /api/admin/drivers/:id
PUT    /api/admin/drivers/:id/verify
PUT    /api/admin/drivers/:id/suspend
PUT    /api/admin/drivers/:id/activate
```

## 🛠️ Development

### Technologies

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side routing
- **TanStack Query**: Data fetching and caching
- **Axios**: HTTP client
- **Lucide React**: Icon library

### Code Style

- ESLint for code quality
- TypeScript for type checking
- Prettier-compatible formatting (via ESLint)

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🚨 Troubleshooting

### API Connection Issues

1. Verify the Hande API is running
2. Check `.env` file has correct `VITE_API_BASE_URL`
3. Ensure CORS is configured in the API
4. Check browser console for errors

### Authentication Errors

1. Clear localStorage: `localStorage.clear()`
2. Check admin user exists in database
3. Verify JWT secret is configured in API
4. Check token expiration settings

### Build Errors

1. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Check Node.js version (18+ required)

## 📝 Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# Optional: Production settings
# VITE_API_BASE_URL=https://api.hande.com/api
```

## 🔒 Security Notes

- Never commit `.env` file to version control
- Always use HTTPS in production
- Implement proper CORS policies
- Use secure password policies
- Enable rate limiting on API
- Regularly update dependencies

## 📄 License

This project is part of the HANDE platform and follows the same license.

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for all new files
3. Add proper type definitions
4. Test authentication flows
5. Follow the HANDE brand guidelines

## 📞 Support

For issues or questions:
- Check the API documentation in `hande-api/docs/`
- Review the project overview in `.github/copilot-instructions.md`
- Contact the development team

---

**Built with ❤️ for HANDE - Empowering drivers, one dollar at a time**
