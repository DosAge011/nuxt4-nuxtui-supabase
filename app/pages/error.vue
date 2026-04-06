<script setup lang="ts">
/**
 * Error Display Page
 * 
 * Displays error information passed via query parameters.
 * Used by the permissions middleware to show 403 Forbidden errors
 * and other access denial messages.
 * 
 * Query Parameters:
 * - `status`: HTTP status code or error code (default: "Error")
 * - `message`: Human-readable error message (default: "An unexpected error occurred")
 * 
 * @example
 * ```
 * /error?status=403&message=Forbidden+-+Invalid+role
 * ```
 */

/** Current route to access query parameters */
const route = useRoute();

/** Router instance for navigation */
const router = useRouter();

/** Computed error status code from query params */
const statusCode = computed(() => route.query.status || "Error");

/** Computed error message from query params */
const statusMessage = computed(() => route.query.message || "An unexpected error occurred");

/** Navigate to home page */
const goHome = () => {
  router.push("/");
};

/** Navigate back to previous page */
const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-error mb-4">{{ statusCode }}</h1>
      <p class="text-xl text-neutral mb-8">{{ statusMessage }}</p>
      <div class="flex gap-4 justify-center">
        <UButton color="primary" @click="goBack">Go Back</UButton>
        <UButton color="neutral" variant="outline" @click="goHome">
          Go Home
        </UButton>
      </div>
    </div>
  </div>
</template>
