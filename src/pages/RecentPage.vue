<template>
  <q-page class="logbook-page q-pa-md">
    <div class="text-h6 q-mb-md">{{ t('menu.recentEntries') }}</div>

    <div class="filters-block q-mb-md">
      <q-btn-toggle
        v-model="filterMode"
        spread
        no-caps
        toggle-color="primary"
        color="white"
        text-color="primary"
        class="filter-mode-toggle full-width q-mb-sm"
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
        class="full-width"
        @update:model-value="onFilterChange"
      />

      <div v-else-if="filterMode === 'monthly'" class="row q-col-gutter-sm">
        <div class="col-6">
          <q-select
            v-model="selectedYear"
            :options="yearOptions"
            :label="t('export.year')"
            outlined
            dense
            clearable
            emit-value
            map-options
            class="full-width"
            @update:model-value="onYearChange"
          />
        </div>
        <div class="col-6">
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
            class="full-width"
            @update:model-value="onFilterChange"
          />
        </div>
      </div>

      <q-input
        v-else-if="filterMode === 'daily'"
        v-model="selectedDate"
        :label="t('form.date')"
        outlined
        dense
        clearable
        readonly
        class="full-width"
        @clear="clearDateFilter"
      >
        <template #append>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date
                v-model="selectedDate"
                mask="YYYY-MM-DD"
                @update:model-value="onFilterChange"
              >
                <div class="row items-center justify-end">
                  <q-btn v-close-popup :label="t('common.close')" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>

    <q-inner-loading :showing="loading">
      <q-spinner color="primary" size="40px" />
    </q-inner-loading>

    <div v-if="!loading && entries.length === 0" class="text-center text-grey-7 q-pa-lg">
      {{ filterMode !== 'all' ? t('entries.noResults') : t('entries.empty') }}
    </div>

    <q-list v-else-if="!loading" bordered separator class="rounded-borders entry-list">
      <q-item v-for="entry in entries" :key="entry.id" class="entry-item">
        <q-item-section v-if="editingId !== entry.id">
          <q-item-label>{{ entry.text }}</q-item-label>
          <q-item-label caption>
            {{ entry.date }} · {{ t('entries.qty') }} {{ entry.quantity }}
          </q-item-label>
        </q-item-section>

        <q-item-section v-else class="col-grow">
          <div class="column q-gutter-sm full-width">
            <q-input
              v-model="editForm.text"
              type="textarea"
              :label="t('form.product')"
              autogrow
              outlined
              dense
            />
            <q-input v-model="editForm.date" :label="t('form.date')" outlined dense readonly>
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="editForm.date" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup :label="t('common.close')" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <div class="quantity-field">
              <div class="text-caption text-grey-7 q-mb-xs">{{ t('form.quantity') }}</div>
              <div class="quantity-stepper row items-stretch no-wrap">
                <q-btn
                  class="quantity-stepper-btn"
                  unelevated
                  color="grey-3"
                  text-color="grey-9"
                  icon="remove"
                  dense
                  :disable="editForm.quantity <= 0"
                  @click="editForm.quantity -= 1"
                />
                <div class="quantity-stepper-value col flex flex-center">
                  <span class="text-subtitle1 text-weight-medium">{{ editForm.quantity }}</span>
                </div>
                <q-btn
                  class="quantity-stepper-btn"
                  unelevated
                  color="grey-3"
                  text-color="grey-9"
                  icon="add"
                  dense
                  @click="editForm.quantity += 1"
                />
              </div>
            </div>
            <div class="row q-gutter-sm">
              <q-btn
                class="col"
                outline
                color="grey-8"
                :label="t('common.cancel')"
                @click="cancelEdit"
              />
              <q-btn
                class="col"
                unelevated
                color="primary"
                icon="save"
                :label="t('form.save')"
                :loading="savingId === entry.id"
                @click="saveEdit(entry.id)"
              />
            </div>
          </div>
        </q-item-section>

        <q-item-section v-if="editingId !== entry.id" side>
          <q-btn
            flat
            round
            dense
            color="primary"
            icon="edit"
            :aria-label="t('entries.edit')"
            @click="startEdit(entry)"
          />
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Notify } from 'quasar'
import { useAppLocale } from 'src/composables/useAppLocale'
import { useYearOptions } from 'src/composables/useYearOptions'
import {
  getAllEntries,
  getEntriesByDate,
  getEntriesByMonth,
  getEntriesByYear,
  updateEntry,
} from 'src/services/logRepository'

const { t, locale } = useAppLocale()
const { yearOptions, loadYearOptions } = useYearOptions()
const route = useRoute()
const router = useRouter()

const filterMode = ref('all')
const selectedYear = ref(null)
const selectedMonth = ref(null)
const selectedDate = ref(null)

