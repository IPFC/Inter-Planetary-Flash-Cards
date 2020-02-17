<template>
    <div class="body" id="app">
            <Navbar id="navbar" @new-card="newCard(); cardEditorFromReview()"/>
            <router-view @edit-clicked="editClicked()" :newCardClicked="newCardClicked" :newCardCommit="newCardCommit" :comingToCardEditorFromReview="toCardEditorFromReview" />
    </div>
</template>

<script>
import Navbar from './components/Navbar'

// import { mapState } from 'vuex'
// import { debounce } from 'lodash/core';

    export default {
        name: 'App',
        data() {
            return {
                newCardClicked: 0,
                newCardCommit: 0,
                toCardEditorFromReview: false,
            }
        },
        // computed: {
        //     ...mapState({
        //         decks: 'decks',
        //         syncing: 'syncing',
        //         userCollection: 'userCollection',
        //         lastSyncsData: 'lastSyncsData'
        //     }),
        // },
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
        // },
        methods: {
            editClicked(){
                // console.log('edit-clicked')
                this.cardEditorFromReview()
            },
            newCard: function() {
                this.newCardClicked ++
                if (this.$store.state.currentDeckId === 'reviewDeck' || this.$store.state.currentDeckId === 'defaultDeck') {
                    this.$store.commit('updateCurrentDeckId', this.$store.getters.decksMeta[0].deck_id)
                } 
                this.$store.dispatch('newCard', this.$store.state.currentDeckId)
                this.$store.commit('updateCardToEditIndex', this.$store.getters.currentDeck.cards.length -1) 
                if (this.$route.name !== 'card-editor' ) {
                    this.$router.push('/card-editor')
                }
                this.newCardCommit ++
            },
            cardEditorFromReview: function(){
                // console.log('card-editor-from-review')
                if (this.$store.state.currentDeckId === 'reviewDeck') {
                    this.toCardEditorFromReview = true
                } else {
                    this.toCardEditorFromReview = false
                }
            },
            // sync: debounce(function(){
            //     //  console.log('debounced sync')
            //     this.$store.dispatch('sync')
            // }, 600000),
        },
        components: {
            Navbar
        }
    }
</script>

<style lang="scss">

  @import "assets/_custom.scss";
  @import "~bootstrap/scss/bootstrap.scss";
  @import '~bootstrap-vue/dist/bootstrap-vue.css';

body {
    background-color: #F6F6F6;
    margin: 0;
    margin-top: 55px;

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
