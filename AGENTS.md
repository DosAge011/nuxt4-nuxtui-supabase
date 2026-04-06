# Project Overview

This is a **Nuxt 4** web application named "foundation" with a complete authentication and role-based access control system using Supabase.

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Nuxt | ^4.4.2 |
| UI Framework | Vue | ^3.5.31 |
| UI Components | @nuxt/ui | Latest |
| Router | Vue Router | ^5.0.4 |
| Language | TypeScript | Latest (via Nuxt) |
| Backend/Auth | Supabase | Via @nuxtjs/supabase |
| Styling | Tailwind CSS v4 | Via @nuxt/ui |
| Package Manager | npm | (lockfile present) |

## External Services

- **Supabase**: Backend-as-a-Service for authentication, database, and real-time subscriptions
  - Configured with `SUPABASE_URL` and `SUPABASE_KEY` (publishable/anon key) in `.env`
  - No service role key required - all operations use RLS-protected queries
  - Custom Auth Hook adds `user_role` and `user_metadata` to JWT claims

## Project Structure

```
├── app/                          # Main application directory (Nuxt 4 app directory)
│   ├── app.vue                  # Root Vue component
│   ├── assets/                  # Static assets (images, fonts, etc.)
│   │   └── css/
│   │       └── main.css        # Custom theme CSS with Tailwind v4
│   ├── components/              # Vue components
│   │   └── UserRoleManagement.vue  # User role management table
│   ├── composables/             # Auto-imported Vue composables
│   │   └── useAuth.ts          # Authentication composable (signIn, signOut, register)
│   ├── layouts/                 # Layout components
│   │   └── default.vue         # Default layout with UHeader navigation
│   ├── middleware/              # Route middleware
│   │   ├── auth.global.ts      # Global auth middleware (redirects logged-in users from auth pages)
│   │   └── permissions.ts      # Role-based permission middleware
│   ├── pages/                   # Page components (auto-routed)
│   │   ├── index.vue           # Home page ("/")
│   │   ├── authentication.vue  # Auth test page with user management
│   │   ├── authentication_old.vue  # Legacy auth page
│   │   ├── error.vue           # Error display page (403, etc.)
│   │   ├── secAdmin.vue        # Admin-only page
│   │   ├── secDirector.vue     # Director+ page
│   │   ├── secWebmaster.vue    # Webmaster-only page
│   │   └── auth/               # Auth sub-pages
│   │       ├── login.vue       # Login page (placeholder)
│   │       ├── register.vue    # Register page (placeholder)
│   │       └── forgot-password.vue  # Forgot password page (placeholder)
│   └── types/                   # TypeScript type definitions
│       ├── database.types.ts   # Supabase database types
│       └── index.ts            # App types (AppRole)
├── server/                      # Server-side code
│   └── api/                     # API routes
│       └── users/               # User management endpoints
│           ├── allusers.get.ts  # GET /api/users/allusers - List all users (protected)
│           └── update-role.put.ts  # PUT /api/users/update-role - Update user role (protected)
├── public/                      # Static assets served at root
│   ├── favicon.ico
│   └── robots.txt
├── supabase/                    # Supabase configuration
│   ├── 01_setup_tables.sql     # Database schema and seed data
│   ├── 02_setup_functions.sql  # Functions and auth hook
│   ├── 03_setup_triggers.sql   # Auth triggers
│   ├── 04_setup_rls.sql        # RLS policies
│   └── 05_setup_initial_user.sql  # Bootstrap first admin
├── nuxt.config.ts              # Nuxt configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
└── .env                        # Environment variables (Supabase credentials)
```

## Build and Development Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server at `http://localhost:3000` |
| `npm run build` | Build for production |
| `npm run generate` | Generate static site |
| `npm run preview` | Preview production build locally |
| `npm run postinstall` | Prepare Nuxt (runs automatically after install) |

## Configuration Details

