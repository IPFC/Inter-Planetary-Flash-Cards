
<template>
    <div>         

        <v-offline
            @detected-condition="amIOnline">
                    <b-alert
            style="z-index: 40000"
            :show="dismissCountDown"
            dismissible
            fade
            variant="warning"
            @dismiss-count-down="countDownChanged"
            >
            {{ offlineWarningTxt }}  
        </b-alert>
        </v-offline>
    </div>
</template>

<script>

import { BAlert } from 'bootstrap-vue'
import VOffline from 'v-offline';
export default {
    components: {
        BAlert, VOffline
    },
    data: () => ({
        dismissSecs: 5,
        dismissCountDown: 0,   
        offlineWarningTxt: "Offline mode: Media files might not load. Sync before using on another device to avoid data being overwritten"    
    }),
    methods: {
        amIOnline(e) {
            /* eslint-disable no-console */

            console.log('   e: ',e)
            if (!e) {
                this.showAlert()
            }
        },
        countDownChanged(dismissCountDown) {
            this.dismissCountDown = dismissCountDown
        },
        showAlert() {
            this.dismissCountDown = this.dismissSecs
        }   
    }  
}



</script>

<style>

</style>