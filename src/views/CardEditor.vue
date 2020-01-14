<template>
    <b-container fluid id="body">
        <b-container class="card">
            <b-row  class="card-row">
                <b-col v-if="card.front_image">
                    <b-img-lazy class="img" v-if="card.front_image" :src="card.front_image"></b-img-lazy>
                </b-col>
                <b-col >
                    <b-form-textarea class="card-text-input" id="front-text-input" v-model="card.front_text"></b-form-textarea>
                </b-col>
            </b-row>
        </b-container>
        <br>
        <b-container class="card">
            <b-form-textarea class="card-text-input" id="back-text-input" v-model="card.back_text"></b-form-textarea>
            <b-img-lazy v-if="card.back_image" class="img" :src="card.back_image"></b-img-lazy>
        </b-container>
        <br>
        <b-container class="tag-chooser">
            <p class="d-inline-block tags-label">Deck:</p>
            <b-button  class="tag-style-button green-btn d-inline-block"  v-for="deck in includedDecks" :key="deck.edited" > 
                    {{ deck.title.slice(0, 24) }}
            </b-button>
            <br>
            <b-button  class="tag-style-button white-btn d-inline-block"  v-for="deck in unincludedDecks" :key="deck.edited" > 
                    {{ deck.title.slice(0, 24) }}
            </b-button>
        </b-container>
        <b-container  class="tag-chooser" id="tags-bottom">
            <p class="d-inline tags-label">Tags:</p>
            <b-button  class="tag-style-button green-btn d-inline"  v-for="deck in includedDecks" :key="deck.edited" > 
                {{ deck.title.slice(0, 24) }}
            </b-button>
            <br>
            <b-button  class="tag-style-button white-btn d-inline"  v-for="deck in unincludedDecks" :key="deck.edited" > 
                {{ deck.title.slice(0, 24) }}
            </b-button>
        </b-container >
        <b-row id="buttons-row" >
            <b-col>
                <b-button class="btn-circle btn-md" @click="deleteCard()">
                    <font-awesome-icon size="2x" icon="trash-alt"/>
                </b-button>
            </b-col>
            <b-col>
                <b-button class="btn-circle btn-md" @click="previousCard()">
                    <font-awesome-icon size="2x" icon="step-backward"/>
                </b-button>
            </b-col>
            <b-col>    
                <b-button class="btn-circle btn-md" @click="undo()">
                    <font-awesome-icon size="2x" icon="undo"/>
                </b-button>
            </b-col>
            <b-col>
                <b-button class="btn-circle btn-md" @click="nextCard()">
                    <font-awesome-icon size="2x" icon="step-forward"/>
                </b-button>
            </b-col>
            <b-col>    
                <b-button class="btn-circle btn-md" @click="doneCheck()">
                    <font-awesome-icon size="2x" icon="check"/>
                </b-button>
            </b-col>
        </b-row>  
    </b-container>
</template>

<script>
import _ from 'lodash';   
const uuidv4 = require('uuid/v4');

