# 🏗️ Foundation

<p align="center">
  <strong>A production-ready Nuxt template with role-based authentication</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#authentication-test-page">Test Page</a> •
  <a href="#role-system">Role System</a> •
  <a href="#securing-pages">Securing Pages</a> •
  <a href="#styling">Styling</a>
</p>

---

## 🔐 Authentication Test Page

The `/authentication` page is a comprehensive demo and testing interface for the authentication system. It provides real-time visibility into auth state and allows you to test all authentication flows.

### Page Sections

#### 1. Authenticated User Details

Displays the current user's authentication status and key identity information:

| Field | Description | Visual Indicator |
|-------|-------------|------------------|
| `isAuthenticated` | Whether a user is currently logged in | 🟢 Green (`true`) / 🔴 Red (`false`) |
| `UUID` | The user's unique Supabase ID | 🟢 Green when present / 🔴 "N/A" when missing |
| `Email` | User's email address from `auth.users` | 🟢 Green when present / 🔴 "N/A" when missing |
| `User Role` | Role from JWT claims (`user_role`) | 🟢 Green when present / 🔴 "N/A" when missing |

> **Note:** These values update in real-time as you log in/out. The color coding makes it easy to visually verify authentication state at a glance.

#### 2. Authentication Actions

Quick login form for testing with pre-filled demo credentials:

```
Email:    webmaster@webmaster.com
Password: password
```

**Available Actions:**
- **Login** (Primary button) - Signs in with the provided credentials
- **Logout** (Error/Red button) - Signs out the current user

#### 3. User Management Table

A full `UserRoleManagement` component (only visible when authenticated) that displays:

- **All registered users** with their email, name, and current role
- **Searchable/filterable** list (filter by email or name)
- **Role editing** (for authorized users):
  - **Users & Admins**: View-only (see role badges)
  - **Directors**: Can assign `user` or `admin` roles
  - **Webmasters**: Can assign any role (`user`, `admin`, `director`, `webmaster`)

> **Demo Tip:** Log in as a webmaster to see the full role management capabilities, then create test users with different roles to test the permission system.

#### 4. Raw Data Inspector

A collapsible section that displays the complete `user` object from `useSupabaseUser()`:

```json
{
  "id": "...",
  "email": "...",
  "user_role": "webmaster",
  "user_metadata": {
    "first_name": "...",
    "last_name": "...",
    "phone_number": "...",
    "avatar_url": "..."
  },
  ...
}
```

This is useful for:
- Debugging JWT claims from the custom auth hook
- Verifying `user_role` and `user_metadata` are present
- Inspecting the full Supabase user object structure

### Testing Workflow

1. **Initial Visit** (logged out): All user details show "N/A" in red
2. **Login**: Click Login with the pre-filled credentials
3. **Verify Auth State**: All fields turn green, User Management appears
4. **Test Role Management**: Try changing roles of test users (if webmaster)
5. **Inspect Raw Data**: Expand "Show Current User Object" to see JWT claims
6. **Logout**: Click Logout and verify all fields return to "N/A"

### Protected API Testing

The User Management table exercises these protected API endpoints:

| Endpoint | Role Required | Purpose |
|----------|---------------|---------|
| `GET /api/users/allusers` | Admin+ | Populates the user list |
| `PUT /api/users/update-role` | Director+ | Updates user roles |

---

## ✨ Features

