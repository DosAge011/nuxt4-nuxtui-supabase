-- ============================================
-- FUNCTIONS
-- ============================================

-- ============================================
-- Auth Hook: Enrich JWT with user role and metadata
-- ============================================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
SECURITY DEFINER
stable
as $$
  declare
    claims jsonb;
    user_role text;
    user_metadata jsonb;
  begin
    -- Fetch the user role from user_roles table
    select role into user_role 
    from public.user_roles 
    where user_id = (event->>'user_id')::uuid;

    -- Fetch specific profile fields for user_metadata
    select jsonb_build_object(
      'first_name', first_name,
      'last_name', last_name,
      'phone_number', phone_number,
      'avatar_url', avatar_url
    ) into user_metadata
    from public.user_profiles
    where user_id = (event->>'user_id')::uuid;

    claims := event->'claims';

    -- Add user_role to claims
    if user_role is not null then
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    else
      claims := jsonb_set(claims, '{user_role}', 'null'::jsonb);
    end if;

    -- Add user_metadata to claims
    if user_metadata is not null then
      claims := jsonb_set(claims, '{user_metadata}', user_metadata);
    else
      claims := jsonb_set(claims, '{user_metadata}', '{}'::jsonb);
    end if;

    -- Update the 'claims' object in the original event
    event := jsonb_set(event, '{claims}', claims);

    return event;
  end;
$$;

-- Grant auth admin permissions
grant usage on schema public to supabase_auth_admin;

grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon, public;

grant all
  on table public.user_roles
  to supabase_auth_admin;

revoke all
  on table public.user_roles
  from authenticated, anon, public;

-- Allow auth admin to read user roles for the hook
drop policy if exists "Allow auth admin to read user roles" on public.user_roles;

create policy "Allow auth admin to read user roles" 
  ON public.user_roles
  as permissive for select
  to supabase_auth_admin
  using (true);

-- ============================================
-- Helper: Get current user's role from JWT
-- ============================================
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
as $$
  select auth.jwt()->>'user_role';
$$;

-- ============================================
-- Helper: Check if user has elevated role
-- ============================================
create or replace function public.has_elevated_role()
returns boolean
language sql
stable
security definer
as $$
  select coalesce(
    auth.jwt()->>'user_role' in ('admin', 'director', 'webmaster'),
    false
  );
$$;

-- ============================================
-- Trigger Function: Create user profile and role on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Create user profile with email
  insert into public.user_profiles (user_id, email)
  values (new.id, new.email);
  
  -- Assign default 'user' role
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
end;
$$;

-- Grant necessary permissions for trigger function
grant execute on function public.handle_new_user() to supabase_auth_admin;
