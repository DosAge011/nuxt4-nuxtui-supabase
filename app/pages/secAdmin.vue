<template>
  <div>
    <UPageHero title="Secure Admin Page" />
  </div>
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ["permissions"],
  minRole: "admin",
});
</script>
