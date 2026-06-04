<template>
  <q-page class="logbook-page q-pa-md">
    <div class="text-h6 q-mb-md">{{ t('dashboard.title') }}</div>

    <q-inner-loading :showing="loading">
      <q-spinner color="primary" size="40px" />
    </q-inner-loading>

    <template v-if="!loading">
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-6">
          <q-card
            flat
            bordered
            class="stat-card cursor-pointer"
            @click="goToAllEntries"
          >
            <q-card-section>
              <div class="text-caption text-grey-7">{{ t('dashboard.totalEntries') }}</div>
              <div class="text-h4 text-weight-bold text-primary">{{ totalEntries }}</div>
              <q-icon name="chevron_right" class="stat-card-icon" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6">
          <q-card
            flat
            bordered
            class="stat-card cursor-pointer"
            @click="goToThisMonth"
          >
            <q-card-section>
              <div class="text-caption text-grey-7">{{ t('dashboard.thisMonth') }}</div>
              <div class="text-h4 text-weight-bold text-primary">{{ thisMonthCount }}</div>
              <q-icon name="chevron_right" class="stat-card-icon" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6">
          <q-card
            flat
            bordered
            class="stat-card cursor-pointer"
            @click="goToAllEntries"
          >
            <q-card-section>
              <div class="text-caption text-grey-7">{{ t('dashboard.totalQuantity') }}</div>
              <div class="text-h4 text-weight-bold text-primary">{{ totalQuantity }}</div>
              <q-icon name="chevron_right" class="stat-card-icon" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6">
          <q-card
            flat
            bordered
            class="stat-card cursor-pointer"
            @click="goToThisMonth"
          >
            <q-card-section>
              <div class="text-caption text-grey-7">{{ t('dashboard.thisMonthQuantity') }}</div>
              <div class="text-h4 text-weight-bold text-primary">{{ thisMonthQuantity }}</div>
              <q-icon name="chevron_right" class="stat-card-icon" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="text-subtitle1 text-weight-medium q-mb-sm">
        {{ t('dashboard.monthlyCounts') }}
      </div>

      <div
        v-if="monthlyCounts.length === 0"
        class="text-center text-grey-7 q-pa-lg rounded-borders bg-grey-2"
      >
        {{ t('dashboard.noData') }}
      </div>

      <q-list v-else bordered separator class="rounded-borders">
        <q-item
          v-for="item in monthlyCounts"
          :key="item.monthKey"
          clickable
          v-ripple
          @click="goToMonth(item)"
        >
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ formatMonth(item) }}</q-item-label>
            <q-item-label caption>
              {{ t('dashboard.totalQuantity') }}: {{ item.totalQuantity }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-chip color="primary" text-color="white" dense>
              {{ item.count }} {{ t('dashboard.entryUnit') }}
            </q-chip>
            <q-icon name="chevron_right" color="grey-6" />
          </q-item-section>
        </q-item>
      </q-list>
    </template>
  </q-page>
</template>

<script setup>
import { computed, onActivated, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { date, Notify } from 'quasar'
import { useAppLocale } from 'src/composables/useAppLocale'
import { getAllEntries, getMonthlyCounts } from 'src/services/logRepository'

const { t } = useAppLocale()
const router = useRouter()

const loading = ref(true)
const monthlyCounts = ref([])
const totalEntries = ref(0)
const totalQuantity = ref(0)

const thisMonthKey = date.formatDate(Date.now(), 'YYYY-MM')

const thisMonthRow = computed(() =>
  monthlyCounts.value.find((m) => m.monthKey === thisMonthKey),
)

const thisMonthCount = computed(() => thisMonthRow.value?.count ?? 0)

const thisMonthQuantity = computed(() => thisMonthRow.value?.totalQuantity ?? 0)

function formatMonth(item) {
  return `${t(`export.months.${item.month}`)} ${item.year}`
}

function goToAllEntries() {
  router.push({ path: '/recent' })
}

function goToThisMonth() {
  const now = new Date()
  router.push({
    path: '/recent',
    query: { year: now.getFullYear(), month: now.getMonth() + 1 },
  })
}

function goToMonth(item) {
  router.push({
    path: '/recent',
    query: { year: item.year, month: item.month },
  })
}

async function loadDashboard() {
  loading.value = true
  try {
    const [counts, all] = await Promise.all([getMonthlyCounts(), getAllEntries()])
    monthlyCounts.value = counts
    totalEntries.value = all.length
    totalQuantity.value = all.reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0)
  } catch {
    Notify.create({
      type: 'negative',
      message: t('notify.loadFailed'),
    })
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
onActivated(loadDashboard)
</script>

<style scoped>
.logbook-page {
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.stat-card {
  border-radius: 12px;
  transition: background-color 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  background-color: rgba(25, 118, 210, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card :deep(.q-card__section) {
  position: relative;
  padding-right: 28px;
}

.stat-card-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.5;
}
</style>
