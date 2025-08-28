# Production Physiotherapy Management System

A comprehensive web application for managing physiotherapy productions, participant onboarding, and AI-powered interactions. This system streamlines the entire lifecycle from production creation to participant engagement through WhatsApp integration and intelligent chat capabilities.

## 🎯 Core Purpose

This application serves as a bridge between physiotherapy professionals and their participants, providing:
- **Production Management**: Create and manage physiotherapy shows with seat allocation
- **Intelligent Onboarding**: Guided participant registration with consent management
- **AI-Powered Chat**: Interactive conversations powered by twin digital personas
- **Multi-Channel Communication**: WhatsApp integration for seamless participant engagement
- **Comprehensive Analytics**: Track engagement, participation, and system usage

## 🏗️ Architecture Principles

### 1. **Security-First Design**
- Row Level Security (RLS) policies protect all user data
- Role-based access control (RBAC) with admin/user separation
- Comprehensive audit logging for all critical actions
- Secure API endpoints with proper authentication

### 2. **User Experience Excellence**
- Mobile-first responsive design
- Progressive web app capabilities
- Intuitive admin interfaces with rich data visualization
- Seamless onboarding flows with clear progress indicators

### 3. **Scalable Backend Architecture**
- Supabase-powered backend with PostgreSQL database
- Edge functions for external API integrations
- Real-time data synchronization
- Efficient caching strategies

### 4. **Data-Driven Insights**
- Comprehensive analytics dashboard
- Real-time system monitoring
- Detailed audit trails
- Performance metrics and health checks

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with design system
- **Vite** - Fast development and build tool
- **React Router** - Client-side routing
- **Shadcn/ui** - High-quality component library

### Backend & Infrastructure
- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Primary database with RLS
- **Edge Functions** - Serverless functions for business logic
- **Twilio** - WhatsApp messaging integration
- **Real-time subscriptions** - Live data updates

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking
- **React Hook Form** - Form management
- **Zod** - Runtime type validation

## 🔧 Key Features

### 🎪 Production Management
- Create and manage physiotherapy productions
- Flexible seat allocation and capacity management
- Start/end date scheduling with status tracking
- Passcode-based access control

### 👥 User Management & Onboarding
- Multi-step onboarding with progress tracking
- Comprehensive profile collection (goals, medical history, preferences)
- Consent management and agreement tracking
- Phone number verification and normalization

### 🤖 AI Chat System
- Context-aware conversations using twin digital personas
- Streaming responses for real-time interaction
- Message history and conversation threading
- Suggested questions for engagement

### 📱 WhatsApp Integration
- Automated message delivery
- Status tracking and delivery confirmations
- Template-based messaging system
- Error handling and retry mechanisms

### 📊 Analytics & Monitoring
- Real-time system status monitoring
- User engagement analytics
- Production performance metrics
- Comprehensive audit logging

### 🎫 QR Code & Access Management
- Bulk QR code generation for seat access
- CSV import/export functionality
- Seat status management (active, pending, expired, revoked)
- Access control and verification

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (shadcn)
│   ├── admin/           # Admin-specific components
│   ├── auth/            # Authentication components
│   └── onboarding/      # Onboarding flow components
├── hooks/               # Custom React hooks
├── integrations/        # External service integrations
│   └── supabase/        # Supabase client and types
├── pages/               # Page components and routing
├── services/            # API clients and business logic
├── types/               # TypeScript type definitions
└── utils/               # Helper functions and utilities

