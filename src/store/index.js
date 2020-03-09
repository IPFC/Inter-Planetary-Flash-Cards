import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersistence from 'vuex-persist';
import Cookies from 'js-cookie';
import { sortBy } from 'lodash/core';
const uuidv4 = require('uuid/v4');
// web workers in Vuex: https://logaretm.com/blog/2019-12-21-vuex-off-mainthread/
const syncWorker = new Worker('../utils/syncWorker.js', {
  type: 'module',
});

Vue.use(Vuex);

const vuexCookie = new VuexPersistence({
  restoreState: key => Cookies.getJSON(key),
  saveState: (key, state) =>
    Cookies.set(key, state, {
      expires: 3,
    }),
  reducer: state => ({
    jwt: state.jwt,
    pinataKeys: state.pinataKeys,
  }),
});

const vuexLocal = new VuexPersistence({
  key: 'vuex', // The key to store the state on in the storage provider.
  storage: window.localStorage,
  // Function that passes the state and returns the state with only the objects you want to store.
  reducer: state => ({
    userCollection: state.userCollection,
    decks: state.decks,
    currentDeckId: state.deck,
    lastSyncsData: state.lastSyncsData,
  }),
  // Function that passes a mutation and lets you decide if it should update the state in localStorage.
  // filter: mutation => (true)
});

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
      state.jwt = newJwt;
    },
    deleteJwt(state) {
      state.jwt = null;
    },
    toggleJwtValid(state, bool) {
      state.jwtValid = bool;
    },
    updatePinataKeys(state, data) {
      state.pinataKeys = data;
    },
    toggleSyncing(state, bool) {
      state.syncing = bool;
    },
    updateInitialSync(state, num) {
      state.initialSync = num;
    },
    updateOnline(state, bool) {
      state.online = bool;
    },
    updateUserCollection(state, data) {
      state.userCollection = data;
    },
    updateSettings(state, data) {
      state.userCollection.webapp_settings = data;
    },
    updateSetting(state, data) {
      const settingSection = data.settingSection;
      const settingName = data.settingName;
      const settingData = data.setting;
      state.userCollection.webapp_settings[settingSection][settingName] = settingData;
      state.userCollection.webapp_settings.edited = new Date().getTime();
    },
    updateSettingSection(state, data) {
      const settingSection = data.settingSection;
      const settingsData = data.settings;
      state.userCollection.webapp_settings[settingSection] = settingsData;
      state.userCollection.webapp_settings.edited = new Date().getTime();
    },
    addDeck(state, newDeck) {
      state.decks.unshift(newDeck);
      state.userCollection.deck_ids.push(newDeck.deck_id);
    },
    updateDeck(state, data) {
      const newerDeck = data.deck;
      const oldDeckLst = state.decks.filter(function(deckToCheck) {
        return deckToCheck.deck_id === newerDeck.deck_id;
      });
      if (oldDeckLst.length > 0) {
        const oldDeck = oldDeckLst[0];
        const oldDeckIndex = state.decks.indexOf(oldDeck);
        if (!data.fromSync) {
          newerDeck.edited = new Date().getTime(); // this screws up sync if updated
        }
        state.decks.splice(oldDeckIndex, 1);
        state.decks.push(newerDeck);
      }
    },
    updateDecks(state, data) {
      state.decks = data;
    },
    deleteDeck(state, deckId) {
      // add to usercollection deleted list
      state.userCollection.deleted_deck_ids.push(deckId);
      // remove from usercollection included list
      const deckIdIndex = state.userCollection.deck_ids.indexOf(deckId);
      state.userCollection.deck_ids.splice(deckIdIndex, 1);

      // remove the deck from 'decks'
      let deckIndex;
      for (const deck of state.decks) {
        if (deck.deck_id === deckId) {
          deckIndex = state.decks.indexOf(deck);
          break;
        }
      }
      if (deckIndex !== -1) {
        // just in case its alraady not there
        state.decks.splice(deckIndex, 1);
      }
    },
    newCard(state, data) {
      // new blank card
      const newCard = data.newCard;
      const deckId = data.deck_id;
      for (const deck of state.decks) {
        if (deck.deck_id === deckId) {
          deck.cards.push(newCard);
          deck.edited = new Date().getTime();
          break;
        }
      }
    },
    addCard(state, data) {
      // insert card with data
      const deckId = data.deck_id;
      const card = data.card;
      for (const deck of state.decks) {
        if (deck.deck_id === deckId) {
          let sameCount = 0;
          for (const origCard of deck.cards) {
            if (origCard.card_id === card.card_id) {
              sameCount++;
              break;
            }
          }
          if (sameCount === 0) {
            deck.cards.push(card);
            deck.edited = new Date().getTime();
          }
          break;
        }
      }
    },
    deleteCard(state, data) {
      const deckId = data.deck_id;
      const cardId = data.card_id;
      let cardIndex;
      for (const deck of state.decks) {
        if (deck.deck_id === deckId) {
          for (const card of deck.cards) {
            if (card.card_id === cardId) {
              cardIndex = deck.cards.indexOf(card);
              if (cardIndex !== -1) {
                // just in case its alraady not there
                deck.cards.splice(cardIndex, 1);
                deck.edited = new Date().getTime();
                break;
              }
            }
          }
          break;
        }
      }
    },
    updateCard(state, data) {
      const deckId = data.deck_id;
      const newCard = JSON.parse(JSON.stringify(data.card));
      let cardIndex;
      for (const deck of state.decks) {
        if (deck.deck_id === deckId) {
          for (const oldCard of deck.cards) {
            if (oldCard.card_id === newCard.card_id) {
              cardIndex = deck.cards.indexOf(oldCard);
              if (cardIndex !== -1) {
                // just in case its not there
                deck.cards.splice(cardIndex, 1, newCard);
                deck.edited = new Date().getTime();
                break;
              }
            }
          }
          break;
        }
      }
    },
    updateCurrentDeckId(state, data) {
      state.currentDeckId = data;
    },
    updateProgressCounter(state, data) {
      state.navProgressCounter = data;
    },
    updateCardToEditIndex(state, index) {
      state.cardToEditIndex = index;
    },
    updateLastSyncsData(state, data) {
      state.lastSyncsData = data;
    },
    toggleSyncFailed(state, bool) {
      state.syncFailed = bool;
    },
    updateSchedule(state, data) {
      state.userCollection.schedule = data;
    },
    addCardToSchedule(state, cardId) {
      let dupCount = 0;
      for (const scheduleItem of state.userCollection.schedule.list) {
        if (scheduleItem.card_id === cardId) {
          dupCount++;
          break;
        }
      }
      if (dupCount === 0) {
        state.userCollection.schedule.list.push({
          card_id: cardId,
          level: 0,
          due: new Date().getTime(),
          lastInterval: null,
        });
        state.userCollection.schedule.edited = new Date().getTime();
      }
    },
    updateCardSchedule(state, data) {
      const cardId = data.card_id;
      const newLevel = data.level;
      const newDue = data.due;
      const newLastInterval = data.lastInterval;
      for (const scheduleItem of state.userCollection.schedule.list) {
        if (scheduleItem.card_id === cardId) {
          scheduleItem.level = newLevel;
          scheduleItem.due = newDue;
          scheduleItem.lastInterval = newLastInterval;
          state.userCollection.schedule.edited = new Date().getTime();
          break;
        }
      }
    },
    resetCardSchedule(state, cardId) {
      const newLevel = 0;
      const newDue = new Date().getTime();
      for (const scheduleItem of state.userCollection.schedule.list) {
        if (scheduleItem.card_id === cardId) {
          scheduleItem.level = newLevel;
          scheduleItem.due = newDue;
          scheduleItem.lastInterval = null;
          state.userCollection.schedule.edited = new Date().getTime();
          break;
        }
      }
    },
    deleteCardFromSchedule(state, cardId) {
      const schedule = state.userCollection.schedule.list;
      for (const scheduleItem of schedule) {
        if (scheduleItem.card_id === cardId) schedule.splice(schedule.indexOf(scheduleItem), 1);
        schedule.edited = new Date().getTime();
        break;
      }
    },
  },
  actions: {
    newCard(context, deckId) {
      const newCard = {
        card_id: uuidv4(),
        card_tags: ['Daily Review'],
        front_text: '',
        back_text: '',
        front_rich_text: '',
        back_rich_text: '',
      };
      const data = {
        newCard: newCard,
        deck_id: deckId,
      };
      context.commit('newCard', data);
      context.commit('addCardToSchedule', newCard.card_id);
    },
    updateCard(context, data) {
      context.commit('updateCard', data);
    },
    navProgress(context, data) {
      const outputString = data.completed + ' / ' + data.totalCards;
      context.commit('updateProgressCounter', outputString);
    },
    logout(context) {
      context.commit('deleteJwt');
      context.commit('toggleJwtValid', false);
    },
    checkJwt(context) {
      const jwt = context.state.jwt;
      if (jwt === null) {
        context.commit('toggleJwtValid', false);
      } else if (!jwt || jwt.split('.').length < 3) {
        context.commit('toggleJwtValid', false);
      } else {
        const data = JSON.parse(atob(jwt.split('.')[1]));
        const exp = new Date(data.exp * 1000); // JS deals with dates in milliseconds since epoch, python in seconds
        const now = new Date();
        context.commit('toggleJwtValid', now < exp);
      }
    },
    levelUpCard(context, cardId) {
      let cardData = null;
      for (const scheduleItem of context.state.userCollection.schedule.list) {
        if (scheduleItem.card_id === cardId) {
          cardData = JSON.parse(JSON.stringify(scheduleItem));
          break;
        }
      }
      const newLevel = cardData.level + 1;
      let newDue = cardData.due;
      let newLastInterval = cardData.lastInterval;
      const settings = context.state.userCollection.webapp_settings.scheduleSettings;
      if (newLevel <= settings.initialReviews.length) {
        const max = settings.initialReviews[newLevel - 1] * 60000 * (1 + settings.randomizer);
        const min = settings.initialReviews[newLevel - 1] * 60000 * (1 - settings.randomizer);
        newDue += Math.random() * (max - min + 1) + min;
      } else {
        let max = 0;
        let min = 0;
        if (newLastInterval === null) {
          newLastInterval = 86400; // 1 day in seconds
          max = newLastInterval * (1 + settings.randomizer);
          min = newLastInterval * (1 - settings.randomizer);
        } else {
          newLastInterval *= settings.laterReviewsMultiplier;
          max = newLastInterval * (1 + settings.randomizer);
          min = newLastInterval * (1 - settings.randomizer);
        }
        newDue += Math.random() * (max - min + 1) + min;
      }
      // console.log('    newLevel',newLevel)
      // console.log('    newDue', newDue -1581330417)
      const updateData = {
        card_id: cardId,
        level: newLevel,
        due: newDue,
        lastInterval: newLastInterval,
      };
      context.commit('updateCardSchedule', updateData);
    },
    levelDownCard(context, cardId) {
      let cardData = null;
      for (const scheduleItem of context.state.userCollection.schedule.list) {
        if (scheduleItem.card_id === cardId) {
          cardData = JSON.parse(JSON.stringify(scheduleItem));
          break;
        }
      }
      let newLevel = cardData.level;
      let newDue = cardData.due;
      let lastInterval = cardData.lastInterval;
      const settings = context.state.userCollection.webapp_settings.scheduleSettings;

      if (settings.failMode === 'reset') {
        newLevel = 0;
        newDue = new Date().getTime();
        lastInterval = null;
      } else {
        newLevel -= settings.failMode;
        // this could be more perfected
        for (let i = 0; i < settings.failMode; i++) {
          lastInterval /= settings.laterReviewsMultiplier;
          newDue -= lastInterval;
        }
      }
      const updateData = {
        card_id: cardId,
        level: newLevel,
        due: newDue,
        lastInterval: lastInterval,
      };
      context.commit('updateCardSchedule', updateData);
    },
    refreshLastSyncsData(context) {
      const lastDecks = JSON.parse(JSON.stringify(context.state.decks));
      const lastUserCollection = JSON.parse(JSON.stringify(context.state.userCollection));
      const lastSyncsData = {
        decks: lastDecks,
        userCollection: lastUserCollection,
      };
      context.commit('updateLastSyncsData', lastSyncsData);
    },
    async cloudSync(context, skipSameCheck = false) {
      const data = {
        decks: context.state.decks,
        userCollection: context.state.userCollection,
        lastSyncsData: context.state.lastSyncsData,
        online: context.state.online,
        syncing: context.state.syncing,
        syncFailed: context.state.syncFailed,
        serverURL: context.state.serverURL,
        jwt: context.state.jwt,
        decksMeta: JSON.parse(JSON.stringify(context.getters.decksMeta)),
        skipSameCheck: skipSameCheck,
      };
      syncWorker.postMessage(data);
    },
  },
  getters: {
    decksMeta(state) {
      const decks = state.decks;
      const newDecksMeta = [];
      for (const deck of decks) {
        const deckMeta = {
          deck_cid: deck.deck_cid,
          deck_id: deck.deck_id,
          edited: deck.edited,
          title: deck.title,
          deck_length: deck.cards.length,
          icon_color: deck.icon_color,
        };
        newDecksMeta.push(deckMeta);
      }
      newDecksMeta.sort(function(a, b) {
        return b.edited - a.edited;
      });
      return newDecksMeta;
    },
    currentDeck(state, getters) {
      if (state.currentDeckId === 'reviewDeck') {
        return getters.reviewDeck;
      } else {
        for (const deck of state.decks) {
          if (deck.deck_id === state.currentDeckId) {
            return deck;
          }
        }
      }
    },
    // redundant?
    isAuthenticated: state => state.jwtValid,
    getDecks: state => state.decks,
    navProgressCounter: state => state.navProgressCounter,
    reviewDeck(state) {
      if (
        state.userCollection === null ||
        state.decks === null ||
        state.userCollection === undefined ||
        state.decks === undefined
      ) {
        return {
          cards: [],
          allTags: [],
          title: 'Review Deck',
        };
      } else {
        const decks = state.decks;
        const reviewDeck = {
          cards: [],
          allTags: [],
          title: 'Review Deck',
        };
        // since we are running through the whole collection anyway, let all tags come for the ride
        for (const deck of decks) {
          for (const card of deck.cards) {
            for (const tag of card.card_tags) {
              if (!reviewDeck.allTags.includes(tag)) {
                reviewDeck.allTags.push(tag);
              }
            }
            if (card.card_tags.includes('Daily Review') && !reviewDeck.cards.includes(card)) {
              reviewDeck.cards.push(card);
            }
          }
        }
        return reviewDeck;
      }
    },
    todaysDeck(state, getters) {
      if (
        state.userCollection === null ||
        state.decks === null ||
        state.userCollection === undefined ||
        state.decks === undefined
      ) {
        return {
          cards: [],
          allTags: [],
          title: 'Review Deck',
        };
      } else {
        const schedule = state.userCollection.schedule.list;
        const reviewDeck = getters.reviewDeck;
        const todaysDeck = {
          cards: [],
          title: `Today's Review`,
        };
        const now = new Date().getTime();
        const cutOff = now + 3600 * 23; // cards due within 23 hours
        // console.log('cutoff', cutOff-1581318652)
        const todaysScheduleItems = [];
        for (const scheduleItem of schedule) {
          // console.log('scheduleItem.due', scheduleItem.due-1581318652)

          if (scheduleItem.due <= cutOff) {
            todaysScheduleItems.push(scheduleItem);
          }
        }
        const todaysScheduleItemsSorted = sortBy(todaysScheduleItems, 'due');
        // console.log('todaysScheduleItemsSorted', todaysScheduleItemsSorted)

        // need to figure out how to limit the list to 50 cards, but if its a getter, it will auto reset...
        for (const scheduleItem of todaysScheduleItemsSorted) {
          // this could get expensive later
          for (const card of reviewDeck.cards) {
            if (card.card_id === scheduleItem.card_id) {
              todaysDeck.cards.push(card);
              break;
            }
          }
        }
        return todaysDeck;
      }
    },
  },
  plugins: [vuexCookie.plugin, vuexLocal.plugin],
});

syncWorker.onmessage = e => {
  // could add an if and a type option here to dispatch other actions
  store.commit(e.data.mutation, e.data.payload);
};

export default store;
