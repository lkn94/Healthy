import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import OverviewView from '../views/OverviewView.vue';
import ProgressView from '../views/ProgressView.vue';
import LifetimeView from '../views/LifetimeView.vue';
import BodyView from '../views/BodyView.vue';
import SettingsView from '../views/SettingsView.vue';
import AuthView from '../views/AuthView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: AuthView,
    meta: { guestOnly: true, mode: 'login' }
  },
  {
    path: '/register',
    name: 'register',
    component: AuthView,
    meta: { guestOnly: true, mode: 'register' }
  },
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/overview' },
      { path: 'overview', name: 'overview', component: OverviewView },
      { path: 'progress', name: 'progress', component: ProgressView },
      { path: 'lifetime', name: 'lifetime', component: LifetimeView },
      { path: 'body', name: 'body', component: BodyView },
      { path: 'settings', name: 'settings', component: SettingsView }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();
  if (!auth.initialized) {
    await auth.restoreSession();
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return next({ name: 'overview' });
  }

  return next();
});

export default router;
