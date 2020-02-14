<template>
    <div>
        <b-container id="review-body" v-if="todaysDeck.cards.length > 0">
            <b-row id="top-buttons-row" class="justify-content-end">
                <a class="edit"><font-awesome-icon @click="editCard(currentCard, reviewDeck)" size="1x" icon="edit"/></a>
            </b-row>
            <b-row id="card-row" class="" @click="flipCard()">
                <b-col class="card-col">
                <vue-flashcard
                    id="main-card"
                    :isToggle= "cardFlipToggle"
                    :front="currentCard.front_rich_text" 
                    :back="currentCard.back_rich_text"
                    >
                </vue-flashcard>
                <div id="next-card-padding-outer">
                    <div id="next-card-padding">
                        <vue-flashcard  v-if="todaysDeck.cards.length > 1"
                            id="next-card"
                            :front="nextCard.front_rich_text" 
                            :back="nextCard.back_rich_text"
                            >
                        </vue-flashcard>
                    </div>
                </div>
                <div id="third-card-padding-outer">
                    <div id="third-card-padding">
                        <vue-flashcard  v-if="todaysDeck.cards.length > 2"
                            id="third-card" class ="card"
                            front="   /n /n /n   " 
                            back="   /n /n /n   " > 
                        </vue-flashcard>
                    </div>
                </div>
                </b-col>
            </b-row>
            <b-row id="buttons-row" >
                <b-col>
                    <b-button v-if="cardFlipToggle === true" class="btn-circle" @click="incorrect()">
                        <font-awesome-icon class="btn-icon" size="2x" icon="times"/>
                    </b-button>
                </b-col>
                <b-col>    
                    <b-button class="btn-circle" @click="flipCard()">
                        <font-awesome-icon class="btn-icon" size="2x" icon="sync"/>
                    </b-button>
                </b-col>
                <b-col>    
                    <b-button v-if="cardFlipToggle === true" class="btn-circle" @click="correct()">
                        <font-awesome-icon class="btn-icon" size="2x" icon="check"/>
                    </b-button>
                </b-col>
            </b-row>  
        </b-container> 
        <b-container v-else style="text-align: center;">
            <br>
            <h1>
                Good work!
            </h1>
            <p>You've finished all your cards for today.</p>
        </b-container>         
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import vueFlashcard from '../components/flashcard.vue';

