# Claimly Admin Frontend

Admin panel for the Claimly insurance management system.

## Features

- **Dashboard**: Overview of alerts and quick access to main sections
- **User Management**: View and manage user accounts, update subscription status
- **Company Management**: Create, edit, and manage insurance companies
- **Policy Management**: View all policies with details
- **Alert Management**: Review and verify alerts from users
- **Admin Actions**: View audit log of admin actions

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React (icons)
- date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional, defaults to `http://localhost:3000`):
```env
VITE_API_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm run dev
```

The admin panel will be available at `http://localhost:5174`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Backend Integration

The admin panel connects to the backend API at the configured URL. Make sure:

1. The backend is running on port 3000 (or update `VITE_API_URL`)
2. You have admin credentials to log in
3. CORS is properly configured on the backend

## Project Structure

```
admin-frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── types/          # TypeScript types
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
└── index.html          # HTML template
```

## Authentication

The admin panel uses JWT tokens stored in localStorage. The token is automatically included in API requests via axios interceptors.

## License

ISC

