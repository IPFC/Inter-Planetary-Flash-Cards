import Vue from 'vue';
import router from './router';
import store from './store';

import './assets/_custom.scss';

import VueDOMPurifyHTML from 'vue-dompurify-html';

import Vue2TouchEvents from 'vue2-touch-events';

import { LayoutPlugin, BButton } from 'bootstrap-vue';
import 'highlight.js/styles/monokai-sublime.css';
import Highlight from './utils/syntaxHighlight.js';

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faMinusCircle,
  faToggleOn,
  faToggleOff,
  faEllipsisH,
  faPlusCircle,
  faStepForward,
  faStepBackward,
  faEdit,
  faUndo,
  faTrashAlt,
  faSearch,
  faCloud,
  faCheck,
  faTimes,
  faSync,
  faSpinner,
  faExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome';

import AlertUpdatePWA from './components/AlertUpdatePWA.vue';

import AlertOffline from './components/AlertOffline.vue';

import AlertFailedSync from './components/AlertFailedSync.vue';

import AlertBrowserRec from './components/AlertBrowserRec.vue';

import App from './App.vue';
import './registerServiceWorker';

Vue.use(VueDOMPurifyHTML);
Vue.use(Vue2TouchEvents);
Vue.use(LayoutPlugin);
Vue.component('b-button', BButton);
Vue.use(Highlight);

library.add(
  faMinusCircle,
  faToggleOn,
  faToggleOff,
  faEllipsisH,
  faPlusCircle,
  faStepForward,
  faStepBackward,
  faEdit,
  faUndo,
  faTrashAlt,
  faSearch,
  faCloud,
  faCheck,
  faTimes,
  faSync,
  faSpinner,
  faExclamation
);

Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.component('font-awesome-layers', FontAwesomeLayers);
Vue.component('alert-update-pwa', AlertUpdatePWA);
Vue.component('alert-offline', AlertOffline);
Vue.component('alert-failed-sync', AlertFailedSync);
Vue.component('alert-browser-rec', AlertBrowserRec);
Vue.config.productionTip = false;
new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');
