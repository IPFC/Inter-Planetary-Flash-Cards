import Vue from 'vue'
import router from './router'
import store from './store'
import BootstrapVue from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faEllipsisH, faPlusCircle, faStepForward, faStepBackward, 
  faEdit, faUndo, faTrashAlt, faSearch, faCloud, faCheck, faTimes, faSync, 
  faSpinner, faExclamation} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon, FontAwesomeLayers} from '@fortawesome/vue-fontawesome'

library.add(faEllipsisH, faPlusCircle, faStepForward, faStepBackward, 
  faEdit, faUndo, faTrashAlt, faSearch, faCloud, faCheck, faTimes, faSync, 
  faSpinner, faExclamation)

Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.component('font-awesome-layers', FontAwesomeLayers)
import App from './App.vue'

Vue.use(BootstrapVue)
Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
