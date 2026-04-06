<template>
  <div>
    <div class="bg-sky-800 rounded-lg">
      <ClientOnly>
        <UFormField label="Search Users" class="ml-4 pt-2">
          <UInput v-model="searchQuery" placeholder="Search by email or name" />
        </UFormField>
        <UTable :data="filteredUserData" :columns="columns" class="max-w-180" />
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file UserRoleManagement.vue
 * 
 * User Role Management Component
 * 
 * A searchable data table for viewing and managing user roles.
 * Displays all users with their profile information and current roles.
 * 
 * **Features:**
 * - Search/filter users by email or name
 * - View all users and their current roles
 * - Edit roles via dropdown (for authorized users only)
 * - Color-coded role badges (neutral, success, warning, error)
 * - Optimistic updates with rollback on API errors
 * 
 * **Permission Levels:**
 * - `user` / `admin`: View-only (see role badges)
 * - `director`: Can assign 'user' or 'admin' roles
 * - `webmaster`: Can assign any role
 * 
 * @example
 * ```vue
 * <template>
 *   <UserRoleManagement />
 * </template>
 * ```
 */

import type { TableColumn } from "@nuxt/ui";
import { h, resolveComponent, defineComponent, ref, computed } from "vue";

/**
 * User data structure returned by the API and displayed in the table.
 */
type UserData = {
  /** Unique user ID (UUID from auth.users) */
  id: string;
  /** User's email address */
  email: string;
  /** Optional first name from user_profiles */
  first_name?: string | null;
  /** Optional last name from user_profiles */
  last_name?: string | null;
  /** Current role: 'user', 'admin', 'director', or 'webmaster' */
  user_role: string;
  /** Optional phone number from user_profiles */
  phone_number?: string | null;
  /** Optional avatar URL from user_profiles */
  avatar_url?: string | null;
};

/** Current authenticated user with custom claims */
const user = useSupabaseUser();

/** Toast notification utility for success/error feedback */
const toast = useToast();

/** Array of all users fetched from the API */
const userData = ref<UserData[]>();

/** Search query string for filtering users */
const searchQuery = ref("");

/**
 * Update a user's role via API with optimistic updates and rollback on error.
 * 
 * **Optimistic Update Flow:**
 * 1. Immediately update local state for responsive UI
 * 2. Make API request to persist change
 * 3. On success: show success toast
 * 4. On error: rollback local state, show error toast, re-throw error
 * 
 * @param userId - The UUID of the user to update
 * @param newRole - The new role to assign ('user', 'admin', 'director', 'webmaster')
 * @param originalRole - The original role for rollback if the API fails
 * @returns Promise that resolves when update is complete
 * @throws Error if user not found or API call fails
 */
const updateUserRole = async (userId: string, newRole: string, originalRole: string): Promise<void> => {
  // Optimistically update local state
  const userIndex = userData.value?.findIndex((u) => u.id === userId);
  if (userIndex === undefined || userIndex < 0) {
    throw new Error("User not found in local data");
  }
  
  // Apply optimistic update
  userData.value![userIndex]!.user_role = newRole;

  try {
    await $fetch("/api/users/update-role", {
      method: "PUT",
      body: { userId, role: newRole },
    });
    
    toast.add({
      title: "Role Updated",
      description: `User role updated to ${newRole}`,
      color: "success",
    });
  } catch (error: any) {
    // Rollback on error
    userData.value![userIndex]!.user_role = originalRole;
    
    toast.add({
      title: "Error updating role",
      description: error.statusMessage || "An error occurred while updating the user role.",
      color: "error",
    });
    
    throw error; // Re-throw so caller can handle if needed
  }
};

/**
 * Computed filtered user data based on search query.
 * Searches across first_name, last_name, and email fields (case-insensitive).
 */
const filteredUserData = computed(() => {
  if (!userData.value) return [];
  if (!searchQuery.value.trim()) return userData.value;

  const query = searchQuery.value.toLowerCase();
  return userData.value.filter((user) => {
    const firstName = user.first_name?.toLowerCase() ?? "";
    const lastName = user.last_name?.toLowerCase() ?? "";
    const email = user.email.toLowerCase();

    return (
      firstName.includes(query) ||
      lastName.includes(query) ||
      email.includes(query)
    );
  });
});

