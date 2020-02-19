<template>
    <b-container fluid class="body">
        <b-row id="main-row">
            <b-col id="main-col">
                <b-container class="card">
                    <quill-editor v-model="card.front_rich_text" class="quill"
                    ref="myQuillEditorFront"
                    :options="editorOption"
                    v-highlight
                    ></quill-editor>
                </b-container>
                <br>
                <b-container class="card">
                    <quill-editor v-model="card.back_rich_text" class="quill"
                    ref="myQuillEditorBack"
                    :options="editorOption"
                    v-highlight
                    ></quill-editor>
                </b-container>
                <p id="counter" >{{ cardNumberOutOfDeck }}</p>                        
                <br>
                <b-container  class="tag-chooser" id="tags-bottom">
                    <p class="d-inline tags-label">Tags: 
                        <b-button class="add-btn" >
                            <font-awesome-icon v-if="!addingTag" class="d-inline add-icon" @click="toggleAddingTag()" color="white" size="1x" icon="plus-circle"/>
                            <font-awesome-icon v-if="addingTag" class="d-inline add-icon"  @click="addNewTag()" color="white" size="1x" icon="plus-circle"/>
                            <b-form-input class="d-inline tag-input" @keyup.enter="addNewTag()" v-if="addingTag" v-model="newTagTitle" >
                            </b-form-input>
                        </b-button>
                    </p>
                    <b-button  @click="removeTagFromCard(tag)" class="tag-style-button green-btn d-inline"  v-for="tag in card.card_tags" :key="tag" >
                    {{ tag }}
                    </b-button>
                    <br>
                    <b-button  @click="addTagToCard(tag)" class="tag-style-button white-btn d-inline"  v-for="tag in unincludedTags" :key="tag" >
                    {{ tag }}
                    </b-button>
                </b-container >
            </b-col>
        </b-row>
        <b-row id="buttons-row">
            <b-col id="buttons-col">
                <b-container id="buttons-inner">
                    <b-row>
                        <b-col class= "btn-col">
                            <b-button class="btn-circle btn-md"
                            @click="deleteCard()">
                                <font-awesome-icon size="2x" icon="trash-alt"/>
                            </b-button>
                        </b-col>
                        <b-col class= "btn-col">
                            <b-button :disabled="leftNavDisabled" class="btn-circle btn-md"
                            @click="previousCard()">
                                <font-awesome-icon size="2x" icon="step-backward"/>
                            </b-button>
                        </b-col>
                        <b-col class= "btn-col">
                            <b-button :disabled="rightNavDisabled" class="btn-circle btn-md"
                            @click="nextCard()">
                                <font-awesome-icon size="2x" icon="step-forward"/>
                            </b-button>
                        </b-col>
                        <b-col class= "btn-col">
                            <b-button class="btn-circle btn-md"
                            @click="doneCheck()">
                                <font-awesome-icon size="2x" icon="check"/>
                        </b-button>
                        </b-col>
                    </b-row>
                </b-container>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import { BFormInput } from 'bootstrap-vue'

import { isEqual } from 'lodash/core';
const uuidv4 = require('uuid/v4');
import { mapState } from 'vuex'
import { Quill, quillEditor } from 'vue-quill-editor'
import 'quill/dist/quill.snow.css'
import imageUpload from 'quill-plugin-image-upload';
Quill.register('modules/imageUpload', imageUpload);
const axios = require('axios');
const FormData = require('form-data');

