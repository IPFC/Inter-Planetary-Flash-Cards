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
      {{ offlineWarningTxt }}
    </b-alert>
  </div>
</template>

<script>
// import { debounce } from 'lodash/core';
import { BAlert } from 'bootstrap-vue';
import { mapActions, mapState } from 'vuex';
const debounce = require('lodash/debounce');
// import _ from 'lodash'
export default {
  components: {
    BAlert,
  },
  props: { display: { type: Boolean } },
  data: () => ({
    online: navigator.onLine,
    dismissSecs: 5,
    dismissCountDown: 0,
    offlineWarningTxt: `Offline mode: 
        Please cloud sync before using app on another device to avoid data conflicts.
        Media files might not load.`,
  }),
  computed: {
    ...mapActions({
      cloudSync: 'cloudSync',
    }),
    ...mapState(['initialSync']),
  },
  watch: {
    display: function() {
      this.showAlert();
    },
  },
  mounted() {
    window.addEventListener('online', this.connectivityChange);
    window.addEventListener('offline', this.connectivityChange);
    this.connectivityChange();
  },
  beforeDestroy() {
    window.removeEventListener('online', this.connectivityChange);
    window.removeEventListener('offline', this.connectivityChange);
  },
  methods: {
    countDownChanged(dismissCountDown) {
      this.dismissCountDown = dismissCountDown;
    },
    showAlert() {
      this.dismissCountDown = this.dismissSecs;
    },
    connectivityChange() {
      this.online = navigator.onLine;
      if (this.online !== this.$store.state.online) {
        this.$store.commit('updateOnline', this.online);
        if (!this.online) {
          this.showAlert();
        } else if (this.initialSync > 1) {
          // suppress sync call on app start
          // only want this when coming back online
          this.debouncedSync();
        }
      }
    },
    debouncedSync: debounce(function() {
      this.cloudSync();
    }, 10000),
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
