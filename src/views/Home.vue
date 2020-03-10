<template>
  <b-container id="home-main" ref="homeBody" fluid>
    <alert-failed-sync />
    <alert-offline :display="alertOffline" />
    <alert-update-pwa @updatePWA="PWAUpdate(bool)" />
    <alert-browser-rec :alert-browser-rec="alertBrowserRec" />
    <b-container v-if="todaysDeck.cards.length > 0" id="review-body">
      <b-row v-if="!spinner" id="top-buttons-row">
        <a id="edit">
          <font-awesome-icon
            size="1x"
            icon="edit"
            @click="
              editCard(currentCard, reviewDeck);
              $emit('edit-clicked');
            "
          />
        </a>
      </b-row>
      <b-row id="card-row">
        <b-col v-if="!spinner">
          <span
            id="main-card-padding"
            v-touch:swipe="swipeHandler"
            class="card-padding"
            :class="
              switchCardSequence && correctAnswer
                ? 'throw-right'
                : switchCardSequence && !correctAnswer
                ? 'throw-left'
                : ''
            "
          >
            <vue-flashcard
              id="main-card"
              ref="card"
              :key="reDrawCardKey"
              v-touch:tap="flipCard"
              class="first-card"
              :flipped="cardFlipToggle"
              :front="currentCard.front_rich_text"
              :back="currentCard.back_rich_text"
            ></vue-flashcard>
          </span>
          <div id="next-card-padding" class="card-padding">
            <vue-flashcard
              v-if="todaysDeck.cards.length > 1"
              id="next-card"
              :class="switchCardSequence ? 'switch-crd-seq-next-crd' : 'next-card'"
              :front="nextCard.front_rich_text"
              :back="' '"
            ></vue-flashcard>
          </div>
          <div id="third-card-padding" class="card-padding">
            <vue-flashcard
              v-if="todaysDeck.cards.length > 2"
              id="third-card"
              :class="switchCardSequence ? 'switch-crd-seq-third-crd' : 'third-card'"
              class="card"
              front="   /n hahaha! you'll never see me /n   "
              back="   /n /n /n   "
            ></vue-flashcard>
          </div>
          <div id="fourth-card-padding" class="card-padding">
            <vue-flashcard
              v-if="todaysDeck.cards.length > 2"
              id="fourth-card"
              :class="switchCardSequence ? 'switch-crd-seq-fourth-crd' : 'fourth-card'"
              class="card"
              front="   /n hahaha! you'll never see me /n   "
              back="   /n /n /n   "
            ></vue-flashcard>
          </div>
        </b-col>
        <b-col v-else id="spinner-col">
          <font-awesome-icon id="spinner" icon="spinner" spin size="5x" />
        </b-col>
      </b-row>
      <b-row id="bot-buttons-row">
        <b-col class="buttons-col">
          <b-button
            v-if="cardFlipToggle"
            aria-label="Incorrect"
            class="btn-circle"
            @click="incorrect()"
          >
            <font-awesome-icon class="btn-icon" size="2x" icon="times" />
          </b-button>
        </b-col>
        <b-col class="buttons-col">
          <b-button
            aria-label="flip"
            class="btn-circle"
            @keydown.left="incorrect()"
            @keydown.right="correct()"
            @keydown.down="flipCard()"
            @click="flipCard()"
          >
            <font-awesome-icon class="btn-icon" size="2x" icon="sync" />
          </b-button>
        </b-col>
        <b-col class="buttons-col">
          <b-button
            v-if="cardFlipToggle"
            aria-label="Correct"
            class="btn-circle"
            @click="correct()"
          >
            <font-awesome-icon class="btn-icon" size="2x" icon="check" />
          </b-button>
          <b-button @click="resetColleciton()">reset colleciton</b-button>
        </b-col>
      </b-row>
    </b-container>
    <b-container v-else style="text-align: center;">
      <br />
      <h1>Good work!</h1>
      <p>You've finished all your cards for today.</p>
    </b-container>
  </b-container>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import defaultCollection from '../assets/defaultCollection.json';
const vueFlashcard = () => import('../components/flashcard');

