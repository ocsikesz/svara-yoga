import SunCalc from 'suncalc';
import { TATTVAS_CLASSIC, TATTVAS_GHATIKA, LUNAR_DAYS } from '../constants/data';

// Time & astronomy helpers used across all screens.
// All timing math (sunrise, svara, tattvas, nadi transitions) lives here.

// ── UTILS ─────────────────────────────────────────────────────────────────────
function calcSunrise(lat, lng, altitude = 0, date = new Date()) {
  // altitude in meters — affects sunrise/sunset time by ~0.3 min per 100m
  // suncalc.getTimes(date, lat, lng, elevation) was added in v1.9.0
  //
  // Defensive input sanitization to prevent Invalid Date results:
  //   - lat must be a number in [-90, 90]
  //   - lng must be a number in [-180, 180]
  //   - altitude must be non-negative number (SunCalc returns Invalid Date
  //     for negative elevation) and not absurdly high
  const safeLat = (typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90) ? lat : 0;
  const safeLng = (typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180) ? lng : 0;
  const safeAlt = (typeof altitude === 'number' && !isNaN(altitude) && altitude >= 0 && altitude < 5000) ? altitude : 0;
  if (safeLat !== lat || safeLng !== lng || safeAlt !== altitude) {
    console.warn(`[calcSunrise] Sanitized input: lat ${lat}->${safeLat}, lng ${lng}->${safeLng}, alt ${altitude}->${safeAlt}`);
  }
  const times = SunCalc.getTimes(date, safeLat, safeLng, safeAlt);
  // Convert a Date to minutes-since-midnight (with fractional seconds for accurate
  // tattva/nadi computations — we want full precision internally).
  const toLocalMin = d => {
    if (!d || isNaN(d.getTime())) return 0;
    return d.getHours()*60 + d.getMinutes() + d.getSeconds()/60;
  };
  // Display: show the minute during which the transition occurred.
  // e.g. sunrise at 05:47:22 → "05:47" (this is what SunCalc.app and most apps show).
  // Note: getMinutes() already truncates seconds, so we just format directly.
  const toHHMM = d => {
    if (!d || isNaN(d.getTime())) return '--:--';
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };
  const sunriseMin = toLocalMin(times.sunrise);
  const sunsetMin  = toLocalMin(times.sunset);
  return { sunriseMin, sunsetMin, sunriseStr:toHHMM(times.sunrise), sunsetStr:toHHMM(times.sunset) };
}

function getLunarDay() {
  const synodicMonth = 29.53058867;
  const knownNewMoon = new Date('2024-01-11T11:57:00Z');
  const diffDays = (new Date() - knownNewMoon) / 86400000;
  const dayInCycle = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
  if (dayInCycle < 15) return { day:Math.floor(dayInCycle)+1, paksha:'shukla' };
  return { day:Math.floor(dayInCycle-15)+1, paksha:'krishna' };
}

function getSvaraFromSunrise(sunriseMin, lunarDay, paksha) {
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
  const minFromSunrise = nowMin - sunriseMin;
  // The svara cycle continues all 24h until next sunrise — not just 12h.
  // Use modulo 1440 (24h) so before-sunrise hours roll back into the previous day's cycle.
  const adjusted = ((minFromSunrise % 1440) + 1440) % 1440;
  const cyclePos = adjusted % 120;
  // 2-min Sushumna window at the start of each 60-min half
  if (cyclePos < 2 || (cyclePos >= 60 && cyclePos < 62)) return 'sushumna';
  const lunarEntry = LUNAR_DAYS.find(d => d.day === lunarDay);
  const startNadi = lunarEntry ? lunarEntry.nadi : 'ida';
  if (cyclePos < 60) return startNadi;
  return startNadi === 'ida' ? 'pingala' : 'ida';
}

// Returns { nextNadi, minutesUntil } — the next DIFFERENT nadi (skipping the
// brief Sushumna windows) and how many minutes until it begins.
function getNextNadiChange(sunriseMin, lunarDay) {
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
  const lunarEntry = LUNAR_DAYS.find(d => d.day === lunarDay);
  const startNadi = lunarEntry ? lunarEntry.nadi : 'ida';
  const nadiAt = (m) => {
    const minFromSR = m - sunriseMin;
    const adjusted = ((minFromSR % 1440) + 1440) % 1440;
    const cyclePos = adjusted % 120;
    if (cyclePos < 2 || (cyclePos >= 60 && cyclePos < 62)) return 'sushumna';
    if (cyclePos < 60) return startNadi;
    return startNadi === 'ida' ? 'pingala' : 'ida';
  };
  const current = nadiAt(nowMin);
  // Walk forward minute by minute until we hit a different, non-sushumna nadi
  for (let dm = 1; dm <= 1440; dm++) {
    const future = nadiAt(nowMin + dm);
    if (future !== 'sushumna' && future !== current) {
      return { nextNadi: future, minutesUntil: dm };
    }
  }
  return { nextNadi: current, minutesUntil: 0 };
}

