import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersistence from 'vuex-persist';
import Cookies from 'js-cookie'

Vue.use(Vuex)

const vuexCookie = new VuexPersistence({
  restoreState: (key) => Cookies.getJSON(key),
  saveState: (key, state) =>
    Cookies.set(key, state, {
      expires: 3
    }),
  reducer: (state) => ({
    jwt: state.jwt 
  })
})

const vuexLocal = new VuexPersistence({
  key: 'vuex', // The key to store the state on in the storage provider.
  storage: window.localStorage,
  // Function that passes the state and returns the state with only the objects you want to store.
  reducer: (state) => ({
    userCollection: state.userCollection,
    decksMeta: state.decksMeta,
    decks: state.decks,
    currentDeck: state.deck,
    reviewDeck: state.reviewDeck,
    lastSyncsData: state.lastSyncsData
  })
  // Function that passes a mutation and lets you decide if it should update the state in localStorage.
  // filter: mutation => (true)
})

const store = new Vuex.Store({
  state: {
    jwt: null,
    jwtValid: false,
    userCollection: null,
    decksMeta: null,
    decks: null,
    currentDeck: null,
    reviewDeck: null,
    cardToEditIndex: null,
    navProgressCounter: '',
    lastSyncsData: null,
    syncing: false,
    serverURL: 'https://ipfc-midware.herokuapp.com'
  },
  mutations: {
    updateJwt(state, newJwt) {
      state.jwt = newJwt
    },
    deleteJwt(state) {
      state.jwt = null
    },
    toggleJwtValid(state, bool) {
      state.jwtValid = bool
    },
    toggleSyncing(state, bool) {
      state.syncing = bool
    },
    updateUserCollection(state, data) {
      state.userCollection = data
    },
    updateDecksMeta(state, data) {
      state.decksMeta = data
    },
    updateDecks(state, data) {
      state.decks = data
    },
    updateCurrentDeck(state, data) {
      state.currentDeck = data
    },
    updateReviewDeck(state, data) {
      state.reviewDeck = data
    },
    updateProgressCounter(state, data) {
      state.navProgressCounter = data
    },
    updateCardToEditIndex (state, index) {
      state.cardToEditIndex = index
    },
    updateLastSyncsData (state, data) {
      state.lastSyncsData = data
    }
  },
  actions: {
    navProgress (context, completedCards) {
        let outputString = completedCards + " / "  + context.state.reviewDeck.length
        context.commit('updateProgressCounter', outputString)
    },
    logout(context) {
      context.commit('deleteJwt')
      context.commit('toggleJwtValid', false)
    },
    checkJwt(context) {
      let jwt = context.state.jwt
      if (jwt === null) {
        context.commit('toggleJwtValid', false)
      }
      else if (!jwt || jwt.split('.').length < 3) {
        context.commit('toggleJwtValid', false)
      }
      else {
        const data = JSON.parse(atob(jwt.split('.')[1]))
        const exp = new Date(data.exp * 1000) // JS deals with dates in milliseconds since epoch
        const now = new Date()
        context.commit('toggleJwtValid', now < exp)
      }
     
    },
    updateReviewDeck(context) {
      let decks = context.state.decks
      let reviewDeck = []
      let deck
      for (deck of decks) {
        let card
        for (card of deck.cards) {
          if (card.card_tags.includes('Daily Review')){
            reviewDeck.push(card)
          }
        }
      }
      context.commit('updateReviewDeck', reviewDeck)
    },
    refreshDecksMeta(context) {
      let decks = context.state.decks
      let newDecksMeta = []
      for (let deck of decks) {
        let deckMeta = {
          deck_cid: deck.deck_cid,
          deck_id: deck.deck_id,
          edited: deck.edited,
          title: deck.title
        }
        newDecksMeta.push(deckMeta)
      }
      context.commit('updateDecksMeta', newDecksMeta)
    },
    refreshLastSyncsData(context) {
      let lastDecks = context.state.decks
      let lastUserCollection = context.state.userCollection
      let lastSyncsData = {
          decks: lastDecks,
          userCollection: lastUserCollection
      }
      context.commit('updateLastSyncsData', lastSyncsData)
    },
    async sync(context) {
      console.log('sync called')
      console.log('syncing status')
      console.log(context.state.syncing)
      if (context.state.syncing == true) {
        console.log('syncing blocked')
        return null
      }
      else{
        context.commit('toggleSyncing', true)
        console.log('syncing status')
        console.log(context.state.syncing)
        let decks = context.state.decks
        let lastSyncDecks = context.state.lastSyncsData.decks
        // let thisSyncsDecks = []
        // let userCollection = context.state.userCollection
        if (decks != lastSyncDecks) {
          console.log("decks changed")
          for (let deck of decks) {
            for (let lastSyncDeck of lastSyncDecks) {
              if (deck.deck_id === lastSyncDeck.deck_id && deck.edited > lastSyncDeck.edited) {
                console.log("this deck changed" + deck.deck_id )
                let putDeckURL = context.state.serverURL + '/put_deck';
                let data = {
                  'deck_id': deck.deck_id,
                  'deck': deck,
                  'title': deck.title,
                  'edited': deck.edited
                  // 'deck_cid': deck.deck_cid
              }
              console.log("starting api call");
              await fetch(putDeckURL, { 
                  headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
                  body: JSON.stringify(data),
                  method: 'PUT',
                  })
                  .then(response => response.json())
                  .then((responseData) => {
                      console.log(responseData);
                      if (!responseData['deck']) {
                        console.log(responseData)
                      }
                      // else if () {
                      //     this.login ();
                      // }
                      }).catch(function() {
                          context.state.failedSync = true
                          this.apiErrorMsg = 'Server error'
                          //console.log(error);
                      });
              }
            }
          }
          
        }
        // context.commit('updateUserCollection', null)
        // context.commit('updateDecks', null)
        context.dispatch('refreshLastSyncsData')
        context.dispatch('refreshDecksMeta')
        context.commit('toggleSyncing', false)
      }
      
    }
  },
  getters: {
    isAuthenticated: state => state.jwtValid,
    getDecks: state => state.decks,
    navProgressCounter: state => state.navProgressCounter
  },
  plugins: [vuexCookie.plugin, vuexLocal.plugin]
})

export default store
