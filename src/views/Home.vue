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
const vueFlashcard = () => import('../components/Flashcard');

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
      'userCollection',
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
    if ((this.userCollection === null) | (this.decks === null)) {
      localStorageEmpty = true;
    } else if (this.userCollection.user_id === 'tutorial') {
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
      this.$store.commit('updateUserCollection', defaultCollection.userCollection);
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
      this.$store.commit('updateUserCollection', defaultCollection.userCollection);
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
        const maxReviewLength = this.userCollection.webapp_settings.scheduleSettings.maxCards;
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