### Nuxt Configuration (`nuxt.config.ts`)
- **Compatibility Date**: 2025-07-15
- **DevTools**: Enabled for development debugging
- **Modules**: `@nuxtjs/supabase`, `@nuxt/ui`
- **CSS**: `~/assets/css/main.css`
- **Supabase**: `redirect: false` (manual auth handling)
- **UI Theme**: Custom colors (primary, secondary, success, info, warning, error, neutral)
- **Color Mode**: System preference with light/dark support
- **Page Transitions**: `page` and `layout` transitions enabled

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase publishable/anonymous key |

## Database Schema

### Tables

**app_roles**: Application role definitions
- `id` (bigint, PK)
- `level` (smallint) - Role hierarchy level
- `role` (varchar, unique) - Role name: 'user', 'admin', 'director', 'webmaster'
- `role_display` (varchar) - Human-readable role name

**user_roles**: User-to-role assignments
- `id` (bigint, PK)
- `user_id` (uuid, FK to auth.users)
- `role` (text, FK to app_roles.role)

**user_profiles**: Extended user profile information
- `id` (bigint, PK)
- `user_id` (uuid, FK to auth.users)
- `first_name` (text)
- `last_name` (text)
- `phone_number` (text)
- `avatar_url` (text)

### Auth Hook (custom_access_token_hook)

The custom hook enriches JWT claims with:
- `user_role`: The user's role from user_roles table
- `user_metadata`: Object containing `{first_name, last_name, phone_number, avatar_url}`

### Triggers

**on_auth_user_created**: Trigger on auth.users insert that:
1. Creates a row in user_profiles
2. Assigns default 'user' role in user_roles

### RLS Policies (user_profiles)

| Operation | Regular User | Admin/Director/Webmaster |
|-----------|--------------|--------------------------|
| SELECT | Own profile | All profiles |
| UPDATE | Own profile | All profiles |
| DELETE | ❌ | All profiles |
| INSERT | Own profile | All profiles |

## Code Organization

### Authentication (`composables/useAuth.ts`)

Provides reactive auth state and methods:
- `isAuthenticated` (computed): Whether user is logged in
- `signIn(email, password)`: Login with email/password
- `signOut()`: Logout current user
- `register(email, password)`: Create new account
- `userDisplayName` (computed): Returns full name or email
- `userAvatarUrl` (computed): Returns avatar URL or default
- `isRole(role)`: Check if user has exact role
- `hasRole(minRole)`: Check if user has at least this role level
- `isAbove(role)`: Check if user has strictly higher role

### Role Hierarchy

Roles are hierarchical from lowest to highest:
1. `user` - Regular user
2. `admin` - Administrator (read-only for user management)
3. `director` - Can assign admin/user roles
4. `webmaster` - Full control, can assign any role

### Middleware

**auth.global.ts**: Global middleware that redirects authenticated users away from auth pages (`/auth/login`, `/auth/register`, `/auth/forgot-password`).

**permissions.ts**: Role-based route protection supporting three meta properties:
- `meta.role`: Exact role match required
- `meta.minRole`: Minimum role level required (inclusive)
- `meta.aboveRole`: Must have strictly higher role than specified

Redirects to `/error` with 403 status if permission check fails.

### Server API

**GET /api/users/allusers**: Returns list of all users with profiles and roles.
- Requires: `admin`, `director`, or `webmaster` role
- Returns: `{ status, message, count, data: UserData[] }`

**PUT /api/users/update-role**: Updates a user's role.
- Requires: `director` (can only set admin/user) or `webmaster` (any role)
- Body: `{ userId: string, role: AppRole }`
- Returns: `{ status, message, data }`

### Components

**UserRoleManagement.vue**: Data table for viewing and managing user roles.
- Shows all users with search/filter capability
- Directors and Webmasters can edit roles via dropdown
- Users and Admins see read-only badges
- Uses UTable, UBadge, USelect from @nuxt/ui

### Accessing Auth Data in Components

