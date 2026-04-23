#!/usr/bin/env node
/**
 * PROPULSION — Script d'import Excel/CSV
 * Usage : node scripts/import-excel.js <fichier.xlsx> [--dry-run] [--batch-size=50]
 *
 * Variables d'environnement requises :
 *   SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY=eyJ... (service_role key, pas anon)
 */

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ============================================================
// Config
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const BATCH_SIZE = parseInt(process.argv.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '50')
const DRY_RUN = process.argv.includes('--dry-run')
const FILE_PATH = process.argv.find(a => !a.startsWith('-') && a !== process.argv[0] && a !== process.argv[1])
const CHECKPOINT_FILE = '.import-checkpoint.json'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables d\'environnement manquantes : SUPABASE_URL et SUPABASE_SERVICE_KEY')
  process.exit(1)
}

if (!FILE_PATH) {
  console.error('❌ Usage : node scripts/import-excel.js <fichier.xlsx> [--dry-run] [--batch-size=50]')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================================
// Mapping colonnes Excel → BDD
// ============================================================
const COLUMN_MAP = {
  // Prénom
  'Prénom': 'first_name', 'prenom': 'first_name', 'First Name': 'first_name', 'first_name': 'first_name',
  // Nom
  'Nom': 'last_name', 'nom': 'last_name', 'Last Name': 'last_name', 'last_name': 'last_name',
  // Email
  'Email': 'email', 'email': 'email', 'E-mail': 'email', 'Adresse email': 'email',
  // WhatsApp
  'WhatsApp': 'whatsapp', 'whatsapp': 'whatsapp', 'Numéro WhatsApp': 'whatsapp', 'Téléphone': 'whatsapp',
  // Ville
  'Ville': 'city', 'ville': 'city', 'City': 'city', 'city': 'city', 'Ville actuelle': 'city',
  // Pays
  'Pays': 'country', 'pays': 'country', 'Country': 'country', 'country': 'country',
  // Statut
  'Statut': 'status', 'statut': 'status', 'Status': 'status', 'status': 'status',
  // Secteurs
  'Secteur': 'sectors', 'secteur': 'sectors', 'Secteurs': 'sectors', "Secteur d'activité": 'sectors',
  'Sector': 'sectors', 'sectors': 'sectors',
  // Bio/Description
  'Description': 'description', 'Bio': 'description', 'bio': 'description',
  // LinkedIn
  'LinkedIn': 'linkedin_url', 'linkedin': 'linkedin_url', 'linkedin_url': 'linkedin_url',
  // Pays
  'Instagram': 'instagram_url', 'TikTok': 'tiktok_url', 'Facebook': 'facebook_url',
}

const VALID_STATUSES = ['Entrepreneur', 'Salarié', 'Employé', 'Étudiant', 'Autre']

function mapStatus(val) {
  if (!val) return 'Autre'
  const v = val.toString().trim()
  const found = VALID_STATUSES.find(s => s.toLowerCase() === v.toLowerCase())
  return found || 'Autre'
}

function parsePhoneNumber(val) {
  if (!val) return ''
  let phone = val.toString().replace(/\s/g, '').trim()
  // Ajouter + si absent et commence par indicatif
  if (!phone.startsWith('+') && !phone.startsWith('00')) {
    // Cameroun par défaut
    if (phone.startsWith('6') || phone.startsWith('2')) phone = '+237' + phone
    else phone = '+' + phone
  }
  if (phone.startsWith('00')) phone = '+' + phone.slice(2)
  return phone
}

function capitalize(str) {
  if (!str) return ''
  return str.toString().trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

function parseSectors(val) {
  if (!val) return []
  return val.toString().split(/[,;\/]/).map(s => s.trim()).filter(Boolean)
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function mapRow(rawRow, headers) {
  const row = {}

  // Mapper chaque colonne Excel vers le champ BDD
  for (const [col, val] of Object.entries(rawRow)) {
    const field = COLUMN_MAP[col]
    if (field) row[field] = val
  }

  return {
    email: (row.email || '').toString().toLowerCase().trim(),
    first_name: capitalize(row.first_name),
    last_name: (row.last_name || '').toString().trim().toUpperCase(),
    whatsapp: parsePhoneNumber(row.whatsapp),
    city: capitalize(row.city),
    country: capitalize(row.country),
    status: mapStatus(row.status),
    sectors: parseSectors(row.sectors),
    description: (row.description || '').toString().trim().slice(0, 160),
    linkedin_url: (row.linkedin_url || '').toString().trim(),
    instagram_url: (row.instagram_url || '').toString().trim(),
    tiktok_url: (row.tiktok_url || '').toString().trim(),
    facebook_url: (row.facebook_url || '').toString().trim(),
    role: 'member',
    is_active: true,
    profile_completed: false,
  }
}

// ============================================================
// Script principal
// ============================================================
async function main() {
  console.log(`\n🚀 PROPULSION — Import Excel`)
  console.log(`📄 Fichier : ${FILE_PATH}`)
  console.log(`⚙️  Batch size : ${BATCH_SIZE}`)
  console.log(DRY_RUN ? '🔍 Mode DRY RUN (aucune donnée insérée)\n' : '📥 Mode RÉEL\n')

  // Lecture du fichier Excel
  const filePath = resolve(FILE_PATH)
  if (!existsSync(filePath)) {
    console.error(`❌ Fichier introuvable : ${filePath}`)
    process.exit(1)
  }

  const wb = XLSX.readFile(filePath)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' })

  console.log(`📊 ${rawData.length} lignes détectées dans le fichier\n`)

  if (rawData.length === 0) {
    console.error('❌ Fichier vide ou format incorrect.')
    process.exit(1)
  }

  // Checkpoint — reprendre depuis la dernière ligne traitée
  let startIndex = 0
  if (existsSync(CHECKPOINT_FILE)) {
    const checkpoint = JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf8'))
    startIndex = checkpoint.lastIndex || 0
    console.log(`↩️  Reprise depuis la ligne ${startIndex}\n`)
  }

  const errors = []
  const skipped = []
  let inserted = 0
  let updated = 0

  // Traitement par batches
  const rows = rawData.slice(startIndex)
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE)

    process.stdout.write(`\r⏳ Traitement batch ${batchNum}/${totalBatches} (${i + startIndex}/${rawData.length} lignes)...`)

    const validRows = []

    for (const rawRow of batch) {
      const row = mapRow(rawRow)

      // Validation
      if (!row.email) { errors.push({ ...row, error: 'Email manquant' }); continue }
      if (!validateEmail(row.email)) { errors.push({ ...row, error: `Email invalide: ${row.email}` }); continue }
      if (!row.first_name && !row.last_name) { errors.push({ ...row, error: 'Prénom et Nom manquants' }); continue }

      validRows.push(row)
    }

    if (!DRY_RUN && validRows.length > 0) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert(validRows, {
            onConflict: 'email',
            ignoreDuplicates: false,
          })
          .select('id, email')

        if (error) {
          console.error(`\n❌ Erreur batch ${batchNum}:`, error.message)
          errors.push(...validRows.map(r => ({ ...r, error: error.message })))
        } else {
          inserted += validRows.length
        }
      } catch (err) {
        console.error(`\n❌ Exception batch ${batchNum}:`, err.message)
        errors.push(...validRows.map(r => ({ ...r, error: err.message })))
      }
    } else if (DRY_RUN) {
      console.log(`\n   [DRY RUN] ${validRows.length} membres valides dans ce batch`)
    }

    // Checkpoint
    writeFileSync(CHECKPOINT_FILE, JSON.stringify({ lastIndex: startIndex + i + batch.length }))

    // Pause pour éviter rate limiting
    if (i + BATCH_SIZE < rows.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  // Rapport final
  console.log('\n\n' + '='.repeat(50))
  console.log('📋 RAPPORT FINAL')
  console.log('='.repeat(50))
  console.log(`✅ Traités avec succès : ${inserted} membres`)
  console.log(`❌ Erreurs : ${errors.length} lignes`)
  console.log(`⏭️  Ignorés : ${skipped.length} lignes`)
  console.log(`📊 Total fichier : ${rawData.length} lignes`)

  // Export des erreurs
  if (errors.length > 0) {
    const errorFile = `import-errors-${Date.now()}.xlsx`
    const ws = XLSX.utils.json_to_sheet(errors)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Erreurs')
    XLSX.writeFile(wb, errorFile)
    console.log(`\n⚠️  Fichier d'erreurs exporté : ${errorFile}`)
  }

  // Nettoyer checkpoint si succès complet
  if (errors.length === 0) {
    try { require('fs').unlinkSync(CHECKPOINT_FILE) } catch {}
  }

  console.log('\n✅ Import terminé.\n')
}

main().catch(err => {
  console.error('\n❌ Erreur fatale:', err.message)
  process.exit(1)
})
