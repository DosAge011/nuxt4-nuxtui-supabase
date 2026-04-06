<template>
  <div>
    <div class="flex flex-col gap-4 mb-4">
      <div>--{{ users.length }}</div>
      <div>
        <div class="text-lg font-bold">Authentication Status</div>
        <div class="ml-4">
          <div>
            Is Authenticated:
            <span
              :class="isAuthenticated ? 'text-green-500' : 'text-red-500'"
              >{{ isAuthenticated }}</span
            >
          </div>
          <div>
            Email:
            <span :class="user?.email ? 'text-green-500' : 'text-red-500'">{{
              user?.email ?? "N/A"
            }}</span>
          </div>
          <div>
            Role:
            <span
              :class="user?.user_role ? 'text-green-500' : 'text-red-500'"
              >{{ user?.user_role ?? "N/A" }}</span
            >
          </div>
          <div>
            <UCollapsible class="flex flex-col gap-2 w-96">
              <UButton
                label="View User Object"
                color="primary"
                variant="subtle"
                trailing-icon="i-lucide-chevron-down"
                block
              />
              <template #content>
                <pre class="ml-4">{{ user }}</pre>
              </template>
            </UCollapsible>
          </div>
        </div>
      </div>
      <div>
        <div class="text-lg font-bold">Change User</div>
        <div class="m-4">
          <USelect v-model="value" :items="items" class="w-48" />
          <UButton
            color="primary"
            @click="handleSignIn(emailMap[value] ?? '')"
            :loading="isSigningIn"
            >Sign In</UButton
          >
          <UButton
            color="error"
            @click="handleSignOut()"
            :loading="isSigningOut"
            class="ml-2"
            >Sign Out</UButton
          >
        </div>
        <div class="mt-4 ml-4">
          <UButton
            color="primary"
            @click="handleRegister(registerEmail)"
            :loading="isRegistering"
            >Register
          </UButton>
          <ClientOnly>
            <UInput
              color="neutral"
              variant="subtle"
              placeholder="email"
              v-model="registerEmail"
              class="ml-4"
            />
          </ClientOnly>
        </div>
        <!-- Only show Load Default Users for elevated roles -->
        <div v-if="hasRole('admin')" class="mt-4 ml-4">
          <UButton
            color="secondary"
            @click="addDefaultUsers"
            :loading="addingDefaultUsers"
            >Load Default Users</UButton
          >
        </div>
      </div>
      <!-- Only show Role Management for elevated roles -->
      <div v-if="hasRole('admin')">
        <div class="text-lg font-bold">Role Management</div>
        <div class="my-4 ml-4">
          <UInput
            v-model="searchQuery"
            placeholder="Search users..."
            icon="i-lucide-search"
            class="w-full max-w-md"
          />
        </div>
        <div v-if="filteredUsers.length > 0" class="m-4 w-220">
          <UTable :data="filteredUsers" :columns="userColumns">
            <template #role-cell="{ row }">
              <USelect
                v-model="row.original.user_role"
                :items="roleOptions"
                size="sm"
                class="w-32"
                @update:model-value="
                  (newRole) => updateUserRole(row.original.id, newRole)
                "
              />
            </template>
          </UTable>
        </div>
        <div
          v-else-if="!loadingUsers && users.length === 0"
          class="text-neutral text-sm"
        >
          No users found. Click "Load Default Users" to seed test data.
        </div>
        <div v-else-if="!loadingUsers" class="text-neutral text-sm">
          No users found matching "{{ searchQuery }}"
        </div>
      </div>
      <!-- Show message for regular users -->
      <div
        v-else
        class="mt-4 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
      >
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          <UIcon name="i-lucide-lock" class="w-4 h-4 inline mr-1" />
          Role management requires admin, director, or webmaster permissions.
        </p>
        <p v-if="!isAuthenticated" class="text-xs text-neutral-500 mt-2">
          <strong>Bootstrap:</strong> Register an account, then run the SQL in
          <code>05_setup_initial_user.sql</code> to promote yourself to admin.
        </p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const { isAuthenticated, signIn, signOut, register, hasRole } = useAuth();

const toast = useToast();

const user = useSupabaseUser();

const isSigningIn = ref(false);
const isRegistering = ref(false);
const isSigningOut = ref(false);
const addingDefaultUsers = ref(false);

const users = ref<Array<{ id: string; email: string; user_role: string }>>([]);
const loadingUsers = ref(false);
const searchQuery = ref("");

