<template>
  <b-container id="body">
    <alert-failed-sync/>
    <alert-offline/>
    <alert-update-pwa @updatePWA="PWAUpdate(bool)" />
    <b-list-group id="top-layer-settings">
      <b-list-group-item id="logout" button @click="logout()">
        Logout
      </b-list-group-item>
      <text-editor-settings class="settings-component"/>
      <review-schedule-settings  class="settings-component"/>
    </b-list-group>
  </b-container>
</template>

<script>
import textEditorSettings from '../components/SettingsTextEditor.vue'
import reviewScheduleSettings from '../components/SettingsReviewSchedule.vue'
import { BListGroup, BListGroupItem } from 'bootstrap-vue'

export default {
  name: 'Settings',
  components: {textEditorSettings, reviewScheduleSettings, BListGroup, BListGroupItem},
  data() {
    return {
    }
  },
  methods: {
    logout () {
      this.$store.dispatch('logout')
      this.$router.push('/login')
    },
    PWAUpdate (bool) {
      this.$emit('updatePWA', bool)
    },
  },
  mounted () {
    this.$emit('homeLoad')
  }
}
</script>

<style scoped>
#body{
  max-width: 600px;
}
#logout{
  margin-top: 15px;
  margin-bottom: 0px;
}
.settings-component{
  padding: 0
}


</style>