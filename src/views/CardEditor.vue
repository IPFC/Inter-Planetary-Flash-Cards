<template>
  <b-container fluid class="body scroller" @keydown.ctrl.delete.prevent="deleteCard">
    <alert-failed-sync />
    <alert-offline />
    <alert-update-pwa @updatePWA="PWAUpdate(bool)" />
    <alert-browser-rec :alert-browser-rec="alertBrowserRec" />
    <b-row id="main-row">
      <b-col id="main-col" :class="swipeTransition">
        <b-container class="card scroller" :class="frontFocusClass">
          <div
            v-if="!frontFocused"
            v-touch:swipe="swipeHandler"
            v-highlight
            v-dompurify-html="card.front_rich_text"
            class="preview"
            @click="focusInputFront()"
          ></div>
          <quill-editor
            v-if="frontFocused"
            ref="myQuillEditorFront"
            v-model="card.front_rich_text"
            v-highlight
            class="quill"
            :options="editorOption"
          ></quill-editor>
        </b-container>
        <br />
        <b-container class="card scroller" :class="backFocusClass">
          <div
            v-if="!backFocused"
            v-touch:swipe="swipeHandler"
            v-highlight
            v-dompurify-html="card.back_rich_text"
            class="preview"
            @click="focusInputBack()"
          ></div>
          <quill-editor
            v-if="backFocused"
            ref="myQuillEditorBack"
            v-model="card.back_rich_text"
            v-highlight
            class="quill"
            :options="editorOption"
          ></quill-editor>
        </b-container>
        <p id="counter" v-touch:swipe="swipeHandler">{{ cardNumberOutOfDeck }}</p>
        <br v-touch:swipe="swipeHandler" />
        <b-container id="tags-bottom" v-touch:swipe="swipeHandler" class="tag-chooser">
          <p class="d-inline tags-label">
            Tags:
            <b-button class="add-btn">
              <font-awesome-icon
                v-if="!addingTag"
                class="d-inline add-icon"
                color="white"
                size="1x"
                icon="plus-circle"
                @click="toggleAddingTag()"
              />
              <font-awesome-icon
                v-if="addingTag"
                class="d-inline add-icon"
                color="white"
                size="1x"
                icon="plus-circle"
                @click="addNewTag()"
              />
              <b-form-input
                v-if="addingTag"
                v-model="newTagTitle"
                class="d-inline tag-input"
                @keyup.enter.prevent="addNewTag()"
              ></b-form-input>
            </b-button>
          </p>
          <b-button
            v-for="tag in card.card_tags"
            :key="tag"
            class="tag-style-button green-btn d-inline"
            @click="removeTagFromCard(tag)"
            >{{ tag }}</b-button
          >
          <br />
          <b-button
            v-for="tag in unincludedTags"
            :key="tag"
            class="tag-style-button white-btn d-inline"
            @click="addTagToCard(tag)"
            >{{ tag }}</b-button
          >
        </b-container>
      </b-col>
    </b-row>
    <b-row id="buttons-row">
      <b-col id="buttons-col">
        <b-container id="buttons-inner">
          <b-row>
            <b-col class="btn-col">
              <b-button class="btn-circle btn-md" @click="deleteCard()">
                <font-awesome-icon size="2x" icon="trash-alt" />
              </b-button>
            </b-col>
            <b-col class="btn-col">
              <b-button
                :disabled="leftNavDisabled"
                class="btn-circle btn-md"
                @click="previousCard()"
              >
                <font-awesome-icon size="2x" icon="step-backward" />
              </b-button>
            </b-col>
            <b-col class="btn-col">
              <b-button :disabled="rightNavDisabled" class="btn-circle btn-md" @click="nextCard()">
                <font-awesome-icon size="2x" icon="step-forward" />
              </b-button>
            </b-col>
            <b-col class="btn-col">
              <b-button class="btn-circle btn-md" @click="doneCheck()">
                <font-awesome-icon size="2x" icon="check" />
              </b-button>
            </b-col>
          </b-row>
        </b-container>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
/* eslint-disable vue/valid-v-on */

import { BFormInput } from 'bootstrap-vue';
import { isEqual } from 'lodash/core';
import { mapState } from 'vuex';

