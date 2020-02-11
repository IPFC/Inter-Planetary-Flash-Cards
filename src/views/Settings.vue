<template>
  <b-container id="body">
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


export default {
  name: 'Settings',
  components: {textEditorSettings, reviewScheduleSettings},
  data() {
    return {
    }
  },
  methods: {
    logout () {
      this.$store.dispatch('logout')
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
#body{
  max-width: 600px;
}
#logout{
  margin-top: 15px
}
.settings-component{
  padding: 0
}


</style>