const loading = ref(true)
const entries = ref([])
const editingId = ref(null)
const savingId = ref(null)
const editForm = ref({
  text: '',
  date: '',
  quantity: 1,
})

const filterModeOptions = computed(() => [
  { label: t('filter.all'), value: 'all' },
  { label: t('filter.daily'), value: 'daily' },
  { label: t('filter.monthly'), value: 'monthly' },
  { label: t('filter.yearly'), value: 'yearly' },
])

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

function buildRouteQuery() {
  if (filterMode.value === 'daily' && selectedDate.value) {
    return { date: selectedDate.value }
  }
  if (filterMode.value === 'yearly' && selectedYear.value != null) {
    return { year: String(selectedYear.value) }
  }
  if (filterMode.value === 'monthly') {
    const query = {}
    if (selectedYear.value != null) query.year = String(selectedYear.value)
    if (selectedMonth.value != null) query.month = String(selectedMonth.value)
    if (Object.keys(query).length) return query
  }
  return {}
}

function applyRouteQuery() {
  selectedDate.value = null
  selectedYear.value = null
  selectedMonth.value = null
  filterMode.value = 'all'

  if (route.query.date && typeof route.query.date === 'string') {
    filterMode.value = 'daily'
    selectedDate.value = route.query.date
    return
  }

  const year = Number(route.query.year)
  const month = Number(route.query.month)
  if (!Number.isNaN(year) && year > 0) {
    selectedYear.value = year
    if (!Number.isNaN(month) && month >= 1 && month <= 12) {
      filterMode.value = 'monthly'
      selectedMonth.value = month
    } else {
      filterMode.value = 'yearly'
    }
  }
}

function clearFilterValues() {
  selectedDate.value = null
  selectedYear.value = null
  selectedMonth.value = null
}

function onFilterModeChange() {
  cancelEdit()
  clearFilterValues()
  syncRoute()
  loadEntries()
}

function syncRoute() {
  router.replace({ query: buildRouteQuery() })
}

function onYearChange() {
  selectedMonth.value = null
  onFilterChange()
}

function onFilterChange() {
  cancelEdit()
  if (filterMode.value === 'monthly' && selectedYear.value == null) {
    selectedMonth.value = null
  }
  syncRoute()
  loadEntries()
}

function clearDateFilter() {
  selectedDate.value = null
  onFilterChange()
}

async function loadEntries() {
  loading.value = true
  try {
    if (filterMode.value === 'daily' && selectedDate.value) {
      entries.value = await getEntriesByDate(selectedDate.value)
    } else if (filterMode.value === 'yearly' && selectedYear.value != null) {
      entries.value = await getEntriesByYear(selectedYear.value)
    } else if (
      filterMode.value === 'monthly' &&
      selectedYear.value != null &&
      selectedMonth.value != null
    ) {
      entries.value = await getEntriesByMonth(selectedYear.value, selectedMonth.value)
    } else {
      entries.value = await getAllEntries()
    }
    entries.value.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    Notify.create({
      type: 'negative',
      message: t('notify.loadFailed'),
    })
  } finally {
    loading.value = false
  }
}

function startEdit(entry) {
  editingId.value = entry.id
  editForm.value = {
    text: entry.text,
    date: entry.date,
    quantity: entry.quantity,
  }
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(id) {
  const text = editForm.value.text?.trim()
  const qty = Number(editForm.value.quantity)

  if (!text) {
    Notify.create({ type: 'negative', message: t('validation.productRequired') })
    return
  }

  if (Number.isNaN(qty) || qty < 0) {
    Notify.create({ type: 'negative', message: t('validation.quantityMin') })
    return
  }

  savingId.value = id
  try {
    await updateEntry(id, {
      text,
      date: editForm.value.date,
      quantity: qty,
    })
    editingId.value = null
    Notify.create({ type: 'positive', message: t('notify.updated') })
    await loadEntries()
    await loadYearOptions()
  } catch {
    Notify.create({
      type: 'negative',
      message: t('notify.updateFailed'),
    })
  } finally {
    savingId.value = null
  }
}

watch(
  () => route.query,
  () => {
    applyRouteQuery()
    cancelEdit()
    loadEntries()
  },
)

onActivated(() => {
  loadYearOptions()
})

onMounted(() => {
  applyRouteQuery()
  loadEntries()
})
</script>

<style scoped>
.logbook-page {
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.filter-mode-toggle {
  border: 1px solid var(--q-primary);
}

.entry-item {
  align-items: flex-start;
}

.quantity-stepper {
  max-width: 200px;
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 8px;
  overflow: hidden;
}

.quantity-stepper-btn {
  width: 44px;
  min-height: 40px;
  border-radius: 0;
}

.quantity-stepper-value {
  min-width: 48px;
  background: #fff;
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
