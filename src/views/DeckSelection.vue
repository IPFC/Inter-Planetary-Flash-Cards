<template>
  <div class="deck-select-main">
    <alert-failed-sync />
    <alert-offline />
    <alert-update-pwa @updatePWA="PWAUpdate(bool)" />
    <alert-browser-rec :alert-browser-rec="alertBrowserRec" />
    <b-list-group class="list-group">
      <b-list-group-item class="list-group-item">
        <b-container class="list-group-item-container">
          <b-row class="list-group-item-row">
            <b-col class="icon-col align-self-center" cols="1">
              <div class="icon" style="{ backgroundColor: grey}">
                <font-awesome-icon
                  v-if="!addingDeck"
                  color="grey"
                  icon="plus-circle"
                  @click="toggleAddingDeck()"
                ></font-awesome-icon>
                <font-awesome-icon
                  v-if="addingDeck"
                  color="green"
                  icon="check"
                  @click="addNewDeck()"
                ></font-awesome-icon>
              </div>
            </b-col>
            <b-col class="text-and-edit-col" cols="11">
              <b-row>
                <b-col class="text-col">
                  <p v-if="!addingDeck" class="text title" @click="toggleAddingDeck">New Deck</p>
                  <b-form-input
                    v-if="addingDeck"
                    v-model="newDeckTitle"
                    type="text"
                    @keyup.enter.prevent="addNewDeck()"
                  />
                </b-col>
                <b-col class="edit-col" cols="1"> </b-col>
              </b-row>
              <b-row>
                <div class="underline"></div>
              </b-row>
            </b-col>
          </b-row>
        </b-container>
      </b-list-group-item>
      <b-list-group-item
        v-for="(deckMeta, index) in decksMeta"
        :key="index"
        class="list-group-item"
      >
        <b-container class="list-group-item-container">
          <b-row class="list-group-item-row">
            <b-col class="icon-col align-self-center" cols="1">
              <div class="icon" :style="{ backgroundColor: deckMeta.icon_color }">
                <p class="deck-abrev">
                  <strong>{{ getTitleAbrev(deckMeta.title) }}</strong>
                </p>
              </div>
            </b-col>
            <b-col class="text-and-edit-col" cols="11">
              <b-row>
                <b-col class="text-col" @click="openDeck(decksMeta[index].deck_id)">
                  <p class="text title">{{ deckMeta.title }}</p>
                  <p class="text card-count">
                    {{ deckMeta.card_count }} card{{ cardOrCards(deckMeta.card_count) }}
                  </p>
                </b-col>
                <b-col class="edit-col" cols="1">
                  <b-dropdown
                    class="deck-options edit-btn"
                    dropleft
                    size="lg"
                    variant="link"
                    toggle-class="text-decoration-none"
                    no-caret
                  >
                    <template v-slot:button-content>
                      <font-awesome-icon
                        class="deck-options"
                        color="grey"
                        size="1x"
                        icon="ellipsis-h"
                      />
                      <span class="sr-only">Search</span>
                    </template>
                    <b-dropdown-item-button @click="deleteDeck(deckMeta.deck_id)"
                      >Delete</b-dropdown-item-button
                    >
                    <b-dropdown-item-button disabled href="#">Export</b-dropdown-item-button>
                  </b-dropdown>
                </b-col>
              </b-row>
              <b-row>
                <div class="underline"></div>
              </b-row>
            </b-col>
          </b-row>
        </b-container>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import {
  BListGroup,
  BListGroupItem,
  BFormInput,
  BDropdown,
  BDropdownItemButton,
} from 'bootstrap-vue';
const uuidv4 = require('uuid/v4');

export default {
  name: 'DeckSelection',
  components: { BListGroup, BListGroupItem, BFormInput, BDropdown, BDropdownItemButton },
  props: { alertBrowserRec: { type: Boolean } },
  data() {
    return {
      addingDeck: false,
      refreshList: 0,
      newDeckTitle: '',
    };
  },
  computed: {
    decksMeta() {
      return this.$store.getters.decksMeta;
    },
  },
  created() {
    this.$store.commit('updateCurrentDeckId', 'defaultDeck');
  },
  mounted() {
    this.$emit('homeLoad');
  },
  methods: {
    toggleAddingDeck() {
      this.addingDeck = !this.addingDeck;
    },
    addNewDeck: function() {
      const title = this.newDeckTitle.trim();
      if (title === '') {
        this.toggleAddingDeck();
      } else {
        const emptyDeck = {
          cards: [],
          user_id: this.$store.state.user_collection.user_id,
          deck_id: uuidv4(),
          deck_tags: [],
          description: null,
          editable_by: 'only_me',
          edited: Math.round(new Date().getTime()),
          created: Math.round(new Date().getTime()),
          lang_back: 'en',
          lang_front: 'en',
          card_count: 0,
          title: title,
          visibility: 'public',
          icon_color: this.generateRandomHslaColor(),
        };
        this.$store.commit('addDeck', emptyDeck);
        this.newDeckTitle = '';
        this.toggleAddingDeck();
        // this.refreshList++;
      }
    },
    generateRandomHslaColor: function() {
      // round to an interval of 20, 0-360
      const hue = Math.round((Math.random() * 360) / 20) * 20;
      const color = `hsla(${hue}, 100%, 50%, 1)`;
      return color;
    },
    openDeck(id) {
      this.$store.commit('updateCurrentDeckId', id);
      this.$router.push('/deck-editor');
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
    deleteDeck(id) {
      this.$store.dispatch('deleteDeck', id);
    },
    PWAUpdate(bool) {
      this.$emit('updatePWA', bool);
    },
  },
};
</script>
<style scoped>
.deck-select-main {
  overflow-y: auto;
}
.deck-select-main::-webkit-scrollbar {
  width: 0.5em;
}
.deck-select-main::-webkit-scrollbar-thumb {
  background-color: rgba(162, 162, 162, 0.5);
  border-radius: 0px;
}
.list-group {
  margin: 10px 10px 0px 10px;
}
.list-group-item {
  margin: auto;
  margin-bottom: 5px;
  padding: 0px;
  background-color: transparent;
  max-width: 600px;
  border: transparent;
  width: 100%;
}
.list-group-item-row {
  margin-right: 0px;
}
.list-group-item-row >>> .btn-lg {
  padding: 0;
}
.text-col {
  padding: 0px 0px 10px 20px;
}
.underline {
  position: absolute;
  bottom: 0px;
  left: 20px;
  height: 1px;
  width: 75%;
  background-color: rgba(0, 0, 0, 0.5);
}
.edit-col {
  padding: 0;
  width: 40px;
}
.edit-button {
  padding: 0;
}
.icon-col {
  padding: 0px;
  height: 50px;
}
.icon:hover {
  cursor: pointer;
}
.icon {
  width: 46px;
  height: 46px;
  border-radius: 23px;
  text-align: center;
  font-size: 28px;
  padding-top: 1px;
  color: white;
  margin: auto;
}
.deck-abrev {
  margin: 0;
}
.text {
  padding: 0px 0px 0px 10px;
  margin: 0px;
}
.text:hover {
  cursor: pointer;
}
.card-count {
  font-size: 0.8em;
  color: dimgray;
}
.title {
  font-size: 1.2em;
}
.deck-options {
  padding: 0;
}
.deck-options-button {
  padding: 0;
}
.deck-options:hover {
  color: black;
  padding: 0;
}
</style>