export default {
  name: 'Home',
  components: { vueFlashcard },
  props: { alertBrowserRec: { type: Boolean } },
  data() {
    return {
      // currentCardIndex: 0,
      cardFlipToggle: false,
      cardsCompleted: 0,
      cardsTotal: 0,
      todaysDeckCardIds: [],
      switchCardSequence: false,
      reDrawCardKey: 0,
      correctAnswer: false,
      maxCardsUnset: false,
      alertOffline: false,
    };
  },
  computed: {
    ...mapGetters({
      reviewDeck: 'reviewDeck',
      todaysDeckFull: 'todaysDeck',
      isAuthenticated: 'isAuthenticated',
    }),
    ...mapState([
      'user_collection',
      'decks',
      'jwt',
      'lastSyncsData',
      'syncing',
      'syncFailed',
      'initialSync',
      'online',
    ]),
    spinner() {
      if (this.syncing && this.initialSync === 1) {
        return true;
      } else {
        return false;
      }
    },
    todaysDeck() {
      const cards = [];
      for (const card of this.todaysDeckFull.cards) {
        if (this.todaysDeckCardIds.includes(card.card_id)) {
          cards.push(card);
        }
      }
      return { cards: cards };
    },
    currentCard() {
      return this.todaysDeck.cards[0];
    },
    nextCard() {
      if (this.todaysDeck.cards.length > 1) {
        return this.todaysDeck.cards[this.todaysDeck.cards.indexOf(this.currentCard) + 1];
      } else {
        return {
          front_rich_text: '    /n /n /n    ',
          back_rich_text: '    /n /n /n    ',
        };
      }
    },
  },
  watch: {
    syncing: function() {
      this.$store.commit('updateInitialSync', this.initialSync + 1);
      if (this.initialSync === 2 && this.maxCardsUnset) {
        this.setTodaysMaxCards();
      }
    },
  },
  created() {},
  mounted() {
    if (!this.online && this.initialSync === 0) {
      this.alertOffline = !this.alertOffline;
    }
    this.$store.dispatch('checkJwt');
    this.$store.commit('updateCurrentDeckId', 'reviewDeck');
    // Determine status of user. New or returning:
    let localStorageEmpty = false;
    let returningNewUser = false;
    if ((this.user_collection === null) | (this.decks === null)) {
      localStorageEmpty = true;
    } else if (this.user_collection.user_id === 'tutorial') {
      returningNewUser = true;
    }
    // returning user, expired jwt
    if (!this.isAuthenticated && this.jwt !== null && !returningNewUser) {
      // console.log('returning user, expired jwt')
      this.$router.push('login');
    }
    // returning user, valid jwt, no cache
    else if (this.isAuthenticated && localStorageEmpty) {
      // console.log('returning user, valid jwt, no cache')
      this.$store.commit('updateUserCollection', defaultCollection.user_collection);
      this.$store.commit('updateDecks', defaultCollection.decks);
      this.$store.dispatch('cloudSync', true);
      this.$store.commit('toggleSyncing', true);
    }
    // returning user, valid jwt, has cache
    else if (this.isAuthenticated && !localStorageEmpty && this.initialSync === 0) {
      // console.log('returning user, valid jwt, has cache')
      // could be coming back from other parts of the app, so need to suppress sync if not initial
      this.$store.dispatch('cloudSync', true);
      this.$store.commit('toggleSyncing', true);
    }
    // new user or no JWT
    else if ((!this.isAuthenticated && this.jwt === null) || returningNewUser) {
      // console.log('new user or no JWT')
      this.$store.commit('updateUserCollection', defaultCollection.user_collection);
      this.$store.commit('updateDecks', defaultCollection.decks);
      // each path through mounted (except to login) needs to end with initialSync at 2,
      // to allow sync calls elsewhere (decks and collection watcher, and the online warning component) and supress them at the start
      this.$store.commit('updateInitialSync', 2);
    }
    if (this.lastSyncsData === null) {
      this.$store.dispatch('refreshLastSyncsData');
    }
    // this.currentCardIndex = 0 // this was before using store. Return to it for speed?

    // set todaysDeck to maximum length as per settings, but if syncing, do after sync. Hence the watcher
    this.setTodaysMaxCards();
    if (this.syncing) {
      this.maxCardsUnset = true;
    }
    this.$store.dispatch('navProgress', {
      totalCards: this.todaysDeckCardIds.length,
      completed: 0,
    });
    this.setKeys();

    this.$emit('homeLoad');
  },
  destroyed() {
    window.removeEventListener('keydown', this.onKeyPress);
  },
  methods: {
    resetCollection() {
      const userCollection = {
        schedule: {
          edited: 1583750774333,
          list: [
            {
              card_id: '6185906d-9c89-40d9-b301-0b1a76ffdb19',
              due: 2961665555762.326,
              last_interval: 1449551462400,
              level: 28,
            },
            {
              card_id: '5de6a885-81e2-410c-9a08-4f5fb62fed20',
              due: 16,
              last_interval: 86400,
              level: 0,
            },
            {
              card_id: 'e1e6d8e1-d836-4640-86c3-e0b83abc2ed8',
              due: 2728384648703.6675,
              last_interval: 1449551462400,
              level: 28,
            },
            {
              card_id: '0da68541-2545-4d4b-b9af-4e5d3149547f',
              due: 3031617296158.598,
              last_interval: 1449551462400,
              level: 28,
            },
            {
              card_id: 'c09cb5fc-f42d-4e73-bfb1-e8dd67d28ebc',
              due: 2967200366816.0996,
              last_interval: 1449551462400,
              level: 28,
            },
            {
              card_id: 'c931f561-a6fd-46c0-ae1e-72c2d505e948',
              due: 1583167886256,
              last_interval: null,
              level: 0,
            },
            {
              card_id: 'be10c254-83b5-447f-b238-61a47f01ed41',
              due: 1583221303302.0015,
              last_interval: 22118400,
              level: 13,
            },
            {
              card_id: 'a2cdfc17-5928-4cb1-90f6-2daf1b9bdf39',
              due: 1583265467815.036,
              last_interval: 44236800,
              level: 14,
            },
            {
              card_id: 'f0ec0e06-c168-480f-83f6-e45422ef3ce6',
              due: 1583222208200.5833,
              last_interval: 22118400,
              level: 13,
            },
            {
              card_id: 'b88d3368-6d10-4fcf-a1ad-04b20cfef466',
              due: 1583218852330,
              last_interval: null,
              level: 0,
            },
            {
              card_id: '4cf74c3a-a3b4-42d0-b5e9-4c0cb585291d',
              level: 0,
              due: 1583750774246,
              last_interval: null,
            },
          ],
        },
        deck_ids: [
          'ea2c0b5b-18e0-4885-bd1b-dcae462a0a49',
          '4c8bc0ec6d8145e8a40e3e65d265c357',
          'a148c3181fb342eaa0f7a6480c158042',
          '830ea7b8d1ff4683a4e0d074ce0f7f7a',
          '2f9d2b4a-a7be-4589-807e-0c47e3b1a336',
        ],
        deleted_deck_ids: [
          '558d57aa-434b-4e9e-a5aa-d52b4fa33f72',
          'e9d6567b-0792-4035-ad8f-42d7cc477d5d',
          '3bd6ee6c-0796-4270-b142-9565684bf051',
          'f434e4d1-8c59-49b4-b165-061ad9e4b38c',
          'd6dfebea-1fc1-45e3-ac88-21d2ffbe37f1',
          '84cec7f0-b3c2-47bc-ad45-1147755d5c65',
          '30f12687-5471-4f92-b275-602f8065a4fa',
          '1f5834e6-dce1-4166-9873-ccd22762a7a9',
          'c36553db-11ef-4c85-8a9b-f01c1348f67f',
          'e6d0ef97-5ce2-42f2-84f9-0afa655ecbe6',
          '1e30d7e9-7c3f-4061-9401-4e97d26e978e',
          '7889aff458a14cdf9c9eee807c05cca6',
          'f67c3767-6c4e-4919-8833-3f7b770ee32a',
          'a6015966-77f8-421b-9db5-f9a90b185ea3',
          '96f0ef25-2132-464c-aded-bb8823f134de',
          '0fa9b35d-8d67-4a91-b0a1-2a4608ab947e',
          '1a344e40-6724-4142-a2d4-e75399dd5a28',
          'd3f18a96-49a9-4038-9804-92746899fc16',
          '20ead6d8-cee5-4b93-aa44-6fb71b3507e1',
          '877ad2b8-3718-4878-99fc-d8c8c31cb523',
          '2e14efcc-0089-4a54-9efe-48f030d04355',
          '002637ce-a867-4ae1-b63d-dee3bee489c0',
        ],
        webapp_settings: {
          text_editor: {
            options: {
              toolbar: [
                'bold',
                'italic',
                'underline',
                'code-block',
                {
                  size: ['small', false, 'large', 'huge'],
                },
                {
                  color: [],
                },
                {
                  background: [],
                },
                {
                  align: [],
                },
                'image',
              ],
            },
          },
          schedule: {
            initial_reviews: [1, 5, 20, 60],
            later_reviews_multiplier: 2,
            fail_mode: 'reset',
            randomizer: 0.1,
            max_cards: 50,
          },
          edited: 1583766340779,
        },
        all_deck_cids: [],
        user_id: '642a264a-00a2-4517-9d95-64a29174c4bd',
      };
      this.$store.commit('updateUserCollection', userCollection);
    },
    swipeHandler(direction) {
      if (direction === 'left') {
        this.incorrect();
      } else if (direction === 'right') {
        this.correct();
      }
    },
    flipCard() {
      this.cardFlipToggle = !this.cardFlipToggle;
    },
    incorrect(flag) {
      this.correctAnswer = false;
      this.switchCardSequence = true;
      if (!flag) {
        setTimeout(() => {
          this.$store.dispatch('levelDownCard', this.currentCard.card_id);
          this.NavbarProgess();
          this.incorrect(true);
        }, 305);
        return;
      }
      this.cardFlipToggle = false;
      this.reDrawCardKey++;
      // this.currentCardIndex ++
      this.switchCardSequence = false;
    },
    correct(flag) {
      this.correctAnswer = true;
      this.switchCardSequence = true;
      if (!flag) {
        setTimeout(() => {
          this.$store.dispatch('levelUpCard', this.currentCard.card_id);
          this.NavbarProgess();
          this.correct(true);
        }, 305);
        return;
      }
      this.cardFlipToggle = false;
      this.reDrawCardKey++;
      // this.currentCardIndex ++
      this.switchCardSequence = false;
    },
    NavbarProgess() {
      const totalCards = this.todaysDeckCardIds.length;
      const completed = this.todaysDeckCardIds.length - this.todaysDeck.cards.length;
      const updateData = { totalCards: totalCards, completed: completed };
      this.$store.dispatch('navProgress', updateData);
    },
    editCard(card, reviewDeck) {
      this.$store.commit('updateCardToEditIndex', reviewDeck.cards.indexOf(card));
      this.$router.push('/card-editor');
    },
    setTodaysMaxCards() {
      for (const card of this.todaysDeckFull.cards) {
        const maxReviewLength = this.user_collection.webapp_settings.schedule.max_cards;
        if (this.todaysDeckFull.cards.length >= maxReviewLength) {
          break;
        } else {
          if (!this.todaysDeckCardIds.includes(card)) {
            this.todaysDeckCardIds.push(card.card_id);
          }
        }
      }
    },
    PWAUpdate(bool) {
      this.$emit('updatePWA', bool);
    },
    onKeyPress(event) {
      if (event.keyCode === 13 || event.keyCode === 40 || event.keyCode === 32) {
        event.preventDefault();
        // enter, down, and spacebar
        this.flipCard();
      }
      if (event.keyCode === 39) {
        event.preventDefault();
        // right
        this.correct();
      }
      if (event.keyCode === 37) {
        event.preventDefault();
        // left
        this.incorrect();
      }
      if (event.keyCode === 38) {
        // up
        event.preventDefault();
        this.editCard(this.currentCard, this.reviewDeck);
        this.$emit('edit-clicked');
      }
      if (event.keyCode === 78) {
        // n
        event.preventDefault();
        this.$emit('new-card');
      }
    },
    setKeys() {
      this.$nextTick(() => {
        window.addEventListener('keydown', this.onKeyPress, false);
      });
    },
  },
};
</script>

