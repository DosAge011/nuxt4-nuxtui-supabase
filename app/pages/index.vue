<template>
  <div>
    <div>Main Page</div>
    <div>{{ isAuthenticated ? "Logged In" : "Not Logged In" }}</div>
  </div>
</template>
<script setup lang="ts">
const { isAuthenticated } = useAuth();
</script>
