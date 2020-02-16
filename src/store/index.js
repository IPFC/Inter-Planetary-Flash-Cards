import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersistence from 'vuex-persist';
import Cookies from 'js-cookie'
import _ from 'lodash';   
const uuidv4 = require('uuid/v4');

Vue.use(Vuex)

const vuexCookie = new VuexPersistence({
  restoreState: (key) => Cookies.getJSON(key),
  saveState: (key, state) =>
    Cookies.set(key, state, {
      expires: 3
    }),
  reducer: (state) => ({
    jwt: state.jwt,
    pinataKeys: state.pinataKeys
  })
})

const vuexLocal = new VuexPersistence({
  key: 'vuex', // The key to store the state on in the storage provider.
  storage: window.localStorage,
  // Function that passes the state and returns the state with only the objects you want to store.
  reducer: (state) => ({
    userCollection: state.userCollection,
    decks: state.decks,
    currentDeckId: state.deck,
    lastSyncsData: state.lastSyncsData
  })
  // Function that passes a mutation and lets you decide if it should update the state in localStorage.
  // filter: mutation => (true)
})

const store = new Vuex.Store({
  state: {
    jwt: null,
    jwtValid: false,
    pinataKeys: null,
    userCollection: null,
    decks: null,
    currentDeckId: null,
    cardToEditIndex: null,
    navProgressCounter: '0 / 0',
    lastSyncsData: null,
    syncing: false,
    syncFailed: false,
    serverURL: 'https://ipfc-midware.herokuapp.com',
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
    updatePinataKeys(state, data) {
      state.pinataKeys = data
    },
    toggleSyncing(state, bool) {
      state.syncing = bool
    },
    updateUserCollection(state, data) {
      state.userCollection = data
    },
    updateSettings(state, data) {
      state.userCollection.webapp_settings = data
    },
    updateSetting(state, data) {
      let settingSection = data.settingSection
      let settingName = data.settingName
      let settingData = data.setting
      state.userCollection.webapp_settings[settingSection][settingName] = settingData
      state.userCollection.webapp_settings.edited = new Date().getTime() 
    },
    updateSettingSection(state, data) {
      let settingSection = data.settingSection
      let settingsData = data.settings
      state.userCollection.webapp_settings[settingSection]= settingsData
      state.userCollection.webapp_settings.edited = new Date().getTime() 
    },
    addDeck(state, newDeck) {
      state.decks.unshift(newDeck)
      state.userCollection.deck_ids.push(newDeck.deck_id)
    },
    updateDeck(state, data) {
        let newerDeck = data.deck
        let oldDeckLst = state.decks.filter(function(deckToCheck) {
          return deckToCheck.deck_id === newerDeck.deck_id
        })
        if (oldDeckLst.length > 0) {
          let oldDeck = oldDeckLst[0]
          let oldDeckIndex = state.decks.indexOf(oldDeck)
          if (!data.fromSync){
            newerDeck.edited = new Date().getTime()   // this screws up sync if updated
          }
          state.decks.splice(oldDeckIndex, 1);
          state.decks.push(newerDeck)
      }
    },
    updateDecks(state, data) {
      state.decks = data
    },
    deleteDeck(state, deck_id) {
      // add to usercollection deleted list
      state.userCollection.deleted_deck_ids.push(deck_id)
      // remove from usercollection included list
      let deckIdIndex = state.userCollection.deck_ids.indexOf(deck_id)
      state.userCollection.deck_ids.splice(deckIdIndex, 1);

      // remove the deck from 'decks' 
      let deckIndex 
      for (let deck of state.decks) {
        if (deck.deck_id === deck_id) {
          deckIndex = state.decks.indexOf(deck)
          break
        }
      }
      if (deckIndex !== -1) { //just in case its alraady not there 
        state.decks.splice(deckIndex, 1);
      }
    },
    newCard (state, data) {
      // new blank card
      let newCard = data.newCard
      let deck_id= data.deck_id
      for (let deck of state.decks) {
        if (deck.deck_id === deck_id) {
          deck.cards.push(newCard)
          deck.edited = new Date().getTime() 
          break
        }
      }
    },
    addCard (state, data) {
      // insert card with data
      let deck_id = data.deck_id 
      let card = data.card
      for (let deck of state.decks) {
        if (deck.deck_id === deck_id) {
          let sameCount = 0
          for (let origCard of deck.cards){
            if (origCard.card_id === card.card_id){
              sameCount ++
              break
            }
          }
          if (sameCount === 0) {
            deck.cards.push(card)
            deck.edited = new Date().getTime()
          }
          break
        }
      }
    },
    deleteCard (state, data) {
      let deck_id = data.deck_id 
      let card_id = data.card_id
      let cardIndex
      for (let deck of state.decks) {
        if (deck.deck_id === deck_id) {
          for (let card of deck.cards) {
            if (card.card_id === card_id) {
              cardIndex = deck.cards.indexOf(card)
              if (cardIndex !== -1) { //just in case its alraady not there 
                deck.cards.splice(cardIndex, 1)
                deck.edited = new Date().getTime()
                break
              }
            }
          }
          break
        }
      }
    },
    updateCard(state, data) {
      let deck_id = data.deck_id 
      let newCard = JSON.parse(JSON.stringify(data.card)) 
      let cardIndex
      for (let deck of state.decks) {
        if (deck.deck_id === deck_id) {
          for (let oldCard of deck.cards) {
            if (oldCard.card_id === newCard.card_id) {
              cardIndex = deck.cards.indexOf(oldCard)
              if (cardIndex !== -1) { //just in case its not there 
                deck.cards.splice(cardIndex, 1, newCard)
                deck.edited = new Date().getTime()
                break
              }
            }
          }
          break
        }
      }
    },
    updateCurrentDeckId(state, data) {
      state.currentDeckId = data
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
    updateSchedule(state, data) {
      state.userCollection.schedule = data
    },
    addCardToSchedule(state, card_id) {
      let dupCount = 0
      for (let scheduleItem of state.userCollection.schedule.list) {
        if (scheduleItem.card_id === card_id) {
              dupCount ++
          break
        }
      }
      if (dupCount === 0){
        state.userCollection.schedule.list.push({ 
          card_id: card_id, 
          level: 0, 
          due: new Date().getTime(),
          lastInterval: null
        })
        state.userCollection.schedule.edited = new Date().getTime() 
      }
    },
    updateCardSchedule(state, data) {
      let card_id = data.card_id
      let newLevel = data.level 
      let newDue = data.due
      let newLastInterval = data.lastInterval
      for (let scheduleItem of state.userCollection.schedule.list) {
        if (scheduleItem.card_id === card_id) {
          scheduleItem.level = newLevel 
          scheduleItem.due = newDue
          scheduleItem.lastInterval = newLastInterval
          state.userCollection.schedule.edited = new Date().getTime()
          break
        }
      }
    },
    resetCardSchedule(state, card_id) {
      let newLevel = 0
      let newDue = new Date().getTime()
      for (let scheduleItem of state.userCollection.schedule.list) {
        if (scheduleItem.card_id === card_id) {
          scheduleItem.level = newLevel 
          scheduleItem.due = newDue
          scheduleItem.lastInterval = null
          state.userCollection.schedule.edited = new Date().getTime() 
          break
        }
      }
    },
    deleteCardFromSchedule(state, card_id) {
      let schedule = state.userCollection.schedule.list
      for (let scheduleItem of schedule) {
        if (scheduleItem.card_id === card_id)
        schedule.splice(schedule.indexOf(scheduleItem), 1)
        schedule.edited = new Date().getTime() 
        break
      }
    }
  },
  actions: {
    newCard(context, deck_id) {
      let newCard = {
        card_id: uuidv4(),
        card_tags: ["Daily Review"],
        front_text: "",
        back_text:"",
        front_rich_text: "",
        back_rich_text:"",
      }
      let data = { newCard: newCard, deck_id: deck_id }
      context.commit('newCard', data)
      context.commit('addCardToSchedule', newCard.card_id)
    },
    updateCard(context, data) {
      this.context.commit('updateCard', data)
    },
    navProgress (context, data) {   
        let outputString = data.completed + " / "  + data.totalCards
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
        const exp = new Date(data.exp * 1000) // JS deals with dates in milliseconds since epoch, python in seconds
        const now = new Date()
        context.commit('toggleJwtValid', now < exp)
      }
    },
    levelUpCard(context, card_id) {
      let cardData = null
      for (let scheduleItem of context.state.userCollection.schedule.list) {
        if (scheduleItem.card_id === card_id) {
          cardData = JSON.parse(JSON.stringify(scheduleItem))
          break
        }
      }
      let newLevel = cardData.level + 1
      let newDue = cardData.due
      let newLastInterval = cardData.lastInterval
      let settings = context.state.userCollection.webapp_settings.scheduleSettings
      if (newLevel <= settings.initialReviews.length) {
        let max = settings.initialReviews[newLevel-1] * 60000 * (1 + settings.randomizer)
        let min = settings.initialReviews[newLevel-1] * 60000 * (1 - settings.randomizer)
        newDue += Math.random() * (max - min + 1) + min
      } else { 
        let max = 0
        let min = 0
        if (newLastInterval === null) {
          newLastInterval = 86400 // 1 day in seconds
          max = newLastInterval * (1 + settings.randomizer)
          min = newLastInterval * (1 - settings.randomizer)
        }
        else {
          newLastInterval *= settings.laterReviewsMultiplier
          max = newLastInterval * (1 + settings.randomizer)
          min = newLastInterval * (1 - settings.randomizer)
        }
        newDue += Math.random() * (max - min + 1) + min
      }
      // console.log('    newLevel',newLevel)        
      // console.log('    newDue', newDue -1581330417)        
      let updateData = { 
        card_id: card_id,
        level: newLevel,
        due: newDue, 
        lastInterval: newLastInterval 
      }
      context.commit('updateCardSchedule', updateData)
    },
    levelDownCard(context, card_id) {
      let cardData = null
      for (let scheduleItem of context.state.userCollection.schedule.list) {
        if (scheduleItem.card_id === card_id) {
          cardData = JSON.parse(JSON.stringify(scheduleItem))
          break
        }
      }      
      let newLevel = cardData.level
      let newDue = cardData.due
      let lastInterval = cardData.lastInterval
      let settings = context.state.userCollection.webapp_settings.scheduleSettings

      if (settings.failMode === 'reset') {
        newLevel = 0
        newDue = new Date().getTime() 
        lastInterval = null
      } else {
        newLevel -= settings.failMode
        // this could be more perfected
        for (let i = 0; i < settings.failMode; i++) {
          lastInterval /= settings.laterReviewsMultiplier
          newDue -= lastInterval
        }
      }
      let updateData = { card_id: card_id,
                         level: newLevel,
                         due: newDue, 
                         lastInterval: lastInterval}
      context.commit('updateCardSchedule', updateData)
    },
    refreshLastSyncsData(context) {
      let lastDecks = JSON.parse(JSON.stringify(context.state.decks))
      let lastUserCollection = JSON.parse(JSON.stringify(context.state.userCollection))
      let lastSyncsData = {
          decks: lastDecks,
          userCollection: lastUserCollection
      }
      context.commit('updateLastSyncsData', lastSyncsData)
    },
    async sync(context) {
      // console.log('    sync called')
      if (context.state.syncing === true) {
        // console.log('    syncing blocked')
        return null
      }
      else{
        context.commit('toggleSyncing', true)
        context.commit('toggleSyncFailed', false)
        while (!context.state.syncFailed && context.state.syncing ) {
          try {
            // console.log("    starting sync")
            let serverCollection     
            let localDecksMeta = JSON.parse(JSON.stringify(context.getters.decksMeta)) 
            // console.log('    localDecksMeta ', localDecksMeta)
            let decks = JSON.parse(JSON.stringify(context.state.decks)) //reload decks, cause they might be changed by above user collection section
            let userCollection = JSON.parse(JSON.stringify(context.state.userCollection))
            let serverDecksMeta = null
            let getMetaAndCollectionURL = context.state.serverURL + '/get_meta_and_collection' 
            await fetch(getMetaAndCollectionURL, {
              headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
              method: 'GET',
              })
              .then(response => response.json())
              .then((responseData) => {
                  // console.log("    Get Meta and Collection ",responseData)
                  serverCollection = responseData['user_collection']
                  serverDecksMeta = responseData['decks_meta']
              })
              .catch(function() {  
                context.commit('toggleSyncFailed', true)
                // console.log(err); 
                return null
              });
            // user collections comparisons
            if (!_.isEqual(serverCollection, userCollection)){
              for (let server_deleted_deck_id of serverCollection.deleted_deck_ids) {        
                // if server deleted, but local deleted isn't, delete locally
                if (!userCollection.deleted_deck_ids.includes(server_deleted_deck_id)) {
                  // add to local usercollection deleted list
                  userCollection.deleted_deck_ids.push(server_deleted_deck_id)
                  // remove from usercollection included list
                  let deck_idIndex = userCollection.deck_ids.indexOf(server_deleted_deck_id)
                  // if its actually in local
                  if (deck_idIndex !== -1)  {
                    userCollection.deck_ids.splice(deck_idIndex, 1);
                    // remove the deck from 'decks'  // note this is only for 'lastsyncsdata' purposes.
                    let deckToDeleteLst = decks.filter(function (deckToCheck) {
                      return deckToCheck.deck_id === server_deleted_deck_id
                      }) 
                    let deckToDelete = deckToDeleteLst[0]
                    let deckIndex = decks.indexOf(deckToDelete)
                    if (deckIndex !== -1) { //just in case its not there alraady
                      decks.splice(deckIndex, 1);
                    }
                    // actually remove from store, decks and user collection
                    context.commit('deleteDeck', server_deleted_deck_id)
                  }
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
                  .then(() => {
                      // console.log("    decks deleted: ", responseData)
                  })
                  .catch(function() {  
                    context.commit('toggleSyncFailed', true)
                    // console.log(err); 
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
                  method: 'POST'
                  })
                  .then(response => response.json())
                  .then((responseData) => {
                      // console.log("    decks downloaded", responseData)
                      for (let downloadedDeck of responseData) {
                        decks.unshift(downloadedDeck)
                        userCollection.deck_ids.push(downloadedDeck.deck_id)
                        context.commit('addDeck', downloadedDeck)
                      }
                  })
                  .catch(function() {  
                    context.commit('toggleSyncFailed', true)
                    // console.log(err); 
                    return null
                  });
              }
              
              // if there are new decks locally, add their IDs, post the deck.
              let decksToPost = []
              for (let client_deck_id of userCollection.deck_ids ) { 
                if (!serverCollection.deck_ids.includes(client_deck_id)) {
                  let deckToPostLst = decks.filter(function (deckToCheck) {
                    return deckToCheck.deck_id === client_deck_id
                    }) 
                  if (deckToPostLst.length > 0) {
                    let deckToPost = deckToPostLst[0]
                    decksToPost.push(deckToPost)
                  }  
                }
              }
              if (decksToPost.length > 0) {
                // console.log('    posting decks ', decksToPost)
                let postDecksURL = context.state.serverURL + '/post_decks';
                await fetch(postDecksURL, { 
                  headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
                  body: JSON.stringify(decksToPost),
                  method: 'POST',
                  })
                  .then(response => response.json())
                  //responseData
                  .then(() => {
                      // console.log("    POSTed decks ", responseData);
                      //err
                  }).catch(function() {
                    context.commit('toggleSyncFailed', true)
                    // console.log(err);
                    return null
                  });
              }
              // sync settings changes
              if (serverCollection.webapp_settings !== userCollection.webapp_settings) {
                if (serverCollection.webapp_settings.edited > userCollection.webapp_settings.edited){
                  context.commit('updateSettings', serverCollection.webapp_settings)
                }
                if (serverCollection.webapp_settings.edited < userCollection.webapp_settings.edited){
                  let putUserCollectionURL = context.state.serverURL + '/put_user_collection';
                  let putUserCollectionData = {'webapp_settings': userCollection.webapp_settings }
                  await fetch(putUserCollectionURL, { 
                    headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
                    body: JSON.stringify(putUserCollectionData),
                    method: 'PUT',
                    })
                    .then(response => response.json())
                    //responseData
                    .then(() => {
                        // console.log("    Put webapp settings ", responseData);
                        //err
                    }).catch(function() {
                      context.commit('toggleSyncFailed', true)
                      // console.log(err);
                      return null
                    });
                }
              }
              // sync schedule changes
              if (serverCollection.schedule !== userCollection.schedule) {
                if (serverCollection.schedule.edited > userCollection.schedule.edited){
                  context.commit('updateSchedule', serverCollection.schedule)
                }
                if (serverCollection.schedule.edited < userCollection.schedule.edited){
                  let putUserCollectionURL = context.state.serverURL + '/put_user_collection';
                  let putUserCollectionData = {'schedule': userCollection.schedule }
                  await fetch(putUserCollectionURL, { 
                    headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
                    body: JSON.stringify(putUserCollectionData),
                    method: 'PUT',
                    })
                    .then(response => response.json())
                    //responseData
                    .then(() => {
                        // console.log("    Put schedule changes", responseData);
                        //err
                    }).catch(function() {
                      context.commit('toggleSyncFailed', true)
                      // console.log(err);
                      return null
                    });
                }
              }
            }
            // decks meta comparisons
            let decksToPut = []
            let decksToUpdateLocally = []
            // compare the edited dates for each deck in local and server decks meta
            for (let localDeckMeta of localDecksMeta) {
              for (let serverDeckMeta of serverDecksMeta){
                if (localDeckMeta.deck_id === serverDeckMeta.deck_id){
                   // if the local version is newer, upload it
                  //  console.log('    localDeckMeta.edited',localDeckMeta.edited)
                  //  console.log('    serverDeckMeta.edited',serverDeckMeta.edited)
                  if (localDeckMeta.edited > serverDeckMeta.edited) {
                    for(let deckToPut of decks ) {
                      if (deckToPut.deck_id === localDeckMeta.deck_id){
                        decksToPut.push(deckToPut)
                        break
                      }
                    }
                  }
                  // if the server version is newer, downlaod it
                  else if (localDeckMeta.edited < serverDeckMeta.edited) {
                    decksToUpdateLocally.push(serverDeckMeta.deck_id)
                  } 
                }
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
                .then(() => {
                    // console.log("    PUT decks ", responseData);
                }).catch(function() {
                  context.commit('toggleSyncFailed', true)
                  // console.log(err);
                });
            }
          
            // get all newer server decks
            if (decksToUpdateLocally.length > 0) {
              let getDecksURL = context.state.serverURL + '/get_decks'
              await fetch(getDecksURL, {
              headers: { 'Content-Type': 'application/json', 'x-access-token': context.state.jwt},
              body: JSON.stringify(decksToUpdateLocally),
              method: 'POST'
              })
              .then(response => response.json())
              .then((responseData) => {
                  // console.log("    decks downloaded", responseData)
                  for (let newerDeck of responseData) {
                    let oldDeckLst = decks.filter(function(deckToCheck) {
                      return deckToCheck.deck_id === newerDeck.deck_id
                    })
                    if (oldDeckLst.length > 0) {
                      let oldDeck = oldDeckLst[0]
                      let oldDeckIndex = decks.indexOf(oldDeck)
                      decks.splice(oldDeckIndex, 1);
                      decks.push(newerDeck)
                      context.commit('updateDeck', { deck: newerDeck, fromSync: true})
                    }
                  }
              })
              .catch(function() {  
                context.commit('toggleSyncFailed', true)
                // console.log(err); 
                return null
              }); 
            }
          context.commit('updateLastSyncsData', {
            decks: decks,
            userCollection: userCollection
          })
          // console.log('    set last sync data',{
          //   decks: decks,
          //   userCollection: userCollection
          // } )
          context.commit('toggleSyncing', false)
          }catch{
            context.commit('toggleSyncFailed', true)
          } 
          finally{
              context.commit('toggleSyncing', false)
              // console.log('    failed or not',context.state.syncFailed)
        }
       }
      } 
    }
  },
  getters: {
    decksMeta(state) {
      let decks = state.decks
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
      newDecksMeta.sort(function(a, b) { 
        return b.edited - a.edited;
    })
      return newDecksMeta
    },
    currentDeck(state, getters) {
      if (state.currentDeckId === "reviewDeck") {
          return getters.reviewDeck
      }
      else {
        for (let deck of state.decks) {
          if (deck.deck_id === state.currentDeckId) {
            return deck
          }
        }
      }
    },
    // redundant?
    isAuthenticated: state => state.jwtValid,
    getDecks: state => state.decks,
    navProgressCounter: state => state.navProgressCounter,
    reviewDeck(state) {
      if (state.userCollection === null || state.decks === null || state.userCollection === undefined || state.decks === undefined) {
        return {cards: [], allTags: [], title: 'Review Deck',  } 
      }
      else {
        let decks = state.decks
        let reviewDeck = {cards: [], allTags: [], title: 'Review Deck',  } 
        //since we are running through the whole collection anyway, let all tags come for the ride
        for (let deck of decks) {
          for (let card of deck.cards) {
            for (let tag of card.card_tags){
              if(!reviewDeck.allTags.includes(tag)){
                reviewDeck.allTags.push(tag)
              }
            }
            if (card.card_tags.includes('Daily Review') && !reviewDeck.cards.includes(card)){
              reviewDeck.cards.push(card)
            }
          }
        }
        return reviewDeck        
      }
     
    },
    todaysDeck(state, getters) {
      if (state.userCollection === null || state.decks === null || state.userCollection === undefined || state.decks === undefined) {
        return {cards: [], allTags: [], title: 'Review Deck',  } 
      } 
      else {
        let schedule = state.userCollection.schedule.list
        let reviewDeck = getters.reviewDeck
        let todaysDeck = { cards: [], title: `Today's Review`}
        let now = new Date().getTime() 
        let cutOff = now + (3600 * 23) // cards due within 23 hours
        // console.log('cutoff', cutOff-1581318652)
        let todaysScheduleItems = []
        for (let scheduleItem of schedule) {
          // console.log('scheduleItem.due', scheduleItem.due-1581318652)

          if (scheduleItem.due <= cutOff) {
            todaysScheduleItems.push(scheduleItem)
          }
        }
        let todaysScheduleItemsSorted = _.sortBy(todaysScheduleItems, 'due')
        // console.log('todaysScheduleItemsSorted', todaysScheduleItemsSorted)

        // need to figure out how to limit the list to 50 cards, but if its a getter, it will auto reset...
        for (let scheduleItem of todaysScheduleItemsSorted) {
          // this could get expensive later
          for (let card of reviewDeck.cards) {
            if (card.card_id === scheduleItem.card_id ) {
              todaysDeck.cards.push(card)
              break
            }
          }
        }
        return todaysDeck        
      }

    },
    // dataChanged (state) {
    //   if(state.userCollection !== null &&  state.lastSyncsData !== null ) {
    //     if(!_.isEqual(state.userCollection, state.lastSyncsData.userCollection) || !_.isEqual(state.decks, state.lastSyncsData.decks)) {
    //       if(!_.isEqual(state.userCollection, state.lastSyncsData.userCollection)) {
    //       return true
    //     } else {
    //       return false
    //       }
    //     }
    //   }
    //   return false
    // }
    // dataChanged (state) {
    //   if(!_.isEqual(state.userCollection, state.lastSyncsData.userCollection) || !_.isEqual(state.decks, state.lastSyncsData.decks)) {
    //     if(!_.isEqual(state.userCollection, state.lastSyncsData.userCollection)) {
    //       // console.log('       collection unequal')
    //     //   for (let item in state.userCollection) {
    //     //     for (let key of Object.keys(state.userCollection)){
    //     //       for (let otherItem in state.lastSyncsData.userCollection){
    //     //         for (let otherKey of Object.keys(state.lastSyncsData.userCollection)){
    //     //               // console.log('   key', key)
    //     //               // console.log('   otherKey', otherKey)
    //     //             if (key == otherKey &&  !_.isEqual(item, otherItem))
    //     //             console.log('   unequal items')
    //     //             console.log('        state', item)
    //     //             console.log(state.userCollection[item])
    //     //             console.log('       last sync,', otherItem)
    //     //             console.log(state.lastSyncsData.userCollection[otherItem])

    //     //         }
    //     //       }
    //     //     }
    //     //   }
    //     // }
    //     // if(!_.isEqual(state.decks, state.lastSyncsData.decks)) {
    //     //   for(let deck of state.decks){
    //     //     for (let syncdeck of state.lastSyncsData.decks){
    //     //       if (deck.deck_id === syncdeck.deck_id && deck.edited !== syncdeck.edited){
    //     //         console.log(deck.title)
    //     //       }
    //     //     }
    //     //   }
    //       // console.log('       decks unequal')
    //     }
    //     return true
    //   } else {
    //     return false
    //   }
    // }
  },
  plugins: [vuexCookie.plugin, vuexLocal.plugin]
})

export default store
