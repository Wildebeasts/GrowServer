<script lang="ts" setup>
import { ref, reactive } from "vue";
import { z } from "zod";
import { authVue } from "@/lib/auth-client";

const loginSchema = z.object({
  growId: z
    .string()
    .min(5, {
      message: "GrowID must be at least 5 characters.",
    })
    .max(20, {
      message: "GrowID are too long.",
    })
    .refine((v) => !/[!@#$%^&*(),.?":{}|<> ]/.test(v), {
      message: "GrowID are containing special characters.",
    }),
  password: z.string().min(5, {
    message: "Password must contains at least 5 characters long.",
  }),
});

const formData = reactive({
  growId: "",
  password: "",
});

const errors = reactive<Record<string, string>>({});
const isSubmitting = ref(false);

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

const toasts = ref<Toast[]>([]);
let toastId = 0;

function showToast(message: string, type: "success" | "error" = "success") {
  const id = toastId++;
  toasts.value.push({ id, message, type });

  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 3000);
}

async function onFormSubmit() {
  // Clear previous errors
  Object.keys(errors).forEach(key => delete errors[key]);

  // Validate
  const result = loginSchema.safeParse(formData);

  if (!result.success) {
    result.error.issues.forEach((error) => {
      const field = String(error.path[0]);
      errors[field] = error.message;
    });
    return;
  }

  // Submit using better-auth
  isSubmitting.value = true;
  try {
    const { data, error } = await authVue.signIn.username({
      username: result.data.growId,
      password: result.data.password,
    });

    if (error) {
      showToast(error.message || "Login failed", "error");
    } else {
      showToast("Login successful!", "success");
      setTimeout(() => {
        window.location.href = "/player/login/dashboard";
      }, 1000);
    }
  } catch (error) {
    showToast("An error occurred. Please try again.", "error");
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="toast toast-top toast-end z-50">
    <div v-for="toast in toasts" :key="toast.id" class="alert" :class="toast.type === 'success' ? 'alert-success' : 'alert-error'">
      <span>{{ toast.message }}</span>
    </div>
  </div>

  <div class="flex justify-center items-center min-h-screen">
    <div class="card w-96 bg-base-200 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-2xl font-bold justify-center mb-4">Legacy Login</h2>

        <form @submit.prevent="onFormSubmit" action="" method="post">
          <div class="form-control w-full mb-4">
            <label class="label" for="growId">
              <span class="label-text">GrowID</span>
            </label>
            <input
              id="growId"
              name="growId"
              v-model="formData.growId"
              type="text"
              placeholder="Enter your GrowID"
              class="input input-bordered w-full"
              :class="{ 'input-error': errors.growId }"
            />
            <label v-if="errors.growId" class="label">
              <span class="label-text-alt text-error">{{ errors.growId }}</span>
            </label>
          </div>

          <div class="form-control w-full mb-4">
            <label class="label" for="password">
              <span class="label-text">Password</span>
            </label>
            <input
              id="password"
              name="password"
              v-model="formData.password"
              type="password"
              placeholder="Enter your password"
              class="input input-bordered w-full"
              :class="{ 'input-error': errors.password }"
            />
            <label v-if="errors.password" class="label">
              <span class="label-text-alt text-error">{{ errors.password }}</span>
            </label>
          </div>

          <div class="form-control mb-4">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="btn btn-primary w-full"
            >
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              {{ isSubmitting ? 'Logging in...' : 'Login' }}
            </button>
          </div>
          <div class="form-control mt-4">
            <a
              href="/player/login/dashboard"
              class="btn btn-link w-full"
            >
            Back
            </a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

