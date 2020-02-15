<template>
<div id="body">
  <b-navbar  toggleable="xs" type="dark" variant="primary">
  <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
  <b-link to="#" class="icon" ><font-awesome-icon style="color: white;" class="fa-lg"  icon="search"/></b-link>     
  <b-nav-text style="color: white;" id="session-counter" >{{ navProgressCounter }}</b-nav-text>    
  <b-link @click="newCard(); $emit('new-card');" class="icon"><img src="../assets/add card logo.svg" alt="add"></b-link>
  <b-link @click="callSync()" id="sync-link">
    <font-awesome-layers  class="fa-lg" id="sync-layers">
      <font-awesome-icon style="color: white;" class="fa-lg" id="cloud" icon="cloud"></font-awesome-icon>
      <font-awesome-icon style="color: primary;" v-if="syncing" class="fa-xs" id="sync-spinner" spin icon="sync"></font-awesome-icon>
      <font-awesome-icon style="color: primary;" v-else-if="syncFailed || $store.getters.dataChanged" class="fa-xs" id="exclamation" icon="exclamation"></font-awesome-icon>
      <font-awesome-icon style="color: primary;" v-else class="fa-xs" id="checkmark" icon="check"></font-awesome-icon>

    </font-awesome-layers>
  </b-link>     
  <b-collapse id="nav-collapse" is-nav>
    <b-navbar-nav  >
    <b-nav-item to="/home">Review</b-nav-item>
    <b-nav-item to="/Settings">Settings</b-nav-item>
    <b-nav-item to="/deck-selection">Decks</b-nav-item>
    <b-nav-item to="#" disabled>Lessons</b-nav-item>
    <b-nav-item to="#" disabled>Classes</b-nav-item>
    <b-nav-form>
    <b-form-input size="sm" class="mr-sm-1" placeholder="find decks and classes"></b-form-input>
      <b-button size="sm" type="submit">Search</b-button>
    </b-nav-form>   
    </b-navbar-nav> 
  </b-collapse> 
</b-navbar>  
</div>
</template>

<script>

import { mapState } from 'vuex'
export default {
  name: 'navbar',
  data () {
    return {
    }
  },
  computed: {
    navProgressCounter () {
				return this.$store.getters.navProgressCounter
				},
    ...mapState({
            syncing: 'syncing',
            syncFailed: 'syncFailed',
    }),
    currentDeck() {
      return this.$store.getters.currentDeck
    }
  },
  methods: {
    newCard() {
      if (this.$store.state.currentDeckId === 'reviewDeck' || this.$store.state.currentDeckId === 'defaultDeck') {
        this.$store.commit('updateCurrentDeckId', this.$store.getters.decksMeta[0].deck_id)
     } 
      this.$store.dispatch('newCard', this.currentDeck.deck_id)  
      this.$store.commit('updateCardToEditIndex', this.currentDeck.cards.length -1)
      if (this.$route.name !== 'card-editor' ) {
        this.$router.push('/card-editor')
      }
    },
    callSync() {
      if (this.$store.getters.isAuthenticated) {
        this.$store.dispatch('sync')
      } 
      else {
        this.$router.push('/login')
      }
    }
  }  
    }
</script>

<style scoped>
#sync-layers {
  margin-top: 3px;
}
#sync-link{
  width: 50px;
}
#exclamation{
  margin: 4px 0px 0px 14px;
  -webkit-animation: pulsate 1s ease-out;
  -webkit-animation-iteration-count: infinite; 
  opacity: 0.0
}
#sync-spinner {
    margin: 4px 0px 0px 9px;
}
#checkmark {
    margin: 5px 0px 0px 9px;
}
@-webkit-keyframes pulsate {
  0% {-webkit-transform: scale(1, 1); opacity: 1;}
  50% {-webkit-transform: scale(1.2, 1.2); opacity: 1;}
  100% {-webkit-transform: scale(1, 1); opacity: 1;}
}
</style>