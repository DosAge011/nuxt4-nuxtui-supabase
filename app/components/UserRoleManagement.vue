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
import type { TableColumn } from "@nuxt/ui";

import { h, resolveComponent, defineComponent, ref, computed } from "vue";
type UserData = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  user_role: string;
  phone_number?: string | null;
  avatar_url?: string | null;
};

const user = useSupabaseUser();
const toast = useToast();
const userData = ref<UserData[]>();
const searchQuery = ref("");

// Filtered user data based on search query
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

// Separate component for role select to maintain proper reactivity
const RoleSelectCell = defineComponent({
  props: {
    role: { type: String, required: true },
    userId: { type: String, required: true },
    onUpdate: { type: Function, required: true },
  },
  setup(props) {
    const selectedRole = ref(props.role);
    const USelect = resolveComponent("USelect");
    const options = ["user", "admin", "director", "webmaster"];

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
      return h(RoleSelectCell, {
        role: row.getValue("user_role") as string,
        userId: row.original.id,
        onUpdate: async (newRole: string) => {
          // Update local data
          const userIndex = userData.value?.findIndex(
            (u) => u.id === row.original.id,
          );
          if (userIndex !== undefined && userIndex >= 0) {
            userData.value![userIndex]!.user_role = newRole;
          }
          await $fetch("/api/users/update-role", {
            method: "PUT",
            body: {
              userId: row.original.id,
              role: newRole,
            },
          })
            .catch((error) => {
              toast.add({
                title: "Error updating role",
                description: "An unexpected error occurred.",
                color: "error",
              });
            })
            .then(() => {
              toast.add({
                title: "Role Updated",
                description: `User role updated to ${newRole}`,
                color: "success",
              });
            });
        },
      });
    },
  },
];
</script>
