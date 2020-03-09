<template>
  <b-alert style="z-index: 40000; width:" :show="showPrompt" dismissible fade variant="warning">
    {{ promptText }}
    <b-button @click="refreshApp()">
      {{ promptBtnText }}
    </b-button>
  </b-alert>
</template>

<script>
import { BAlert } from 'bootstrap-vue';
export default {
  components: {
    BAlert,
  },
  data() {
    return {
      refreshing: false,
      registration: null,
      promptBtnText: 'Refresh',
      promptText: 'New version available!  ',
      showPrompt: false,
    };
  },
  created: function() {
    // PWA
    // Listen for swUpdated event and display refresh snackbar as required.
    document.addEventListener('swUpdated', this.showRefreshUI, { once: true });

    // Refresh all open app tabs when a new service worker is installed.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.refreshing) return;
      this.refreshing = true;
      window.location.reload();
    });
  },
  methods: {
    refreshApp() {
      this.showPrompt = false;
      // Protect against missing registration.waiting.
      if (!this.registration || !this.registration.waiting) {
        return;
      }
      this.registration.waiting.postMessage('skipWaiting');
      this.$emit('updatePWA', false);
    },
    showRefreshUI(e) {
      // Display a snackbar inviting the user to refresh/reload the app due
      // to an app update being available.
      // The new service worker is installed, but not yet active.
      // Store the ServiceWorkerRegistration instance for later use.
      this.registration = e.detail;
      this.showPrompt = true;
      this.$emit('updatePWA', true);
    },
  },
};
</script>

<style scoped></style>