export default {

    name: "home",
    data() {
        return {
            // currentCardIndex: 0,
            cardFlipToggle: false,
            cardsCompleted: 0,
            cardsTotal: 0,
            todaysDeckCardIds: [],
        }
    },
    computed: {
        ...mapGetters([
            'reviewDeck'
        ]),
        todaysDeckFull () {  //before max card limit is applied
            return this.$store.getters.todaysDeck
        },
        todaysDeck() {
            let cards = []
            for (let card of this.todaysDeckFull.cards) {
                if (this.todaysDeckCardIds.includes(card.card_id)){
                    cards.push(card)
                }
            }
            return { cards: cards }
        },
        currentCard () {
            return this.todaysDeck.cards[0]
        },
        nextCard () {
            if (this.todaysDeck.cards.length > 1){
                return this.todaysDeck.cards[this.todaysDeck.cards.indexOf(this.currentCard) + 1]
            } else {
                return {front_rich_text: "    /n /n /n    ", back_rich_text: "    /n /n /n    "} 
            }
        },
    },
    methods: {
        flipCard () {
            this.cardFlipToggle=!this.cardFlipToggle
        },
        incorrect () {
            this.$store.dispatch('levelDownCard', this.currentCard.card_id)
            // this.currentCardIndex ++
            this.cardFlipToggle = false
            this.NavbarProgess()
           
        },
        correct () {
            this.$store.dispatch('levelUpCard', this.currentCard.card_id)
            // this.currentCardIndex ++
            this.cardFlipToggle = false
            this.NavbarProgess()
        },
        NavbarProgess() {
            let totalCards = this.todaysDeckCardIds.length
            let completed = this.todaysDeckCardIds.length - this.todaysDeck.cards.length
            let updateData= {totalCards: totalCards, completed: completed}
            this.$store.dispatch('navProgress', updateData)
        },
        editCard(card, reviewDeck) {
            this.$store.commit('updateNavToCardEditorFromReview', true)
            this.$store.commit('updateCardToEditIndex', reviewDeck.cards.indexOf(card))
            this.$router.push('/card-editor')
        },
        // populateSchedule(){
        //     // initial schedule when its empty for testing
        //     for (let card of this.reviewDeck.cards) {
        //         this.$store.commit('addCardToSchedule', card.card_id)
        //         // console.log('   addCardToSchedule',card.card_id)
        //     }
        // },
        // resetSchedule(){
        //     // reset schedule for testing
        //     for (let card of this.reviewDeck.cards) {
        //         this.$store.commit('resetCardSchedule', card.card_id)
        //         // console.log('   resetCardSchedule',card.card_id)
        //     }
        // }
     
        // plaintextToRichtext () {
        //     for (let deck of this.$store.state.decks) {
        //         console.log('checking a deck')
        //         for (let oldCard of deck.cards) {
        //             if (oldCard.front_rich_text !== oldCard.front_text || oldCard.back_rich_text !== oldCard.back_text){
        //                oldCard.front_rich_text = JSON.parse(JSON.stringify(oldCard.front_text))
        //                 oldCard.back_rich_text = JSON.parse(JSON.stringify(oldCard.back_text))
        //                 let cardUpdateData = { deck_id: deck.deck_id, card: oldCard }
        //                 this.$store.commit('updateCard', cardUpdateData) 
        //             }
        //         }
        //     }
        // }
        // duplicateChecker () {
        //     for (let deck of this.$store.state.decks) {
        //         for (let dupDeck of this.$store.state.decks) {
        //             let dupCount = 0
        //             if (deck.deck_id === dupDeck.deck_id) {
        //                 dupCount ++
        //                 console.log("    dupCount", dupCount)    
        //                 if (dupCount > 1) {
        //                     console.log("    duplicate deck  detected", dupDeck)
        //                     this.$store.commit('deleteDeck', dupDeck.deck_id)
        //                 }
        //             }
        //         }
        //     }
        //     for (let deck of this.$store.state.decks) {
        //         for (let card of deck.cards) {
        //             let dupCount = 0
        //             for (let cardDup of deck.cards) {
        //                 if (card.card_id === cardDup.card_id) {
        //                     dupCount ++
        //                     console.log("    dupCount", dupCount)    
        //                     if (dupCount > 1) {
        //                         console.log("    duplicate card  detected", cardDup)
        //                         let deleteData = { deck_id: deck.deck_id, card_id:  cardDup.card_id,}
        //                         this.$store.commit('deleteCard', deleteData)
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }
        // generateRandomHslaColor (){
        //     // round to an interval of 20, 0-360
        //     let hue = Math.round(Math.random() * 360 / 20) * 20
        //     let color = `hsla(${hue}, 100%, 50%, 1)`
        //     return color
        // },
        // setAllDeckColors () {
        //     let decks = this.$store.state.decks
        //     for (let deck of decks) {
        //         if (!deck.icon_color) {
        //         // console.log("setting deck icons")
        //          deck.icon_color = this.generateRandomHslaColor()
        //             deck.edited = Math.round(new Date().getTime());
        //     this.$store.commit('updateDeck', deck)
        //         }
        //     }
        // }
    },
    created () {
        // this.setAllDeckColors()
        // this.duplicateChecker()
        // this.plaintextToRichtext()
        this.$store.commit('updateCurrentDeckId', 'reviewDeck')
        if (this.$store.state.lastSyncsData === '') {
            this.$store.dispatch('refreshLastSyncsData')
        }
        this.$store.commit('updateNavToCardEditorFromReview', false)
        // this.currentCardIndex = 0
        this.$store.commit('toggleNavNewCardDisabled', false)
        // this.populateSchedule()
        // this.resetSchedule()
        for (let card of this.todaysDeckFull.cards) {
            let maxReviewLength = this.$store.state.userCollection.webapp_settings.scheduleSettings.maxCards
            if (this.todaysDeckFull.cards.length >= maxReviewLength) {
                break
            } else {
                if (!this.todaysDeckCardIds.includes(card)){
                    this.todaysDeckCardIds.push(card.card_id)
                }
            }
        }
        this.$store.dispatch('navProgress', {totalCards: this.todaysDeckCardIds.length, completed: 0})
    },
    components: { vueFlashcard }
}
</script>

<style scoped>
.edit {
    color: gray;
    margin: 5px;
    right: 3px;
    z-index: 1;
    position: absolute;
}
.edit:hover{
    cursor: pointer;
}

#main-card {
    margin: auto;
    margin-top: 30px;
    max-width: 600px;
}
#next-card-padding-outer{
    z-index: -1;
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
}
#next-card-padding {
    width: 82%;
    margin: auto;
    z-index: -1;
}
#next-card {
    z-index: -1;
    margin: auto;
    margin-top: 20px;
    max-width: 480px;
}
#third-card-padding-outer{
    z-index: -2;
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
}
#third-card-padding {
    width: 70%;
    margin: auto ;
    z-index: -2;
}
#third-card {
    z-index: -2;
    margin: auto;
    margin-top: 10px;
    max-width: 380px;
    border-radius: 10px;
}
.btn-icon{
    margin: auto;
}
.btn-circle{ 
    width: 46px; 
    height: 46px; 
    padding: 0; 
    margin: 7px auto;
    border-radius: 23px; 
    font-size: 12px; 
    text-align: center; 
    color:grey;
    background-color: white;
    border: none;
    box-shadow: 0 0px 5px rgba(0, 0, 0, 0.5);
    max-height: 25vh;
    } 
.btn-circle.btn-xl:hover {
    box-shadow: 0 0px 25px rgba(0, 0, 0, 0.8);
}

#buttons-row {
    margin: auto;
    text-align: center;
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.3)

}
</style>