import { Quill, quillEditor } from 'vue-quill-editor';
import 'quill/dist/quill.snow.css';
import imageUpload from 'quill-plugin-image-upload';
const uuidv4 = require('uuid/v4');
const axios = require('axios');
const FormData = require('form-data');
Quill.register('modules/imageUpload', imageUpload);
var quillKeyBindings = {
  custom: {
    key: 'ENTER',
    shiftKey: true,
    handler: function() {
      document.querySelector('#app-main > div.router-view').__vue__.editorShiftEnter();
    },
  },
};

export default {
  name: 'CardEditor',
  components: { BFormInput, quillEditor },
  props: {
    newCardClicked: { type: Number, default: 0 },
    comingToCardEditorFromReview: { type: Boolean },
    newCardCommit: { type: Number, default: 0 },
    alertBrowserRec: { type: Boolean },
  },
  data() {
    return {
      card: '',
      frontFocused: true,
      backFocused: false,
      frontFocusClass: '',
      backFocusClass: '',
      swipeTransition: 'enter',
      initialDeckState: null,
      addingTag: false,
      newTagTitle: '',
      editorOption: {
        theme: 'snow',
        modules: {
          imageUpload: {
            upload: file => {
              const gateway = 'https://gateway.pinata.cloud/ipfs/';
              const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
              const data = new FormData();
              data.append('file', file);
              const metadata = JSON.stringify({
                name: 'testname',
                keyvalues: {
                  exampleKey: 'exampleValue',
                },
              });
              data.append('pinataMetadata', metadata);
              return axios
                .post(url, data, {
                  maxContentLength: 'Infinity', // this is needed to prevent axios from erroring out with large files
                  headers: {
                    'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                    pinata_api_key: this.pinataKeys.pinata_api,
                    pinata_secret_api_key: this.pinataKeys.pinata_key,
                  },
                })
                .then(function(response) {
                  return gateway + response.data.IpfsHash;
                })
                .catch(function() {
                  // console.log(error)
                });
            },
          },
          toolbar: this.$store.state.user_collection.webapp_settings.text_editor.options.toolbar,
          syntax: {
            highlight: text => window.hljs.highlightAuto(text).value,
          },
          history: {
            delay: 2000,
            maxStack: 500,
            userOnly: true,
          },
          keyboard: {
            bindings: quillKeyBindings,
          },
        },
      },
    };
  },

  computed: {
    ...mapState({
      user_collection: 'user_collection',
      cardToEditIndex: 'cardToEditIndex',
      decks: 'decks',
      jwt: 'jwt',
      pinataKeys: 'pinataKeys',
    }),
    currentDeck() {
      return this.$store.getters.currentDeck;
    },
    unincludedTags() {
      // this now rides on review deck in getters
      const allTagsList = this.$store.getters.reviewDeck.allTags;
      const unincludedTagsList = [];
      for (const tag of allTagsList) {
        if (!this.card.card_tags.includes(tag)) {
          unincludedTagsList.push(tag);
        }
      }
      return unincludedTagsList;
    },
    leftNavDisabled() {
      if (this.cardToEditIndex === 0) {
        return true;
      } else {
        return false;
      }
    },
    rightNavDisabled() {
      if (this.cardToEditIndex === this.currentDeck.cards.length - 1) {
        return true;
      } else {
        return false;
      }
    },
    unChanged() {
      const card = this.card;
      let result = true;
      if (card !== null && this.initialDeckState !== null) {
        for (const initialDeckCard of this.initialDeckState.cards) {
          if (card.card_id === initialDeckCard.card_id) {
            if (!isEqual(initialDeckCard, card)) {
              result = false;
              break;
            } else {
              result = true;
              break;
            }
          }
        }
      }
      return result;
    },
    cardNumberOutOfDeck() {
      const totalCards = this.currentDeck.cards.length;
      const currentCardNumber = this.cardToEditIndex + 1;
      let title = this.currentDeck.title;
      if (this.currentDeck.title === undefined) {
        title = 'Review Deck';
      }
      return `Card ${currentCardNumber}/${totalCards} in: ${title}`;
    },
  },
  watch: {
    newCardClicked: function() {
      this.newCardFirst();
    },
    newCardCommit: function() {
      this.newCardThen();
    },
  },
  created() {
    this.setCard();
    this.initialDeckState = JSON.parse(JSON.stringify(this.currentDeck));
  },
  mounted() {
    this.focusInputFront();
    this.$emit('homeLoad');
  },
  methods: {
    swipeHandler(direction) {
      if (direction === 'left' && !this.rightNavDisabled) {
        this.nextCard();
      } else if (direction === 'right' && !this.leftNavDisabled) {
        this.previousCard();
      }
    },
    editorShiftEnter() {
      event.preventDefault();
      if (this.frontFocused) {
        this.focusInputBack();
      } else {
        this.doneCheck();
      }
    },
    PWAUpdate(bool) {
      this.$emit('updatePWA', bool);
    },
    focusInputFront() {
      this.frontFocused = true;
      this.backFocused = false;
      this.frontFocusClass = 'focused';
      this.backFocusClass = 'unfocused';
      this.$nextTick(() => {
        const length = this.$refs.myQuillEditorFront.quill.getLength();
        this.$refs.myQuillEditorFront.quill.setSelection(length);
      });
    },
    focusInputBack() {
      this.frontFocused = false;
      this.backFocused = true;
      this.frontFocusClass = 'unfocused';
      this.backFocusClass = 'focused';
      this.$nextTick(() => {
        const length = this.$refs.myQuillEditorBack.quill.getLength();
        this.$refs.myQuillEditorBack.quill.setSelection(length);
      });
    },
    setCard() {
      this.card = JSON.parse(JSON.stringify(this.currentDeck.cards[this.cardToEditIndex]));
    },
    deleteCard: function() {
      const card = JSON.parse(JSON.stringify(this.card));
      const deck = JSON.parse(JSON.stringify(this.currentDeck));
      let wasLastCard;
      if (this.rightNavDisabled) {
        wasLastCard = true;
      }
      let deckId = null;
      if (deck.title === 'Review Deck') {
        deckId = this.findCardsDeck(card.card_id);
      } else {
        deckId = deck.deck_id;
      }
      const deleteData = { deck_id: deckId, card_id: card.card_id };
      if (deck.cards.length === 1 || this.comingToCardEditorFromReview) {
        this.$router.go(-1);
        this.$store.commit('deleteCard', deleteData);
        this.$store.commit('deleteCardFromSchedule', card.card_id);
      } else {
        if (wasLastCard) {
          this.$store.commit('updateCardToEditIndex', this.cardToEditIndex - 1);
        }
        this.$store.commit('deleteCard', deleteData);
        this.$store.commit('deleteCardFromSchedule', card.card_id);
        this.setCard();
      }
    },
    findCardsDeck: function(cardId) {
      for (const deck of this.decks) {
        for (const card of deck.cards) {
          if (card.card_id === cardId) {
            return deck.deck_id;
          }
        }
      }
    },
    nextCard: function() {
      if (!this.rightNavDisabled) {
        this.swipeTransition = 'throw-left';
        this.backFocused = true;
        this.frontFocused = true;
        window.setTimeout(() => {
          this.nextCardAnimation();
          this.switchCard(1);
        }, 120);
      }
    },
    previousCard: function() {
      if (!this.leftNavDisabled) {
        this.swipeTransition = 'throw-right';
        this.backFocused = true;
        this.frontFocused = true;
        window.setTimeout(() => {
          this.previousCardAnimation();
          this.switchCard(-1);
        }, 120);
      }
    },
    nextCardAnimation() {
      this.swipeTransition = 'offscreen-right';
      window.setTimeout(() => {
        this.swipeTransition = 'enter';
      }, 1);
    },
    previousCardAnimation() {
      this.swipeTransition = 'offscreen-left';
      window.setTimeout(() => {
        this.swipeTransition = 'enter';
      }, 1);
    },
    async switchCard(index) {
      const unChanged = JSON.parse(JSON.stringify(this.unChanged));
      if (!unChanged) {
        await this.submit(this.card);
        this.$store.commit('updateCardToEditIndex', this.cardToEditIndex + index);
        this.focusInputFront();
      } else {
        this.$store.commit('updateCardToEditIndex', this.cardToEditIndex + index);
      }
      this.setCard();
      this.focusInputFront();
    },
    doneCheck: function() {
      if (!this.unChanged) {
        this.submit(this.card);
      }
      this.$router.go(-1);
    },
    getQuillData: function(cardInput, quill) {
      // copy image and plaintext

      const card = JSON.parse(JSON.stringify(cardInput));
      for (const line of quill.quillFrontDelta.ops) {
        if (line.insert.image) {
          card.front_image = line.insert.image;
          break;
        }
      }
      card.front_text = quill.frontGottenText;
      for (const line of quill.quillBackDelta.ops) {
        if (line.insert.image) {
          card.back_image = line.insert.image;
          break;
        }
      }
      card.back_text = quill.backGottenText;
      return card;
    },
    async submit(card) {
      // this focuses both sides so that quill is showing
      this.backFocused = true;
      this.frontFocused = true;
      await this.$nextTick(() => {});
      const quill = JSON.parse(
        JSON.stringify({
          quillFrontDelta: this.$refs.myQuillEditorFront.quill.getContents(),
          frontGottenText: this.$refs.myQuillEditorFront.quill.getText(),
          quillBackDelta: this.$refs.myQuillEditorBack.quill.getContents(),
          backGottenText: this.$refs.myQuillEditorBack.quill.getText(),
        })
      );
      this.submitStep2(card, quill);
      return true;
    },
    submitStep2(cardInput, quill) {
      const card = this.getQuillData(cardInput, quill);
      // remove empty card
      if (card.front_text === '' && card.back_text === '') {
        this.deleteCard();
      } else {
        let deckId = null;
        if (this.currentDeck.title === 'Review Deck') {
          deckId = this.findCardsDeck(card.card_id);
        } else {
          deckId = this.currentDeck.deck_id;
        }
        const updateData = { deck_id: deckId, card: card };
        this.$store.dispatch('updateCard', updateData);
        this.focusInputFront();
        this.setCard();
      }
      return true;
    },
    // use later for dropdown menu, copy to other deck
    addCardToDeck: function(deckId) {
      const card = JSON.parse(JSON.stringify(this.card));
      const addData = { deck_id: deckId, card: card };
      this.$store.commit('addCard', addData);
    },
    removeTagFromCard: function(tag) {
      const card = JSON.parse(JSON.stringify(this.card));
      card.card_tags.splice(card.card_tags.indexOf(tag), 1);
      this.submit(card);
    },
    addTagToCard: function(tag) {
      const card = JSON.parse(JSON.stringify(this.card));
      if (tag === 'Daily Review') {
        this.$store.commit('addCardToSchedule', card.card_id);
      }
      card.card_tags.unshift(tag);
      this.submit(card);
    },
    toggleAddingTag: function() {
      this.addingTag = !this.addingTag;
    },
    // new
    moveCard: function() {},
    copyCardToNewDeck: function() {},
    duplicateCArd: function() {},
    // move this to deck selection page. keep here for option 'creat new deck', when selecting move/add to another deck
    addNewDeck: function() {
      if (this.newDeckTitle === '' || this.newDeckTitle === ' ') {
        this.toggleAddingDeck();
      } else {
        const emptyDeck = {
          cards: [this.card],
          created_by: this.user_collection.user_id,
          deck_id: uuidv4(),
          deck_tags: [],
          description: null,
          editable_by: 'only_me',
          edited: Math.round(new Date().getTime()),
          lang_back: 'en',
          lang_front: 'en',
          term_count: 1,
          title: this.newDeckTitle,
          visibility: 'public',
          icon_color: this.generateRandomHslaColor(),
        };
        this.$store.commit('addDeck', emptyDeck);
        this.newDeckTitle = '';
      }
    },
    generateRandomHslaColor: function() {
      // round to an interval of 20, 0-360
      const hue = Math.round((Math.random() * 360) / 20) * 20;
      const color = `hsla(${hue}, 100%, 50%, 1)`;
      return color;
    },
    addNewTag: function() {
      const card = JSON.parse(JSON.stringify(this.card));
      const allTags = this.unincludedTags.concat(card.card_tags);
      if (
        allTags.includes(this.newTagTitle) ||
        this.newTagTitle === '' ||
        this.newTagTitle === ' '
      ) {
        this.newTagTitle = '';
        this.toggleAddingTag();
      } else {
        card.card_tags.unshift(this.newTagTitle);
        this.submit(card);
        this.newTagTitle = '';
        this.toggleAddingTag();
      }
    },
    newCardFirst() {
      if (!this.unChanged) {
        this.submit(this.card);
      }
    },
    newCardThen() {
      this.setCard();
      this.initialDeckState = JSON.parse(JSON.stringify(this.currentDeck));
      this.focusInputFront();
    },
  },
};
</script>

