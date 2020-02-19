import Vue from 'vue'
import router from './router'
import store from './store'

// import 'bootstrap/dist/css/bootstrap.css'
// import 'bootstrap-vue/dist/bootstrap-vue.css'
import "./assets/_custom.scss";


import { LayoutPlugin } from 'bootstrap-vue'
Vue.use(LayoutPlugin)
import { BButton } from 'bootstrap-vue'
Vue.component('b-button', BButton)

// import BootstrapVue from 'bootstrap-vue'

// Vue.use(BootstrapVue)

import 'highlight.js/styles/monokai-sublime.css'
import Highlight from './components/highlight.js'
Vue.use(Highlight)

import { library } from '@fortawesome/fontawesome-svg-core'
import { faMinusCircle, faToggleOn, faToggleOff, faEllipsisH, faPlusCircle, faStepForward, faStepBackward, 
  faEdit, faUndo, faTrashAlt, faSearch, faCloud, faCheck, faTimes, faSync, 
  faSpinner, faExclamation} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon, FontAwesomeLayers} from '@fortawesome/vue-fontawesome'

library.add( faMinusCircle, faToggleOn, faToggleOff, faEllipsisH, faPlusCircle, faStepForward, faStepBackward, 
  faEdit, faUndo, faTrashAlt, faSearch, faCloud, faCheck, faTimes, faSync, 
  faSpinner, faExclamation)

Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.component('font-awesome-layers', FontAwesomeLayers)

import App from './App.vue'
import './registerServiceWorker'
Vue.config.productionTip = false
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
