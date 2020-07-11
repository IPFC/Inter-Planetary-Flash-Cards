<template>
  <b-container id="main" fluid>
    <b-list-group-item v-if="!isAuthenticated" id="logout" button @click="$router.push('/login')">
      Login
    </b-list-group-item>
    <b-list-group-item v-else id="logout" button @click="settingsOpen = !settingsOpen">
      Logout
    </b-list-group-item>
    <b-list-group v-if="settingsOpen" class="second-layer-settings">
      <b-list-group-item id="logout" button @click="logoutDeleteCache()">
        Logout and delete cache
      </b-list-group-item>
      <b-list-group-item id="logout" button @click="logout()">
        Logout and keep cache
      </b-list-group-item>
    </b-list-group>
  </b-container>
</template>

<script>
import { BListGroup, BListGroupItem } from 'bootstrap-vue';
import { mapGetters } from 'vuex';
export default {
  name: 'ReviewScheduleSettings',
  components: {
    BListGroup,
    BListGroupItem,
  },
  data() {
    return {
      settingsOpen: false,
    };
  },
  computed: {
    ...mapGetters(['isAuthenticated']),
  },
  methods: {
    async logout() {
      await this.$store.dispatch('logout');
      this.$router.push('/login');
    },
    async logoutDeleteCache() {
      console.log('logoutDeleteCache');
      await this.$store.dispatch('logoutDeleteCache');
      this.$router.push('/login');
    },
  },
};
</script>

<style scoped>
#main {
  padding: 0;
}
.second-layer-settings {
  padding: 10px;
}
</style>
