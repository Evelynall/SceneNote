import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import TimelineView from '../views/TimelineView.vue'
import Watch from '../views/Watch.vue'
import ProjectManager from '../views/ProjectManager.vue'

/** 应用页面路由：项目数据通过参数在后续阶段传递。 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/projects', name: 'projects', component: ProjectManager },
    { path: '/watch/:projectId', name: 'watch', component: Watch },
    { path: '/timeline/:projectId', name: 'timeline', component: TimelineView },
  ],
})

export default router
