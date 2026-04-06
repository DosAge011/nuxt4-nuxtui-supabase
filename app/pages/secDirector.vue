<template>
  <div>
    <UPageHero title="Secure Director Page" />
  </div>
</template>

<script setup lang="ts">
/**
 * Secure Director Page
 * 
 * Protected page accessible only to users with 'director' role or higher.
 * Demonstrates role-based access control using the permissions middleware.
 * 
 * **Access Level:** Director, Webmaster
 * 
 * @middleware permissions - Checks for minRole: 'director'
 */
definePageMeta({
  middleware: ["permissions"],
  minRole: "director",
});
</script>