<style scoped>
#home-main {
  padding: 55px 0;
}
#review-body {
  height: 100%;
  max-width: 600vw;
  padding: 0;
}
#top-buttons-row {
  margin: auto;
  max-width: 600px;
  z-index: 6;
}
#edit {
  color: gray;
  margin-left: auto;
  margin-right: 5px;
  z-index: 6;
  /* position: absolute; */
}
#edit:hover {
  cursor: pointer;
}
.throw-right {
  transform: translateX(1000px) translateY(-100px);
  z-index: 10000;
  transition: transform 0.3s 0.1s ease-in;
}
.throw-left {
  transform: translateX(-1000px) translateY(-100px);
  z-index: 10000;
  transition: transform 0.3s 0.1s ease-in;
}
.first-card {
  width: 95%;
  height: 100%;
  max-width: 600px;
  margin: auto;
  margin-top: 30px;
}
.switch-crd-seq-next-crd {
  width: 95%;
  height: 100%;
  max-width: 600px;
  margin: auto;
  margin-top: 30px;
  transition: margin-top 0.3s, max-width 0.3s, width 0.3s, height 0.3s ease-in-out;
}
.next-card {
  width: 82%;
  height: 95%;
  max-width: 480px;
  margin: auto;
  margin-top: 21px;
}
.switch-crd-seq-third-crd {
  width: 82%;
  height: 95%;
  max-width: 480px;
  margin: auto;
  margin-top: 21px;
  transition: margin-top 0.3s, max-width 0.3s, width 0.3s, height 0.3s ease-in-out;
}
.third-card {
  width: 70%;
  height: 90%;
  margin: auto;
  margin-top: 12px;
  max-width: 380px;
}
.switch-crd-seq-fourth-crd {
  opacity: 1;
  visibility: visible;
  width: 70%;
  height: 90%;
  max-width: 380px;
  margin: auto;
  margin-top: 12px;
  transition: opacity 0.3s, visibility 0.3s, margin-top 0.3s, max-width 0.3s, width 0.3s,
    height 0.3s ease-in-out;
}
.fourth-card {
  opacity: 0;
  visibility: hidden;
  width: 58%;
  height: 85%;
  margin: auto;
  margin-top: 8px;
  max-width: 280px;
}
.card-padding {
  position: fixed;
  top: 60px;
  left: 0px;
  width: 100%;
  bottom: 95px;
}
#main-card-padding {
  z-index: 5;
}
#main-card {
  z-index: 5;
}
#next-card-padding {
  z-index: 4;
}
#next-card {
  z-index: 3;
}
#next-card >>> .card-content::-webkit-scrollbar-thumb {
  background-color: rgba(162, 162, 162, 0);
}
#third-card-padding {
  z-index: 2;
}
#third-card {
  z-index: 2;
  border: none;
}
#fourth-card-padding {
  z-index: 1;
}
#fourth-card {
  z-index: 1;
  border: none;
}
.btn-icon {
  margin: auto;
}
.btn-circle {
  width: 46px;
  height: 46px;
  padding: 0;
  margin: 7px auto;
  border-radius: 23px;
  font-size: 12px;
  text-align: center;
  color: grey;
  background-color: white;
  border: none;
  box-shadow: 0 0px 5px rgba(0, 0, 0, 0.5);
}
.btn-circle.btn-xl:hover {
  box-shadow: 0 0px 25px rgba(0, 0, 0, 0.8);
}

#bot-buttons-row {
  margin: auto;
  text-align: center;
  position: fixed;
  z-index: 1;
  height: 60px;
  left: 0;
  bottom: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.3);
}
.buttons-col {
  align-self: center;
}
#spinner-col {
  text-align: center;
}
#spinner {
  color: #f8690d;
  margin-top: 40vh;
}
</style>