supabase/
├── functions/           # Edge functions
├── migrations/          # Database migrations
└── config.toml         # Supabase configuration
```

## 🔐 Security Model

### Role-Based Access Control
- **Admin Role**: Full system access, user management, analytics
- **User Role**: Limited to personal data and assigned productions

### Data Protection Policies
- All tables protected by Row Level Security (RLS)
- User data isolated by `auth.uid()` validation
- Admin data requires explicit role checking
- Comprehensive audit logging for sensitive operations

### API Security
- All API endpoints require authentication
- Rate limiting and abuse prevention
- Input validation and sanitization
- Secure secret management

## 🚀 Development Guidelines

### Code Standards
- **TypeScript First**: All new code must use TypeScript
- **Component Architecture**: Favor composition over inheritance
- **Hook Pattern**: Use custom hooks for shared logic
- **Error Boundaries**: Implement proper error handling
- **Accessibility**: Follow WCAG guidelines

### State Management
- React hooks for local state
- Supabase real-time for global state
- Form state with React Hook Form
- URL state for navigation persistence

### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow the design system tokens
- Implement dark/light mode support
- Ensure mobile-first responsive design

### Testing Strategy
- Unit tests for utilities and hooks
- Integration tests for API endpoints
- E2E tests for critical user flows
- Visual regression testing

## 📈 Performance Considerations

### Frontend Optimization
- Code splitting and lazy loading
- Image optimization and lazy loading
- Bundle size monitoring
- Performance budgets

### Backend Optimization
- Database query optimization
- Proper indexing strategies
- Connection pooling
- Caching strategies

## 🔄 Data Flow Architecture

### User Onboarding Flow
1. **Access Control**: Passcode verification
2. **Information Collection**: Multi-step form completion
3. **Consent Management**: Agreement acknowledgment
4. **Profile Creation**: Database record initialization
5. **Seat Assignment**: Production enrollment

### Chat System Flow
1. **Message Input**: User query processing
2. **Context Building**: Conversation history and user profile
3. **AI Processing**: Twin persona response generation
4. **Response Streaming**: Real-time message delivery
5. **History Storage**: Conversation persistence

### Admin Management Flow
1. **Production Creation**: Show setup and configuration
2. **Participant Management**: User oversight and support
3. **Analytics Review**: Performance monitoring
4. **System Maintenance**: Health checks and updates

## 🚦 Environment Configuration

### Required Environment Variables
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Supabase Secrets
- `TWILIO_ACCOUNT_SID` - Twilio account identifier
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_WHATSAPP_FROM` - WhatsApp sender number
- `CORE_API_KEY` - AI service authentication
- `CORE_API_URL` - AI service endpoint

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase CLI (for local development)

### Installation
```bash
# Clone the repository
git clone [repository-url]
cd production-physiotherapy

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Database Setup
```bash
# Start Supabase locally (optional)
supabase start

# Run migrations
supabase db push

# Seed initial data (if available)
npm run seed
```

## 👥 Contributing

### Contribution Workflow
1. Create feature branch from `main`
2. Implement changes following coding standards
3. Add tests for new functionality
4. Update documentation as needed
5. Submit pull request with detailed description

### Code Review Process
- All changes require peer review
- Automated tests must pass
- Security review for sensitive changes
- Performance impact assessment

## 📝 API Documentation

### Core Endpoints
- `/api/auth/*` - Authentication and authorization
- `/api/shows/*` - Production management
- `/api/profiles/*` - User profile management
- `/api/chat/*` - AI chat functionality
- `/api/admin/*` - Administrative operations

### Edge Functions
- `ai-twin-chat` - AI conversation processing
- `twilio-webhook` - WhatsApp message handling
- `core-api` - Business logic operations
- `middleware-api` - External service integration

## 🎯 Future Roadmap

### Planned Features
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile application
- [ ] Integration with healthcare systems
- [ ] Advanced AI capabilities
- [ ] Performance optimization
- [ ] Enhanced security features

### Technical Debt
- [ ] Comprehensive test coverage
- [ ] Performance monitoring setup
- [ ] Documentation improvements
- [ ] Code refactoring for maintainability

## 📞 Support & Contact

For technical questions or support requests, please:
1. Check existing documentation
2. Search through issues in the repository
3. Contact the development team
4. Create a detailed issue report

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ for the physiotherapy community**

## 🔧 Development Environment

**URL**: https://lovable.dev/projects/112d0efe-20fb-41eb-8251-742e75bc8ce6

### How to Edit This Code

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/112d0efe-20fb-41eb-8251-742e75bc8ce6) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Deployment

Simply open [Lovable](https://lovable.dev/projects/112d0efe-20fb-41eb-8251-742e75bc8ce6) and click on Share -> Publish.

### Custom Domain

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)