/**
 * Fetch all users from the protected API endpoint.
 * Populates the userData ref with enriched user information.
 */
const getUserData = async () => {
  try {
    const { data, error } = await useFetch("/api/users/allusers", {
      method: "GET",
    });

    if (!error.value && data.value) {
      userData.value = data.value.data as unknown as UserData[];
    }

    if (error.value) {
      console.error("Error fetching users:", error.value);
    }
  } catch (err) {
    console.error("Error fetching users:", err);
  }
};

/** Watch for authentication state changes to load/clear user data */
watch(
  user,
  async (newUser, _) => {
    if (newUser) {
      await getUserData();
    } else {
      userData.value = [];
    }
  },
  { immediate: true },
);

/**
 * Internal component for editable role select dropdown.
 * 
 * Renders a USelect with color-coded options. Watches for external
 * role changes (e.g., rollback on error) to keep UI in sync.
 * 
 * @component
 * @prop {string} role - Current role value
 * @prop {string} userId - User ID for logging
 * @prop {Function} onUpdate - Callback when role is changed
 */
const RoleSelectCell = defineComponent({
  props: {
    role: { type: String, required: true },
    userId: { type: String, required: true },
    onUpdate: { type: Function, required: true },
  },
  setup(props) {
    /** Internal reactive selected role */
    const selectedRole = ref(props.role);
    const USelect = resolveComponent("USelect");
    
    /** Available role options for the select dropdown */
    const options = ["user", "admin", "director", "webmaster"];

    /** Watch for external changes to role prop (e.g., revert on error) */
    watch(() => props.role, (newRole) => {
      selectedRole.value = newRole;
    });

    /** Computed color based on selected role for visual feedback */
    const color = computed(() => {
      const colors: Record<string, string> = {
        user: "neutral",
        admin: "success",
        director: "warning",
        webmaster: "error",
      };
      return colors[selectedRole.value] ?? "neutral";
    });

    return () =>
      h(USelect, {
        items: options,
        class: "capitalize w-48",
        color: color.value,
        modelValue: selectedRole.value,
        "onUpdate:modelValue": (newRole: string) => {
          selectedRole.value = newRole;
          props.onUpdate(newRole);
          console.log(`Updating role for user ${props.userId} to ${newRole}`);
        },
      });
  },
});

/**
 * Table column definitions for UTable.
 * 
 * The 'user_role' column renders differently based on permissions:
 * - Users with 'user' or 'admin' role see read-only UBadge
 * - Users with 'director' or 'webmaster' see editable RoleSelectCell
 */
const columns: TableColumn<UserData>[] = [
  {
    accessorKey: "first_name",
    header: "First Name",
    meta: {
      class: {
        th: "text-center font-semibold",
        td: "text-end font-mono text-white/80",
      },
    },
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
    meta: {
      class: {
        th: "text-center",
        td: "text-end font-mono text-white/80",
      },
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    meta: {
      class: {
        th: "text-center font-semibold",
        td: "text-end font-mono text-white/80",
      },
    },
  },
  {
    accessorKey: "user_role",
    header: "Role",
    cell: ({ row }) => {
      const UBadge = resolveComponent("UBadge");
      const color = {
        user: "neutral" as const,
        admin: "success" as const,
        director: "warning" as const,
        webmaster: "error" as const,
      }[row.getValue("user_role") as string];

      // Users with 'user' or 'admin' role can only view badges
      if (
        user.value?.user_role === "user" ||
        user.value?.user_role === "admin"
      ) {
        return h(
          UBadge,
          { class: "capitalize", variant: "subtle", color: color },
          () => row.getValue("user_role"),
        );
      }

      // Director and webmaster can edit roles - use a wrapper component for reactivity
      const currentRole = row.getValue("user_role") as string;
      
      return h(RoleSelectCell, {
        role: currentRole,
        userId: row.original.id,
        onUpdate: (newRole: string) => updateUserRole(row.original.id, newRole, currentRole),
      });
    },
  },
];
</script>
