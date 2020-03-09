<template>
  <div class="padding">
    <b-alert
      class="alert-browser"
      :show="dismissCountDown"
      dismissible
      fade
      variant="warning"
      @dismiss-count-down="countDownChanged"
    >
      {{ syncFailedWarningTxt }}
    </b-alert>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { BAlert } from 'bootstrap-vue';
export default {
  components: {
    BAlert,
  },
  data: () => ({
    dismissSecs: 8,
    dismissCountDown: 0,
    syncFailedWarningTxt: `Cloud sync failed`,
  }),
  computed: {
    ...mapState(['syncFailed']),
  },
  watch: {
    syncFailed() {
      if (!this.syncFailed) {
        this.showAlert();
      }
    },
  },
  methods: {
    countDownChanged(dismissCountDown) {
      this.dismissCountDown = dismissCountDown;
    },
    showAlert() {
      this.dismissCountDown = this.dismissSecs;
    },
  },
};
</script>

<style scoped>
.padding {
  z-index: 40000;
  padding: 0px 8px;
  margin: auto;
  margin-top: 5px;
}
.alert {
  z-index: 40000;
  margin: auto;
  width: 100%;
  max-width: 800px;
}
</style>