export default {
    name: 'card-editor',
    components: {BFormInput, quillEditor},
    data() {
        return {
            card: '',
            initialDeckState : null,
            addingTag: false,            
            newTagTitle: '',
            editorOption: {
                theme: 'snow',
                modules: {      
                    imageUpload: {
                        upload: file => {
                            const gateway = 'https://gateway.pinata.cloud/ipfs/'
                            const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
                            let data = new FormData();
                            data.append('file', file);
                            const metadata = JSON.stringify({
                                name: 'testname',
                                keyvalues: {
                                    exampleKey: 'exampleValue'
                                }
                            });
                            data.append('pinataMetadata', metadata);
                            return axios.post(url,
                                data,
                                {
                                    maxContentLength: 'Infinity', //this is needed to prevent axios from erroring out with large files
                                    headers: {
                                        'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                                        'pinata_api_key': this.pinataKeys.pinata_api,
                                        'pinata_secret_api_key': this.pinataKeys.pinata_key
                                    }
                                }
                            ).then(function (response) {
                                return gateway + response.data.IpfsHash
                            }).catch(function () {
                                // console.log(error)    
                            })
                        }
                        
                    },
                    toolbar:this.$store.state.userCollection.webapp_settings.textEditorSettings.editorOptions.toolbar,
                    syntax: {
                        highlight: text => window.hljs.highlightAuto(text).value    
                    },
                    history: {
                        delay: 2000,
                        maxStack: 500,
                        userOnly: true
                    }
                }
            },
        }
    },
    props: [ 'newCardClicked', 'comingToCardEditorFromReview', 'newCardCommit' ],
    computed: {
        ...mapState({
            userCollection: 'userCollection',
            cardToEditIndex: 'cardToEditIndex',
            decks: 'decks',
            jwt: 'jwt',
            pinataKeys: 'pinataKeys',
        }),
        currentDeck() {
            return this.$store.getters.currentDeck
        },
        unincludedTags () {
            // this now rides on review deck in getters
            let allTagsList = this.$store.getters.reviewDeck.allTags
            let unincludedTagsList = []
            for (let tag of allTagsList) {
                if (!this.card.card_tags.includes(tag)) {
                    unincludedTagsList.push(tag)
                }
            }
            return unincludedTagsList
        },
        leftNavDisabled () {
            if (this.cardToEditIndex === 0){ 
                return true                        
            }
            else {
                return false
            }
        },
        rightNavDisabled () {
            if (this.cardToEditIndex === this.currentDeck.cards.length -1 ) {
                return true 
            } 
            else {
                return false
            }
        },
        unChanged () {
            let card = this.card
            let result = true
            if (card !== null && this.initialDeckState !== null) {
                for (let initialDeckCard of this.initialDeckState.cards) {
                    if (card.card_id === initialDeckCard.card_id) {
                        if ( !isEqual(initialDeckCard, card)) {
                        result = false
                        break
                        } else {
                        result = true
                        break
                        }
                    }
                }
            }
            return result
        },
        cardNumberOutOfDeck() {
            let totalCards = this.currentDeck.cards.length
            let currentCardNumber = this.cardToEditIndex + 1
            let title = this.currentDeck.title
            if (this.currentDeck.title === undefined) {
                title = "Review Deck"
            }
            return `Card ${currentCardNumber}/${totalCards} in: ${title}`  
        }        
    },
    methods: {
        setCard() {
            this.card = JSON.parse(JSON.stringify(this.currentDeck.cards[this.cardToEditIndex]))
            
        },
        deleteCard: function () {
            let card = JSON.parse(JSON.stringify(this.card))
            let deck = JSON.parse(JSON.stringify(this.currentDeck))
            let wasLastCard
            if (this.rightNavDisabled) {
                wasLastCard = true
            }
            let deck_id = null 
            if (deck.title === 'Review Deck') {
                deck_id = this.findCardsDeck(card.card_id)
            } else {
                deck_id = deck.deck_id
            }
            let deleteData = {deck_id: deck_id, card_id: card.card_id}
            if (deck.cards.length === 1 || this.comingToCardEditorFromReview) {
                this.$router.go(-1)
                this.$store.commit('deleteCard', deleteData)
                this.$store.commit('deleteCardFromSchedule', card.card_id)
            } else {
                if (wasLastCard) {
                    this.$store.commit('updateCardToEditIndex', this.cardToEditIndex - 1)
                }
                this.$store.commit('deleteCard', deleteData)
                this.$store.commit('deleteCardFromSchedule', card.card_id)
                this.setCard()
            }
        },
        findCardsDeck: function (card_id){
            for (let deck of this.decks) {
                for (let card of deck.cards){
                    if (card.card_id === card_id){
                        return deck.deck_id
                    }
                }
            }
        },
        previousCard: function() {
            if (!this.unChanged) {
                this.submit(this.card)
                this.$store.commit('updateCardToEditIndex', this.cardToEditIndex - 1) 
            } else {
                this.$store.commit('updateCardToEditIndex', this.cardToEditIndex - 1) 
                this.setCard()
            }
        },
        nextCard: function() {
          if (!this.unChanged) {
                this.submit(this.card)
                this.$store.commit('updateCardToEditIndex', this.cardToEditIndex + 1) 
            } else {
                this.$store.commit('updateCardToEditIndex', this.cardToEditIndex + 1) 
                this.setCard()
            }
        },
        doneCheck: function () {
            if (!this.unChanged) {
                this.submit(this.card)
            }
            let wasLastCard
            if (this.rightNavDisabled) {
                wasLastCard = true
            }
            let currentDeckLength = this.currentDeck.cards.length
            if (currentDeckLength === 1 || this.comingToCardEditorFromReview) {
                this.$router.go(-1)
            }
            else if (wasLastCard) {
                this.$store.commit('updateCardToEditIndex', this.cardToEditIndex - 1)
            }
            else {
                this.$store.commit('updateCardToEditIndex', this.cardToEditIndex + 1)
            }
            
        },
        getQuillData: function (cardInput) {
            // copy image and plaintext
            let card = JSON.parse(JSON.stringify(cardInput))
            let quillFrontDelta = this.$refs.myQuillEditorFront.quill.getContents();
            for (let line of quillFrontDelta.ops) {
                if (line.insert.image) {
                    card.front_image = line.insert.image
                    break
                }
            }
            let frontGottenText = this.$refs.myQuillEditorFront.quill.getText();
            card.front_text = frontGottenText
            let quillBackDelta = this.$refs.myQuillEditorBack.quill.getContents();
            for (let line of quillBackDelta.ops) {
                if (line.insert.image) {
                    card.back_image = line.insert.image
                    break
                }
            }
            let backGottenText = this.$refs.myQuillEditorBack.quill.getText();
            card.back_text = backGottenText
            return card
        },
        submit: function (cardInput) {
            let card = this.getQuillData(cardInput)
            // remove empty card
            if (card.front_text === "" && card.back_text === "") {
                this.deleteCard()
            }
            else {
                let deck_id = null 
                if (this.currentDeck.title === 'Review Deck') {
                    deck_id = this.findCardsDeck(card.card_id)
                } else {
                    deck_id = this.currentDeck.deck_id
                }
                let updateData = {deck_id: deck_id, card: card}
                this.$store.dispatch('updateCard', updateData)
            }
            this.setCard()
        },
        // use later for dropdown menu, copy to other deck
        addCardToDeck: function (deck_id) {
            let card = JSON.parse(JSON.stringify(this.card))
            let addData = {deck_id: deck_id, card: card}
            this.$store.commit('addCard', addData)
        },
        removeTagFromCard: function(tag){
            let card = JSON.parse(JSON.stringify(this.card))
            card.card_tags.splice(card.card_tags.indexOf(tag),1)
            this.submit(card)
        },
        addTagToCard: function(tag){
            let card = JSON.parse(JSON.stringify(this.card))
            if (tag === "Daily Review") {
                this.$store.commit('addCardToSchedule', card.card_id)
            }
            card.card_tags.unshift(tag)
            this.submit(card)
        },
        toggleAddingTag: function () {
            this.addingTag = !this.addingTag
        },
        // new 
        moveCard: function(){},
        copyCardToNewDeck: function(){},
        duplicateCArd: function(){},
        // move this to deck selection page. keep here for option 'creat new deck', when selecting move/add to another deck
        addNewDeck: function () {
            if (this.newDeckTitle === "" || this.newDeckTitle === " ") {
                this.toggleAddingDeck()
            } else{
                let emptyDeck = {
                    cards: [this.card],
                    created_by: this.userCollection.user_id,
                    deck_id: uuidv4(),
                    deck_tags: [],
                    description: null,
                    editable_by: "only_me",
                    edited: Math.round(new Date().getTime()),  
                    lang_back:"en",
                    lang_front:"en",
                    term_count: 1,
                    title: this.newDeckTitle,
                    visibility:"public",
                    icon_color: this.generateRandomHslaColor()
                    }
                this.$store.commit('addDeck', emptyDeck)
                this.newDeckTitle= ""
            }
        },
        generateRandomHslaColor: function (){
            // round to an interval of 20, 0-360
            let hue = Math.round(Math.random() * 360 / 20) * 20
            let color = `hsla(${hue}, 100%, 50%, 1)`
            return color
        },
        addNewTag: function () {
            let card = JSON.parse(JSON.stringify(this.card)) 
            let allTags = this.unincludedTags.concat(card.card_tags)
            if (allTags.includes(this.newTagTitle) || this.newTagTitle === '' || this.newTagTitle === ' ') {
                this.newTagTitle = ''
                this.toggleAddingTag()
            } else {
                card.card_tags.unshift(this.newTagTitle)
                this.submit(card)
                this.newTagTitle = ''
                this.toggleAddingTag()
            }
        },
        newCardFirst() {
            if (!this.unChanged) {
                this.submit(this.card)
            }
        },
        newCardThen() {
            this.setCard()
            this.initialDeckState = JSON.parse(JSON.stringify(this.currentDeck))
        },
    },
    created () {
        this.setCard()
        this.initialDeckState = JSON.parse(JSON.stringify(this.currentDeck))
    },
    watch: {
        newCardClicked: function () {
            this.newCardFirst()
        },
        newCardCommit: function (){
            this.newCardThen()
        }
    },
  }
