import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersistence from 'vuex-persist';
import localForage from 'localforage';

import Cookies from 'js-cookie';
import { sortBy } from 'lodash/core';
import { isEmpty } from 'lodash';
import { cardLevelUp } from '../utils/dataProcessing';
import defaultCollection from '../assets/defaultCollection.json';
const axios = require('axios');
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

// const vuexLocal = new VuexPersistence({
//   key: 'vuex', // The key to store the state on in the storage provider.
//   storage: window.localStorage,
//   // Function that passes the state and returns the state with only the objects you want to store.
//   reducer: state => ({
//     user_collection: state.user_collection,
//     decks: state.decks,
//     currentDeckId: state.deck,
//     lastSyncsData: state.lastSyncsData,
//   }),
//   // Function that passes a mutation and lets you decide if it should update the state in localStorage.
//   // filter: mutation => (true)
// });
const vuexLocalForage = new VuexPersistence({
  key: process.env.VUE_APP_STORAGE_KEY,
  storage: localForage,
  reducer: state => ({
    user_collection: state.user_collection,
    decks: state.decks,
    currentDeckId: state.deck,
    lastSyncsData: state.lastSyncsData,
  }), // only save decks module
  // undocumented bug in vuex-persist with localforage. Hacky fix from issues forum
  asyncStorage: true,
});
const initialState = {
  jwt: null,
  pinataKeys: null,
  user_collection: null,
  decks: null,
  currentDeckId: null,
  cardToEditIndex: null,
  navProgressCounter: '0 / 0',
  lastSyncsData: null,
  syncing: false,
  syncFailed: false,
  initialSync: 0,
  online: false,
  serverUrl: process.env.VUE_APP_API_URL,
};
const store = new Vuex.Store({
  state: initialState,

  mutations: {
    clearState(state) {
      state = initialState;
    },
    updateJwt(state, newJwt) {
      state.jwt = newJwt;
    },
    deleteJwt(state) {
      state.jwt = null;
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
      state.user_collection = data;
    },
    updateSettings(state, data) {
      state.user_collection.webapp_settings = data;
    },
    updateSetting(state, data) {
      const settingSection = data.settingSection;
      const settingName = data.settingName;
      const settingData = data.setting;
      state.user_collection.webapp_settings[settingSection][settingName] = settingData;
      state.user_collection.webapp_settings.edited = new Date().getTime();
    },
    updateSettingSection(state, data) {
      const settingSection = data.settingSection;
      const settingsData = data.settings;
      state.user_collection.webapp_settings[settingSection] = settingsData;
      state.user_collection.webapp_settings.edited = new Date().getTime();
    },
    addDeck(state, newDeck) {
      state.decks.unshift(newDeck);
      state.user_collection.deck_ids.push(newDeck.deck_id);
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
      if (deckId) {
        // console.log('delete Deck, deck', deckId);
        // add to user_collection deleted list
        if (!state.user_collection.deleted_deck_ids.includes(deckId))
          state.user_collection.deleted_deck_ids.push(deckId);
        // remove from user_collection included list
        if (state.user_collection.deck_ids.includes(deckId)) {
          state.user_collection.deck_ids.splice(state.user_collection.deck_ids.indexOf(deckId), 1);
        }
        // remove the deck from 'decks'
        for (const deck of state.decks) {
          if (deck.deck_id === deckId) state.decks.splice(state.decks.indexOf(deck), 1);
        }
      }
    },
    newCard(state, data) {
      // new blank card
      const newCard = data.newCard;
      const deckId = data.deck_id;
      for (const deck of state.decks) {
        if (deck.deck_id === deckId) {
          deck.cards.push(newCard);
          deck.card_count = deck.cards.length;
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
            deck.card_count = deck.cards.length;
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
                deck.card_count = deck.cards.length;
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
      newCard.edited = new Date().getTime();

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
    addCardToSchedule(state, cardId) {
      let dupCount = 0;
      for (const scheduleItem of state.user_collection.schedule.list) {
        if (scheduleItem.card_id === cardId) {
          dupCount++;
          break;
        }
      }
      if (dupCount === 0) {
        state.user_collection.schedule.list.push({
          card_id: cardId,
          level: 0,
          due: new Date().getTime(),
          last_interval: null,
        });
        state.user_collection.schedule.edited = new Date().getTime();
      }
    },
    updateCardSchedule(state, data) {
      const cardId = data.card_id;
      const newLevel = data.level;
      const newDue = data.due;
      const newLastInterval = data.last_interval;
      for (const scheduleItem of state.user_collection.schedule.list) {
        if (scheduleItem.card_id === cardId) {
          scheduleItem.level = newLevel;
          scheduleItem.due = newDue;
          scheduleItem.last_interval = newLastInterval;
          state.user_collection.schedule.edited = new Date().getTime();
          break;
        }
      }
    },
    resetCardSchedule(state, cardId) {
      const newLevel = 0;
      const newDue = new Date().getTime();
      for (const scheduleItem of state.user_collection.schedule.list) {
        if (scheduleItem.card_id === cardId) {
          scheduleItem.level = newLevel;
          scheduleItem.due = newDue;
          scheduleItem.last_interval = null;
          state.user_collection.schedule.edited = new Date().getTime();
          break;
        }
      }
    },
    deleteCardFromSchedule(state, cardId) {
      const schedule = state.user_collection.schedule.list;
      for (const scheduleItem of schedule) {
        if (scheduleItem.card_id === cardId) schedule.splice(schedule.indexOf(scheduleItem), 1);
        schedule.edited = new Date().getTime();
        break;
      }
    },
    updateLastReviewDay(state, day) {
      state.user_collection.schedule.lastReviewDay = day;
      state.user_collection.schedule.edited = new Date().getTime();
    },
    addCardToTodaysCardReviews(state, cardId) {
      if (!state.user_collection.schedule.todaysReviewCardIds)
        state.user_collection.schedule.todaysReviewCardIds = [];
      state.user_collection.schedule.todaysReviewCardIds.push(cardId);
    },
    resetTodaysCardReviews(state) {
      state.user_collection.schedule.todaysReviewCardIds = [];
    },
    updateWebappSettings(state, data) {
      state.user_collection.webapp_settings = data;
    },
    updateSchedule(state, data) {
      state.user_collection.schedule = data;
    },
    updateAllCardTags(state, data) {
      state.user_collection.all_card_tags = data;
    },
    updateHighlightUrls(state, data) {
      state.user_collection.highlight_urls = data;
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
        created: new Date().getTime(),
        edited: new Date().getTime(),
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
    deleteCard(context, data) {
      context.commit('deleteCard', data);
      const deckId = data.deck_id;
      const cardId = data.card_id;
      context.commit('deleteCardFromSchedule', cardId);
      // remove from highlights
      let cardIndex;
      for (const deck of context.state.decks) {
        if (deck.deck_id === deckId) {
          for (const card of deck.cards) {
            if (card.card_id === cardId) {
              cardIndex = deck.cards.indexOf(card);
              if (cardIndex !== -1) {
                if (!isEmpty(card.highlight_url)) {
                  if (context.state.user_collection.highlight_urls.includes(card.highlight_url)) {
                    context.dispatch('removeCardFromHighlights', card);
                  }
                  break;
                }
              }
            }
            break;
          }
        }
      }
    },
    async removeCardFromHighlights(context, card) {
      const getWebsiteCall = {
        url: context.state.serverUrl + '/get_website',
        jwt: context.state.jwt,
        method: 'POST',
        data: {
          url: card.highlight_url,
        },
      };
      let getWebsiteResults;
      await context.dispatch('callAPI', getWebsiteCall).then(data => {
        getWebsiteResults = data;
      });
      // console.log('    get Website, Results ', getWebsiteResults);
      if (!getWebsiteResults) {
        throw new Error('error in get_websites_selected_content');
      }
      const website = getWebsiteResults.website;
      for (const wCard of website.cards) {
        if (wCard.card_id === card.card_id) {
          website.cards.splice(website.cards.indexOf(wCard), 1);
          website.deleted.push(card.card_id);
          break;
        }
      }
      const postWebsitesCall = {
        url: context.state.serverUrl + '/post_websites',
        jwt: context.state.jwt,
        method: 'POST',
        data: {
          websites: {
            [card.highlight_url]: website,
          },
        },
      };
      let postWebsitesResult = null;
      await context.dispatch('callAPI', postWebsitesCall).then(data => {
        postWebsitesResult = data;
      });
      // console.log('          post Websites Result', postWebsitesResult);
      if (!postWebsitesResult) {
        throw new Error('error posting websites');
      }
    },
    async callAPI(context, data) {
      let result = null;
      const options = {
        url: data.url,
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': data.jwt,
        },
        method: data.method,
      };
      if (data.data) {
        options.data = data.data;
      }
      // console.log('options', options);
      await axios(options)
        .then(response => {
          result = response.data;
          // console.log(result);
        })
        .catch(function(err) {
          throw new Error(err);
        });
      return result;
    },
    deleteDeck(context, deckId) {
      for (const deck of context.state.decks) {
        if (deck.deck_id === deckId) {
          // console.log('deleting deck', deckId);

          // console.log(deck.cards);
          for (const card of deck.cards) {
            if (!isEmpty(card.highlight_url)) {
              // console.log('card', card);
              // console.log(
              //   'context.state.user_collection.highlight_urls.list',
              //   context.state.user_collection.highlight_urls.list
              // );
              context.dispatch('removeCardFromHighlights', card);

              break;
            }
          }
          context.commit('deleteDeck', deck.deck_id);
          break;
        }
      }
    },
    navProgress(context, data) {
      const outputString = data.completed + ' / ' + data.totalCards;
      context.commit('updateProgressCounter', outputString);
    },
    logout(context) {
      context.commit('updateJwt', null);
      document.cookie = null;
    },
    logoutDeleteCache(context) {
      context.commit('updateJwt', null);
      document.cookie = null;
      context.commit('clearState');
      localForage.clear();
      context.commit('updateUserCollection', defaultCollection.user_collection);
      context.commit('updateDecks', defaultCollection.decks);
    },
    levelUpCard(context, cardId) {
      let cardData = null;
      for (const scheduleItem of context.state.user_collection.schedule.list) {
        if (scheduleItem.card_id === cardId) {
          cardData = JSON.parse(JSON.stringify(scheduleItem));
          break;
        }
      }
      const settings = context.state.user_collection.webapp_settings.schedule;
      context.commit('updateCardSchedule', cardLevelUp(cardId, cardData, settings));
    },
    levelDownCard(context, cardId) {
      let cardData = null;
      for (const scheduleItem of context.state.user_collection.schedule.list) {
        if (scheduleItem.card_id === cardId) {
          cardData = JSON.parse(JSON.stringify(scheduleItem));
          break;
        }
      }
      let level = cardData.level;
      let newDue = cardData.due;
      let lastInterval = cardData.last_interval;
      const settings = context.state.user_collection.webapp_settings.schedule;

      if (settings.fail_mode === 'reset') {
        level = 0;
        newDue = new Date().getTime();
        lastInterval = null;
      } else {
        level -= settings.fail_mode;
        // this could be more perfected
        for (let i = 0; i < settings.fail_mode; i++) {
          lastInterval /= settings.later_reviews_multiplier;
          newDue -= lastInterval;
        }
      }
      const updateData = {
        card_id: cardId,
        level: level,
        due: newDue,
        last_interval: lastInterval,
      };
      context.commit('updateCardSchedule', updateData);
    },
    refreshLastSyncsData(context) {
      const lastDecks = JSON.parse(JSON.stringify(context.state.decks));
      const lastUserCollection = JSON.parse(JSON.stringify(context.state.user_collection));
      const lastSyncsData = {
        decks: lastDecks,
        user_collection: lastUserCollection,
      };
      context.commit('updateLastSyncsData', lastSyncsData);
    },
    async cloudSync(context, skipSameCheck = false) {
      const data = {
        decks: context.state.decks,
        user_collection: context.state.user_collection,
        lastSyncsData: context.state.lastSyncsData,
        online: context.state.online,
        syncing: context.state.syncing,
        syncFailed: context.state.syncFailed,
        serverUrl: context.state.serverUrl,
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
          card_count: deck.cards.length,
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
    isAuthenticated: state => {
      const jwt = state.jwt;
      if (jwt === null) {
        return false;
      } else if (!jwt || jwt.split('.').length < 3) {
        return false;
      } else {
        const data = JSON.parse(atob(jwt.split('.')[1]));
        const exp = new Date(data.exp * 1000); // JS deals with dates in milliseconds since epoch, python in seconds
        const now = new Date();
        return now < exp;
      }
    },
    getDecks: state => state.decks,
    navProgressCounter: state => state.navProgressCounter,
    reviewDeck(state) {
      if (
        state.user_collection === null ||
        state.decks === null ||
        state.user_collection === undefined ||
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
        state.user_collection === null ||
        state.decks === null ||
        state.user_collection === undefined ||
        state.decks === undefined
      ) {
        return {
          cards: [],
          allTags: [],
          title: 'Review Deck',
        };
      } else {
        const schedule = state.user_collection.schedule.list;
        const reviewDeck = getters.reviewDeck;
        const todaysDeck = {
          cards: [],
          title: `Today's Review`,
        };
        const now = new Date().getTime();
        const cutOff = now + 3600 * 23; // cards due within 23 hours
        const todaysScheduleItems = [];
        for (const scheduleItem of schedule) {
          if (scheduleItem.due <= cutOff) {
            todaysScheduleItems.push(scheduleItem);
          }
        }
        const todaysScheduleItemsSorted = sortBy(todaysScheduleItems, 'due');
        for (const scheduleItem of todaysScheduleItemsSorted) {
          // this could get expensive later
          for (const card of reviewDeck.cards) {
            if (card.card_id === scheduleItem.card_id) {
              todaysDeck.cards.push(card);
              break;
            }
          }
          if (todaysDeck.cards.length > state.user_collection.webapp_settings.schedule.max_cards)
            break;
        }
        return todaysDeck;
      }
    },
  },
  plugins: [vuexCookie.plugin, vuexLocalForage.plugin],
});

syncWorker.onmessage = e => {
  // could add an if and a type option here to dispatch other actions
  store.commit(e.data.mutation, e.data.payload);
};

export default store;
