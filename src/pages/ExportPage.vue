<template>
  <q-page class="logbook-page q-pa-md">
    <ExportPanel />
  </q-page>
</template>

<script setup>
import ExportPanel from 'components/ExportPanel.vue'
</script>

<style scoped>
.logbook-page {
  max-width: 480px;
  margin: 0 auto;
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}
</style>
