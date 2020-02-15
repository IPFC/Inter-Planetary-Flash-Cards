<template>
    <div>
        <b-container id="review-body" v-if="todaysDeck.cards.length > 0">
            <b-row id="top-buttons-row" class="justify-content-end">
                <a class="edit"><font-awesome-icon @click="editCard(currentCard, reviewDeck); $emit('edit-clicked')" size="1x" icon="edit"/></a>
            </b-row>
            <b-row id="card-row" class="" @click="flipCard()">
                <b-col v-if="!spinner" class="card-col">
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
                <b-col v-else>
                    <font-awesome-icon style="margin: auto" icon="spinner" spin size="3x" />
                    <p style="margin: auto" >syncing</p>
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
import { mapState } from 'vuex'

import vueFlashcard from '../components/flashcard.vue';
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
    mounted() {
        this.checkAuth()
    },
    created () {
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


        console.log('   newUser',newUser)
        console.log('   localStorageEmpty',localStorageEmpty)
        console.log('   auth status',this.authStatus)
        console.log('   this.jwt',this.jwt)

        // returning user, expired jwt
        if (this.authStatus === false && this.jwt !== null && !newUser){
                    console.log('returning user, expired jwt')

            this.$router.push('login');
        }
        // returning user, valid jwt, no cache
        else if (this.authStatus === true && localStorageEmpty){
                            console.log('returning user, valid jwt, no cache')

            this.$store.commit('updateUserCollection', defaultCollection['user_collection'])
            this.$store.commit('updateDecks', defaultCollection['decks']) // might be overlap
            this.$store.commit('toggleSyncFailed', false) // we'll watch this, then set collection and cancel spinner when done syncing
            this.loggingIn = true
            this.spinner = true            
            this.$store.dispatch('sync')
        }

        // returning user, valid jwt, has cache
        else if (this.authStatus === true && !localStorageEmpty){
                            console.log('returning user, valid jwt, has cache')

            this.$store.commit('toggleSyncFailed', false)
            this.loggingIn = true
            this.spinner = true
            this.$store.dispatch('sync')
        }

        // new user or no JWT
        else if(this.authStatus === false && this.jwt ===null || newUser ) {
            console.log('new user or no JWT')
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
.edit {
    color: gray;
    margin: 7px;
    right: 3px;
    z-index: 1;
    position: absolute;
}
.edit:hover{
    cursor: pointer;
}

#main-card {
    margin: auto;
    margin-top: 35px;
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
    margin-top: 25px;
    max-width: 480px;
}
#next-card >>> .card-content::-webkit-scrollbar-thumb {
    background-color: rgba(162, 162, 162, 0);
}
#third-card-padding-outer{
    z-index: -2;
    position: absolute;
    top: 5px;
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