```ts
const user = useSupabaseUser()
const auth = useAuth()

// From custom JWT claims
const role = user.value?.user_role           // 'user', 'admin', etc.
const metadata = user.value?.user_metadata   // {first_name, last_name, phone_number, avatar_url}

// From useAuth composable
const isAdmin = auth.isRole('admin')
const isDirectorOrHigher = auth.hasRole('director')
const isAboveAdmin = auth.isAbove('admin')

// Standard Supabase user data
const email = user.value?.email
const userId = user.value?.id
```

### Routing

Nuxt uses file-based routing:

| Route | File | Access |
|-------|------|--------|
| `/` | `app/pages/index.vue` | Public |
| `/authentication` | `app/pages/authentication.vue` | Public (auth test page) |
| `/auth/login` | `app/pages/auth/login.vue` | Public (placeholder) |
| `/auth/register` | `app/pages/auth/register.vue` | Public (placeholder) |
| `/auth/forgot-password` | `app/pages/auth/forgot-password.vue` | Public (placeholder) |
| `/secAdmin` | `app/pages/secAdmin.vue` | Admin+ (minRole) |
| `/secDirector` | `app/pages/secDirector.vue` | Director+ (minRole) |
| `/secWebmaster` | `app/pages/secWebmaster.vue` | Webmaster only (minRole) |
| `/error` | `app/pages/error.vue` | Public (error display) |

### Page Meta for Role Protection

```ts
// Exact role match
definePageMeta({
  middleware: ['permissions'],
  role: 'webmaster'
})

// Minimum role (inclusive)
definePageMeta({
  middleware: ['permissions'],
  minRole: 'admin'
})

// Strictly above role
definePageMeta({
  middleware: ['permissions'],
  aboveRole: 'admin'  // Only director and webmaster
})
```

## Styling and Theming

### CSS Architecture (`app/assets/css/main.css`)

- **Tailwind v4**: Uses `@import "tailwindcss"` and `@import "@nuxt/ui"`
- **Custom Theme**: `@theme static` block defines custom color scales
  - Primary Blue (#0055b8)
  - Secondary Teal (#0d9488)
  - Neutral Slate scale
  - Semantic colors (success, info, warning, error)
- **Nuxt UI Variables**: CSS custom properties for light/dark modes
- **Utility Classes**: Gradient, glow, glass morphism utilities
- **Transitions**: Smooth theme transitions and page/layout transitions

### Color Coding for Roles

| Role | Badge Color | Select Color |
|------|-------------|--------------|
| user | neutral | neutral |
| admin | success | success |
| director | warning | warning |
| webmaster | error | error |

## Security Considerations

- `.env` contains sensitive credentials and is ignored by git
- Supabase key in `.env` is the publishable key, safe for client-side
- RLS policies enforce data access control at the database level
- Custom auth hook runs with SECURITY DEFINER privileges
- Server API endpoints verify user role from database (not just JWT claims)
- Role update permissions enforced at both API and database levels

## Supabase Setup

Run the SQL files in order in the Supabase SQL Editor:

1. `01_setup_tables.sql` - Creates tables, seed data, and storage
2. `02_setup_functions.sql` - Creates functions and auth hook
3. `03_setup_triggers.sql` - Creates auto-trigger on signup
4. `04_setup_rls.sql` - Enables RLS and policies
5. `05_setup_initial_user.sql` - Bootstrap: create first admin (see comments in file)

**Important**: After running 01-04, you must manually create your first elevated user since RLS policies prevent regular users from managing roles. See `05_setup_initial_user.sql` for instructions.

## Useful Links

- [Nuxt Documentation](https://nuxt.com/docs/getting-started/introduction)
- [Vue 3 Documentation](https://vuejs.org/guide/introduction.html)
- [Supabase Documentation](https://supabase.com/docs)
- [@nuxtjs/supabase Documentation](https://supabase.nuxtjs.org/)
- [@nuxt/ui Documentation](https://ui.nuxt.com/)
