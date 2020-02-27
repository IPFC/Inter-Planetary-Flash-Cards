<template>
    <div ref="appMain" id="app-main" >
        <div v-if="!updatePWA" id="splash" :class="splashClass"></div>
        <Navbar ref="navbar" id="navbar" @new-card="newCard()"/>
        <router-view id="router-view" 
        @homeLoad="homeLoaded()" 
        @edit-clicked="editClicked()" 
        @updatePWA="PWAUpdate(bool)"
        :newCardClicked="newCardClicked" 
        :newCardCommit="newCardCommit" 
        :comingToCardEditorFromReview="toCardEditorFromReview"
        />
    </div>
</template>

<script>
import Navbar from './components/Navbar'
import { mapGetters } from 'vuex'
import { mapState } from 'vuex'
const debounce = require('lodash/debounce');

export default {
    name: 'App',
    data() {
        return {
            newCardClicked: 0,
            newCardCommit: 0,
            toCardEditorFromReview: false,
            splashClass: 'splash',
            updatePWA: false,
        }
    },
    computed: {
        ...mapGetters([
            'decksMeta',
            'currentDeck',
        ]),
        ...mapState([
            'currentDeckId',
            'decks',
            'syncing',
            'userCollection',
            'initialSync',
            // 'lastSyncsData'
        ]),
    },
    watch: {
        userCollection: {
            handler: function() {
                // console.log(  'sync called from user collection change')
                this.debouncedSync()
            },
            deep: true
        },
        decks: {
            handler: function() {
                // console.log(  'sync called from decks change')
                this.debouncedSync()
            },
            deep: true
        },
        syncing: function() {
            // in case there were changes made during sync, try again after each sync
            // console.log(  'sync called from syncing change')
            this.debouncedSync()
        }
    },
    methods: {
        homeLoaded: function() {
            this.splashClass = 'loaded'
        },
        editClicked: function(){
            if (this.currentDeckId === 'reviewDeck') {
                this.toCardEditorFromReview = true
            } else {
                this.toCardEditorFromReview = false
            }
        },
        newCard: function() {
            this.newCardClicked ++
            if (this.currentDeckId === 'reviewDeck' || this.currentDeckId === 'defaultDeck') {
                this.toCardEditorFromReview = true
                this.$store.commit('updateCurrentDeckId', this.decksMeta[0].deck_id)
            } 
            this.$store.dispatch('newCard', this.currentDeckId)
            this.$store.commit('updateCardToEditIndex', this.currentDeck.cards.length -1) 
            if (this.$route.name !== 'card-editor' ) {
                this.$router.push('/card-editor')
            }
            this.newCardCommit ++
        },
        PWAUpdate (bool) {
            if (bool) {
                this.updatePWA = true
            } else {
                this.updatePWA = false
            }
        },
        debouncedSync: debounce(function(){
            if (!this.syncing && this.initialSync > 1) {
                this.$store.dispatch('cloudSync')
            }
        }, 15000),
    },
    components: {
        Navbar
    },
    created: function () {
        this.splashClass = 'splash'
    }
}
</script>

<style lang="scss">
.splash {
    background-image: url('/img/icons/icon-192x192.png');
    background-position: center center;
    background-repeat: no-repeat;
    background-color: #F8690D;
    position: fixed;
    height: 100%; 
    width: 100%;
    margin: 0;
    padding: 0;
    visibility: visible;
    opacity: 1;
    z-index: 4000;
}
.loaded {
    background-color: #F8690D;
    position: fixed;
    height: 100%; 
    width: 100%;
    margin: 0;
    padding: 0;
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s .25s, opacity .25s linear;
}

#app-main {
    height: 100%;
    width: 100%;
    position: fixed;
    // height: calc(var(--vh, 1vh) * 100);
    background-color: #F6F6F6;
    margin: 0;
    padding: 0;
}

#router-view{
    height: 100%; 
    padding-top: 55px;
}
#navbar {
    position: absolute;
    top: 0;
    right: 0;
    width: 100vw;
    z-index: 2000;
}
.body::-webkit-scrollbar {
    width: .5em;
}
.body::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 5px;
}
</style>
