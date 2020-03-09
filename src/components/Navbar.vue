<template>
  <div id="body">
    <b-navbar ref="navbarMain" toggleable="xs" type="dark" variant="primary">
      <b-navbar-toggle target="nav-collapse" />
      <b-link to="#" class="icon">
        <font-awesome-icon style="color: white;" class="fa-lg" icon="search" />
      </b-link>
      <b-nav-text id="session-counter" style="color: white;">
        {{ navProgressCounter }}
      </b-nav-text>
      <b-link class="icon" @click="$emit('new-card')">
        <img src="/img/icons/add card logo.svg" alt="add" />
      </b-link>
      <b-link id="sync-link" aria-label="sync status" @click="callSync()">
        <font-awesome-layers id="sync-layers" class="fa-lg">
          <font-awesome-icon id="cloud" style="color: white;" class="fa-lg" icon="cloud" />
          <font-awesome-icon
            v-if="syncing"
            id="sync-spinner"
            style="color: primary;"
            class="fa-xs"
            spin
            icon="sync"
          />
          <font-awesome-icon
            v-else-if="syncFailed || !online"
            id="exclamation"
            style="color: primary;"
            class="fa-xs"
            icon="exclamation"
          />
          <font-awesome-icon
            v-else
            id="checkmark"
            style="color: primary;"
            class="fa-xs"
            icon="check"
          />
        </font-awesome-layers>
      </b-link>
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item class="dropdown-item" to="/home">
            Review
          </b-nav-item>
          <b-nav-item class="dropdown-item" to="/Settings">
            Settings
          </b-nav-item>
          <b-nav-item class="dropdown-item" to="/deck-selection">
            Decks
          </b-nav-item>
          <b-nav-item v-if="!installed" class="dropdown-item" @click="installer()">
            Install App
          </b-nav-item>
          <b-nav-item class="dropdown-item" to="#" disabled>
            Lessons
          </b-nav-item>
          <b-nav-item class="dropdown-item" to="#" disabled>
            Classes
          </b-nav-item>
          <b-nav-form>
            <b-form-input size="sm" class="mr-sm-1" placeholder="find decks and classes" />
            <b-button size="sm" type="submit">
              Search
            </b-button>
          </b-nav-form>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
import {
  BLink,
  BNavbar,
  BNavbarNav,
  BNavForm,
  BFormInput,
  BNavbarToggle,
  BNavText,
  BNavItem,
  BCollapse,
} from 'bootstrap-vue';
import { mapState } from 'vuex';
export default {
  name: 'Navbar',
  components: {
    BLink,
    BNavbar,
    BNavbarNav,
    BNavForm,
    BFormInput,
    BNavbarToggle,
    BNavText,
    BNavItem,
    BCollapse,
  },
  props: { chromeInstallPrompt: { type: Boolean } },
  data() {
    return {
      installed: true,
      installer: undefined,
      installPrompt: null,
    };
  },
  computed: {
    navProgressCounter() {
      return this.$store.getters.navProgressCounter;
    },
    ...mapState(['syncing', 'syncFailed', 'online']),
  },
  watch: {
    chromeInstallPrompt() {
      if (this.installPrompt !== null) {
        this.installer();
      }
    },
  },
  created() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      this.installPrompt = e;
      this.installed = false;
    });
    this.installer = () => {
      this.installed = true;
      this.installPrompt.prompt();
      this.installPrompt.userChoice.then(result => {
        if (result.outcome === 'accepted') {
          // console.log("user accepted")
        } else {
          // console.log("user denied")
        }
        this.installPrompt = null;
      });
    };
  },
  methods: {
    callSync() {
      if (this.$store.getters.isAuthenticated) {
        this.$store.dispatch('cloudSync', true);
      } else {
        this.$router.push('/login');
      }
    },
  },
};
</script>

<style scoped>
.dropdown-item {
  padding-left: 15px;
}
.dropdown-item:hover {
  color: primary;
}
#sync-layers {
  margin-top: 3px;
}
#sync-link {
  width: 50px;
}
#exclamation {
  margin: 4px 0px 0px 14px;
  -webkit-animation: pulsate 1s ease-out;
  animation: pulsate 1s ease-out;
  -webkit-animation-iteration-count: infinite;
  animation-iteration-count: infinite;
  opacity: 0;
}
#sync-spinner {
  margin: 4px 0px 0px 9px;
}
#checkmark {
  margin: 5px 0px 0px 9px;
}
@-webkit-keyframes pulsate {
  0% {
    -webkit-transform: scale(1, 1);
    opacity: 1;
  }
  50% {
    -webkit-transform: scale(1.2, 1.2);
    opacity: 1;
  }
  100% {
    -webkit-transform: scale(1, 1);
    opacity: 1;
  }
}
@keyframes pulsate {
  0% {
    -webkit-transform: scale(1, 1);
    opacity: 1;
  }
  50% {
    -webkit-transform: scale(1.2, 1.2);
    opacity: 1;
  }
  100% {
    -webkit-transform: scale(1, 1);
    opacity: 1;
  }
}
</style>
