import { onMounted, ref } from 'vue'
import { getAvailableYears } from 'src/services/logRepository'

export function useYearOptions() {
  const yearOptions = ref([])
  const loadingYears = ref(false)

  async function loadYearOptions() {
    loadingYears.value = true
    try {
      const years = await getAvailableYears()
      yearOptions.value = years.map((y) => ({ label: String(y), value: y }))
    } finally {
      loadingYears.value = false
    }
  }

  onMounted(loadYearOptions)

  return { yearOptions, loadingYears, loadYearOptions }
}
