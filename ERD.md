# ERD - SaaS Team Management Platform

## SCHEMA_INFO
- database: PostgreSQL
- orm: TypeORM  
- primary_key_strategy: UUID (except plans: integer)
- migration_support: true

## ENTITIES

### users
```
table_name: users
purpose: User accounts and authentication
primary_key: id (UUID)
columns:
  id: UUID, PK, NOT NULL
  email: VARCHAR, UNIQUE, NOT NULL
  name: VARCHAR, NOT NULL  
  password: VARCHAR, NOT NULL  # bcrypt hashed
  isVerified: BOOLEAN, DEFAULT false
  createdAt: TIMESTAMP, NOT NULL
  updatedAt: TIMESTAMP, NOT NULL
relationships:
  - verification_tokens: ONE_TO_MANY, CASCADE_DELETE
  - password_reset_tokens: ONE_TO_MANY
  - refresh_tokens: ONE_TO_MANY, CASCADE_DELETE
  - user_teams: ONE_TO_MANY
  - team_invitations: ONE_TO_MANY (as inviter), SET_NULL
indexes:
  - email: UNIQUE
```

### teams  
```
table_name: teams
purpose: Organizational teams
primary_key: id (UUID)
columns:
  id: UUID, PK, NOT NULL
  name: VARCHAR, NOT NULL
  ownerId: UUID, FK(users.id), NOT NULL
  createdAt: TIMESTAMP, NOT NULL
relationships:
  - users: MANY_TO_ONE (owner)
  - user_teams: ONE_TO_MANY, CASCADE_DELETE
  - team_invitations: ONE_TO_MANY, CASCADE_DELETE
  - subscriptions: ONE_TO_MANY, CASCADE_DELETE
  - invoices: ONE_TO_MANY, CASCADE_DELETE
  - usage_counters: ONE_TO_MANY, CASCADE_DELETE
indexes:
  - ownerId: FK_INDEX
```

### roles
```
table_name: roles
purpose: Role-based access control
primary_key: id (UUID)
columns:
  id: UUID, PK, NOT NULL
  name: ENUM(OWNER, ADMIN, BILLING), NOT NULL
  createdAt: TIMESTAMP, NOT NULL
relationships:
  - user_teams: ONE_TO_MANY
enums:
  RoleType: [OWNER, ADMIN, BILLING]
```

### user_teams
```
table_name: user_teams
purpose: User-team membership with roles
primary_key: [userId, teamId] (COMPOSITE)
columns:
  userId: UUID, PK, FK(users.id), NOT NULL
  teamId: UUID, PK, FK(teams.id), NOT NULL
  roleId: UUID, FK(roles.id), NULLABLE
  status: ENUM(INVITING, ACTIVE, REJECT), NOT NULL
  createdAt: TIMESTAMP, NOT NULL
relationships:
  - users: MANY_TO_ONE
  - teams: MANY_TO_ONE
  - roles: MANY_TO_ONE
enums:
  UserTeamStatus: [INVITING, ACTIVE, REJECT]
indexes:
  - userId: INDEX
  - teamId: INDEX
  - roleId: INDEX
```

### verification_tokens
```
table_name: verification_tokens
purpose: Email verification tokens
primary_key: id (UUID)
columns:
  id: UUID, PK, NOT NULL
  token: VARCHAR, UNIQUE, NOT NULL
  userId: UUID, FK(users.id), NOT NULL
  expiresAt: TIMESTAMP, NOT NULL
  createdAt: TIMESTAMP, NOT NULL
relationships:
  - users: MANY_TO_ONE, CASCADE_DELETE
indexes:
  - token: UNIQUE
  - userId: INDEX
```

### password_reset_tokens
```
table_name: password_reset_tokens
purpose: Password reset functionality
primary_key: id (UUID)
columns:
  id: UUID, PK, NOT NULL
  token: VARCHAR, NOT NULL
  userId: UUID, FK(users.id), NOT NULL
  expiresAt: TIMESTAMP, NOT NULL
  createdAt: TIMESTAMP, NOT NULL
relationships:
  - users: MANY_TO_ONE
indexes:
  - userId: INDEX
```

### refresh_tokens
```
table_name: refresh_tokens
purpose: JWT session management
primary_key: id (UUID)
columns:
  id: UUID, PK, NOT NULL
  token: VARCHAR, NOT NULL
  userId: UUID, FK(users.id), NOT NULL
  expiresAt: TIMESTAMP, NOT NULL
  isRevoked: BOOLEAN, DEFAULT false
  revokedAt: TIMESTAMP, NULLABLE
  createdAt: TIMESTAMP, NOT NULL
relationships:
  - users: MANY_TO_ONE, CASCADE_DELETE
indexes:
  - userId: INDEX
```