</script>

<style scoped>
.body{
    background-color: C7C7C7;
    overflow-y: auto;
    margin: auto;   
}
.body::-webkit-scrollbar {
    width: .5em;
}
.body::-webkit-scrollbar-thumb {
    background-color: grey;
    border-radius: 5px;
}

#main-col {
    width: 100%;
    padding: 0px 10px;
 }
 #card-container {
     padding: 0;
 }
.card {
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
    width: 100%;
}
.card::-webkit-scrollbar {
width: .5em;
}
.card::-webkit-scrollbar-thumb {
background-color: grey;
border-radius: 5px;
}
.card-text-input {
border: hidden;
word-wrap: normal;
margin: auto;
margin-top: 0px;
font-size: 1em;
padding: 0.3em 0px 0px;
min-height: 4.8em;
}
.card-text-input::-webkit-scrollbar {
width: .5em;
}
.card-text-input::-webkit-scrollbar-thumb {
background-color: lightgrey;
border-radius: 5px;
}
.img {
margin: auto;
margin-top: .5em;
object-fit: fill;
width: 90%;
}

.flashcard:hover {
box-shadow: 0 0px 25px rgba(0, 0, 0, 0.8);
}
#counter{
    color: grey; 
    margin:  40px auto 0px;
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
height: .5em;
}
.tag-chooser::-webkit-scrollbar-thumb {
background-color: lightgrey;
border-radius: 5px;
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
.green-btn {  background-color: rgba(185, 255, 184, 1)}
.white-btn {  background-color: white;}


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
.add-icon{
margin: .58em;
height: 1em;
}
.tag-input{
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

color:grey;
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
width: 100vw;
z-index: 1000;
background-color: rgba(63, 47, 47, 0.3)
}
#buttons-col {
max-width: 600px;
margin: auto;
  }
.btn-col{
padding: 0px;
margin: 5px 2px;
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
.quill >>> p .ql-size-small{
    font-size: 0.75em;
}
.quill >>> p .ql-size-large{
    font-size: 2em;
}
.quill >>> p .ql-size-huge{
    font-size: 3.5em;
}
  </style>