- 🔐 **Complete Authentication** - Login, register, logout powered by Supabase Auth
- 👥 **Role-Based Access Control** - Hierarchical roles: `user` → `admin` → `director` → `webmaster`
- 🛡️ **Secure by Default** - Middleware protection, RLS policies, API-level validation
- 🎨 **Beautiful UI** - Pre-configured with Nuxt UI components
- 📱 **Responsive** - Mobile-first design with collapsible navigation
- 🗄️ **Database Ready** - PostgreSQL with Supabase, migrations included
- 🔔 **Toast Notifications** - Built-in feedback system
- 🔧 **TypeScript** - Fully typed for better DX
- 🌙 **Dark Mode** - Automatic system preference detection
- 🎭 **User Management** - Built-in role management interface

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd foundation
npm install
```

### 2. Configure Environment

Create `.env` file with your **publishable (anon) key**:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

> 🔒 **No service role key needed!** This template uses RLS policies for security.

### 3. Setup Database

Run the SQL files in Supabase SQL Editor in order:

| File | Purpose |
|------|---------|
| `01_setup_tables.sql` | Creates tables and seed data |
| `02_setup_functions.sql` | Creates functions and auth hook |
| `03_setup_triggers.sql` | Creates auto-trigger on signup |
| `04_setup_rls.sql` | Enables RLS and policies |
| `05_setup_initial_user.sql` | Create first admin (see below) |

### 4. Create Initial Admin User (Bootstrap)

Since RLS policies restrict who can manage users, you need to manually create your first elevated user:

**Option A: Promote an existing user (Recommended)**
1. Register a new account at `/authentication` (this creates a user with 'user' role)
2. Go to Supabase Dashboard → SQL Editor
3. Run this query to promote to webmaster:
   ```sql
   -- Get the user ID first
   SELECT id, email FROM auth.users;
   
   -- Then promote them (replace with actual UUID)
   UPDATE public.user_roles 
   SET role = 'webmaster' 
   WHERE user_id = 'PASTE-UUID-HERE';
   ```
4. Log out and log back in to get the updated role in your JWT

**Option B: Use the provided SQL template**
See `supabase/05_setup_initial_user.sql` for complete SQL templates.

### 5. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000` and log in with your admin account 🎉

---

## 🎭 Role System

### Role Hierarchy

```
webmaster    ← Highest (can do everything)
   ↑
director     ← Can promote/demote admins
   ↑
admin        ← Read-only access to user management
   ↑
user         ← Basic user (default)
```

### Role Permissions

| Feature | User | Admin | Director | Webmaster |
|---------|------|-------|----------|-----------|
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ | ✅ |
| View all users | ❌ | ✅ | ✅ | ✅ |
| Assign `user` role | ❌ | ❌ | ✅ | ✅ |
| Assign `admin` role | ❌ | ❌ | ✅ | ✅ |
| Assign `director` role | ❌ | ❌ | ❌ | ✅ |
| Assign `webmaster` role | ❌ | ❌ | ❌ | ✅ |

### Role Colors

Roles are color-coded throughout the UI:

| Role | Color | Usage |
|------|-------|-------|
| `user` | Neutral | Badges, selects, indicators |
| `admin` | Success | Badges, selects, indicators |
| `director` | Warning | Badges, selects, indicators |
| `webmaster` | Error | Badges, selects, indicators |

---

## 🔒 Securing Pages

### Using Middleware

Add the `permissions` middleware to your page with role requirements:

#### Exact Role Match
```vue
<!-- Only webmasters can access -->
<script setup lang="ts">
definePageMeta({
  middleware: ["permissions"],
  role: "webmaster",
});
</script>
```

#### Minimum Role (Hierarchy)
```vue
<!-- Admin, Director, and Webmaster can access -->
<script setup lang="ts">
definePageMeta({
  middleware: ["permissions"],
  minRole: "admin",
});
</script>
```

#### Strictly Above Role
```vue
<!-- Only Director and Webmaster (not Admin) -->
<script setup lang="ts">
definePageMeta({
  middleware: ["permissions"],
  aboveRole: "admin",
});
</script>
```

### Global Auth Middleware

The `auth.global.ts` middleware runs on all routes and automatically redirects authenticated users away from auth pages (`/auth/login`, `/auth/register`, `/auth/forgot-password`) to the home page.

### Using Composables in Templates