### password_reset_rate_limits
```
table_name: password_reset_rate_limits
purpose: Rate limiting for password resets
primary_key: id (UUID)
columns:
  id: UUID, PK, NOT NULL
  email: VARCHAR, NOT NULL
  attemptCount: INTEGER, NOT NULL
  lastAttempt: TIMESTAMP, NOT NULL
  nextAllowedAttempt: TIMESTAMP, NOT NULL
```

### team_invitations
```
table_name: team_invitations
purpose: Team invitation workflow
primary_key: id (UUID)
columns:
  id: UUID, PK, NOT NULL
  teamId: UUID, FK(teams.id), NOT NULL
  inviterId: UUID, FK(users.id), NOT NULL
  email: VARCHAR, UNIQUE, NOT NULL
  roleId: UUID, NOT NULL
  status: ENUM(PENDING, ACCEPTED, EXPIRED), NOT NULL
  token: VARCHAR, UNIQUE, NOT NULL
  sentAt: TIMESTAMP, NOT NULL
  acceptedAt: TIMESTAMP, NULLABLE
relationships:
  - teams: MANY_TO_ONE, CASCADE_DELETE
  - users: MANY_TO_ONE (inviter), SET_NULL
enums:
  TeamInvitationStatus: [PENDING, ACCEPTED, EXPIRED]
indexes:
  - email: UNIQUE
  - token: UNIQUE
  - teamId: INDEX
```

### plans
```
table_name: plans
purpose: Subscription plans and pricing
primary_key: id (INTEGER AUTO_INCREMENT)
columns:
  id: INTEGER, PK, AUTO_INCREMENT
  name: VARCHAR(100), NULLABLE
  description: TEXT, NULLABLE
  price: DECIMAL(10,2), NOT NULL
  features: JSON, NULLABLE
  billingCycle: ENUM(MONTHLY, YEARLY), DEFAULT MONTHLY
  stripePriceId: VARCHAR(100), NULLABLE
  stripeProductId: VARCHAR(100), NULLABLE
  createdAt: TIMESTAMP, NOT NULL
  updatedAt: TIMESTAMP, NOT NULL
relationships:
  - subscriptions: ONE_TO_MANY
enums:
  BillingCycle: [MONTHLY, YEARLY]
```

### subscriptions
```
table_name: subscriptions
purpose: Team subscription management
primary_key: id (UUID)
columns:
  id: UUID, PK, NOT NULL
  teamId: UUID, FK(teams.id), NOT NULL
  planId: INTEGER, FK(plans.id), NOT NULL
  startDate: DATE, NOT NULL
  endDate: DATE, NOT NULL
  status: ENUM(PENDING, ACTIVE, EXPIRED, CANCELED), DEFAULT PENDING
  createdAt: TIMESTAMP, NOT NULL
  updatedAt: TIMESTAMP, NOT NULL
relationships:
  - teams: MANY_TO_ONE, CASCADE_DELETE
  - plans: MANY_TO_ONE
  - invoices: ONE_TO_MANY
enums:
  SubscriptionStatus: [PENDING, ACTIVE, EXPIRED, CANCELED]
indexes:
  - teamId: INDEX
  - planId: INDEX
```

### invoices
```
table_name: invoices
purpose: Billing invoices
primary_key: id (UUID)
columns:
  id: UUID, PK, NOT NULL
  teamId: UUID, FK(teams.id), NOT NULL
  subscriptionId: UUID, FK(subscriptions.id), NOT NULL
  amount: DECIMAL(10,2), NOT NULL
  status: ENUM(UNPAID, PAID, FAILED), DEFAULT UNPAID
  issuedDate: DATE, NOT NULL
  dueDate: DATE, NOT NULL
  createdAt: TIMESTAMP, NOT NULL
  updatedAt: TIMESTAMP, NOT NULL
relationships:
  - teams: MANY_TO_ONE, CASCADE_DELETE
  - subscriptions: MANY_TO_ONE
  - payments: ONE_TO_MANY
enums:
  InvoiceStatus: [UNPAID, PAID, FAILED]
indexes:
  - teamId: INDEX
  - subscriptionId: INDEX
```

