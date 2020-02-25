<template>
    <div ref="appMain" id="app-main" >
        <div id="splash" :class="splashClass"></div>
        <Navbar ref="navbar" id="navbar" @new-card="newCard()"/>
        <b-button @click="snackWithButtons" v-if="refreshing">{{ snackBtnText}}</b-button>
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
                splashClass: 'splash',
                refreshing: false,
                registration: null,
                snackBtnText: '',
                snackWithBtnText: '',
                snackWithButtons: false,
                timeout: 0,
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
            // }, 60000),
            showRefreshUI(e) {
                // Display a snackbar inviting the user to refresh/reload the app due
                // to an app update being available.
                // The new service worker is installed, but not yet active.
                // Store the ServiceWorkerRegistration instance for later use.
                this.registration = e.detail;
                this.snackBtnText = 'Refresh';
                this.snackWithBtnText = 'New version available!';
                this.snackWithButtons = true;
                },

            refreshApp() {
                this.snackWithButtons = false;

                // Protect against missing registration.waiting.
                if (!this.registration || !this.registration.waiting) { return; }

                this.registration.waiting.postMessage('skipWaiting');
            },
        },
        components: {
            Navbar
        },
        created: function () {
            this.splashClass = 'splash'
            //PWA
            // Listen for swUpdated event and display refresh snackbar as required.
            document.addEventListener('swUpdated', this.showRefreshUI, { once: true });

            // Refresh all open app tabs when a new service worker is installed.
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (this.refreshing) return;
                this.refreshing = true;
                window.location.reload();
            });
            // use this to 
            // console.log(document)
            // window.addEventListener('resize', () => {
            //     let vh = window.innerHeight * 0.01;
            //     this.$refs.appMain.style.setProperty('--vh', `${vh}px`);
            // });
        },
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
