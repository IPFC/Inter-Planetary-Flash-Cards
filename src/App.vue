<template>
  <div id="app-main" ref="appMain">
    <div
      v-if="!updatePWA && !routeName === 'privacy-agreement'"
      id="splash"
      :class="splashClass"
    ></div>
    <div v-if="appleInstallPrompt" id="apple-install-prompt-greyout">
      <div id="apple-install-prompt-padding">
        <div id="apple-install-prompt">
          <p>
            Enjoying our app? To view full screen and get the full IPFC experience, tap the share
            button then add to home screen.
          </p>
          <img class="apple-prompt-img" src="img/apple-share-icon.png" alt="Apple share icon" />
          <b-button @click="dismissApplePrompt()">got it</b-button>
          <img
            class="apple-prompt-img"
            src="img/apple-add-to-homescreen-icon.png"
            alt="AppleAdd to homescreen icon"
          />
        </div>
      </div>
    </div>
    <the-navbar
      id="navbar"
      ref="navbar"
      :chrome-install-prompt="chromeInstallPrompt"
      @new-card="newCard()"
    />
    <router-view
      class="router-view"
      :new-card-clicked="newCardClicked"
      :coming-to-card-editor-from-review="toCardEditorFromReview"
      :alert-browser-rec="alertBrowserRec"
      @homeLoad="homeLoaded()"
      @edit-clicked="editClicked()"
      @updatePWA="PWAUpdate(bool)"
      @new-card="newCard()"
    />
  </div>
</template>

<script>
import TheNavbar from './components/TheNavbar';
import { mapGetters, mapState } from 'vuex';
const debounce = require('lodash/debounce');

export default {
  name: 'App',
  components: {
    TheNavbar,
  },
  data() {
    return {
      newCardClicked: 0,
      toCardEditorFromReview: false,
      splashClass: 'splash',
      updatePWA: false,
      appleInstallPrompt: false,
      applePromptDissmissed: false,
      chromeInstallPrompt: false,
      alertBrowserRec: false,
    };
  },
  computed: {
    ...mapGetters(['decksMeta', 'currentDeck', 'todaysDeckFull']),
    ...mapState(['currentDeckId', 'decks', 'syncing', 'user_collection', 'initialSync']),
    routeName() {
      return this.$route.name;
    },
  },
  watch: {
    user_collection: {
      handler: function() {
        // console.log(  'sync called from user collection change')
        this.debouncedSync();
      },
      deep: true,
    },
    decks: {
      handler: function() {
        // console.log(  'sync called from decks change')
        this.debouncedSync();
      },
      deep: true,
    },
    syncing: function() {
      // in case there were changes made during sync, try again after each sync
      // console.log(  'sync called from syncing change')
      this.debouncedSync();
    },
    todaysDeckFull: function() {
      this.$store.dispatch('setOrResetTodaysMaxCards');
    },
  },
  created: function() {
    this.splashClass = 'splash';
  },
  mounted: function() {
    // Chrome 1 - 79
    const chrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
    // console.log("chrome", chrome);
    const userAgent = window.navigator.userAgent.toLowerCase();
    // console.log("user agent", userAgent);
    const isIos = () => {
      return /iphone|ipad|ipod/.test(userAgent);
    };
    // Detects if device is in standalone mode
    const isInStandaloneMode = () => window.matchMedia('(display-mode: standalone)').matches;
    // console.log("isInStandaloneMode", isInStandaloneMode());
    // console.log("isIos", isIos());

    // Checks if should display install popup notification:
    if (isIos() && !isInStandaloneMode() && !this.promptDissmissed) {
      this.promptAppleInstall();
    }
    if (chrome && !isInStandaloneMode()) {
      this.promptChromeInstall();
    }
    if (!isIos() && !chrome && !isInStandaloneMode()) {
      // console.log('alert rec')
      this.alertBrowserReccomendation();
    }
  },
  methods: {
    homeLoaded: function() {
      this.splashClass = 'loaded';
    },
    editClicked: function() {
      if (this.currentDeckId === 'reviewDeck') {
        this.toCardEditorFromReview = true;
      } else {
        this.toCardEditorFromReview = false;
      }
    },
    newCard: function() {
      this.newCardClicked++;
      if (this.currentDeckId === 'reviewDeck' || this.currentDeckId === 'defaultDeck') {
        this.toCardEditorFromReview = true;
        this.$store.commit('updateCurrentDeckId', this.decksMeta[0].deck_id);
      }
      this.$store.dispatch('newCard', this.currentDeckId);
      if (this.$route.name !== 'card-editor') {
        this.$store.commit('updateCardToEditIndex', this.currentDeck.cards.length - 1);
        this.$router.push('/card-editor');
      }
    },
    PWAUpdate(bool) {
      if (bool) {
        this.updatePWA = true;
      } else {
        this.updatePWA = false;
      }
    },
    debouncedSync: debounce(function() {
      if (!this.syncing && this.initialSync > 1 && this.user_collection.user_id !== 'tutorial') {
        // console.log('sync called from  app.vue');
        this.$store.dispatch('cloudSync');
      }
    }, 15000),

    promptAppleInstall: debounce(function() {
      this.appleInstallPrompt = true;
    }, 30000),

    dismissApplePrompt() {
      this.appleInstallPrompt = false;
    },
    promptChromeInstall: debounce(function() {
      this.chromeInstallPrompt = !this.chromeInstallPrompt;
    }, 30000),

    alertBrowserReccomendation: debounce(function() {
      this.alertBrowserRec = !this.alertBrowserRec;
    }, 30000),
  },
};
</script>

<style lang="scss">
#apple-install-prompt-greyout {
  position: fixed;
  height: 100%;
  width: 100%;
  background-color: rgba(100, 100, 100, 0.5);
  z-index: 10000;
}
#apple-install-prompt-padding {
  top: 30%;
  width: 100%;
  position: fixed;
  z-index: 10001;
  padding: 20px;
}
#apple-install-prompt {
  text-align: center;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  margin: auto;
  width: 80%;
  max-width: 300px;
  z-index: 10003;
  box-shadow: 0 0px 5px rgba(0, 0, 0, 0.5);
}
.apple-prompt-img {
  margin: 0px 20px;
  width: 40px;
}
.splash {
  background-image: url('/img/icons/icon-192x192.png');
  background-position: center center;
  background-repeat: no-repeat;
  background-color: #f8690d;
  position: fixed;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  visibility: visible;
  opacity: 1;
  z-index: 4000;
}
.loaded {
  background-color: #f8690d;
  position: fixed;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s 0.25s, opacity 0.25s linear;
}

#app-main {
  height: 100%;
  width: 100%;
  position: fixed;
  // height: calc(var(--vh, 1vh) * 100);
  background-color: #f6f6f6;
  margin: 0;
  padding: 0;
}

.router-view {
  height: 100%;
  width: 100%;
  padding-top: 55px;
}

#navbar {
  position: absolute;
  top: 0;
  right: 0;
  width: 100vw;
  z-index: 2000;
}
</style>
