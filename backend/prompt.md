# Quiz App Backend Documentation

## System Architecture

### Authentication System
- JWT-based authentication flow
- Refresh token mechanism for session management
- Email verification system for new accounts
- Password reset functionality with rate limiting
- Secure password change capability

### Team Management
- Multi-team support with role-based access control
- Team invitation system with email notifications
- User-team relationship management
- Team member status tracking (active/pending)

### Role-Based Access Control
- Three-tier role system:
  - Owner: Full system access and team management
  - Admin: Team management and member administration
  - Member: Basic team member access
- Role assignment and verification

### Email System
- Templated email notifications using Handlebars
- Supported email types:
  - Verification emails
  - Password reset requests
  - Team invitations
  - Password change confirmations

## Entity Relationships

### User Entity
- Core user information
- Authentication credentials
- Profile management
- Linked to teams through UserTeam entity

### Team Entity
- Team information and settings
- Connected to users through UserTeam junction
- Team invitation tracking

### Role Entity
- Role definitions and permissions
- Used in UserTeam relationships
- Seeded with default roles (Owner, Admin, Member)

### Token Entities
- RefreshToken: JWT refresh token management
- VerificationToken: Email verification
- PasswordResetToken: Password reset process
- Rate limiting for security features

## Business Logic Flows

### User Registration Flow
1. User signs up with email/password
2. Verification email sent
3. Account activated upon verification
4. Initial profile setup

### Team Creation and Invitation Flow
1. Authenticated user creates team
2. User automatically assigned Owner role
3. Team invitations sent to new members
4. Members accept/reject invitations
5. Role assignments managed by Owner/Admin

### Security Measures
- Password hashing and salting
- JWT token expiration and rotation
- Rate limiting on sensitive operations
- Email verification requirement
- Role-based action authorization

## API Structure
- /auth: Authentication endpoints
- /user: User management
- /team: Team operations
- /role: Role management

## Development Notes
- NestJS framework for structured development
- TypeORM for database operations
- Handlebars for email templating
- Jest for testing implementation
- Swagger for API documentation