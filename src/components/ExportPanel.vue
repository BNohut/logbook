<template>
  <div class="export-panel column q-gutter-md">
    <div>
      <div class="text-h6">{{ t('export.title') }}</div>
      <div class="text-caption text-grey-7 q-mt-xs">{{ t('export.subtitle') }}</div>
    </div>

    <q-btn-toggle
      v-model="filterMode"
      spread
      no-caps
      toggle-color="primary"
      color="white"
      text-color="primary"
      class="export-mode-toggle"
      :options="filterModeOptions"
      @update:model-value="onFilterModeChange"
    />

    <q-select
      v-if="filterMode === 'yearly'"
      v-model="selectedYear"
      :options="yearOptions"
      :label="t('export.year')"
      outlined
      dense
      clearable
      emit-value
      map-options
      class="export-date-field"
      @update:model-value="onYearlyChange"
    />

    <div v-else-if="filterMode === 'monthly'" class="export-filters">
      <q-select
        v-model="selectedYear"
        :options="yearOptions"
        :label="t('export.year')"
        outlined
        dense
        clearable
        emit-value
        map-options
        class="export-filters-field"
        @update:model-value="onYearChange"
      />
      <q-select
        v-model="selectedMonth"
        :options="monthOptions"
        :label="t('export.month')"
        outlined
        dense
        clearable
        emit-value
        map-options
        :disable="selectedYear == null"
        class="export-filters-field"
        @update:model-value="onMonthChange"
      />
    </div>

    <q-input
      v-else-if="filterMode === 'daily'"
      v-model="selectedDate"
      :label="t('form.date')"
      outlined
      dense
      clearable
      readonly
      class="export-date-field"
      @clear="clearDateFilter"
    >
      <template #append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date v-model="selectedDate" mask="YYYY-MM-DD" @update:model-value="onDateChange">
              <div class="row items-center justify-end">
                <q-btn v-close-popup :label="t('common.close')" color="primary" flat />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>

    <div v-if="hasExportFilter" class="export-preview">
      <div class="text-subtitle2 text-weight-medium q-mb-sm">
        {{ t('export.previewTitle', { count: previewEntries.length }) }}
      </div>

      <q-inner-loading :showing="loadingPreview">
        <q-spinner color="primary" size="32px" />
      </q-inner-loading>

      <div
        v-if="!loadingPreview && previewEntries.length === 0"
        class="text-center text-grey-7 q-pa-md rounded-borders bg-grey-2"
      >
        {{ t('export.noEntries') }}
      </div>

      <q-list
        v-else-if="!loadingPreview"
        bordered
        separator
        dense
        class="rounded-borders export-preview-list"
      >
        <q-item v-for="entry in previewEntries" :key="entry.id">
          <q-item-section>
            <q-item-label>{{ entry.text }}</q-item-label>
            <q-item-label caption>
              {{ entry.date }} · {{ t('entries.qty') }} {{ entry.quantity }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <div v-else class="text-caption text-grey-7">
      {{ t('export.selectToPreview') }}
    </div>

    <div class="export-btn-wrap">
      <q-btn
        unelevated
        color="primary"
        icon="download"
        :label="t('form.export')"
        :loading="exporting"
        :disable="!canExport"
        size="lg"
        class="export-btn"
        @click="onExport"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Notify } from 'quasar'
import { useAppLocale } from 'src/composables/useAppLocale'
import { useYearOptions } from 'src/composables/useYearOptions'
import { exportLogbookDate, exportLogbookMonth, exportLogbookYear } from 'src/services/exportLogbook'
import { getEntriesByDate, getEntriesByMonth, getEntriesByYear } from 'src/services/logRepository'

const props = defineProps({
  closeOnSuccess: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['exported', 'close'])

const { t, locale } = useAppLocale()
const { yearOptions, loadYearOptions } = useYearOptions()

const filterMode = ref('monthly')
const selectedYear = ref(null)
const selectedMonth = ref(null)
const selectedDate = ref(null)
const exporting = ref(false)
const loadingPreview = ref(false)
const previewEntries = ref([])

const filterModeOptions = computed(() => [
  { label: t('filter.daily'), value: 'daily' },
  { label: t('filter.monthly'), value: 'monthly' },
  { label: t('filter.yearly'), value: 'yearly' },
])

const hasExportFilter = computed(() => {
  if (filterMode.value === 'daily') return selectedDate.value != null
  if (filterMode.value === 'yearly') return selectedYear.value != null
  if (filterMode.value === 'monthly') {
    return selectedYear.value != null && selectedMonth.value != null
  }
  return false
})

const canExport = computed(() => hasExportFilter.value && previewEntries.value.length > 0)

const monthOptions = computed(() => {
  locale.value
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    return {
      label: t(`export.months.${m}`),
      value: m,
    }
  })
})

function clearFilterValues() {
  selectedYear.value = null
  selectedMonth.value = null
  selectedDate.value = null
  previewEntries.value = []
}

function onFilterModeChange() {
  clearFilterValues()
}

function onYearChange() {
  if (filterMode.value === 'monthly') selectedMonth.value = null
  loadPreview()
}

function onYearlyChange() {
  loadPreview()
}

function onMonthChange() {
  loadPreview()
}

function onDateChange() {
  loadPreview()
}

function clearDateFilter() {
  selectedDate.value = null
  previewEntries.value = []
}

async function loadPreview() {
  if (!hasExportFilter.value) {
    previewEntries.value = []
    return
  }

  loadingPreview.value = true
  try {
    if (filterMode.value === 'daily') {
      previewEntries.value = await getEntriesByDate(selectedDate.value)
    } else if (filterMode.value === 'yearly') {
      previewEntries.value = await getEntriesByYear(selectedYear.value)
    } else {
      previewEntries.value = await getEntriesByMonth(
        selectedYear.value,
        selectedMonth.value,
      )
    }
    previewEntries.value.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    previewEntries.value = []
    Notify.create({
      type: 'negative',
      message: t('notify.loadFailed'),
    })
  } finally {
    loadingPreview.value = false
  }
}

function resetPeriod() {
  filterMode.value = 'monthly'
  clearFilterValues()
  loadYearOptions()
}

async function onExport() {
  if (!canExport.value) return

  exporting.value = true
  try {
    let ok = false
    if (filterMode.value === 'daily') {
      ok = await exportLogbookDate(selectedDate.value)
    } else if (filterMode.value === 'yearly') {
      ok = await exportLogbookYear(selectedYear.value)
    } else {
      ok = await exportLogbookMonth(selectedYear.value, selectedMonth.value)
    }
    if (ok) {
      emit('exported')
      if (props.closeOnSuccess) emit('close')
    }
  } finally {
    exporting.value = false
  }
}

defineExpose({ resetPeriod })
</script>

<style scoped>
.export-panel {
  width: 100%;
}

.export-mode-toggle {
  width: 100%;
  border: 1px solid var(--q-primary);
}

.export-filters {
  display: flex;
  gap: 8px;
  width: 100%;
}

.export-filters-field,
.export-date-field {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.export-preview {
  position: relative;
  min-height: 48px;
}

.export-preview-list {
  max-height: 240px;
  overflow-y: auto;
}

.export-btn-wrap {
  width: 100%;
}

.export-btn {
  width: 100%;
}
</style>
