# Stock2Table - AI-Powered Meal Planning Application

## Overview

Stock2Table is a comprehensive AI-powered meal planning application designed to simplify daily meal preparation for families and individuals. The application combines ingredient identification, recipe recommendations, meal planning, and shopping list management into a unified platform. Built with a focus on efficiency and family accessibility, it addresses common pain points like decision fatigue, food waste, and inefficient grocery shopping through intelligent automation and personalized recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application follows a modern React-based architecture:

- **React with TypeScript**: Provides type safety and component-based development
- **Wouter Router**: Lightweight routing solution for navigation between pages
- **TanStack Query**: Handles server state management, caching, and data fetching
- **Vite**: Fast development build tool with hot module replacement
- **Tailwind CSS**: Utility-first CSS framework for consistent styling

### UI Component System
The application implements a design system based on shadcn/ui components:

- **Material Design-inspired**: Clean, efficiency-focused aesthetics with medical-app-inspired trust elements
- **Radix UI Primitives**: Accessible, unstyled component primitives
- **Custom Theme System**: Supports light/dark modes with CSS custom properties
- **Component Variants**: Uses class-variance-authority for consistent component styling

### Backend Architecture
The server follows a Node.js/Express architecture pattern:

- **Express.js**: RESTful API server handling HTTP requests
- **TypeScript**: Type-safe server-side development
- **Modular Route Structure**: Organized API endpoints with separation of concerns
- **Storage Abstraction**: Interface-based storage layer for data operations

### Data Architecture
The application uses a PostgreSQL database with Drizzle ORM:

- **PostgreSQL**: Primary relational database for structured data
- **Drizzle ORM**: Type-safe database queries and schema management
- **Neon Database**: Serverless PostgreSQL hosting solution
- **Schema-first Design**: Shared TypeScript types between client and server

### Key Data Models
- **Users & Family Members**: Multi-user family account support with individual preferences
- **Ingredients & Pantry**: Comprehensive ingredient catalog with user inventory tracking
- **Recipes & Meal Plans**: Recipe database with AI-powered recommendations
- **Shopping Lists**: Smart grocery list generation from meal plans

### AI Integration Architecture
The application integrates OpenAI's GPT models for intelligent features:

- **Image Recognition**: Ingredient identification from uploaded photos
- **Recipe Recommendations**: Personalized suggestions based on available ingredients
- **Natural Language Processing**: Understanding of dietary preferences and restrictions
- **Fallback System**: Mock data responses when AI services are unavailable

### State Management
Client-side state is managed through multiple patterns:

- **Server State**: TanStack Query for API data caching and synchronization
- **Local State**: React hooks for component-level state
- **Theme State**: Context-based theme provider for UI customization
- **Form State**: React Hook Form for complex form interactions

### Authentication & Sessions
The application implements secure session-based authentication with Replit Auth (OIDC):

- **Replit Auth (OIDC)**: OAuth 2.0 / OpenID Connect authentication supporting Google, GitHub, X (Twitter), Apple, and email/password
- **Express Sessions**: Server-side session management with secure cookie configuration
- **PostgreSQL Session Store**: Persistent session storage using connect-pg-simple for session persistence across server restarts
- **Protected Routes**: All user-specific API endpoints require authentication via isAuthenticated middleware
- **Session-Based User Identity**: User ID derived from authenticated session (req.user.claims.sub) rather than client requests
- **Security Architecture**: Zero-trust model where client cannot spoof user identity - all user-specific operations validate authentication server-side

### API Security
All user-specific routes are protected with authentication middleware:

- **Protected Endpoints**: `/api/pantry/*`, `/api/family`, `/api/suggestions/*`, `/api/meal-plans/*`, `/api/shopping/*`, `/api/recipes/*/favorite`
- **Authentication Flow**: Unauthenticated requests to protected routes return 401 Unauthorized
- **User Scoping**: All data operations automatically scoped to authenticated user's ID
- **Session Validation**: Each request validates session against PostgreSQL session store
- **CSRF Protection**: Session cookies configured with httpOnly and sameSite flags

## External Dependencies

### AI Services
- **OpenAI API**: GPT-5 model for ingredient identification and recipe recommendations
- **Image Processing**: Base64 image encoding for AI analysis

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting and management
- **Connection Pooling**: @neondatabase/serverless for efficient database connections

### File Upload & Storage
- **Multer**: Express middleware for handling multipart/form-data file uploads
- **Local File System**: Temporary storage for image processing

### UI Libraries
- **Radix UI**: Complete set of accessible React components
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Touch-friendly carousel components
- **React Day Picker**: Calendar and date selection components

### Development Tools
- **Replit Integration**: Development environment plugins for debugging and monitoring
- **ESBuild**: Fast JavaScript/TypeScript bundling for production
- **PostCSS**: CSS processing with Tailwind CSS integration

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional CSS class handling
- **zod**: Runtime type validation and schema definition
- **nanoid**: Unique ID generation for entities

### Infrastructure Requirements
- **Node.js Environment**: ESM module support required
- **Environment Variables**: DATABASE_URL and OPENAI_API_KEY configuration
- **Static Asset Serving**: Vite-built client assets served by Express

## Deployment Configuration

### Health Check Endpoints
The application provides multiple health check endpoints for monitoring:

- **`/health`**: Basic server health check returning uptime and status
- **`/api/health`**: API health check with database and service status

### Production Readiness Features
- **Error Handling**: Comprehensive try-catch blocks around initialization
- **Graceful Degradation**: Application continues even if seed data or services fail
- **Startup Logging**: Detailed logs during server initialization
- **Service Validation**: Automatic checks for DATABASE_URL and OPENAI_API_KEY
- **Error Recovery**: Fallback mechanisms for database and AI service failures

### Port Configuration
- **Default Port**: 5000 (configured via PORT environment variable)
- **Host Binding**: 0.0.0.0 for external accessibility
- **Port Reuse**: Enabled for zero-downtime deployments