<template>
    <div>
        <b-container id="review-body" v-if="todaysDeck.cards.length > 0">
            <b-row id="top-buttons-row" class="justify-content-end">
                <a id="edit"><font-awesome-icon @click="editCard(currentCard, reviewDeck); $emit('edit-clicked')" size="1x" icon="edit"/></a>
            </b-row>
            <b-row id="card-row" class="" @click="flipCard()">
                <b-col v-if="!spinner" class="card-col">
                    <span id="main-card-padding" class="card-padding"
                      :class="switchCardSequence && correctAnswer ? 'throw-right': 
                              switchCardSequence  && !correctAnswer ? 'throw-left': '' "
                                           v-touch:swipe.left="incorrect"
                            v-touch:swipe.right="correct">
                        <vue-flashcard
                            class="first-card"
                            id="main-card"
                            :flipped="cardFlipToggle"
                            :front="currentCard.front_rich_text" 
                            :back="currentCard.back_rich_text"
                            :key="reDrawCardKey"
                            >
                        </vue-flashcard>  
                    </span>
                    <div id="next-card-padding" class="card-padding">
                        <vue-flashcard  v-if="todaysDeck.cards.length > 1"
                            :class="switchCardSequence ? 'switch-crd-seq-next-crd': 'next-card' "
                            id="next-card"
                            :front="nextCard.front_rich_text" 
                            :back="' '"
                            >
                        </vue-flashcard>
                    </div>
                    <div id="third-card-padding" class="card-padding">
                        <vue-flashcard  v-if="todaysDeck.cards.length > 2"
                            :class="switchCardSequence ? 'switch-crd-seq-third-crd': 'third-card' "
                            id="third-card" class ="card"
                            front="   /n hahaha! you'll never see me /n   " 
                            back="   /n /n /n   " > 
                        </vue-flashcard>
                    </div>
                    <div id="fourth-card-padding" class="card-padding">
                        <vue-flashcard  v-if="todaysDeck.cards.length > 2"
                            :class="switchCardSequence ? 'switch-crd-seq-fourth-crd': 'fourth-card' "
                            id="fourth-card" class ="card"
                            front="   /n hahaha! you'll never see me /n   " 
                            back="   /n /n /n   " > 
                        </vue-flashcard>
                    </div>                    
                </b-col>
                <b-col v-else>
                    <font-awesome-icon style="margin: auto" icon="spinner" spin size="3x" />
                    <p style="margin: auto" >syncing</p>
                </b-col>
            </b-row>
            <b-row id="buttons-row" >
                <b-col class="buttons-col">
                    <b-button aria-label="Incorrect" v-if="cardFlipToggle" class="btn-circle" @click="incorrect()">
                        <font-awesome-icon class="btn-icon" size="2x" icon="times"/>
                    </b-button>
                </b-col>
                <b-col class="buttons-col">    
                    <b-button aria-label="flip" class="btn-circle" @click="flipCard()">
                        <font-awesome-icon class="btn-icon" size="2x" icon="sync"/>
                    </b-button>
                </b-col>
                <b-col class="buttons-col">    
                    <b-button aria-label="Correct" v-if="cardFlipToggle" class="btn-circle" @click="correct()">
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
import { mapState } from 'vuex'
const vueFlashcard = () => import('../components/flashcard')