<style scoped>
.body {
  overflow-y: auto;
}
.scroller::-webkit-scrollbar {
  width: 8px;
  padding-right: 5px;
}
.scroller::-webkit-scrollbar-thumb {
  background-color: rgba(162, 162, 162, 0.5);
  border-radius: 10px;
}
#main-col {
  width: 100%;
  padding: 0px 10px;
}
#card-container {
  padding: 0;
}
.card {
  width: 100%;
  max-width: 600px;
  margin: auto;
  top: 15px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.5em;
  padding: 0px 5px 0px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.51);
  text-align: left;
  overflow-y: auto;
}
.focused {
  max-height: 20em;
  transition: max-height 0.5s ease;
}
.unfocused {
  max-height: 5em;
}
.preview {
  padding: 12px 15px;
  min-height: 2em;
}
.throw-right {
  transform: translateX(1000px);
  z-index: 10000;
  transition: transform 0.15s ease-in;
}
.throw-left {
  transform: translateX(-1000px);
  z-index: 10000;
  transition: transform 0.15s ease-in;
}
.offscreen-left {
  visibility: hidden;
  transform: translateX(-1000px);
  transition: transform 0s linear;
}
.offscreen-right {
  visibility: hidden;
  transform: translateX(1000px);
  transition: transform 0s linear;
}
.enter {
  transform: translateX(0px);
  transition: transform 0.15s ease-out;
}
.flashcard:hover {
  box-shadow: 0 0px 25px rgba(0, 0, 0, 0.8);
}
#counter {
  color: grey;
  margin: 40px auto 0px;
  max-width: 600px;
}

