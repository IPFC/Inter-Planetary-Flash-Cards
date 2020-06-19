<template>
  <b-container class="deck-editor-main">
    <alert-failed-sync />
    <alert-offline />
    <alert-update-pwa @updatePWA="PWAUpdate(bool)" />
    <alert-browser-rec :alert-browser-rec="alertBrowserRec" />
    <b-row id="main-row">
      <b-col id="main-col">
        <b-row id="title-row">
          <b-col id="icon-col" cols="2" class="align-self-center">
            <div id="icon" :style="{ backgroundColor: deck.icon_color }">
              <p id="deck-abrev">
                <strong>{{ getTitleAbrev(deck.title) }}</strong>
              </p>
            </div>
          </b-col>
          <b-col id="text-col">
            <p v-if="!editingDeckTitle" class="text title" @click="toggleEditDeckTitle()">
              {{ deck.title }}
            </p>
            <b-form-input
              v-if="editingDeckTitle"
              v-model="newDeckTitle"
              @keyup.enter="commitDeckTitle()"
            ></b-form-input>
            <p class="text card-count">
              {{ deck.cards.length }} card{{ cardOrCards(deck.cards.length) }}
            </p>
            <div id="underline"></div>
          </b-col>
        </b-row>
        <b-row id="options-row" class="mt-2  ml-3">
          <p class="mr-2 mb-0 text-muted">card backs</p>
          <toggle-button
            v-model="showCardBacks"
            :width="60"
            :labels="{ checked: 'show', unchecked: 'hide' }"
          ></toggle-button>
        </b-row>
        <b-row id="cards-row">
          <b-col id="cards-col" :key="refreshCardsKey" cols="12">
            <flashcard-preview
              v-for="card in deck.cards"
              :key="card.card_id"
              class="flashcard-outer"
              :show-card-backs="showCardBacks"
              :card="card"
              @edit-clicked="editCard(card)"
            ></flashcard-preview>

            <!-- <b-card v-for="card in deck.cards" :key="card.card_id" class="card">
              <b-container style="padding: 0;">
                <b-row>
                  <b-col v-if="card.front_image" class="card-content-col scroller" cols="5">
                    <b-img-lazy v-if="card.front_image" :src="card.front_image"></b-img-lazy>
                  </b-col>
                  <b-col class="card-content-col scroller">
                    <b-card-text class="font-weight-bold">{{ card.front_text }}</b-card-text>
                  </b-col>
                  <b-col cols="1">
                    <font-awesome-icon
                      icon="edit"
                      class="edit"
                      @click="
                        editCard(card);
                        $emit('edit-clicked');
                      "
                    />
                  </b-col>
                </b-row>
                <hr v-if="showCardBacks" class="divider" />
                <b-row v-if="showCardBacks">
                  <b-col v-if="card.back_image" class="card-content-col scroller">
                    <b-img-lazy :src="card.back_image"></b-img-lazy>
                  </b-col>
                  <b-col class="card-content-col scroller">
                    <b-card-text> {{ card.back_text }} </b-card-text>
                  </b-col>
                </b-row>
              </b-container>
            </b-card> -->
          </b-col>
        </b-row>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { BFormInput } from 'bootstrap-vue';
// https://github.com/euvl/vue-js-toggle-button/
import { ToggleButton } from 'vue-js-toggle-button';
import FlashcardPreview from '../components/FlashcardPreview.vue';
export default {
  name: 'DeckEditor',
  components: { BFormInput, ToggleButton, FlashcardPreview },
  props: { alertBrowserRec: { type: Boolean } },
  data() {
    return {
      editingDeckTitle: false,
      newDeckTitle: '',
      showCardBacks: false,
      refreshCardsKey: 0,
    };
  },

  computed: {
    deck() {
      const deckRaw = JSON.parse(JSON.stringify(this.$store.getters.currentDeck));
      // console.log(deckRaw);
      const cardIds = [];
      const cards = [];
      for (const card of deckRaw.cards) {
        if (!cardIds.includes(card.card_id)) {
          cards.push(card);
          cardIds.push(card.card_id);
        }
      }
      deckRaw.cards = cards;
      // console.log(JSON.stringify(cards));
      // console.log(cards.length);
      return deckRaw;
      // return this.$store.getters.currentDeck;
    },
  },
  watch: {
    showCardBacks() {
      this.refreshCardsKey++;
    },
  },
  mounted() {
    this.$emit('homeLoad');
  },
  methods: {
    toggleEditDeckTitle() {
      this.newDeckTitle = this.deck.title;
      this.editingDeckTitle = !this.editingDeckTitle;
    },
    commitDeckTitle() {
      // check to make sure it was changed
      this.deck.title = this.newDeckTitle;
      this.$store.commit('updateDeck', this.deck);
      this.toggleEditDeckTitle();
    },
    editCard(card) {
      this.$emit('edit-clicked');
      this.$store.commit('updateCardToEditIndex', this.deck.cards.indexOf(card));
      this.$router.push('/card-editor');
    },
    cardOrCards(deckLength) {
      if (deckLength === 1) {
        return '';
      } else {
        return 's';
      }
    },
    getTitleAbrev(title) {
      const split = title.split(' ')[0];
      let abrev;
      if (split.length === 1) {
        abrev = split[0].charAt(0) + split[0].charAt(1);
      } else {
        abrev = split[0].charAt(0) + split[1].charAt(0);
      }
      return abrev;
    },
    PWAUpdate(bool) {
      this.$emit('updatePWA', bool);
    },
  },
};
</script>

<style scoped>
.flashcard-outer {
  margin: 10px;
  width: 95%;
}
.card-content-col {
  max-height: 5em;
  overflow: auto;
}
.scroller::-webkit-scrollbar {
  width: 8px;
  padding-right: 5px;
}
.scroller::-webkit-scrollbar-thumb {
  background-color: rgba(162, 162, 162, 0.5);
  border-radius: 10px;
}
.edit {
  color: gray;
}
.edit:hover {
  cursor: pointer;
  color: black;
}
.deck-editor-main {
  overflow-y: auto;
  padding-left: 0;
  padding-right: 0;
}
.deck-editor-main::-webkit-scrollbar {
  width: 0em;
}
#main-row {
  margin: 15px 15px 0px 10px;
  margin-top: 15px;
}
#main-col {
  margin: auto;
  max-width: 600px;
  padding: 0;
}
#title-row {
  width: 100%;
  padding-left: 30px;
}
#text-col {
  padding: 0px 0px 10px 20px;
}
#underline {
  position: absolute;
  bottom: 0px;
  left: 20px;
  height: 1px;
  width: 75%;
  background-color: rgba(0, 0, 0, 0.5);
}
#edit-col {
  padding: 0;
  margin: auto;
  width: 10px;
}
#icon-col {
  width: 50px;
  height: 50px;
}
#icon:hover {
  cursor: pointer;
}
#icon {
  width: 46px;
  height: 46px;
  border-radius: 23px;
  text-align: center;
  font-size: 28px;
  color: white;
  margin: auto;
}
#deck-abrev {
  margin: 0;
}
.text {
  padding: 0px 0px 0px 10px;
  margin: 0px;
}
.text:hover {
  cursor: pointer;
}
#cards-col {
  padding: 0 0 0 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.card-count {
  font-size: 0.8em;
  color: dimgray;
}
.title {
  font-size: 1.2em;
}
img {
  width: 100%;
}
</style>
