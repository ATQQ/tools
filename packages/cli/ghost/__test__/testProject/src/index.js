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

export default router
