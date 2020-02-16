import Vue from 'vue'
import router from './router'
import store from './store'

import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(BootstrapVue)

import 'highlight.js/styles/monokai-sublime.css'
import Highlight from './components/highlight.js'
Vue.use(Highlight)

import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
import VueQuillEditor from 'vue-quill-editor'
Vue.use(VueQuillEditor, /* { default global options } */)

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
