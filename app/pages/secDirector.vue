<template>
  <div>
    <UPageHero title="Secure Director Page" />
  </div>
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ["permissions"],
  minRole: "director",
});
</script>
