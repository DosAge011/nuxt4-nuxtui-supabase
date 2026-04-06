<template>
  <div>
    <UPageHero title="Secure Webmaster Page" />
  </div>
</template>

<script setup lang="ts">
/**
 * Secure Webmaster Page
 * 
 * Protected page accessible only to users with 'webmaster' role.
 * Demonstrates role-based access control using the permissions middleware.
 * 
 * **Access Level:** Webmaster only
 * 
 * @middleware permissions - Checks for minRole: 'webmaster'
 */
definePageMeta({
  middleware: ["permissions"],
  minRole: "webmaster",
});
</script>
