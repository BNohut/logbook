import ExcelJS from 'exceljs'
import { Notify } from 'quasar'
import { date } from 'quasar'
import { i18n } from 'src/i18n'
import { getEntriesByDate, getEntriesByMonth, getEntriesByYear } from './logRepository'

function downloadBlob(buffer, filename) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

async function exportEntries(entries, filename) {
  const { t } = i18n.global

  if (entries.length === 0) {
    Notify.create({
      type: 'warning',
      message: t('export.noEntries'),
    })
    return false
  }

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Logbook'
  const sheet = workbook.addWorksheet(t('export.sheetName'))

  sheet.columns = [
    { header: t('export.columns.date'), key: 'date', width: 14 },
    { header: t('export.columns.text'), key: 'text', width: 40 },
    { header: t('export.columns.quantity'), key: 'quantity', width: 12 },
    { header: t('export.columns.savedAt'), key: 'savedAt', width: 22 },
  ]

  sheet.getRow(1).font = { bold: true }

  for (const entry of entries) {
    sheet.addRow({
      date: entry.date,
      text: entry.text,
      quantity: entry.quantity,
      savedAt: date.formatDate(entry.createdAt, 'YYYY-MM-DD HH:mm:ss'),
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(buffer, filename)

  Notify.create({
    type: 'positive',
    message: t('export.success', { count: entries.length }),
  })

  return true
}

/**
 * @param {number} year
 * @param {number} month 1-12
 */
export async function exportLogbookMonth(year, month) {
  const entries = await getEntriesByMonth(year, month)
  const mm = String(month).padStart(2, '0')
  return exportEntries(entries, `logbook-${year}-${mm}.xlsx`)
}

/**
 * @param {string} dateStr YYYY-MM-DD
 */
export async function exportLogbookDate(dateStr) {
  const entries = await getEntriesByDate(dateStr)
  return exportEntries(entries, `logbook-${dateStr}.xlsx`)
}

/**
 * @param {number} year
 */
export async function exportLogbookYear(year) {
  const entries = await getEntriesByYear(year)
  return exportEntries(entries, `logbook-${year}.xlsx`)
}