```vue
<template>
  <div>
    <!-- Only show for webmasters -->
    <UButton v-if="isRole('webmaster')">
      Delete Database
    </UButton>

    <!-- Show for admin and above -->
    <UTable v-if="hasRole('admin')" :data="users" />

    <!-- Show for roles above admin (director, webmaster) -->
    <USelect v-if="isAbove('admin')" :items="roles" />
  </div>
</template>

<script setup lang="ts">
const { isRole, hasRole, isAbove } = useAuth();
</script>
```

### Securing API Endpoints

```typescript
// server/api/sensitive-data.get.ts
export default defineEventHandler(async (event) => {
  const currentUser = await serverSupabaseUser(event);
  const userRole = (currentUser as { user_role?: string }).user_role;

  // Check role
  if (userRole !== "webmaster") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden - Webmaster only",
    });
  }

  // Return sensitive data...
});
```

---

## 👥 User Role Management

The template includes a built-in `UserRoleManagement` component that provides a searchable table for viewing and managing user roles:

### Features
- **Search**: Filter users by email or name
- **View Roles**: See all users and their current roles
- **Edit Roles**: Directors and Webmasters can change roles via dropdown
- **Visual Indicators**: Color-coded role badges

### Usage
```vue
<template>
  <UserRoleManagement />
</template>
```

The component is already integrated into the `/authentication` page for testing.

---

## 🎨 Styling

### Nuxt UI Components