import { mapState } from 'vuex'
export default {
    name: 'card-editor',
    data() {
        return {
            initialDeckState : null
        };
    },
    computed: {
        ...mapState({
            cardToEditIndex: 'cardToEditIndex',
            decksMeta: 'decksMeta',
            decks: 'decks',
            currentDeck: 'currentDeck',
            jwt: 'jwt'
        }),
        card() {
            if (this.currentDeck == null){
                return {}
            }
            else {
                return this.currentDeck[this.cardIndex]
            }
        },
        cardIndex () {
             if (this.cardToEditIndex < 0){ 
                return 0
            } if (this.cardToEditIndex === this.currentDeck.length){
                return this.cardToEditIndex 
            } if ( this.cardToEditIndex > this.currentDeck.length){
                return this.currentDeck.length
            }
            else {
                return this.cardToEditIndex
            }
        },
        includedDecks () {
            var card = this.card
            return this.decks.filter(function (deck) {
                return deck.cards.indexOf(card)>-1
            })
        },
        unincludedDecks () {
            var card = this.card
            return this.decks.filter(function (deck) {
                return !deck.cards.includes(card)
            }) 
        }
    },
    methods: {
        createCard () {
            let newCard = {
                back_text:"",
                card_id: uuidv4(),
                card_tags: [],
                front_text: ""
            }
            this.currentDeck.push(newCard)
        },
        deleteCard () {
            // for each of the included decks, filter out the current card from its .cards
            let changedDecks = this.unincludedDecks
            for (let deck of this.includedDecks) {
                let card = this.card
                let updatedDeckCards = deck.cards.filter(function (x) {
                    return x.card_id != card.card_id
                    }) 
                deck.cards = updatedDeckCards
                changedDecks.push(deck)
                deck.edited = Math.round(new Date().getTime() / 1000);
            }
            this.$store.commit('updateDecks', changedDecks)
            this.$store.dispatch('refreshDecksMeta')
            this.$router.go(-1)
        },
        previousCard() {
            let card = this.card
            for (let initialDeckCard of this.initialDeckState) {
                if (card.card_id === initialDeckCard.card_id) {
                    if ( !_.isEqual(initialDeckCard, card)) {
                            this.submit()
                    }
                }
            }
            this.$store.commit('updateCardToEditIndex', this.cardToEditIndex - 1)
        },
        undo () {
            return null
        },
        nextCard() {
            let card = this.card
            for (let initialDeckCard of this.initialDeckState) {
                if (card.card_id === initialDeckCard.card_id) {
                    if ( !_.isEqual(initialDeckCard, card)) {
                            this.submit()
                    }
                }
            }
            this.$store.commit('updateCardToEditIndex', this.cardToEditIndex + 1)
        },
        doneCheck () {
            this.submit()
            this.$router.go(-1)
        },
        submit () {
            // check to make sure card isnt blank, maybe disable all the buttons

            // for each of the included decks, 
            let changedDecks = this.unincludedDecks.slice(0)
            for (let deck of this.includedDecks) {
                let card = this.card
                // filter out the old version card from .cards
                let updatedDeckCards = deck.cards.filter(function (x) {
                    return x.card_id != card.card_id
                    })
                // then add new one back
                updatedDeckCards.push(card)
                deck.cards = updatedDeckCards
                deck.edited = Math.round(new Date().getTime() / 1000);
                changedDecks.push(deck)
            }
            this.$store.commit('updateDecks', changedDecks)
            this.$store.dispatch('refreshDecksMeta')
        }
    },
    created () {
        // deep copy so it doesnt change
        this.initialDeckState = JSON.parse(JSON.stringify(this.currentDeck))
    },
     watch: {
            cardToEditIndex: function() {
                if (this.cardToEditIndex < 0){ 
                    this.$store.commit('updateCardToEditIndex', 0)
                } if (this.cardToEditIndex === this.currentDeck.length){
                    this.createCard()
                } if (this.cardToEditIndex > this.currentDeck.length){
                    this.$store.commit('updateCardToEditIndex', this.currentDeck.cards.length)
                }
            }
        },  
}
</script>

<style scoped>
#body{
    background-color: C7C7C7;
  
    overflow-y: auto;

}

.card {
    margin: auto;
    top: 30px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 1.5em;
    padding: 15px;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.51);
    text-align: left;
    overflow-y: auto;
    width: 90vw;
   
}
.card::-webkit-scrollbar {
    width: .5em;
}
.card::-webkit-scrollbar-thumb {
    background-color: lightgrey;
    border-radius: 5px;
}
.card-text-input {
    border: hidden;
    word-wrap: normal;
    margin: auto;
    margin-top: 0px;
    font-size: 1em;
    padding-top: 0px;
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
    width: 68vw;
    max-height: 50vh;
}

.flashcard:hover {
    box-shadow: 0 0px 25px rgba(0, 0, 0, 0.8);
}


.tag-chooser {
    margin: 1em auto;
    margin-right: 0px;
    height: 7.5em;
    overflow-x: auto;
    white-space: nowrap;
    position: initial;
    padding: 0px;
}

.tag-chooser::-webkit-scrollbar {
    height: .5em;
} 
.tag-chooser::-webkit-scrollbar-thumb {
    background-color: lightgrey;
    border-radius: 5px;
}
.tags-label {
    margin-left: 10px;
}

.tag-style-button {
    border-radius: 10px;
    margin: 5px 10px;
    border-width: 0px;
    color: grey;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.51);

}
.green-btn {  background-color: rgba(185, 255, 184, 1)}
.white-btn {  background-color: white;}

#tags-bottom {
    margin-bottom: 80px;
}


.btn-circle.btn-md { 
    width: 50px; 
    height: 50px; 
    padding: 10px 16px; 
    margin: 5px auto;
    border-radius: 25px; 
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



</style>