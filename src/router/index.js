import Vue from 'vue'
import Router from 'vue-router'

const Login = () => import('../views/Login.vue')
const Home = () => import('../views/Home.vue')
const DeckSelection = () => import('../views/DeckSelection.vue')
const DeckEditor = () => import('../views/DeckEditor.vue')
const Settings = () => import('../views/Settings.vue')
const CardEditor = () => import('../views/CardEditor.vue')

import store from "../store"

Vue.use(Router)

async function redirectIfNotAuth (to, from, next) {
    await store.dispatch('checkJwt')
    if (store.getters.isAuthenticated) {
      next()
    } else {
      next('/login')
    }
}

function redirectIfNoUserCollection (to, from, next) {
    if (store.state.userCollection !== null) {
        next()
    } else {
        next('home')
    }
}


export default new Router({
    mode: 'history',
    routes: [
        {
            path: '/',
            redirect: {
            name: "home",
            }
        },
        {
            path: "/login",
            name: "login",
            component: Login,
            beforeEnter: redirectIfNoUserCollection
        },
        {
            path: "/home",
            name: "home",
            component: Home,
        },
        {
            path: "/deck-selection",
            name: "deck-selection",
            component: DeckSelection,
            beforeEnter: redirectIfNotAuth
        },
        {
            path: "/deck-editor",
            name: "deck-editor",
            component: DeckEditor,
            beforeEnter: redirectIfNotAuth
        },
        {
            path: "/settings",
            name: "settings",
            component: Settings,
            beforeEnter: redirectIfNotAuth
        },
        {
            path: "/card-editor",
            name: "card-editor",
            component: CardEditor,
            props: true 
        }
    ]
})