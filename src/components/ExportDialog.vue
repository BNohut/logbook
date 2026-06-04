<template>
  <q-dialog v-model="open" position="bottom">
    <q-card class="export-dialog-card">
      <q-card-section>
        <ExportPanel close-on-success @close="open = false" />
      </q-card-section>
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat :label="t('common.cancel')" color="grey-8" @click="open = false" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import ExportPanel from 'components/ExportPanel.vue'
import { useAppLocale } from 'src/composables/useAppLocale'

const { t } = useAppLocale()
const open = defineModel({ type: Boolean, default: false })
</script>

<style scoped>
.export-dialog-card {
  width: 100%;
  max-width: 480px;
  border-radius: 16px 16px 0 0;
}
</style>