// Format minutes as "30 minutes" or "1 hour 3 minutes"
function formatDuration(mins) {
  const m = Math.round(mins);
  if (m < 60) return m + (m === 1 ? ' minute' : ' minutes');
  const h = Math.floor(m / 60);
  const rem = m % 60;
  let str = h + (h === 1 ? ' hour' : ' hours');
  if (rem > 0) str += ' ' + rem + (rem === 1 ? ' minute' : ' minutes');
  return str;
}

function getTattvaFromSunrise(sunriseMin, isGhatika) {
  const seq = isGhatika ? TATTVAS_GHATIKA : TATTVAS_CLASSIC;
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
  const minFromSunrise = nowMin - sunriseMin;
  // Cycle 24h: before sunrise, roll back into yesterday's cycle continuation
  const adjusted = ((minFromSunrise % 1440) + 1440) % 1440;
  const cycleDur = isGhatika ? 120 : 60;
  const pos = adjusted % cycleDur;
  let elapsed = 0;
  for (const t of seq) {
    elapsed += isGhatika ? t.ghatika : t.classic;
    if (pos < elapsed) return t;
  }
  return seq[seq.length-1];
}

// Build a timeline of upcoming tattva transitions over the next 24h.
// Returns array of { time:'NOW'|'HH:MM', tattva:{id,name,emoji}, minutesUntil, isNow }.
function getTattvaTimeline(sunriseMin, isGhatika, limit) {
  const seq = isGhatika ? TATTVAS_GHATIKA : TATTVAS_CLASSIC;
  const cycleDur = isGhatika ? 120 : 60;
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
  const tattvaAt = (m) => {
    const mFromSR = m - sunriseMin;
    const adjusted = ((mFromSR % 1440) + 1440) % 1440;
    const pos = adjusted % cycleDur;
    let elapsed = 0;
    for (const t of seq) { elapsed += isGhatika ? t.ghatika : t.classic; if (pos < elapsed) return t; }
    return seq[seq.length-1];
  };
  const out = [];
  let last = null;
  for (let dm = 0; dm <= 1440 && out.length < (limit||15); dm++) {
    const t = tattvaAt(nowMin + dm);
    if (last === null || t.id !== last) {
      const future = new Date(now.getTime() + dm*60000);
      const hh = String(future.getHours()).padStart(2,'0');
      const mm = String(future.getMinutes()).padStart(2,'0');
      const row = {
        time: dm === 0 ? 'NOW' : `${hh}:${mm}`,
        tattva: t,
        minutesUntil: dm,
        isNow: dm === 0,
      };
      // For the current (NOW) tattva, walk backwards to find when it started
      if (dm === 0) {
        let back = 0;
        while (back < 1440 && tattvaAt(nowMin - back - 1).id === t.id) { back++; }
        const startDate = new Date(now.getTime() - back*60000);
        row.startedAt = `${String(startDate.getHours()).padStart(2,'0')}:${String(startDate.getMinutes()).padStart(2,'0')}`;
        row.elapsedMin = back;
      }
      out.push(row);
      last = t.id;
    }
  }
  return out;
}

function getTattvaProgress(sunriseMin, isGhatika, tattva) {
  const seq = isGhatika ? TATTVAS_GHATIKA : TATTVAS_CLASSIC;
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
  const minFromSunrise = nowMin - sunriseMin;
  const cycleDur = isGhatika ? 120 : 60;
  const pos = minFromSunrise < 0 ? 0 : minFromSunrise % cycleDur;
  let elapsed = 0;
  for (const t of seq) {
    const dur = isGhatika ? t.ghatika : t.classic;
    if (t.id === tattva.id) {
      const timeIn = pos - elapsed;
      return { remaining:Math.max(0,Math.round(dur-timeIn)), duration:dur, percent:Math.min(100,Math.max(0,(timeIn/dur)*100)) };
    }
    elapsed += dur;
  }
  return { remaining:0, duration:0, percent:0 };
}

// ── SHARED HEADER ───────────────────────────────────────────────────────────

export {
  calcSunrise, getLunarDay,
  getSvaraFromSunrise, getNextNadiChange,
  formatDuration,
  getTattvaFromSunrise, getTattvaTimeline, getTattvaProgress,
};
