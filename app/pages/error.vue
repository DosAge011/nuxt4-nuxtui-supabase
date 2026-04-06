<script setup lang="ts">
const route = useRoute();
const router = useRouter();

// Get error details from query params
const statusCode = computed(() => route.query.status || "Error");
const statusMessage = computed(() => route.query.message || "An unexpected error occurred");

const goHome = () => {
  router.push("/");
};

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
