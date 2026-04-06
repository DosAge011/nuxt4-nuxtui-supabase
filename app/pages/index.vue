<template>
  <div>
    <div>Main Page</div>
    <div>{{ isAuthenticated ? "Logged In" : "Not Logged In" }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * Home Page
 * 
 * The main landing page of the application.
 * Displays a simple authentication status indicator.
 */

/** Auth composable for authentication state */
const { isAuthenticated } = useAuth();
</script>