.tag-chooser {
  margin: auto;
  height: 7em;
  overflow-x: auto;
  white-space: nowrap;
  position: initial;
  padding: 0px;
  max-width: 600px;
}
.tag-chooser::-webkit-scrollbar {
  height: 0.5em;
}
.tag-chooser::-webkit-scrollbar-thumb {
  background-color: rgba(162, 162, 162, 0.5);
  border-radius: 0px;
}
.tags-label {
  margin: 0px 0px 5px 0px;
  padding: 0px;
}

.tag-style-button {
  border-radius: 10px;
  margin: 5px 10px;
  border-width: 0px;
  color: grey;
  padding: 0.4em;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.51);
}
.green-btn {
  background-color: rgba(185, 255, 184, 1);
}
.white-btn {
  background-color: white;
}

#tags-bottom {
  margin-bottom: 60px;
}
.add-btn {
  border-radius: 10px;
  background-color: grey;
  padding: 0px 0px;
  overflow-x: hidden;
  display: inline-flex;
}
.add-icon {
  margin: 0.58em;
  height: 1em;
}
.tag-input {
  height: 2em;
}

.btn-circle.btn-md {
  width: 40px;
  height: 40px;
  padding: 0px 11px;
  margin: 5px auto;
  border-radius: 20px;
  font-size: 10px;
  text-align: center;
  color: grey;
  background-color: white;
  border: none;
  box-shadow: 0 0px 5px rgba(0, 0, 0, 0.5);
  max-height: 25vh;
}
.btn-circle.btn-md:hover {
  box-shadow: 0 0px 25px rgba(0, 0, 0, 0.8);
}

