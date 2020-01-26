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
    dataChanged: false,
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
    toggleDataChanged (state, bool) {
      state.dataChanged = bool
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
      context.commit('toggleDataChanged', false)
      // console.log('sync called')
      // console.log('syncing status ', context.state.syncing)
      if (context.state.syncing === true) {
        // console.log('syncing blocked')
        context.commit('toggleDataChanged', false)
        return null
      }
      else{
        context.commit('toggleSyncing', true)
        context.commit('toggleSyncFailed', false)
        console.log("starting sync")
        // get user collection to check for deleted decks 
        let serverCollection     
        let localDecksMeta = JSON.parse(JSON.stringify(context.state.decksMeta))
        let userCollection = JSON.parse(JSON.stringify(context.state.userCollection))
        let lastUserCollection = JSON.parse(JSON.stringify(context.state.lastSyncsData.userCollection))
        let getCollectionURL = context.state.serverURL + '/get_user_collection' 
        let decks = JSON.parse(JSON.stringify(context.state.decks)) //reload decks, cause they might be changed by above user collection section
        let lastSyncDecks = JSON.parse(JSON.stringify(context.state.lastSyncsData.decks))
        let thisSyncsData = {
          decks: decks,
          userCollection: userCollection }
        let decksToDeleteLocally = []  
        let decksToDeleteOnServer= []  

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
              // add to deleted list
              decksToDeleteLocally.push(server_deleted_deck_id)

              // rewrite API to accept lists of decks to delete, post, put, get.
              // just use the copied 'decks' variable the whole time, commit at the end.
              // make sure I'm combining the 'usercollection' on both  client and server.

              userCollection.deleted_deck_ids.push(server_deleted_deck_id)
              // remove from included list
              for( var i = 0; i < userCollection.deck_ids.length; i++){ 
                if ( userCollection.deck_ids[i] === server_deleted_deck_id) {
                  userCollection.deck_ids.splice(i, 1);
                  i--;
                }
              }
              context.commit('updateUserCollection', userCollection)
              // remove the actual deck
              let decks = JSON.parse(JSON.stringify(context.state.decks))
              let updatedDecks = decks.filter(function (deckToCheck) {
                  return deckToCheck.deck_id !== server_deleted_deck_id
                  }) 


              // !!!!! should make all these commits at the end, incase data changes during sync

              context.commit('updateDecks', updatedDecks)
              context.dispatch('refreshDecksMeta')
              context.commit('updateLastSyncsData', thisSyncsData)
            }
          }
          // if local deleted, but server deleted isn't, add to server deleted list
          for (let client_deleted_deck_id of userCollection.deleted_deck_ids) { 
            if (!serverCollection.deleted_deck_ids.includes(client_deleted_deck_id)) {
              // call delete deck (server will update it's deleted decks list on its end)
              let deleteDeckURL = context.state.serverURL + '/delete_deck' 
              let deleteDeckData = {'deck_id': client_deleted_deck_id}
              await fetch(deleteDeckURL, {
                headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
                body: JSON.stringify(deleteDeckData),
                method: 'DELETE'
                })
                .then(response => response.json())
                .then((responseData) => {
                    console.log("deck deleted", responseData)
                })
                .catch(function(err) {  
                  context.commit('toggleSyncFailed', true)
                  console.log(err); 
                  return null
                });
            }
          }
        }
        // if there are new decks from server, add their IDs, download the deck.
        for (let server_deck_id of serverCollection.deck_ids) { 
          if (!userCollection.deck_ids.includes(server_deck_id)) {
            let decks = JSON.parse(JSON.stringify(context.state.decks))
            let getDeckURL = context.state.serverURL + '/get_deck' 
            let getDeckData = {'deck_id': server_deck_id}
            await fetch(getDeckURL, {
              headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
              body: JSON.stringify(getDeckData),
              method: 'GET'
              })
              .then(response => response.json())
              .then((responseData) => {
                  console.log("deck downloaded", responseData)
                  decks.unshift(responseData)
                  context.commit('updateDecks', decks)
                  let newUserCollection = JSON.parse(JSON.stringify(context.state.userCollection))
                  newUserCollection.deck_ids.push(responseData.deck_id)
                  context.commit('updateUserCollection', newUserCollection)
                  context.commit('updateLastSyncsData', thisSyncsData)
              })
              .catch(function(err) {  
                context.commit('toggleSyncFailed', true)
                console.log(err); 
                return null
              });
          }
        }
        // if there are new decks locally, add their IDs, post the deck.
        for (let client_deck_id of userCollection.deck_ids ) { 
          if (!serverCollection.deck_ids.includes(client_deck_id)) {
            let decks = JSON.parse(JSON.stringify(context.state.decks))
            let deck = decks.filter(function (deckToCheck) {
              return deckToCheck.deck_id === client_deck_id
              }) 
            let postDeckURL = context.state.serverURL + '/post_deck';
            let postDeckData = {
              'deck_id': deck.deck_id,
              'deck': deck,
              'title': deck.title,
              'edited': deck.edited 
            }
            await fetch(postDeckURL, { 
              headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
              body: JSON.stringify(postDeckData),
              method: 'POST',
              })
              .then(response => response.json())
              //responseData
              .then(() => {
                  console.log("POST deck ",responseData);
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
        // compare the edited dates for each deck in local and server decks meta
        for (let localDeckMeta of localDecksMeta) {
          let serverDeckMeta = serverDecksMeta.filter(function (deckMetaToCheck) {
            return deckMetaToCheck.deck_id !== localDeckMeta.deck_id
            })  
          // if the local version is newer, upload it
          if (localDeckMeta.edited > serverDeckMeta.edited) {
            let decks = JSON.parse(JSON.stringify(context.state.decks))
            let deck = decks.filter(function (deckToCheck) {
              return deckToCheck.deck_id === localDeckMeta.deck_id
              }) 
            let putDeckURL = context.state.serverURL + '/put_deck';
            let putDeckData = {
              'deck_id': deck.deck_id,
              'deck': deck,
              'title': deck.title,
              'edited': deck.edited 
            }
            await fetch(putDeckURL, { 
              headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
              body: JSON.stringify(putDeckData),
              method: 'PUT',
              })
              .then(response => response.json())
              //responseData
              .then(() => {
                  console.log("PUT deck ", responseData);
              }).catch(function(err) {
                context.commit('toggleSyncFailed', true)
                console.log(err);
              });
          }  
          // if the server version is newer, downlaod it
          else if (localDeckMeta.edited < serverDeckMeta.edited) {
            let getDeckURL = context.state.serverURL + '/get_deck' 
            let getDeckData = {'deck_id': localDeckMeta.deck_id}
            await fetch(getDeckURL, {
              headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
              body: JSON.stringify(getDeckData),
              method: 'GET'
              })
              .then(response => response.json())
              .then((responseData) => {
                  console.log("deck downloaded", responseData)
                 
                 
                  context.commit('updateDeck', responseData)
                  let newUserCollection = JSON.parse(JSON.stringify(context.state.userCollection))
                  newUserCollection.deck_ids.push(responseData.deck_id)
                  context.commit('updateUserCollection', newUserCollection)
                  context.commit('updateLastSyncsData', thisSyncsData)
              })
              .catch(function(err) {  
                context.commit('toggleSyncFailed', true)
                console.log(err); 
                return null
              });
          } 
        }
       

      






        // these need to be deep copies, so they don't change in the middle of the sync
        let decks = JSON.parse(JSON.stringify(context.state.decks)) //reload decks, cause they might be changed by above user collection section
        let lastSyncDecks = JSON.parse(JSON.stringify(context.state.lastSyncsData.decks))
        let thisSyncsData = {
          decks: decks,
          userCollection: userCollection }
        if (userCollection != lastUserCollection) {
          // console.log('user collection changed')
        }
        if (decks != lastSyncDecks) {
        // console.log("decks changed (but maybe just order, not content)")
          let lastSyncDecksDeckIds = []
          for (let lastSyncDeck of lastSyncDecks) {
            lastSyncDecksDeckIds.push(lastSyncDeck.deck_id)
          }
          for (let deck of decks) {
            if (lastSyncDecksDeckIds.includes(deck.deck_id)){
              for (let lastSyncDeck of lastSyncDecks) {
                if (deck.deck_id === lastSyncDeck.deck_id && deck.edited > lastSyncDeck.edited) {
                  // console.log("this deck changed" + deck.title + " "  + deck.deck_id + ' edited: ' + deck.edited)
                  // console.log('changed with this deck' + deck.title + " " + lastSyncDeck.deck_id + ' edited: ' + lastSyncDeck.edited)
                  let putDeckURL = context.state.serverURL + '/put_deck';
                  let data = {
                    'deck_id': deck.deck_id,
                    'deck': deck,
                    'title': deck.title,
                    'edited': deck.edited 
                }
                // console.log("starting api call");
                context.commit('updateLastSyncsData', thisSyncsData)
                await fetch(putDeckURL, { 
                    headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
                    body: JSON.stringify(data),
                    method: 'PUT',
                    })
                    .then(response => response.json())
                    .then((responseData) => {
                        //  console.log(responseData)
                        if (responseData.message !== 'Up to date') {
                          // console.log(responseData)
                        }
                        // console.log('finished syncing')   
                        // if (response data.. says that the server had a newer version) {
                        // prompt user if they want to accept changes from the database. changes made locally during the sync will be discarded
                        // click to show a list of changes 
                        // }
                        // context.commit('updateUserCollection', data)
                        // context.commit('updateDecks', data)
                        // context.dispatch('refreshDecksMeta')
                        // context.dispatch('refreshLastSyncsData')
                        // actually, this step should just be logged here, but dealt with after all the decks have synced
                        }).catch(function() {
                            context.commit('toggleSyncFailed', true)
                            // console.log(err);
                        });
                }
                else if (deck.deck_id === lastSyncDeck.deck_id) {
                  // console.log("this deck unchanged: " + deck.title + " " + deck.deck_id + ' edited: ' + deck.edited)
                  // console.log('unchanged with this deck: ' + lastSyncDeck.title + " " + lastSyncDeck.deck_id + ' edited: ' + lastSyncDeck.edited)
                }
              }
            } else {
              // post not put
              // console.log("this is a new deck to upload " + deck.title + " " + deck.deck_id + ' edited: ' + deck.edited)
              let putDeckURL = context.state.serverURL + '/post_deck';
              let data = {
                'deck_id': deck.deck_id,
                'deck': deck,
                'title': deck.title,
                'edited': deck.edited 
              }
              // console.log("starting api call");
              context.commit('updateLastSyncsData', thisSyncsData)
              await fetch(putDeckURL, { 
                  headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
                  body: JSON.stringify(data),
                  method: 'POST',
                  })
                  .then(response => response.json())
                  //responseData
                  .then(() => {
                      // console.log(responseData);
                      //err
                  }).catch(function() {
                    context.commit('toggleSyncFailed', true)
                    // console.log(err);
                  });
            }
          }
        }
      }
      context.commit('toggleSyncing', false)
      context.commit('toggleDataChanged', false)
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
