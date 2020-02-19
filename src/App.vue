<template>

    <div ref="appMain" id="app-main" >
        <div id="splash" :class="splashClass"></div>
        <Navbar ref="navbar" id="navbar" @new-card="newCard()"/>
        <router-view id="router-view" @homeLoad="homeLoaded()" @edit-clicked="editClicked()" :newCardClicked="newCardClicked" :newCardCommit="newCardCommit" :comingToCardEditorFromReview="toCardEditorFromReview" />
    </div>
</template>

<script>
import Navbar from './components/Navbar'
import { mapGetters } from 'vuex'
import { mapState } from 'vuex'
// import { debounce } from 'lodash/core';

    export default {
        name: 'App',
        data() {
            return {
                newCardClicked: 0,
                newCardCommit: 0,
                toCardEditorFromReview: false,
                splashClass: 'splash'
            }
        },
        computed: {
            ...mapGetters([
                'decksMeta',
                'currentDeck',
            ]),
            ...mapState([
                 'currentDeckId',
                // 'decks',
                // 'syncing',
                // 'userCollection',
                // 'lastSyncsData'
            ]),
        // watch: {
        //     userCollection: {
        //         handler: function() {
        //             if (this.syncing === false) {
        //                 if (this.$store.getters.dataChanged) {                            
        //                     // console.log('    watched user collection for syncing')
        //                     this.sync()
        //                 }
        //             } 
        //         },
        //         deep: true
        //     },
        //     decks: {
        //         handler: function() {
        //             if (this.syncing === false) {
        //                 if (this.$store.getters.dataChanged) {                            
        //                     // console.log('    watched decks for syncing')
        //                     this.sync()
        //                 }
        //             }
        //         },
        //         deep: true
        //     },
        //     syncing: function() {
        //         if (this.syncing === false) {
        //             if (this.$store.getters.dataChanged) {
        //                 // console.log('    this.decks', this.decks)
        //                 // console.log('    this.lastSyncsData.decks', this.lastSyncsData.decks)
        //                 // console.log('    watched syncing for syncing')
        //                 this.sync()
        //              }
        //         }
        //     }
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
            // sync: debounce(function(){
            //     //  console.log('debounced sync')
            //     this.$store.dispatch('sync')
            // }, 600000),
        },
        components: {
            Navbar
        },
        created: function () {
            this.splashClass = 'splash'
        },
    }
</script>

<style lang="scss">
.splash {
    background-image: url('/img/icons/icon-192x192.png');
    background-position: center center;
    background-repeat: no-repeat;
    background-color: #F8690D;
    position: absolute;
    height: 100%; 
    width: 100%;
    margin: 0;
    padding: 0;
    visibility: visible;
    opacity: 1;
    z-index: 4000;
}
.loaded {
      background-image: url('/img/icons/icon-192x192.png');
    background-position: center center;
    background-repeat: no-repeat;
    background-color: #F8690D;
    position: absolute;
    height: 100%; 
    width: 100%;
    margin: 0;
    padding: 0;
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s .5s, opacity .5s linear;
}

#app-main {
    height: 100vh;
    background-color: #F6F6F6;
    margin: 0;
    padding: 0;
}

#router-view{
    height: calc(100vh-55px); padding-top: 55px;
}
h1 {
    padding: 0;
    margin-top: 0;
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