const addDefaultUsers = async () => {
  addingDefaultUsers.value = true;
  const defaultUsers = [
    { email: "user@user.com", role: "user" },
    { email: "admin@admin.com", role: "admin" },
    { email: "director@director.com", role: "director" },
    { email: "webmaster@webmaster.com", role: "webmaster" },
  ];

  const results = await Promise.allSettled(
    defaultUsers.map((user) =>
      register(user.email, "password")
        .then(() => ({ email: user.email, success: true }))
        .catch((error) => {
          // Ignore "User already exists" errors
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (
            errorMessage.toLowerCase().includes("user already registered") ||
            errorMessage.toLowerCase().includes("user already exists")
          ) {
            return { email: user.email, success: true, skipped: true };
          }
          throw { email: user.email, error: errorMessage };
        }),
    ),
  );

  const failures = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => r.reason);

  const succeeded = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
    .map((r) => r.value);

  if (failures.length > 0) {
    toast.add({
      title: "Failed to Add Some Users",
      description: failures.map((f) => `${f.email}: ${f.error}`).join("; "),
      icon: "i-lucide-x",
      color: "error",
    });
  } else {
    toast.add({
      title: "Default Users Added",
      description: `${succeeded.length} users processed (some may have already existed).`,
      icon: "i-lucide-check",
      color: "success",
    });
  }

  // Always try to refresh the user list, but don't fail if permissions don't allow it
  try {
    await fetchUsers();
  } catch (fetchError) {
    console.warn("Could not refresh user list:", fetchError);
    // Don't show error toast for fetch failure - user creation might still have succeeded
  }

  addingDefaultUsers.value = false;
};

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(
    (user) =>
      user.id.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.user_role.toLowerCase().includes(query),
  );
});

const fetchUsers = async () => {
  loadingUsers.value = true;
  try {
    const response = await $fetch<{
      status: string;
      data: Array<{ id: string; email: string; user_role: string }>;
    }>("/api/users/allusers", {
      method: "GET",
    });
    users.value = response.data.map((user) => ({
      id: user.id,
      email: user.email,
      user_role: user.user_role || "N/A",
    }));
    console.log(`Loaded ${users.value.length} users`);
  } catch (error: any) {
    const statusCode = error.statusCode || error.status;
    const statusMessage = error.statusMessage || error.message;
    console.error("Fetch users error:", error);

    // Only show toast for non-permission errors (permission errors are expected for non-admin users)
    if (statusCode !== 403) {
      toast.add({
        title: "Failed to Load Users",
        description: `${statusMessage || "Unknown error"} (Code: ${statusCode || "unknown"})`,
        icon: "i-lucide-x",
        color: "error",
      });
    }
  } finally {
    loadingUsers.value = false;
  }
};

const roleOptions = ["user", "admin", "director", "webmaster"];

const userColumns = [
  { accessorKey: "id", header: "User ID", enableSorting: true },
  { accessorKey: "email", header: "Email", enableSorting: true },
  { id: "role", header: "Role", enableSorting: true, cell: "role" },
];

// Fetch users automatically when page loads
onMounted(() => {
  // fetchUsers();
});

const updateUserRole = async (userId: string, newRole: string) => {
  try {
    await $fetch("/api/users/update-role", {
      method: "PUT",
      body: {
        userId,
        role: newRole,
      },
    });
    toast.add({
      title: "Role Updated",
      description: `User role updated to ${newRole}`,
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Failed to Update Role",
      description: error instanceof Error ? error.message : String(error),
      icon: "i-lucide-x",
      color: "error",
    });
    // Refresh to get the actual current role
    await fetchUsers();
  }
};

const registerEmail = ref("");

const items = ref(["User", "Admin", "Director", "Webmaster"]);
const value = ref("Admin");

const emailMap: Record<string, string> = {
  User: "user@user.com",
  Admin: "admin@admin.com",
  Director: "director@director.com",
  Webmaster: "webmaster@webmaster.com",
};

//PASSWORD IS HARDCODED FOR DEMO PURPOSES ONLY. DO NOT USE THIS APPROACH IN PRODUCTION.
const handleSignIn = async (email: string) => {
  isSigningIn.value = true;
  console.log(`Attempting to sign in as ${email}...`);
  try {
    await signIn(email, "password");
  } catch (error) {
    toast.add({
      title: "Login Failed",
      description: error instanceof Error ? error.message : String(error),
      icon: "i-lucide-x",
      color: "error",
    });
  } finally {
    isSigningIn.value = false;
  }
};

const handleSignOut = async () => {
  isSigningOut.value = true;
  try {
    await signOut();
    toast.add({
      title: "Logout Successful",
      description: "You have been logged out.",
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Logout Failed",
      description: error instanceof Error ? error.message : String(error),
      icon: "i-lucide-x",
      color: "error",
    });
  } finally {
    isSigningOut.value = false;
  }
};

const handleRegister = async (email: string) => {
  isRegistering.value = true;
  try {
    await register(email, "password");
    toast.add({
      title: "Registration Successful",
      description: "Your account has been created and you are now logged in.",
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Registration Failed",
      description: error instanceof Error ? error.message : String(error),
      icon: "i-lucide-x",
      color: "error",
    });
  } finally {
    isRegistering.value = false;
  }
};
</script>
