import { getSetting, setItem, getAll } from './db'
import { formatDateKey } from './taken'

export async function getHuidigeStand() {
  const metingen = await getAll('metingen')
  if (metingen.length === 0) return null
  return metingen.sort((a, b) => b.datum.localeCompare(a.datum))[0]
}

export const ACTIVITEIT_FACTOREN = {
  zittend: 1.2,
  licht: 1.375,
  matig: 1.55,
  actief: 1.725,
}

export const ACTIVITEIT_OPTIES = [
  { id: 'zittend', label: 'Zittend werk, weinig sport' },
  { id: 'licht', label: 'Licht actief (1-3x/week sport)' },
  { id: 'matig', label: 'Matig actief (3-5x/week sport)' },
  { id: 'actief', label: 'Actief (6-7x/week sport)' },
]

const KCAL_PER_KG_VET = 7700
const TARGET_WEEKLY_RATE = 0.007 // 0.7% van huidig lichaamsgewicht per week
const MAX_WEEKLY_RATE = 0.01 // hard cap 1% van lichaamsgewicht
const ADAPTATIE_PER_WEEK = 0.005
const MAX_ADAPTATIE = 0.15
const KCAL_FLOOR = { Man: 1500, Vrouw: 1200 }
const MAX_WEKEN = 156

export function berekenBMR({ gewicht, lengte, leeftijd, geslacht }) {
  if (!gewicht || !lengte || !leeftijd || !geslacht) return null
  const base = 10 * gewicht + 6.25 * lengte - 5 * leeftijd
  return geslacht === 'Man' ? base + 5 : base - 161
}

export function berekenTDEE(bmr, niveau) {
  if (!bmr) return null
  const factor = ACTIVITEIT_FACTOREN[niveau] || ACTIVITEIT_FACTOREN.licht
  return bmr * factor
}

export function berekenBMI(gewicht, lengteCm) {
  if (!gewicht || !lengteCm) return null
  const m = lengteCm / 100
  return Math.round((gewicht / (m * m)) * 10) / 10
}

export function gezondeBmiBereik(lengteCm) {
  const m = lengteCm / 100
  return {
    min: Math.round(18.5 * m * m * 10) / 10,
    max: Math.round(24.9 * m * m * 10) / 10,
  }
}

// Week-voor-week simulatie met metabolische adaptatie en harde grenzen.
// Stop bij doelGewicht (mode A) of na n weken (mode B).
// Tempo schaalt mee met huidig gewicht (0.7% per week target) zodat
// zwaardere mensen meer afvallen per week dan lichtere.
function simuleerWeken({ startGewicht, doelGewicht, maxWeken, basisData, richting = -1 }) {
  if (doelGewicht != null) {
    richting = startGewicht > doelGewicht ? -1 : 1
  }
  const projecties = []
  let gewicht = startGewicht
  const waarschuwingen = []
  let intakeFloorGeraakt = false

  for (let week = 1; week <= maxWeken; week++) {
    const bmr = berekenBMR({ ...basisData, gewicht })
    const tdee = berekenTDEE(bmr, basisData.activiteitsniveau)
    if (!tdee) return { projecties: [], waarschuwingen: [{ type: 'fout', bericht: 'Vul eerst je basisgegevens in.' }] }

    const adaptatie = Math.min(MAX_ADAPTATIE, week * ADAPTATIE_PER_WEEK)
    const effectiveTdee = tdee * (1 - adaptatie)

    // Doel-deficit afgeleid van percentage huidig gewicht (schaalt met gewicht
    // en wordt automatisch trager naarmate je afvalt)
    const targetWeeklyVerandering = gewicht * TARGET_WEEKLY_RATE
    const targetDailyDeficit = (targetWeeklyVerandering * KCAL_PER_KG_VET) / 7

    // Hard cap op 1% van huidig gewicht per week
    const maxWeeklyVerandering = gewicht * MAX_WEEKLY_RATE
    const maxDailyDeficit = (maxWeeklyVerandering * KCAL_PER_KG_VET) / 7

    let dailyDeficit = Math.min(targetDailyDeficit, maxDailyDeficit)

    // Cap zodat intake niet onder floor zakt (alleen bij afvallen)
    if (richting === -1) {
      const floor = KCAL_FLOOR[basisData.geslacht] || 1200
      const maxDeficitPerFloor = effectiveTdee - floor
      if (dailyDeficit > maxDeficitPerFloor) {
        dailyDeficit = Math.max(0, maxDeficitPerFloor)
        if (!intakeFloorGeraakt) {
          intakeFloorGeraakt = true
          waarschuwingen.push({
            type: 'info',
            bericht: `Bij week ${week} zou je calorie-inname onder ${floor} kcal/dag moeten zakken om het tempo te halen. Het tempo wordt vanaf hier automatisch bijgesteld.`,
          })
        }
      }
    }

    const weeklyVerandering = (dailyDeficit * 7) / KCAL_PER_KG_VET
    let nieuwGewicht = gewicht + weeklyVerandering * richting

    let bereikt = false
    if (doelGewicht != null) {
      if ((richting === -1 && nieuwGewicht <= doelGewicht) || (richting === 1 && nieuwGewicht >= doelGewicht)) {
        nieuwGewicht = doelGewicht
        bereikt = true
      }
    }

    projecties.push({
      week,
      gewicht: Math.round(nieuwGewicht * 10) / 10,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      effectiveTdee: Math.round(effectiveTdee),
      dailyDeficit: Math.round(dailyDeficit),
    })

    if (bereikt) break
    gewicht = nieuwGewicht
  }

  return { projecties, waarschuwingen }
}

