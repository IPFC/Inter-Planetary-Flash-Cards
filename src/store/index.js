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
    syncFailed: false,
    serverURL: 'https://ipfc-midware.herokuapp.com',
    navNewCardDisabled: false,
    navNewCardClicked: false
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
    addDeck(state, newDeck) {
      state.decks.unshift(newDeck)
      state.userCollection.deck_ids.push(newDeck.deck_id)
    },
    updateDeck(state, data) {
      for (let deck of state.decks) {
        if (deck.deck_id === data.deck_id) {
          deck = data
          }
      }
    },
    updateDecks(state, data) {
      state.decks = data
    },
    deleteDeck(state, deck_id) {
      // add to usercollection deleted list
      state.userCollection.deleted_deck_ids.push(deck_id)
      // remove from usercollection included list
      let deck_idIndex = state.userCollection.deck_ids.indexOf(deck_id)
      state.userCollection.deck_ids.splice(deck_idIndex, 1);

      // remove the deck from 'decks' 
      let deckToDelete = state.decks.filter(function (deckToCheck) {
        return deckToCheck.deck_id === deck_id
        }) 
      let deckIndex = state.decks.indexOf(deckToDelete)
      if (deckIndex !== -1) { //just in case its alraady not there 
        state.decks.splice(deckIndex, 1);
      }
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
    },
    toggleSyncFailed (state, bool) {
      state.syncFailed = bool
    },
    toggleNavNewCardDisabled (state, bool) {
      state.navNewCardDisabled = bool
    },
    toggleNavNewCardClicked (state) {
      state.navNewCardClicked = !state.navNewCardClicked
    }
  },
  actions: {
    navProgress (context, completedCards) {                 //.cards
        let outputString = completedCards + " / "  + context.state.reviewDeck.cards.length
        context.commit('updateProgressCounter', outputString)
    },
    navNewCardClicked (context) {
      context.commit('toggleNavNewCardClicked')
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
      let reviewDeck = {cards: [] } 
      for (let deck of decks) {
        for (let card of deck.cards) {
          if (card.card_tags.includes('Daily Review') && !reviewDeck.cards.includes(card)){
            reviewDeck.cards.push(card)
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
          title: deck.title,
          deck_length: deck.cards.length,
          icon_color: deck.icon_color
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
              // rewrite API to accept lists of decks to delete, post, put, get.
              // just use the copied 'decks' variable the whole time, commit at the end.
              // make sure I'm combining the 'usercollection' on both  client and server.

      // console.log('sync called')
      if (context.state.syncing === true) {
        // console.log('syncing blocked')
        return null
      }
      else{
        context.commit('toggleSyncing', true)
        context.commit('toggleSyncFailed', false)
        console.log("starting sync")
        let serverCollection     
        let localDecksMeta = JSON.parse(JSON.stringify(context.state.decksMeta)) 
        let decks = JSON.parse(JSON.stringify(context.state.decks)) //reload decks, cause they might be changed by above user collection section
        let userCollection = JSON.parse(JSON.stringify(context.state.userCollection))
        let getCollectionURL = context.state.serverURL + '/get_user_collection' 
       
        // get user collection to check for deleted decks 
        await fetch(getCollectionURL, {
          headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
          method: 'GET',
          })
          .then(response => response.json())
          .then((responseData) => {
              console.log(responseData)
              serverCollection = responseData
          })
          .catch(function(err) {  
            context.commit('toggleSyncFailed', true)
            console.log(err); 
            return null
          });

        if (serverCollection !== userCollection){
          for (let server_deleted_deck_id of serverCollection.deleted_deck_ids) {        
            // if server deleted, but local deleted isn't, delete locally
            if (!userCollection.deleted_deck_ids.includes(server_deleted_deck_id)) {
              // add to local usercollection deleted list
              userCollection.deleted_deck_ids.push(server_deleted_deck_id)
              // remove from usercollection included list
              let deck_idIndex = userCollection.deck_ids.indexOf(server_deleted_deck_id)
              userCollection.deck_ids.splice(deck_idIndex, 1);
              // remove the deck from 'decks'  // note this is only for 'lastsyncsdata' purposes.
              let deckToDelete = decks.filter(function (deckToCheck) {
                return deckToCheck.deck_id === server_deleted_deck_id
                }) 
              let deckIndex = decks.indexOf(deckToDelete)
              if (deckIndex !== -1) { //just in case its not there alraady
                decks.splice(deckIndex, 1);
              }
              // actually remove from store
              context.commit('deleteDeck', server_deleted_deck_id)
            }
          }
          // if local deleted, but server deleted isn't, add to server deleted list
          let decksToDeleteOnServer= []  
          for (let client_deleted_deck_id of userCollection.deleted_deck_ids) { 
            if (!serverCollection.deleted_deck_ids.includes(client_deleted_deck_id)) {
              decksToDeleteOnServer.push(client_deleted_deck_id)
            }
            }// call delete decks (server will update it's deleted decks list on its end)
          if (decksToDeleteOnServer.length > 0) {
            let deleteDeckURL = context.state.serverURL + '/delete_decks' 
            let deleteDecksData = {'deck_ids': decksToDeleteOnServer}
            await fetch(deleteDeckURL, {
              headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
              body: JSON.stringify(deleteDecksData),
              method: 'DELETE'
              })
              .then(response => response.json())
              .then((responseData) => {
                  console.log("decks deleted: ", responseData)
              })
              .catch(function(err) {  
                context.commit('toggleSyncFailed', true)
                console.log(err); 
                return null
              });
          }

          // if there are new decks from server, add their IDs, download the deck.
          let decksToDownload = []
          for (let server_deck_id of serverCollection.deck_ids) { 
            if (!userCollection.deck_ids.includes(server_deck_id)) {
              decksToDownload.push(server_deck_id)
            }
          }
          let getDecksURL = context.state.serverURL + '/get_decks'
          if (decksToDownload.length > 0) {
            await fetch(getDecksURL, {
              headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
              body: JSON.stringify(decksToDownload),
              method: 'GET'
              })
              .then(response => response.json())
              .then((responseData) => {
                  console.log("decks downloaded", responseData)
                  for (let downloadedDeck of responseData) {
                    decks.unshift(downloadedDeck)
                    userCollection.deck_ids.push(downloadedDeck.deck_id)
                    context.commit('addDeck', downloadedDeck)
                  }
              })
              .catch(function(err) {  
                context.commit('toggleSyncFailed', true)
                console.log(err); 
                return null
              });
          }
          
          // if there are new decks locally, add their IDs, post the deck.
          let decksToPost = []
          for (let client_deck_id of userCollection.deck_ids ) { 
            if (!serverCollection.deck_ids.includes(client_deck_id)) {
              let deckToPost = decks.filter(function (deckToCheck) {
                return deckToCheck.deck_id === client_deck_id
                }) 
              decksToPost.push(deckToPost)
            }
          }
          if (decksToPost.length > 0) {
            let postDecksURL = context.state.serverURL + '/post_decks';
            await fetch(postDecksURL, { 
              headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
              body: JSON.stringify(decksToPost),
              method: 'POST',
              })
              .then(response => response.json())
              //responseData
              .then((responseData) => {
                  console.log("POSTed decks ", responseData);
                  //err
              }).catch(function() {
                context.commit('toggleSyncFailed', true)
                // console.log(err);
              });
          }
        }
        
        // get serverDecksMeta
        let serverDecksMeta = null
        let getDecksMetaURL = context.state.serverURL + '/get_decks_meta' 
        await fetch(getDecksMetaURL, {
          headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
          method: 'GET'
          })
          .then(response => response.json())
          .then((responseData) => {
              console.log("got decks meta", responseData)
              serverDecksMeta = responseData
          })
          .catch(function(err) {  
            context.commit('toggleSyncFailed', true)
            console.log(err); 
            return null
          });
        let decksToPut = []
        let decksToUpdateLocally = []
        // compare the edited dates for each deck in local and server decks meta
        for (let localDeckMeta of localDecksMeta) {
          let serverDeckMeta = serverDecksMeta.filter(function (deckMetaToCheck) {
            return deckMetaToCheck.deck_id === localDeckMeta.deck_id
            })  
          // if the local version is newer, upload it
          if (localDeckMeta.edited > serverDeckMeta.edited) {
            let deckToUpdate = decks.filter(function (deckToCheck) {
              return deckToCheck.deck_id === localDeckMeta.deck_id
              }) 
            decksToPut.push(deckToUpdate)
          }
          // if the server version is newer, downlaod it
          else if (localDeckMeta.edited < serverDeckMeta.edited) {
            decksToUpdateLocally.push(serverDeckMeta.deck_id)
          } 
        }
        // upload all the decks to put
        if (decksToPut.length > 0) {
          let putDecksURL = context.state.serverURL + '/put_decks';
          await fetch(putDecksURL, { 
            headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
            body: JSON.stringify(decksToPut),
            method: 'PUT',
            })
            .then(response => response.json())
            //responseData
            .then((responseData) => {
                console.log("PUT decks ", responseData);
            }).catch(function(err) {
              context.commit('toggleSyncFailed', true)
              console.log(err);
            });
        }
       
        // get all newer server decks
        if (decksToUpdateLocally.length > 0) {
          let getDecksURL = context.state.serverURL + '/get_decks'
          await fetch(getDecksURL, {
          headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
          body: JSON.stringify(decksToUpdateLocally),
          method: 'GET'
          })
          .then(response => response.json())
          .then((responseData) => {
              console.log("decks downloaded", responseData)
              for (let newerDeck of responseData) {
                let oldDeck = decks.filter(function(deckToCheck) {
                  return deckToCheck.deck_id === newerDeck.deck_id
                })
                let oldDeckIndex = decks.indexOf(oldDeck)
                decks.splice(oldDeckIndex, 1);
                decks.push(newerDeck)
                context.commit('updateDeck', newerDeck)
              }
          })
          .catch(function(err) {  
            context.commit('toggleSyncFailed', true)
            console.log(err); 
            return null
          }); 
        }
        context.commit('updateLastSyncsData', {
          decks: decks,
          userCollection: userCollection
        })
        context.commit('toggleSyncing', false)
      }
    }
  },
  getters: {
    isAuthenticated: state => state.jwtValid,
    getDecks: state => state.decks,
    navProgressCounter: state => state.navProgressCounter,
    dataChanged (state) {
      if(state.userCollection != state.lastSyncsData.userCollection || state.decks != state.lastSyncsData.decks) {
        return true
      } else {
        return false
      }
    }
  },
  plugins: [vuexCookie.plugin, vuexLocal.plugin]
})

export default store
