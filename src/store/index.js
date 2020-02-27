import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersistence from 'vuex-persist';
import Cookies from 'js-cookie'
import { sortBy} from 'lodash/core';
const uuidv4 = require('uuid/v4');
// web workers in Vuex: https://logaretm.com/blog/2019-12-21-vuex-off-mainthread/
const syncWorker = new Worker("../utils/syncWorker.js", { type: 'module' });

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
    initialSync: 0,
    online: false,
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
    updateInitialSync(state, num) {
      state.initialSync = num
    },
    updateOnline(state, bool) {
      state.online = bool
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
      context.commit('updateCard', data)
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
    async cloudSync (context, skipSameCheck=false) {
      let data = {
        decks: context.state.decks,
        userCollection: context.state.userCollection,
        lastSyncsData: context.state.lastSyncsData,
        online: context.state.online,  
        syncing: context.state.syncing,
        syncFailed: context.state.syncFailed,
        serverURL: context.state.serverURL,
        jwt: context.state.jwt,   
        decksMeta: JSON.parse(JSON.stringify(context.getters.decksMeta)),
        skipSameCheck: skipSameCheck
      }
      syncWorker.postMessage(data)
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
        let todaysScheduleItemsSorted = sortBy(todaysScheduleItems, 'due')
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
  },
  plugins: [vuexCookie.plugin, vuexLocal.plugin]
})

syncWorker.onmessage = e => {
  // could add an if and a type option here to dispatch other actions
  store.commit(e.data.mutation, e.data.payload)
}

export default store
