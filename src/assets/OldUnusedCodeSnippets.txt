<template>
  
</template>

<script>
export default {
    methods: {
         populateSchedule(){
            // initial schedule when its empty for testing
            for (let card of this.reviewDeck.cards) {
                this.$store.commit('addCardToSchedule', card.card_id)
                // console.log('   addCardToSchedule',card.card_id)
            }
        },
        resetSchedule(){
            // reset schedule for testing
            for (let card of this.reviewDeck.cards) {
                this.$store.commit('resetCardSchedule', card.card_id)
                // console.log('   resetCardSchedule',card.card_id)
            }
        },
        plaintextToRichtext () {
            for (let deck of this.$store.state.decks) {
                console.log('checking a deck')
                for (let oldCard of deck.cards) {
                    if (oldCard.front_rich_text !== oldCard.front_text || oldCard.back_rich_text !== oldCard.back_text){
                       oldCard.front_rich_text = JSON.parse(JSON.stringify(oldCard.front_text))
                        oldCard.back_rich_text = JSON.parse(JSON.stringify(oldCard.back_text))
                        let cardUpdateData = { deck_id: deck.deck_id, card: oldCard }
                        this.$store.commit('updateCard', cardUpdateData) 
                    }
                }
            }
        },
        duplicateChecker () {
            for (let deck of this.$store.state.decks) {
                for (let dupDeck of this.$store.state.decks) {
                    let dupCount = 0
                    if (deck.deck_id === dupDeck.deck_id) {
                        dupCount ++
                        console.log("    dupCount", dupCount)    
                        if (dupCount > 1) {
                            console.log("    duplicate deck  detected", dupDeck)
                            this.$store.commit('deleteDeck', dupDeck.deck_id)
                        }
                    }
                }
            }
            for (let deck of this.$store.state.decks) {
                for (let card of deck.cards) {
                    let dupCount = 0
                    for (let cardDup of deck.cards) {
                        if (card.card_id === cardDup.card_id) {
                            dupCount ++
                            console.log("    dupCount", dupCount)    
                            if (dupCount > 1) {
                                console.log("    duplicate card  detected", cardDup)
                                let deleteData = { deck_id: deck.deck_id, card_id:  cardDup.card_id,}
                                this.$store.commit('deleteCard', deleteData)
                            }
                        }
                    }
                }
            }
        },
        generateRandomHslaColor (){
            // round to an interval of 20, 0-360
            let hue = Math.round(Math.random() * 360 / 20) * 20
            let color = `hsla(${hue}, 100%, 50%, 1)`
            return color
        },
        setAllDeckColors () {
            let decks = this.$store.state.decks
            for (let deck of decks) {
                if (!deck.icon_color) {
                // console.log("setting deck icons")
                 deck.icon_color = this.generateRandomHslaColor()
                    deck.edited = Math.round(new Date().getTime());
            this.$store.commit('updateDeck', deck)
                }
            }
        }
    }
}
</script>

<style>

</style>
// Quill/ in component. to do on change, check contents.
                    <!-- @change="onBackCardEditorChange($event)" -->
        // onFrontCardEditorChange() {
        //     // ( quill, html, text)
        //     // console.log('front editor change!', quill, html, text)
        //     // console.log(JSON.stringify(delta))
        //     // let justHtml = this.$refs.myQuillEditorFront.quill.root.innerHTML;
        //     // console.log(justHtml)
        //     return null
        // },
        // onBackCardEditorChange() {
        //     return null
        // },

    // store.mutations:
    // updateDeckEdited(state, deck_id) {
    //   for (let deck of state.decks) {
    //     if (deck.deck_id === deck_id) {
    //       deck.edited = new Date().getTime() 
    //       break
    //     }
    //   }
    // },
    // cleanSchedule(state) {
    //   let schedule = state.userCollection.schedule.list
    //   for (let scheduleItem of schedule) {
    //     let counter = 0
    //     for (let scheduleItemInner of schedule){
    //       if (scheduleItem.card_id === scheduleItemInner.card_id ) {
    //         counter ++
    //         if (counter > 1) {
    //           schedule.splice(schedule.indexOf(scheduleItem), 1)
    //         }
    //       }
    //     }
    //   }
    // },
    store.getter
        dataChanged (state) {
      if(!_.isEqual(state.userCollection, state.lastSyncsData.userCollection) || !_.isEqual(state.decks, state.lastSyncsData.decks)) {
        if(!_.isEqual(state.userCollection, state.lastSyncsData.userCollection)) {
          // console.log('       collection unequal')
        //   for (let item in state.userCollection) {
        //     for (let key of Object.keys(state.userCollection)){
        //       for (let otherItem in state.lastSyncsData.userCollection){
        //         for (let otherKey of Object.keys(state.lastSyncsData.userCollection)){
        //               // console.log('   key', key)
        //               // console.log('   otherKey', otherKey)
        //             if (key == otherKey &&  !_.isEqual(item, otherItem))
        //             console.log('   unequal items')
        //             console.log('        state', item)
        //             console.log(state.userCollection[item])
        //             console.log('       last sync,', otherItem)
        //             console.log(state.lastSyncsData.userCollection[otherItem])

        //         }
        //       }
        //     }
        //   }
        // }
        // if(!_.isEqual(state.decks, state.lastSyncsData.decks)) {
        //   for(let deck of state.decks){
        //     for (let syncdeck of state.lastSyncsData.decks){
        //       if (deck.deck_id === syncdeck.deck_id && deck.edited !== syncdeck.edited){
        //         console.log(deck.title)
        //       }
        //     }
        //   }
        //   console.log('       decks unequal')
        }
        return true
      } else {
        return false
      }
    }