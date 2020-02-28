
<template>
    <div>         
        <b-alert
            style="z-index: 40000"
            :show="dismissCountDown"
            dismissible
            fade
            variant="warning"
            @dismiss-count-down="countDownChanged"
            >
            {{ alertTxt }}  
        </b-alert>
    </div>
</template>

<script>
import { BAlert } from 'bootstrap-vue'
export default {
    components: {
        BAlert
    },
    data: () => ({
        dismissSecs: 8,
        dismissCountDown: 0,   
        alertTxt: 
        `For full screen mode and faster loading, open the app in Chrome(Android/Desktop) or Safari(iOS) and click 'add to homescreen'`
    }),
    props: ['browserRec'],
    methods: {
        countDownChanged(dismissCountDown) {
            this.dismissCountDown = dismissCountDown
        },
        showAlert() {
            this.dismissCountDown = this.dismissSecs
        },   
    },
    watch: {
        browserRec () {
            this.showAlert()
        }
    }
}



</script>

<style>

</style>