<template>
  <b-container class="review-body">
    <alert-failed-sync />
    <alert-offline />
    <alert-update-pwa @updatePWA="PWAUpdate(bool)" />
    <alert-browser-rec :alert-browser-rec="alertBrowserRec" />
    <b-list-group id="top-layer-settings">
      <logout-settings class="settings-component" />
      <text-editor-settings class="settings-component" />
      <review-schedule-settings class="settings-component" />
    </b-list-group>
  </b-container>
</template>

<script>
import logoutSettings from '../components/SettingsLogout.vue';
import textEditorSettings from '../components/SettingsTextEditor.vue';
import reviewScheduleSettings from '../components/SettingsReviewSchedule.vue';
import { BListGroup } from 'bootstrap-vue';

export default {
  name: 'Settings',
  components: {
    textEditorSettings,
    reviewScheduleSettings,
    logoutSettings,
    BListGroup,
  },
  props: { alertBrowserRec: { type: Boolean } },
  data() {
    return {};
  },
  mounted() {
    this.$emit('homeLoad');
  },
  methods: {
    PWAUpdate(bool) {
      this.$emit('updatePWA', bool);
    },
  },
};
</script>

<style scoped>
.review-body {
  max-width: 600px;
  overflow-y: auto;
  margin: auto;
}
.review-body::-webkit-scrollbar {
  width: 0.5em;
}
.review-body::-webkit-scrollbar-thumb {
  background-color: rgba(162, 162, 162, 0.5);
  border-radius: 0px;
}
#logout {
  margin-top: 15px;
  margin-bottom: 0px;
}
.settings-component {
  padding: 0;
}
</style>
