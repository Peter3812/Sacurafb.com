# FBPro.MCP - AI-Driven Facebook Management SaaS

## Overview

FBPro.MCP is an AI-powered SaaS platform designed for Facebook page management and automation. The application provides content generation, scheduling, messenger bot automation, analytics, and ad intelligence features. Built with modern web technologies, it integrates multiple AI services including OpenAI GPT-5, Claude, and Perplexity to deliver intelligent Facebook marketing automation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI components
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **UI Components**: Comprehensive component library based on Radix UI primitives

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for RESTful API endpoints
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Authentication**: OpenID Connect (OIDC) integration with Replit Auth using Passport.js
- **Session Management**: Express sessions with PostgreSQL store for persistent user sessions
- **Build System**: ESBuild for production bundling with Vite for development

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless connection
- **Schema Management**: Drizzle Kit for database migrations and schema evolution
- **Key Entities**:
  - Users with Stripe integration for subscription management
  - Facebook Pages with access tokens and metadata
  - Generated Content with AI model tracking and scheduling capabilities
  - Messenger Bots with configuration and automation rules
  - Analytics data for performance tracking
  - Ad Intelligence for competitor analysis

### Authentication & Authorization
- **Primary Auth**: Replit OIDC integration for secure user authentication
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **API Security**: Session-based authentication with middleware protection on all authenticated routes
- **User Management**: Automatic user creation/update on successful authentication

### AI Integration Architecture
- **Content Generation**: OpenAI GPT-5 integration for intelligent post creation
- **Image Generation**: DALL-E 3 for automated visual content creation
- **Model Flexibility**: Configurable AI model selection (GPT-5, Claude, Perplexity)
- **Prompt Engineering**: Structured prompts for consistent content quality and brand voice

### Payment Processing
- **Payment Provider**: Stripe integration for subscription billing
- **Subscription Management**: Customer and subscription tracking in user profiles
- **Billing Features**: Upgrade flows and subscription status management

## External Dependencies

### AI Services
- **OpenAI API**: GPT-5 for content generation and DALL-E 3 for image creation
- **Anthropic Claude**: Alternative AI model for content generation
- **Perplexity AI**: Research and trend-based content creation

### Facebook Integration
- **Facebook Graph API**: Page management and content publishing
- **Facebook Ads API**: Ad intelligence and competitor research
- **Messenger Platform**: Automated customer engagement and bot management

### Infrastructure Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support
- **Stripe**: Payment processing and subscription management
- **Replit**: Authentication provider and deployment platform

### Development Tools
- **Replit Cartographer**: Development environment integration
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Typography with multiple font families (DM Sans, Fira Code, Geist Mono)