import defaultCollection from '../assets/defaultCollection.json'
export default {
    name: "home",
    data() {
        return {
            // currentCardIndex: 0,
            authStatus: false,
            spinner: false,
            cardFlipToggle: false,
            cardsCompleted: 0,
            cardsTotal: 0,
            todaysDeckCardIds: [], 
            loggingIn: false,
            switchCardSequence: false,
            reDrawCardKey: 0,
            correctAnswer: false,
        }
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
        ]),
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
            this.cardFlipToggle = !this.cardFlipToggle
        },
        incorrect (flag) {
            this.correctAnswer = false            
            this.switchCardSequence = true
            if(!flag) {
                setTimeout( ()=>{
                    this.$store.dispatch('levelDownCard', this.currentCard.card_id)
                    this.NavbarProgess()
                    this.incorrect(true)
                }, 305);
                return;
            }                
            this.cardFlipToggle = false
            this.reDrawCardKey ++
            // this.currentCardIndex ++
            this.switchCardSequence= false
        },
        correct (flag) {
            this.correctAnswer = true
            this.switchCardSequence = true
            if(!flag) {
                setTimeout( ()=>{
                    this.$store.dispatch('levelUpCard', this.currentCard.card_id)
                    this.NavbarProgess()
                    this.correct(true)
                }, 305);
                return;
            }    
            this.cardFlipToggle = false
            this.reDrawCardKey ++
            // this.currentCardIndex ++
            this.switchCardSequence = false
        },
        NavbarProgess() {
            let totalCards = this.todaysDeckCardIds.length
            let completed = this.todaysDeckCardIds.length - this.todaysDeck.cards.length
            let updateData= {totalCards: totalCards, completed: completed}
            this.$store.dispatch('navProgress', updateData)
        },
        editCard(card, reviewDeck) {
            this.$store.commit('updateCardToEditIndex', reviewDeck.cards.indexOf(card))
            this.$router.push('/card-editor')
        },
        async checkAuth () {
            await this.$store.dispatch('checkJwt')
            if (this.isAuthenticated) {
                // but upon entry we'll need to query decks metadata and make sure we aren't missing updates
                // if there's no internet, post the unsynced data warning AND a special login without sync warning.
                this.authStatus = true
            } else {
                this.authStatus = false
            }
        },
    },
    created () {
        this.checkAuth()
    },
    mounted () {
        this.$store.commit('updateCurrentDeckId', 'reviewDeck')
        let localStorageEmpty = false
        let newUser = null
        if (this.userCollection === null | this.decks === null){
            localStorageEmpty = true
        }
        else if(this.userCollection.user_id === "tutorial") {
            newUser = true
        }
        // define the users as true false variables, then later be like if(newUserfirst page refresh)
        // new user returning
        // old user cache but jwt off


        // console.log('   newUser',newUser)
        // console.log('   localStorageEmpty',localStorageEmpty)
        // console.log('   auth status',this.authStatus)
        // console.log('   this.jwt',this.jwt)

        // returning user, expired jwt
        if (this.authStatus === false && this.jwt !== null && !newUser){
                    // console.log('returning user, expired jwt')

            this.$router.push('login');
        }
        // returning user, valid jwt, no cache
        else if (this.authStatus === true && localStorageEmpty){
                            // console.log('returning user, valid jwt, no cache')

            this.$store.commit('updateUserCollection', defaultCollection['user_collection'])
            this.$store.commit('updateDecks', defaultCollection['decks']) // might be overlap
            this.$store.commit('toggleSyncFailed', false) // we'll watch this, then set collection and cancel spinner when done syncing
            this.loggingIn = true
            this.spinner = true            
            this.$store.dispatch('sync')
        }

        // returning user, valid jwt, has cache
        else if (this.authStatus === true && !localStorageEmpty){
                            // console.log('returning user, valid jwt, has cache')

            this.$store.commit('toggleSyncFailed', false)
            this.loggingIn = true
            this.spinner = true
            this.$store.dispatch('sync')
        }

        // new user or no JWT
        else if(this.authStatus === false && this.jwt ===null || newUser ) {
            // console.log('new user or no JWT')
            this.$store.commit('updateUserCollection', defaultCollection['userCollection'])
            this.$store.commit('updateDecks', defaultCollection['decks'])
        }

        if (this.lastSyncsData === null) {
            this.$store.dispatch('refreshLastSyncsData')
        }
        // this.currentCardIndex = 0

        // set todaysDeck to maximum length as per settings
        for (let card of this.todaysDeckFull.cards) {
            let maxReviewLength = this.userCollection.webapp_settings.scheduleSettings.maxCards
            if (this.todaysDeckFull.cards.length >= maxReviewLength) {
                break
            } else {
                if (!this.todaysDeckCardIds.includes(card)){
                    this.todaysDeckCardIds.push(card.card_id)
                }
            }
        }
        this.$store.dispatch('navProgress', {totalCards: this.todaysDeckCardIds.length, completed: 0})
        this.$emit('homeLoad')
    },
    watch: {
        syncing: function () {
            if (this.loggingIn === true && this.syncing ===true && this.syncFailed === true) {
                this.spinner = true
            } else {
                this.spinner = false
            }
        }
    },
    components: { vueFlashcard }
}
</script>

<style scoped>
#review-body{
    height: 100%;
}
#edit {
    color: gray;
    margin: 5px;
    right: 3px;
    z-index: 6;
    position: absolute;
}
#edit:hover{
    cursor: pointer;
}
.throw-right{
    transform: translateX(1000px) translateY(-100px);
    z-index: 10000;
    transition: transform .3s 0.1s ease-in; 
}
.throw-left{
    transform: translateX(-1000px) translateY(-100px);
    z-index: 10000;
    transition: transform .3s 0.1s ease-in;
}
.first-card{
    width: 95%;
    height: 100%;
    max-width: 600px;
    margin: auto;
    margin-top: 30px;    
}
.switch-crd-seq-next-crd{
    width: 95%;
    height: 100%;  
    max-width: 600px;  
    margin: auto;
    margin-top: 30px;
    transition: margin-top .3s, max-width .3s, width .3s, height .3s ease-in-out;
}
.next-card{
    width: 82%;
    height: 95%; 
    max-width: 480px;
    margin: auto;
    margin-top: 21px;
}
.switch-crd-seq-third-crd{
    width: 82%;
    height: 95%; 
    max-width: 480px;
    margin: auto;
    margin-top: 21px;
    transition: margin-top .3s, max-width .3s, width .3s, height .3s ease-in-out;
}
.third-card{
    width: 70%;
    height: 90%; 
    margin: auto;
    margin-top: 12px;
    max-width: 380px;
}
.switch-crd-seq-fourth-crd{
    opacity: 1;
    visibility: visible;
    width: 70%;
    height: 90%; 
    max-width: 380px;
    margin: auto;
    margin-top: 12px;
    transition: opacity .3s, visibility .3s, margin-top .3s, max-width .3s, width .3s, height .3s ease-in-out;
}
.fourth-card{
    opacity: 0;
    visibility: hidden;
    width: 58%;
    height: 85%; 
    margin: auto;
    margin-top: 8px;
    max-width: 280px;
}
.card-padding{
    position: fixed;
    top: 60px;
    left: 0px;
    width: 100%;
    bottom: 95px;
}
#main-card-padding{
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
    } 
.btn-circle.btn-xl:hover {
    box-shadow: 0 0px 25px rgba(0, 0, 0, 0.8);
}

#buttons-row {
    margin: auto;
    text-align: center;
    position: fixed;
    z-index: 1;
    height: 60px;
    left: 0;
    bottom: 0;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.3)
}
.buttons-col{
    align-self: center;
}
</style>