#buttons-row {
  text-align: center;
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 1000;
  background-color: rgba(63, 47, 47, 0.3);
}
#buttons-col {
  max-width: 600px;
  margin: auto;
}
.btn-col {
  padding: 0px;
  margin: 5px 2px;
}
.preview >>> img {
  width: 100%;
  margin: auto;
  object-fit: fill;
}
.preview >>> .ql-align-center {
  text-align: center;
}
.preview >>> .ql-align-right {
  text-align: right;
}
.preview >>> .ql-align-left {
  text-align: left;
}
.preview >>> .ql-align-justify {
  text-align: justify;
}
.preview >>> p {
  font-size: 1em;
}
.preview >>> p .ql-size-small {
  font-size: 0.65em;
}
.preview >>> p .ql-size-large {
  font-size: 1.5em;
}
.preview >>> p .ql-size-huge {
  font-size: 2.5em;
}
.quill >>> .ql-container.ql-snow {
  border: 0px;
}

.quill >>> .ql-toolbar.ql-snow {
  border: 0px solid #ccc;
  border-bottom: 1px solid #ccc;
}
.quill >>> p {
  font-size: 1.5em;
}
.quill >>> p .ql-size-small {
  font-size: 0.75em;
}
.quill >>> p .ql-size-large {
  font-size: 2em;
}
.quill >>> p .ql-size-huge {
  font-size: 3.5em;
}
</style>
