-- ============================================
-- RLS POLICIES
-- ============================================

-- ============================================
-- app_roles RLS POLICIES
-- ============================================

-- Enable RLS on app_roles
alter table public.app_roles enable row level security;

-- Drop existing policies before creating (allows re-running this script)
drop policy if exists "Anyone can read app_roles" on public.app_roles;
drop policy if exists "Webmasters can insert roles" on public.app_roles;
drop policy if exists "Webmasters can update roles" on public.app_roles;
drop policy if exists "Webmasters can delete roles" on public.app_roles;

-- Policy: Anyone can read app_roles (reference data)
create policy "Anyone can read app_roles"
  on public.app_roles
  for select
  to authenticated, anon
  using (true);

-- Policy: Only webmasters can insert new roles
create policy "Webmasters can insert roles"
  on public.app_roles
  for insert
  to authenticated
  with check (
    public.current_user_role() = 'webmaster'
  );

-- Policy: Only webmasters can update roles
create policy "Webmasters can update roles"
  on public.app_roles
  for update
  to authenticated
  using (
    public.current_user_role() = 'webmaster'
  )
  with check (
    public.current_user_role() = 'webmaster'
  );

-- Policy: Only webmasters can delete roles
create policy "Webmasters can delete roles"
  on public.app_roles
  for delete
  to authenticated
  using (
    public.current_user_role() = 'webmaster'
  );

-- Grant permissions
grant select on public.app_roles to authenticated, anon;
grant insert, update, delete on public.app_roles to authenticated;
grant usage on sequence app_roles_id_seq to authenticated;


-- ============================================
-- user_roles RLS POLICIES
-- ============================================

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Drop existing policies before creating (allows re-running this script)

-- SELECT policies
drop policy if exists "Admins can view roles" on public.user_roles;
drop policy if exists "Directors can view roles" on public.user_roles;
drop policy if exists "Webmasters can view roles" on public.user_roles;

-- INSERT policies
drop policy if exists "Directors can assign admin or user roles only" on public.user_roles;
drop policy if exists "Webmasters can assign any role" on public.user_roles;

-- UPDATE policies
drop policy if exists "Directors can update between admin and user roles only" on public.user_roles;
drop policy if exists "Webmasters can update any role" on public.user_roles;

-- DELETE policies
drop policy if exists "Directors can delete admin or user roles only" on public.user_roles;
drop policy if exists "Webmasters can delete any role" on public.user_roles;

-- ============================================
-- SELECT POLICIES
-- ============================================

-- Policy: Admins can view all roles (read-only)
create policy "Admins can view roles"
  on public.user_roles
  for select
  to authenticated
  using (
    public.current_user_role() = 'admin'
  );

-- Policy: Directors can view all roles
create policy "Directors can view roles"
  on public.user_roles
  for select
  to authenticated
  using (
    public.current_user_role() = 'director'
  );

-- Policy: Webmasters can view all roles
create policy "Webmasters can view roles"
  on public.user_roles
  for select
  to authenticated
  using (
    public.current_user_role() = 'webmaster'
  );

-- ============================================
-- INSERT POLICIES (Assign roles)
-- ============================================

-- Policy: Directors can assign 'admin' or 'user' roles only
create policy "Directors can assign admin or user roles only"
  on public.user_roles
  for insert
  to authenticated
  with check (
    public.current_user_role() = 'director'
    and role in ('admin', 'user')
  );

-- Policy: Webmasters can assign ANY role
create policy "Webmasters can assign any role"
  on public.user_roles
  for insert
  to authenticated
  with check (
    public.current_user_role() = 'webmaster'
  );

-- ============================================
-- UPDATE POLICIES (Modify roles)
-- ============================================

-- Policy: Directors can change roles between 'admin' and 'user' only
-- They can promote user->admin and demote admin->user
create policy "Directors can update between admin and user roles only"
  on public.user_roles
  for update
  to authenticated
  using (
    public.current_user_role() = 'director'
    and role in ('admin', 'user')  -- Can only modify users who are admin or user
  )
  with check (
    public.current_user_role() = 'director'
    and role in ('admin', 'user')  -- Can only set role to admin or user
  );

-- Policy: Webmasters can update ANY role
create policy "Webmasters can update any role"
  on public.user_roles
  for update
  to authenticated
  using (
    public.current_user_role() = 'webmaster'
  )
  with check (
    public.current_user_role() = 'webmaster'
  );

-- ============================================
-- DELETE POLICIES
-- ============================================

-- Policy: Directors can delete admin or user role assignments
create policy "Directors can delete admin or user roles only"
  on public.user_roles
  for delete
  to authenticated
  using (
    public.current_user_role() = 'director'
    and role in ('admin', 'user')
  );

-- Policy: Webmasters can delete any role
create policy "Webmasters can delete any role"
  on public.user_roles
  for delete
  to authenticated
  using (
    public.current_user_role() = 'webmaster'
  );

-- Grant permissions to authenticated users
grant select on public.user_roles to authenticated;
grant insert, update, delete on public.user_roles to authenticated;
grant usage on sequence user_roles_id_seq to authenticated;


-- ============================================
-- user_profiles RLS POLICIES
-- ============================================

-- Enable RLS on user_profiles
alter table public.user_profiles enable row level security;

-- Drop existing policies before creating (allows re-running this script)
drop policy if exists "Users can read own profile, elevated roles can read all" on public.user_profiles;
drop policy if exists "Users can update own profile, elevated roles can update all" on public.user_profiles;
drop policy if exists "Elevated roles can delete any profile" on public.user_profiles;
drop policy if exists "Elevated roles can insert profiles" on public.user_profiles;

-- Policy: Users can read their own profile
-- Elevated roles can read all profiles
create policy "Users can read own profile, elevated roles can read all"
  on public.user_profiles
  for select
  to authenticated
  using (
    auth.uid() = user_id 
    or public.has_elevated_role()
  );

-- Policy: Users can update their own profile
-- Elevated roles can update all profiles
create policy "Users can update own profile, elevated roles can update all"
  on public.user_profiles
  for update
  to authenticated
  using (
    auth.uid() = user_id 
    or public.has_elevated_role()
  )
  with check (
    auth.uid() = user_id 
    or public.has_elevated_role()
  );

-- Policy: Elevated roles can delete any profile
create policy "Elevated roles can delete any profile"
  on public.user_profiles
  for delete
  to authenticated
  using (
    public.has_elevated_role()
  );

-- Policy: Elevated roles can insert profiles
-- (Regular users typically create their own via trigger or sign-up flow)
create policy "Elevated roles can insert profiles"
  on public.user_profiles
  for insert
  to authenticated
  with check (
    public.has_elevated_role()
    or auth.uid() = user_id  -- Allow users to create their own profile
  );

-- Grant permissions to authenticated users
grant select, insert, update, delete on public.user_profiles to authenticated;
grant usage on sequence user_profiles_id_seq to authenticated;
