const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/HomePage.vue') },
      { path: 'entry', component: () => import('pages/EntryPage.vue') },
      { path: 'recent', component: () => import('pages/RecentPage.vue') },
      { path: 'export', component: () => import('pages/ExportPage.vue') },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
