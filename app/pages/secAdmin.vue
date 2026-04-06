<template>
  <div>
    <UPageHero title="Secure Admin Page" />
  </div>
</template>

<script setup lang="ts">
/**
 * Secure Admin Page
 * 
 * Protected page accessible only to users with 'admin' role or higher.
 * Demonstrates role-based access control using the permissions middleware.
 * 
 * **Access Level:** Admin, Director, Webmaster
 * 
 * @middleware permissions - Checks for minRole: 'admin'
 */
definePageMeta({
  middleware: ["permissions"],
  minRole: "admin",
});
</script>
