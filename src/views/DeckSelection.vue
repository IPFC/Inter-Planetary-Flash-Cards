<template>
  <div id="main">
      <!-- <h3>Decks</h3> -->
    <b-list-group id="list-group" >
    <b-list-group-item id="list-group-item" v-for="(deckMeta, index) in decksMeta" :key="index" > 
      <b-container id="list-group-item-container">
        <b-row id="list-group-item-row">
         <b-col id="icon-col" cols="1" class="align-self-center">
           <div id="icon" :style="{ backgroundColor: deckMeta.icon_color}" > 
             <p id="deck-abrev"><strong>{{ getTitleAbrev(deckMeta.title)}}</strong></p>
           </div>
         </b-col>
         <b-col id="text-and-edit-col" cols="11">
          <b-row>
            <b-col id="text-col" @click="openDeck(decksMeta[index].deck_id)">
              <p class="text title" >{{ deckMeta.title }}</p> 
              <p class="text card-count">
                {{ deckMeta.deck_length }} card{{cardOrCards(deckMeta.deck_length)}}
              </p>     
            </b-col>
            <b-col id="edit-col" cols="1">
               <b-dropdown id="edit-btn" class="deck-options" dropleft size="lg" variant= "link" 
                toggle-class="text-decoration-none" no-caret>
                <template v-slot:button-content>
                  <font-awesome-icon class="deck-options" color="grey" 
                  size="1x" icon="ellipsis-h"/> 
                  <span class="sr-only">Search</span>
                </template>
                <b-dropdown-item-button @click="deleteDeck(deckMeta.deck_id)">Delete</b-dropdown-item-button>
                <b-dropdown-item-button disabled href="#">Export</b-dropdown-item-button>
              </b-dropdown>
            </b-col>
          </b-row>
          <b-row>
            <div id="underline"></div>
          </b-row>
         </b-col>
       </b-row>
     </b-container>
  </b-list-group-item>
    </b-list-group>
    </div>
</template>


<script>
import { BListGroup, BListGroupItem, BDropdown, 
BDropdownItemButton } from 'bootstrap-vue'

export default {
  name: 'deck-selection',
  components: { BListGroup, BListGroupItem, BDropdown, 
  BDropdownItemButton },
  data () {
    return {
    }
  },
  computed: {
    decksMeta () {
      return this.$store.getters.decksMeta
    }
  },  
  methods: {
    openDeck (id) {
      this.$store.commit('updateCurrentDeckId', id)
      this.$router.push('/deck-editor')
    },
    cardOrCards (deckLength) {
      if (deckLength === 1) {
        return ""
      } else {
        return "s"
      }
    },
    getTitleAbrev(title) {
        // There shouldn't be any empty title decks, but we can leave this validation here just in case
      if (title === "") {
        return ""
      } else {
        let split = title.split(" ")[0]
        let abrev
        if (split.length === 1) {
          abrev = split[0].charAt(0) + split[0].charAt(1)
        } else {
          abrev = split[0].charAt(0) + split[1].charAt(0)
        }
        return abrev
      }
    },
    deleteDeck(id) {
      this.$store.commit('deleteDeck', id)
    }
  },
  created () {
    this.$store.commit('updateCurrentDeckId', 'defaultDeck')
  }
}
</script>
<style scoped>
#main{
  padding: 15px 0px 0px 10px;
}
#list-group{
  margin-top: 15px
}
#list-group-item{
  margin: auto;
  margin-bottom: 5px;
  padding: 0px;
  background-color: transparent;
  max-width: 600px;
  border: transparent;
  width: 100%;
}
#list-group-item-row{
  margin-right: 0px;
}
#list-group-item-row >>> .btn-lg{
  padding: 0;
}
#text-col{
  padding: 0px 0px 10px 20px ;
}
#underline{
  position: absolute;
  bottom: 0px;
  left: 20px;
  height: 1px;
  width: 75%;
  background-color: rgba(0, 0, 0, 0.5);
}
#edit-col{
  padding: 0;
  width: 40px;
}
#edit-button {
    padding: 0;

}
#icon-col{
  padding: 0px; 
  height: 50px;
}
#icon:hover{
  cursor: pointer;
}
#icon{
  width: 46px;
  height: 46px;
  border-radius: 23px;
  text-align: center;
  font-size: 28px;
  padding-top: 1px;
  color: white;
  margin: auto;
}
#deck-abrev{
  margin: 0;
}
.text{
  padding: 0px 0px 0px 10px;
  margin: 0px
}
.text:hover{
  cursor: pointer;
}
.card-count{
  font-size: .8em;
  color: dimgray;
}
.title{
  font-size: 1.2em;
}
.deck-options{
  padding: 0;
}
.deck-options-button{
  padding: 0;
}
.deck-options:hover{
  color: black;
  padding: 0;
}
</style>