function dagenErbij(datumStr, dagen) {
  const d = new Date(datumStr + 'T00:00:00')
  d.setDate(d.getDate() + dagen)
  return formatDateKey(d)
}

function dagenTussen(aStr, bStr) {
  const a = new Date(aStr + 'T00:00:00')
  const b = new Date(bStr + 'T00:00:00')
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

// Mode A: gebruiker geeft doelgewicht, app berekent einddatum
export function berekenEindDatumVanGewicht({ startGewicht, doelGewicht, basisData }) {
  const sim = simuleerWeken({ startGewicht, doelGewicht, maxWeken: MAX_WEKEN, basisData })
  if (sim.projecties.length === 0) return { onmogelijk: true, waarschuwingen: sim.waarschuwingen }
  const laatste = sim.projecties[sim.projecties.length - 1]
  if (laatste.gewicht !== doelGewicht) {
    return {
      onmogelijk: true,
      projecties: sim.projecties,
      waarschuwingen: [
        ...sim.waarschuwingen,
        { type: 'fout', bericht: `Doel kan niet binnen ${MAX_WEKEN} weken bereikt worden bij gezond tempo.` },
      ],
    }
  }
  return {
    onmogelijk: false,
    eindDatum: dagenErbij(formatDateKey(new Date()), laatste.week * 7),
    weken: laatste.week,
    projecties: sim.projecties,
    waarschuwingen: sim.waarschuwingen,
  }
}

// Mode B: gebruiker geeft einddatum, app berekent realistisch doelgewicht
// (default richting = afvallen)
export function berekenDoelGewichtVanDatum({ startGewicht, eindDatum, basisData }) {
  const dagen = dagenTussen(formatDateKey(new Date()), eindDatum)
  if (dagen <= 7) {
    return {
      onmogelijk: true,
      waarschuwingen: [{ type: 'fout', bericht: 'De einddatum ligt te dichtbij. Kies een datum minimaal 2 weken in de toekomst.' }],
    }
  }
  const weken = Math.floor(dagen / 7)
  const sim = simuleerWeken({
    startGewicht,
    doelGewicht: null,
    maxWeken: weken,
    basisData,
    richting: -1,
  })
  const laatste = sim.projecties[sim.projecties.length - 1]
  return {
    onmogelijk: false,
    doelGewicht: laatste.gewicht,
    weken,
    projecties: sim.projecties,
    waarschuwingen: sim.waarschuwingen,
  }
}

// Maak tussendoelen elke 14 dagen vanaf startdatum, op basis van projecties
function maakTussendoelen({ startDatum, projecties }) {
  const tussendoelen = []
  for (let i = 1; i < projecties.length; i++) {
    const week = projecties[i].week
    if (week % 2 !== 0) continue // alleen even weken (2,4,6,...)
    if (i === projecties.length - 1) continue // laatste = einddoel zelf, niet tussendoel
    tussendoelen.push({
      datum: dagenErbij(startDatum, week * 7),
      gewicht: projecties[i].gewicht,
      week,
    })
  }
  return tussendoelen
}

export function bouwPlan({ mode, startGewicht, doelGewicht, eindDatum, basisData }) {
  const startDatum = formatDateKey(new Date())
  const waarschuwingen = []

  let resolvedDoelGewicht = doelGewicht
  let resolvedEindDatum = eindDatum
  let projecties = []

  if (mode === 'doelgewicht') {
    const r = berekenEindDatumVanGewicht({ startGewicht, doelGewicht, basisData })
    if (r.onmogelijk) return { onmogelijk: true, waarschuwingen: r.waarschuwingen }
    resolvedEindDatum = r.eindDatum
    projecties = r.projecties
    waarschuwingen.push(...r.waarschuwingen)
  } else {
    const r = berekenDoelGewichtVanDatum({ startGewicht, eindDatum, basisData })
    if (r.onmogelijk) return { onmogelijk: true, waarschuwingen: r.waarschuwingen }
    resolvedDoelGewicht = r.doelGewicht
    projecties = r.projecties
    waarschuwingen.push(...r.waarschuwingen)
  }

  // BMI-validatie
  const bmiDoel = berekenBMI(resolvedDoelGewicht, basisData.lengte)
  if (bmiDoel < 18.5) {
    const bereik = gezondeBmiBereik(basisData.lengte)
    waarschuwingen.push({
      type: 'waarschuwing',
      bericht: `Doelgewicht (${resolvedDoelGewicht} kg, BMI ${bmiDoel}) ligt onder gezond bereik. Voor jouw lengte is ${bereik.min}–${bereik.max} kg gezond.`,
    })
  }

  // Tempo-info
  const totaalVerschil = Math.abs(startGewicht - resolvedDoelGewicht)
  const wekenTotaal = projecties.length
  const gemTempo = Math.round((totaalVerschil / wekenTotaal) * 100) / 100

  const tussendoelen = maakTussendoelen({ startDatum, projecties })

  return {
    onmogelijk: false,
    plan: {
      id: `plan-${Date.now()}`,
      gegenereerdOp: startDatum,
      mode,
      startDatum,
      startGewicht: Math.round(startGewicht * 10) / 10,
      doelGewicht: resolvedDoelGewicht,
      eindDatum: resolvedEindDatum,
      basisSnapshot: { ...basisData },
      tussendoelen,
      gemTempo,
      bmiDoel,
    },
    waarschuwingen,
    projecties,
  }
}

export async function getPlannen() {
  const p = await getSetting('plannen')
  return Array.isArray(p) ? p : []
}

export async function voegPlanToe(plan) {
  const bestaand = await getPlannen()
  const nieuw = [...bestaand, plan].sort((a, b) => a.gegenereerdOp.localeCompare(b.gegenereerdOp))
  await setItem('settings', 'plannen', nieuw)
  return nieuw
}

export async function verwijderPlan(planId) {
  const bestaand = await getPlannen()
  const nieuw = bestaand.filter(p => p.id !== planId)
  await setItem('settings', 'plannen', nieuw)
  return nieuw
}

export async function verwijderOudePlannen() {
  const bestaand = await getPlannen()
  if (bestaand.length <= 1) return bestaand
  const nieuwste = bestaand[bestaand.length - 1]
  await setItem('settings', 'plannen', [nieuwste])
  return [nieuwste]
}

export function getActievePlan(plannen) {
  if (!plannen || plannen.length === 0) return null
  const vandaag = formatDateKey(new Date())
  const actief = [...plannen].reverse().find(p => p.gegenereerdOp <= vandaag)
  return actief || plannen[plannen.length - 1]
}