### payments
```
table_name: payments
purpose: Payment transactions
primary_key: id (UUID)
columns:
  id: UUID, PK, NOT NULL
  invoiceId: UUID, FK(invoices.id), NOT NULL
  paymentMethod: VARCHAR(50), NOT NULL
  transactionId: VARCHAR, NOT NULL
  amountPaid: DECIMAL(10,2), NOT NULL
  status: ENUM(SUCCESSFUL, FAILED), NOT NULL
  paidAt: TIMESTAMP, NULLABLE
  createdAt: TIMESTAMP, NOT NULL
relationships:
  - invoices: MANY_TO_ONE
enums:
  PaymentStatus: [SUCCESSFUL, FAILED]
indexes:
  - invoiceId: INDEX
```

### usage_counters
```
table_name: usage_counters
purpose: Feature usage tracking
primary_key: id (UUID)
columns:
  id: UUID, PK, NOT NULL
  teamId: UUID, FK(teams.id), NOT NULL
  features: JSON, NULLABLE
  last_reset_date: DATE, NOT NULL
relationships:
  - teams: MANY_TO_ONE, CASCADE_DELETE
indexes:
  - teamId: INDEX
```

## RELATIONSHIPS_SUMMARY
```
users 1:N verification_tokens
users 1:N password_reset_tokens
users 1:N refresh_tokens
users N:M teams (via user_teams)
users 1:N team_invitations (as inviter)

teams 1:N user_teams
teams 1:N team_invitations
teams 1:N subscriptions
teams 1:N invoices
teams 1:N usage_counters

roles 1:N user_teams

plans 1:N subscriptions
subscriptions 1:N invoices
invoices 1:N payments
```

## BUSINESS_FLOWS

### user_registration
```
1. CREATE users record
2. CREATE verification_tokens record
3. SEND verification email
4. UPDATE users.isVerified = true (on verification)
```

### team_invitation
```
1. CREATE team_invitations record with token
2. SEND invitation email
3. CREATE users record (if new user)
4. CREATE user_teams record
5. UPDATE team_invitations.status = ACCEPTED
```

### subscription_flow
```
1. CREATE subscriptions record
2. CREATE invoices record
3. PROCESS payment -> CREATE payments record
4. UPDATE invoice/subscription status
```

### usage_tracking
```
1. INCREMENT usage_counters.features JSON
2. CHECK against plan limits
3. RESET usage based on billing cycle
```

## CONSTRAINTS
```
unique_constraints:
  - users.email
  - verification_tokens.token
  - team_invitations.email
  - team_invitations.token

foreign_key_constraints:
  cascade_delete:
    - users -> verification_tokens
    - users -> refresh_tokens
    - teams -> user_teams
    - teams -> subscriptions
    - teams -> invoices
    - teams -> usage_counters
    - teams -> team_invitations
  set_null:
    - users -> team_invitations (inviter)

composite_keys:
  - user_teams: [userId, teamId]
```

## PERFORMANCE_INDEXES
```
CREATE INDEX idx_user_teams_user_id ON user_teams(userId);
CREATE INDEX idx_user_teams_team_id ON user_teams(teamId);
CREATE INDEX idx_subscriptions_team_id ON subscriptions(teamId);
CREATE INDEX idx_invoices_team_id ON invoices(teamId);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscriptionId);
CREATE INDEX idx_payments_invoice_id ON payments(invoiceId);
CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(userId);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(userId);
CREATE INDEX idx_team_invitations_team_id ON team_invitations(teamId);
```

## SEED_DATA
```sql
-- Default roles
INSERT INTO roles (id, name) VALUES 
  (gen_random_uuid(), 'OWNER'),
  (gen_random_uuid(), 'ADMIN'),
  (gen_random_uuid(), 'BILLING');

-- Default plans
INSERT INTO plans (name, description, price, features, billingCycle) VALUES
  ('Free', 'Basic features for small teams', 0.00, '{"users": 5, "submissions": 100}', 'MONTHLY'),
  ('Premium', 'Advanced features for growing teams', 29.99, '{"users": 20, "submissions": 1000}', 'MONTHLY'),
  ('Enterprise', 'Full features for large organizations', 99.99, '{"users": -1, "submissions": -1}', 'MONTHLY');
```

## SECURITY_NOTES
```
password_storage: bcrypt with salt
token_security: UUID with expiration
rate_limiting: password_reset_rate_limits table
access_control: role-based via user_teams
data_isolation: team-scoped data access
audit_trail: timestamps on all entities
``` 