<template>
  <div class="p-4">
    <div class="text-lg font-extrabold">Authentication Test Page</div>
    <USeparator color="primary" class="my-4"
      >Authenticated User Details</USeparator
    >
    <div class="flex">
      <div class="details">isAuthenticated :</div>
      <div
        class="ml-2"
        :class="isAuthenticated ? 'text-success' : 'text-error'"
      >
        {{ isAuthenticated }}
      </div>
    </div>
    <div class="flex">
      <div class="details">UUID :</div>
      <div
        class="ml-2"
        :class="user && user.sub ? 'text-success' : 'text-error'"
      >
        {{ user && user.sub ? user.sub : "N/A" }}
      </div>
    </div>
    <div class="flex">
      <div class="details">Email :</div>
      <div
        class="ml-2"
        :class="user && user.email ? 'text-success' : 'text-error'"
      >
        {{ user && user.email ? user.email : "N/A" }}
      </div>
    </div>
    <div class="flex">
      <div class="details">User Role :</div>
      <div
        class="ml-2"
        :class="user && user.user_role ? 'text-success' : 'text-error'"
      >
        {{ user && user.user_role ? user.user_role : "N/A" }}
      </div>
    </div>
    <USeparator color="primary" class="my-4">Authentication Actions</USeparator>
    <div class="flex">
      <ClientOnly>
        <UFormField label="Email">
          <UInput v-model="email" placeholder="Enter your email" />
        </UFormField>
        <UFormField label="Password">
          <UInput
            v-model="password"
            type="password"
            placeholder="Enter your password"
          />
        </UFormField>
      </ClientOnly>
    </div>
    <div class="mt-4">
      <UButton color="primary" class="mr-2" @click="signIn(email, password)"
        >Login</UButton
      >
      <UButton color="error" class="mr-2" @click="signOut">Logout</UButton>
    </div>
    <USeparator color="primary" class="my-4">User Management</USeparator>
    <div>
      <UserRoleManagement v-if="isAuthenticated" />
      <div v-else class="text-error mt-2">
        Please log in to view user management features.
      </div>
    </div>
    <USeparator color="primary" class="my-4">Raw Data</USeparator>
    <pre></pre>
    <UCollapsible class="flex flex-col gap-2 w-120">
      <UButton
        class="group"
        label="Show Current User Object"
        color="neutral"
        variant="subtle"
        trailing-icon="i-lucide-chevron-down"
        :ui="{
          trailingIcon:
            'group-data-[state=open]:rotate-180 transition-transform duration-200',
        }"
        block
      />

      <template #content>
        <pre>{{ user }}</pre>
      </template>
    </UCollapsible>
  </div>
</template>

<script setup lang="ts">
/**
 * Authentication Test Page
 *
 * A comprehensive demo and testing interface for the authentication system.
 * Displays real-time auth state, provides login/logout functionality,
 * and includes the UserRoleManagement component for role-based testing.
 *
 * @see {@link ~/components/UserRoleManagement.vue} for user management table
 */

/** Auth composable for signIn/signOut and isAuthenticated state */
const { isAuthenticated, signIn, signOut } = useAuth();

/** Current Supabase user with custom JWT claims (user_role, user_metadata) */
const user = useSupabaseUser();

/** Toast notification utility */
const toast = useToast();

/** Email input for login form (pre-filled with demo account) */
const email = ref("webmaster@webmaster.com");

/** Password input for login form (pre-filled with demo password) */
const password = ref("password");

/**
 * Display a toast notification.
 * @param title - Toast title
 * @param description - Toast description/message
 * @param type - Toast type: 'success' or 'error'
 */
const showToast = (
  title: string,
  description: string,
  type: "success" | "error" = "success",
) => {
  toast.add({
    title: title,
    description: description,
    icon: type === "success" ? "i-lucide-check" : "i-lucide-circle-alert",
    color: type === "success" ? "success" : "error",
  });
};
</script>

<style lang="css" scoped>
.details {
  width: 160px;
  text-align: end;
}
</style>
