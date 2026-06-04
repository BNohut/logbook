<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          :aria-label="t('menu.open')"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title>{{ pageTitle }}</q-toolbar-title>

        <q-space />

        <q-btn-dropdown
          flat
          dense
          no-caps
          :label="currentLocaleLabel"
          icon="language"
          :aria-label="t('common.language')"
        >
          <q-list>
            <q-item
              v-for="opt in localeOptions"
              :key="opt.value"
              clickable
              v-close-popup
              :active="locale === opt.value"
              active-class="bg-primary text-white"
              @click="setLocale(opt.value)"
            >
              <q-item-section>{{ opt.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered :width="280" :breakpoint="500">
      <div class="drawer-brand q-pa-md text-center">
        <img
          :src="logoSrc"
          :alt="t('app.title')"
          class="app-logo app-logo--drawer"
          width="120"
          height="120"
        />
      </div>

      <q-separator />

      <q-list padding>
        <q-item-label header class="text-weight-bold">{{ t('menu.title') }}</q-item-label>

        <q-item
          v-for="item in menuItems"
          :key="item.to"
          clickable
          v-ripple
          :to="item.to"
          exact
          active-class="bg-primary text-white"
          @click="leftDrawerOpen = false"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container class="logbook-page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAppLocale } from 'src/composables/useAppLocale'

const { locale, setLocale, localeOptions, currentLocaleLabel, t } = useAppLocale()
const route = useRoute()
const leftDrawerOpen = ref(false)
const logoSrc = `${import.meta.env.BASE_URL}logbook.png`

const menuItems = computed(() => [
  {
    to: '/',
    icon: 'dashboard',
    label: t('menu.home'),
    headerLabel: t('menu.home'),
  },
  {
    to: '/entry',
    icon: 'add_box',
    label: t('menu.productEntry'),
    headerLabel: t('menu.productEntryHeader'),
  },
  {
    to: '/recent',
    icon: 'history',
    label: t('menu.recentEntries'),
    headerLabel: t('menu.recentEntries'),
  },
  {
    to: '/export',
    icon: 'download',
    label: t('menu.export'),
    headerLabel: t('menu.export'),
  },
])

const pageTitle = computed(() => {
  const match = menuItems.value.find((item) => item.to === route.path)
  return match?.headerLabel ?? match?.label ?? t('app.title')
})
</script>

<style scoped lang="scss">
.app-logo {
  display: block;
  object-fit: contain;
  flex-shrink: 0;
}

.app-logo--toolbar {
  width: 36px;
  height: 36px;
  margin-right: 8px;
  border-radius: 8px;
  background: #fff;
}

.app-logo--drawer {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>