This template uses [**Nuxt UI**](https://ui.nuxt.com/) - a comprehensive UI library:

```vue
<template>
  <!-- Button with variants -->
  <UButton color="primary" variant="solid">Primary</UButton>
  <UButton color="error" variant="outline">Danger</UButton>

  <!-- Form inputs -->
  <UInput v-model="email" placeholder="Email" icon="i-lucide-mail" />
  <USelect v-model="role" :items="['user', 'admin']" />

  <!-- Feedback -->
  <UBadge color="success">Active</UBadge>
  <UToast />

  <!-- Layout -->
  <UPageHero title="Welcome" />
  <UTable :data="items" :columns="columns" />
</template>
```

### Tailwind CSS v4

This template uses Tailwind CSS v4 with the new `@theme` syntax:

```css
/* app/assets/css/main.css */
@theme static {
  /* Custom colors */
  --color-blue-500: #0055b8;
  --color-teal-500: #0d9488;
  
  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

### Custom Theme Features

- **Semantic Colors**: Primary (blue), Secondary (teal), Success, Info, Warning, Error, Neutral
- **Dark Mode**: Automatic switching with CSS variables
- **Transitions**: Smooth page and layout transitions
- **Utilities**: Gradient, glow, and glass morphism classes

```vue
<template>
  <!-- Gradient backgrounds -->
  <div class="gradient-primary">Primary gradient</div>
  <div class="gradient-primary-soft">Soft gradient</div>
  
  <!-- Glass morphism -->
  <div class="glass">Glass card</div>
  
  <!-- Glow effects -->
  <div class="glow-primary">Glowing element</div>
</template>
```

### Icons

Uses **Lucide** icons via Nuxt UI:

```vue
<UIcon name="i-lucide-shield" class="w-6 h-6" />
<UButton icon="i-lucide-plus">Add New</UButton>
```

---

## 📁 Project Structure

```
├── app/
│   ├── assets/           # Static assets
│   │   └── css/
│   │       └── main.css  # Custom theme with Tailwind v4
│   ├── components/       # Vue components (auto-imported)
│   │   └── UserRoleManagement.vue  # User management table
│   ├── composables/      # Vue composables (auto-imported)
│   │   └── useAuth.ts    # Authentication helper
│   ├── layouts/          # Layout components
│   │   └── default.vue   # Main layout with header
│   ├── middleware/       # Route middleware
│   │   ├── auth.global.ts      # Global auth checks
│   │   └── permissions.ts      # Role-based access
│   ├── pages/            # File-based routing
│   │   ├── index.vue           # Home page
│   │   ├── authentication.vue  # Auth management
│   │   ├── error.vue           # Error page (403, etc.)
│   │   ├── secAdmin.vue        # Admin-only page
│   │   ├── secDirector.vue     # Director+ page
│   │   ├── secWebmaster.vue    # Webmaster-only page
│   │   └── auth/               # Auth sub-pages
│   │       ├── login.vue
│   │       ├── register.vue
│   │       └── forgot-password.vue
│   ├── types/            # TypeScript types
│   │   ├── database.types.ts
│   │   └── index.ts      # AppRole type
│   └── app.vue           # App root
├── server/
│   └── api/              # API endpoints
│       └── users/
│           ├── allusers.get.ts
│           └── update-role.put.ts
├── supabase/             # Database setup
│   ├── 01_setup_tables.sql
│   ├── 02_setup_functions.sql
│   ├── 03_setup_triggers.sql
│   ├── 04_setup_rls.sql
│   └── 05_setup_initial_user.sql
├── nuxt.config.ts
└── package.json
```

---

## 🔑 Authentication Composable

The `useAuth()` composable provides reactive auth state:

```typescript
const {
  isAuthenticated,  // boolean - user logged in?
  userDisplayName,  // string - full name or email
  userAvatarUrl,    // string - avatar URL
  isRole,           // (role) => boolean - exact match
  hasRole,          // (minRole) => boolean - meets minimum
  isAbove,          // (role) => boolean - strictly above
  signIn,           // (email, password) => Promise
  signOut,          // () => Promise
  register,         // (email, password) => Promise
} = useAuth();
```

### Accessing User Data

```vue
<script setup lang="ts">
const user = useSupabaseUser();

// From custom JWT claims (set by auth hook)
const role = user.value?.user_role;           // 'admin', 'director', etc.
const metadata = user.value?.user_metadata;   // { first_name, last_name, avatar_url }

// Standard Supabase data
const email = user.value?.email;
const userId = user.value?.id;
</script>
```

---

## 🗄️ Database Schema

### Tables

**app_roles** - Role definitions
```sql
id          bigint PK
level       smallint    -- Hierarchy level
role        varchar     -- 'user', 'admin', etc.
role_display varchar    -- Human-readable name
```

**user_roles** - User assignments
```sql
id          bigint PK
user_id     uuid FK → auth.users
role        text FK → app_roles.role
```

**user_profiles** - Extended user data
```sql
id          bigint PK
user_id     uuid FK → auth.users
first_name  text
last_name   text
phone_number text
avatar_url  text
```

### Auto-Created on Signup

When a user registers, a trigger automatically:
1. Creates a profile in `user_profiles`
2. Assigns the `'user'` role in `user_roles`

---

## 🔌 API Endpoints

All API endpoints use **RLS-protected queries** - no service role key required!

| Endpoint | Method | Auth Required | Role | Description |
|----------|--------|---------------|------|-------------|
| `/api/users/allusers` | GET | ✅ | Admin+ | List all users (from RLS-protected tables) |
| `/api/users/update-role` | PUT | ✅ | Director+ | Update user role (enforced by RLS + API validation) |

### Security Architecture

```
Client → API Endpoint → Supabase Client (with user's JWT) → RLS Policy Check → Database
```

- API endpoints validate permissions for clear error messages
- RLS policies enforce security at the database level (defense in depth)
- No `SUPABASE_SERVICE_ROLE_KEY` required - keeps your app secure by default

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables

Only the **publishable (anon) key** is required - no service role key needed!

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

> **Security Note:** This template uses RLS policies and JWT-based authorization. No `SUPABASE_SERVICE_ROLE_KEY` is required, keeping your API secure by default.

> **Note:** Never commit your `.env` file. Use your hosting platform's environment variable system.

### Recommended Platforms

- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [Railway](https://railway.app)
- Self-hosted with Docker

---

## 📝 License

MIT License - feel free to use this template for your projects!

---

<p align="center">
  Built with ❤️ using <a href="https://nuxt.com">Nuxt</a> and <a href="https://supabase.com">Supabase</a>
</p>
