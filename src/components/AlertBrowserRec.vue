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
      {{ alertTxt }}
    </b-alert>
  </div>
</template>

<script>
import { BAlert } from 'bootstrap-vue';
export default {
  components: {
    BAlert,
  },
  props: { alertBrowserRec: { type: Boolean } },
  data: () => ({
    dismissSecs: 8,
    dismissCountDown: 0,
    alertTxt: `For full screen mode and faster loading, open the app in Chrome(Android/Desktop) or Safari(iOS) and click 'add to homescreen'`,
  }),
  watch: {
    alertBrowserRec() {
      this.showAlert();
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
