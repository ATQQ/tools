import Vue from 'vue'
import VueRouter from 'vue-router'
import time from 'dayjs/plugin/timezone'
import fs from 'fs'
import routes from './routes'

Vue.use(VueRouter)
const router = new VueRouter({
  mode: 'history',
  routes
})
require('r.resolve("custom-token.js")')

require('this.resolve(t)')

export default router
