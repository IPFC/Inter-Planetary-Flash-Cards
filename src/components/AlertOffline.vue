
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
            {{ offlineWarningTxt }}  
        </b-alert>
    </div>
</template>

<script>
// import { debounce } from 'lodash/core';
const debounce = require('lodash/debounce');
// import _ from 'lodash'
import { BAlert } from 'bootstrap-vue'
import { mapActions, mapState } from 'vuex'
export default {
    components: {
        BAlert
    },
    props: ['display'],
    data: () => ({
        online: navigator.onLine,
        dismissSecs: 5,
        dismissCountDown: 0,   
        offlineWarningTxt:         `Offline mode: 
        Please cloud sync before using app on another device to avoid data conflicts.
        Media files might not load.`      
    }),
    methods: {
        countDownChanged(dismissCountDown) {
            this.dismissCountDown = dismissCountDown
        },
        showAlert() {
            this.dismissCountDown = this.dismissSecs
        },   
        connectivityChange () {
            this.online = navigator.onLine;
            if (this.online != this.$store.state.online) {
                this.$store.commit('updateOnline', this.online);            
                if (!this.online) {
                    this.showAlert()
                } else if (this.initialSync > 1) {
                    // suppress sync call on app start
                    // only want this when coming back online
                    this.debouncedSync()
                }
            }
        },
        debouncedSync: debounce(function(){ 
            this.cloudSync
        }, 10000),
    },
    computed: {
        ...mapActions({
            cloudSync: 'cloudSync',
        }),
        ...mapState([
            'initialSync',
        ]),
    },
    watch: {
        display: function () {
            this.showAlert()
        }
    },
    mounted () {
        window.addEventListener("online", this.connectivityChange);
        window.addEventListener("offline", this.connectivityChange);
        this.connectivityChange();
    },
    beforeDestroy () {
        window.removeEventListener("online", this.connectivityChange);
        window.removeEventListener("offline", this.connectivityChange);
    },  
}



</script>

<style>

</style>