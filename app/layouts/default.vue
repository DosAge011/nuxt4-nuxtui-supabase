<template>
  <div>
    <div>
      <UHeader
        :toggle="{
          color: 'primary',
          variant: 'subtle',
          class: 'rounded-full',
        }"
      >
        <template #title>
          <div class="text-lg font-medium">Nuxt 4 / Supabase Template</div>
        </template>

        <UNavigationMenu :items="items" />
        <template #right>
          <ClientOnly>
            <UColorModeButton />
          </ClientOnly>
          <div v-if="isAuthenticated">
            <UUser
              :name="userDisplayName ?? 'Unknown User'"
              :avatar="{
                src: userAvatarUrl ?? '',
                loading: 'lazy',
                icon: 'i-lucide-image',
              }"
            >
              <template #description>
                <UBadge size="sm" variant="soft" :color="getBadgeColor">{{
                  user?.user_role ?? "Unknown Role"
                }}</UBadge>
              </template>
            </UUser>
          </div>
          <div v-else>
            <UButton
              color="primary"
              variant="outline"
              size="sm"
              to="/authentication"
              >Login</UButton
            >
          </div>
        </template>
        <template #body>
          <UNavigationMenu
            :items="items"
            orientation="vertical"
            class="-mx-2.5"
          />
        </template>
      </UHeader>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

/** Current route object for active navigation state */
const route = useRoute();

/** Auth composable for authentication state and user info */
const { isAuthenticated, userDisplayName, userAvatarUrl } = useAuth();

/** Current Supabase user with custom claims (user_role, user_metadata) */
const user = useSupabaseUser();

/**
 * Computed navigation menu items.
 * Updates active state based on current route.
 */
const items = computed<NavigationMenuItem[]>(() => [
  {
    label: "Home",
    to: "/",
    icon: "i-lucide-home",
    active: route.path === "/",
  },
  {
    label: "Authentication",
    to: "/authentication",
    icon: "i-lucide-key",
    active: route.path.startsWith("/authentication"),
  },
  {
    label: "Secure Pages",
    icon: "i-lucide-shield",
    active: route.path.startsWith("/secAdmin"),
    children: [
      {
        label: "Admin",
        to: "/secAdmin",
        icon: "i-lucide-shield",
        active: route.path.startsWith("/secAdmin"),
      },
      {
        label: "Director",
        to: "/secDirector",
        icon: "i-lucide-shield-check",
        active: route.path.startsWith("/secDirector"),
      },
      {
        label: "Webmaster",
        to: "/secWebmaster",
        icon: "i-lucide-shield-alert",
        active: route.path.startsWith("/secWebmaster"),
      },
    ],
  },
]);

/**
 * Computed badge color based on user's role.
 * Maps roles to semantic colors: admin (success), director (warning), webmaster (error), user (neutral)
 */
const getBadgeColor = computed(() => {
  const userRole = (user.value as any)?.user_role;
  if (!userRole) return "neutral";
  switch (userRole) {
    case "admin":
      return "success";
    case "director":
      return "warning";
    case "webmaster":
      return "error";
    default:
      return "neutral";
  }
});
</script>
