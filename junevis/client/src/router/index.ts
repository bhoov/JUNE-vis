import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Intro from "@/views/Intro.vue";
import CompareGeos from "@/views/CompareGeos.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => Intro
  },
  {
    path: '/:projectId/exploreRuns',
    name: 'Explore Runs',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "compareRuns" */ '../views/CompareRuns.vue'),
    props: true
  },
  {
    path: '/:projectId/runDetails/:run1Id/:run2Id?',
    name: 'Compare Runs',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "compareRuns" */ '../views/RunDetails.vue'),
    props: true,
  },
  {
    path: '/:projectId/compareGeos',
    name: 'Compare Geographical Regions',
    component: () => CompareGeos,
    props: true
  },
  {
    path: '/geoRun/:projectId?/:runId?/:dim?',
    name: 'geoRun',
    component: () => import(/* webpackChunkName: "geoRun" */ '../views/GeoRun.vue')
  },
  {
    path: '/geoTest',
    name: 'geoTest',
    component: () => import('../views/TestMap.vue')
  },
  // {
  //   path: '/runDetails',
  //   name: 'View Run Information',
  //   component: () => RunDetails,
  //   props: true,
  // },

]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
