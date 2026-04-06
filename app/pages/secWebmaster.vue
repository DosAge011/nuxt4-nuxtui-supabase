<template>
  <div>
    <UPageHero title="Secure Webmaster Page" />
  </div>
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ["permissions"],
  minRole: "webmaster",
});
</script>
