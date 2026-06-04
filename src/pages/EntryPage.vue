<template>
  <q-page class="logbook-page q-pa-md">
    <q-card flat bordered class="entry-card">
      <q-card-section class="q-pb-none">
        <div class="text-subtitle1 text-weight-medium text-grey-9">
          {{ t('menu.productEntry') }}
        </div>
      </q-card-section>

      <q-card-section>
        <q-form ref="formRef" class="entry-form" @submit.prevent="onSave">
          <div class="product-autocomplete">
            <q-input
              v-model="form.text"
              :label="t('form.product')"
              :placeholder="t('form.productPlaceholder')"
              outlined
              stack-label
              clearable
              lazy-rules
              class="entry-field"
              :loading="loadingSuggestions"
              :rules="[(val) => (val && val.trim().length > 0) || t('validation.productRequired')]"
              @update:model-value="onProductInput"
              @focus="onProductFocus"
              @blur="onProductBlur"
            />
            <q-list
              v-if="showSuggestions && productSuggestions.length"
              bordered
              dense
              class="product-suggestions"
            >
              <q-item
                v-for="name in productSuggestions"
                :key="name"
                clickable
                @mousedown.prevent="selectProduct(name)"
              >
                <q-item-section>{{ name }}</q-item-section>
              </q-item>
            </q-list>
          </div>

          <div class="row q-col-gutter-sm entry-meta-row">
            <div class="col-6">
              <q-input
                v-model="form.date"
                :label="t('form.date')"
                outlined
                stack-label
                dense
                readonly
                class="entry-field"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer text-primary">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="form.date" mask="YYYY-MM-DD">
                        <div class="row items-center justify-end q-pa-sm">
                          <q-btn v-close-popup :label="t('common.close')" color="primary" unelevated />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-6">
              <q-input
                v-model.number="form.quantity"
                :label="t('form.quantity')"
                outlined
                stack-label
                dense
                readonly
                input-class="text-center text-weight-medium"
                class="entry-field entry-qty"
              >
                <template #prepend>
                  <q-btn
                    flat
                    dense
                    round
                    icon="remove"
                    color="primary"
                    :disable="form.quantity <= 0"
                    :aria-label="t('form.quantityDecrease')"
                    @click="decrementQuantity"
                  />
                </template>
                <template #append>
                  <q-btn
                    flat
                    dense
                    round
                    icon="add"
                    color="primary"
                    :aria-label="t('form.quantityIncrease')"
                    @click="incrementQuantity"
                  />
                </template>
              </q-input>
            </div>
          </div>

          <q-btn
            type="submit"
            color="primary"
            icon="save"
            :label="t('form.save')"
            :loading="saving"
            unelevated
            no-caps
            size="lg"
            class="full-width entry-save-btn"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { date, Notify } from 'quasar'
import { useAppLocale } from 'src/composables/useAppLocale'
import { addEntry, getProductNameSuggestions } from 'src/services/logRepository'

const { t } = useAppLocale()

function todayString() {
  return date.formatDate(Date.now(), 'YYYY-MM-DD')
}

const form = ref({
  text: '',
  date: todayString(),
  quantity: 1,
})

function incrementQuantity() {
  form.value.quantity += 1
}

function decrementQuantity() {
  if (form.value.quantity > 0) {
    form.value.quantity -= 1
  }
}

const formRef = ref(null)
const saving = ref(false)
const productSuggestions = ref([])
const showSuggestions = ref(false)
const loadingSuggestions = ref(false)

let suggestionTimer = null
let blurTimer = null

async function fetchProductSuggestions(query) {
  loadingSuggestions.value = true
  try {
    productSuggestions.value = await getProductNameSuggestions(query)
  } catch {
    productSuggestions.value = []
  } finally {
    loadingSuggestions.value = false
  }
}

function onProductInput(value) {
  if (suggestionTimer) clearTimeout(suggestionTimer)
  suggestionTimer = setTimeout(() => {
    void fetchProductSuggestions(String(value ?? '').trim())
  }, 400)
}

function onProductFocus() {
  if (blurTimer) clearTimeout(blurTimer)
  showSuggestions.value = true
  if (productSuggestions.value.length === 0) {
    void fetchProductSuggestions(form.value.text?.trim() ?? '')
  }
}

function onProductBlur() {
  blurTimer = setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}

function selectProduct(name) {
  form.value.text = name
  showSuggestions.value = false
  productSuggestions.value = []
}

async function resetForm() {
  form.value.text = ''
  form.value.quantity = 1
  form.value.date = todayString()
  productSuggestions.value = []
  showSuggestions.value = false
  await nextTick()
  formRef.value?.resetValidation()
}

async function onSave() {
  const text = form.value.text?.trim()
  const qty = Number(form.value.quantity)

  if (!text) {
    Notify.create({ type: 'negative', message: t('validation.productRequired') })
    return
  }

  if (Number.isNaN(qty)) {
    Notify.create({ type: 'negative', message: t('validation.quantityRequired') })
    return
  }

  if (qty < 0) {
    Notify.create({ type: 'negative', message: t('validation.quantityMin') })
    return
  }

  saving.value = true
  try {
    await addEntry({
      text,
      date: form.value.date,
      quantity: qty,
    })
    Notify.create({ type: 'positive', message: t('notify.saved') })
    await resetForm()
  } catch {
    Notify.create({
      type: 'negative',
      message: t('notify.saveFailed'),
    })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.logbook-page {
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.entry-card {
  border-radius: 12px;
}

.entry-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-autocomplete {
  position: relative;
}

.product-suggestions {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: 2;
  max-height: 160px;
  overflow-y: auto;
  margin-top: 4px;
  border-radius: 0 0 8px 8px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.entry-meta-row {
  align-items: flex-start;
}

/* Solid border on readonly fields (Quasar defaults to dashed) */
.entry-field :deep(.q-field__control:before) {
  border-style: solid !important;
}

.entry-qty :deep(.q-field__native) {
  text-align: center;
  font-size: 1.1rem;
}

.entry-save-btn {
  border-radius: 10px;
  min-height: 48px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
</style>
