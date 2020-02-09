<template>
  <b-container id="body">
    <b-list-group id="top-layer-settings">
      <b-list-group-item id="logout" button @click="logout()">
        Logout
      </b-list-group-item>
      <text-editor-settings id="text-editor-settings"/>
    </b-list-group>
  </b-container>
</template>

<script>
import textEditorSettings from '../components/SettingsTextEditor.vue'
        

export default {
  name: 'Settings',
  components: {textEditorSettings},
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
#text-editor-settings{
  padding: 0
}

</style>