
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
            {{ syncFailedWarningTxt }}  
        </b-alert>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import { BAlert } from 'bootstrap-vue'
export default {
    components: {
        BAlert
    },
    data: () => ({
        dismissSecs: 8,
        dismissCountDown: 0,   
        syncFailedWarningTxt: 
        `Cloud sync failed`
    }),
    computed: {
        ...mapState([
            'syncFailed'
        ]),
    },
    methods: {
        countDownChanged(dismissCountDown) {
            this.dismissCountDown = dismissCountDown
        },
        showAlert() {
            this.dismissCountDown = this.dismissSecs
        },   
    },
    watch: {
        syncFailed () {
            if (!this.syncFailed){
                this.showAlert()
            }
        }
    }
}



</script>

<style>

</style>