import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, TextInput, Alert, Platform, Image, Linking } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SunCalc from 'suncalc';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const C = {
  bg:'#1a0a2e', bgCard:'#2a1040', bgDeep:'#2a0a4a',
  border:'#4a2a6a', borderFaint:'#3d2a5a',
  gold:'#c9a96e', goldLight:'#e8d5a3',
  muted:'#8a6a9a', faint:'#6a4a7a', fainter:'#5a3a7a',
  purple:'#3d1a60', purpleBorder:'#6a3a8a',
  green:'#6ae0a0', greenBg:'#0a2a1a', greenBorder:'#2a6a4a',
  red:'#e06060', redBg:'#2a0a0a', redBorder:'#6a2a2a',
  blue:'#6ab0e0', blueBg:'#1a2a4a',
  orange:'#e09060', orangeBg:'#3a1a0a',
};

const TABS = [
  { id:'home',     label:'Home',    icon:'🏠' },
  { id:'svara',    label:'Svara',   icon:'🌬' },
  { id:'lunar',    label:'Lunar',   icon:'🌙' },
  { id:'shlokas',  label:'Shlokas', icon:'📖' },
  { id:'settings', label:'Settings',icon:'⚙️' },
];

const TATTVAS_CLASSIC = [
  { id:'prithvi', name:'Prithvi', emoji:'🌍', classic:20, ghatika:24, color:'#8B5E3C', sense:'Smell · Gandha',   chakra:'Muladhara · Root',       symbol:'Square',   description:'Earth element brings stability, patience and endurance. Ideal for planting, construction and long-term planning.' },
  { id:'apas',    name:'Apas',    emoji:'💧', classic:16, ghatika:24, color:'#4a8ec2', sense:'Taste · Rasa',    chakra:'Svadhisthana · Sacral',   symbol:'Crescent', description:'Water element brings flow, creativity and auspiciousness. Ideal for healing, romance and all gentle pursuits.' },
  { id:'tejas',   name:'Tejas',   emoji:'🔥', classic:12, ghatika:24, color:'#c2603a', sense:'Sight · Rupa',    chakra:'Manipura · Solar Plexus', symbol:'Triangle', description:'Fire element brings transformation and intensity. Use for cooking, debate and fierce activity. Avoid new beginnings.' },
  { id:'vayu',    name:'Vayu',    emoji:'🌬', classic:8,  ghatika:24, color:'#7ab89a', sense:'Touch · Sparsha', chakra:'Anahata · Heart',         symbol:'Hexagon',  description:'Air element brings movement and change. Good for short travel, music and communication. Avoid permanent decisions.' },
  { id:'akasha',  name:'Akasha',  emoji:'✨', classic:4,  ghatika:24, color:'#8a6aaa', sense:'Sound · Shabda',  chakra:'Vishuddha · Throat',      symbol:'Circle',   description:'Ether element is transcendent and rare. Use only for deep meditation, mantra japa and spiritual initiation.' },
];

const TATTVAS_GHATIKA = [
  { id:'akasha',  name:'Akasha',  emoji:'✨', classic:4,  ghatika:24, color:'#8a6aaa', sense:'Sound · Shabda',  chakra:'Vishuddha · Throat',      symbol:'Circle',   description:'Ether element is transcendent and rare. Use only for deep meditation, mantra japa and spiritual initiation.' },
  { id:'vayu',    name:'Vayu',    emoji:'🌬', classic:8,  ghatika:24, color:'#7ab89a', sense:'Touch · Sparsha', chakra:'Anahata · Heart',         symbol:'Hexagon',  description:'Air element brings movement and change. Good for short travel, music and communication. Avoid permanent decisions.' },
  { id:'tejas',   name:'Tejas',   emoji:'🔥', classic:12, ghatika:24, color:'#c2603a', sense:'Sight · Rupa',    chakra:'Manipura · Solar Plexus', symbol:'Triangle', description:'Fire element brings transformation and intensity. Use for cooking, debate and fierce activity. Avoid new beginnings.' },
  { id:'apas',    name:'Apas',    emoji:'💧', classic:16, ghatika:24, color:'#4a8ec2', sense:'Taste · Rasa',    chakra:'Svadhisthana · Sacral',   symbol:'Crescent', description:'Water element brings flow, creativity and auspiciousness. Ideal for healing, romance and all gentle pursuits.' },
  { id:'prithvi', name:'Prithvi', emoji:'🌍', classic:20, ghatika:24, color:'#8B5E3C', sense:'Smell · Gandha',  chakra:'Muladhara · Root',        symbol:'Square',   description:'Earth element brings stability, patience and endurance. Ideal for planting, construction and long-term planning.' },
];

// Teachings paraphrased in our own words from the Shiva Svarodaya tradition.
// These are NOT copied translations — the full Sanskrit text with a proper
// English translation is in: "Swara Yoga: The Tantric Science of Brain
// Breathing" by Swami Muktibodhananda (Bihar School of Yoga). See the source
// card at the bottom of this screen. Verse numbers are approximate references
// to where each theme appears in the 395-sutra text.
const SHLOKAS = [
  // ── Foundations ──
  { verse:1,   topic:'The Dialogue Begins',      sanskrit:'', meaning:'The teaching opens as Parvati asks Shiva to reveal the science of the breath — knowledge once kept secret, passed only from teacher to student.' },
  { verse:9,   topic:'Svara as Supreme Knowledge', sanskrit:'स्वरे शास्त्राणि विद्यन्ते', meaning:'All scriptures, all music, all knowledge are said to rest within the svara — the flow of the breath. To know the breath is to know the cosmos in miniature.' },
  { verse:12,  topic:'Secrecy of the Science',   sanskrit:'', meaning:'This knowledge is described as the most precious of secrets — to be shared only with the sincere, the devoted, and those who will honour it.' },
  { verse:15,  topic:'Breath as Life-Force',     sanskrit:'', meaning:'The breath carries prana, the vital force. As the breath moves, so moves the mind; steady the one and you steady the other.' },

  // ── The Three Nadis ──
  { verse:21,  topic:'The Three Channels',       sanskrit:'इडा पिङ्गला सुषुम्ना', meaning:'Three subtle channels carry the breath: Ida on the left, Pingala on the right, and Sushumna in the centre. From these all rhythms of life unfold.' },
  { verse:24,  topic:'Ida — The Lunar Channel',  sanskrit:'', meaning:'When breath flows in the left nostril, the cooling lunar current (Ida) is active — calm, nourishing, inward-turning.' },
  { verse:27,  topic:'Pingala — The Solar Channel', sanskrit:'', meaning:'When breath flows in the right nostril, the heating solar current (Pingala) is active — energetic, outward, ready for action.' },
  { verse:30,  topic:'Sushumna — The Central Fire', sanskrit:'', meaning:'When both nostrils flow equally, Sushumna awakens. This rare state is the gateway to meditation and higher consciousness.' },
  { verse:33,  topic:'Reading Your Own Breath',  sanskrit:'', meaning:'Place a finger beneath the nostrils on waking. Notice which side flows more freely — that current colours the hours ahead.' },

  // ── Ida activities ──
  { verse:47,  topic:'When Ida Flows',           sanskrit:'इडायां शुभकार्याणि', meaning:'While the left breath flows, favour gentle and lasting works: study, healing, planting, acts of kindness, beginning peaceful ventures.' },
  { verse:50,  topic:'Ida and the Mind',         sanskrit:'', meaning:'The lunar breath quiets the mind and cools the emotions. A good time for reflection, art, and matters of the heart.' },
  { verse:53,  topic:'Ida for Health',           sanskrit:'', meaning:'Tradition holds that drinking, eating and resting during the left-breath supports digestion and recovery.' },

  // ── Pingala activities ──
  { verse:58,  topic:'When Pingala Flows',       sanskrit:'पिङ्गलायां च दारुणम्', meaning:'While the right breath flows, favour vigorous works: physical effort, travel, debate, competition, and bold undertakings.' },
  { verse:61,  topic:'Pingala and Digestion',    sanskrit:'', meaning:'The solar breath kindles the inner fire. Heavier meals are said to digest best while Pingala is active.' },
  { verse:64,  topic:'Pingala for Courage',      sanskrit:'', meaning:'When willpower and stamina are needed, the right-breath lends its heat. Confront challenges while the sun-channel flows.' },

  // ── Sushumna ──
  { verse:71,  topic:'When Sushumna Flows',      sanskrit:'सुषुम्नायां न कार्याणि', meaning:'When the central channel opens, set aside worldly tasks. This is the moment for meditation, mantra, and turning within.' },
  { verse:74,  topic:'The Sacred Pause',         sanskrit:'', meaning:'Sushumna arises briefly as the breath shifts from one nostril to the other. Catch this pause and the mind grows still.' },

  // ── The Five Tattvas ──
  { verse:82,  topic:'The Five Elements',        sanskrit:'पृथ्वी आपस् तेजस् वायु आकाश', meaning:'Each breath carries one of five elements in turn: Earth, Water, Fire, Air and Ether — each shaping the quality of the moment.' },
  { verse:85,  topic:'Prithvi — Earth',          sanskrit:'', meaning:'When the Earth element flows, the breath is steady and grounding. Favourable for stable, long-lasting work and important foundations.' },
  { verse:88,  topic:'Apas — Water',             sanskrit:'', meaning:'When Water flows, the breath is cool and moving. Auspicious for nourishing, creative and flowing activities.' },
  { verse:91,  topic:'Tejas — Fire',             sanskrit:'', meaning:'When Fire flows, the breath is sharp and hot. A destructive, transforming current — avoid new beginnings; good for cutting away.' },
  { verse:94,  topic:'Vayu — Air',               sanskrit:'', meaning:'When Air flows, the breath is light and mobile. Favourable for movement, travel, communication and quick exchanges.' },
  { verse:97,  topic:'Akasha — Ether',           sanskrit:'', meaning:'When Ether flows, the breath is subtle and vast. Worldly action bears little fruit now — best given to meditation and stillness.' },
  { verse:100, topic:'Recognising the Tattvas',  sanskrit:'', meaning:'The elements may be sensed by the breath\u2019s temperature, direction and texture, and by the colours seen in meditation.' },

  // ── Timing & the Moon ──
  { verse:108, topic:'The Breath at Sunrise',    sanskrit:'', meaning:'At dawn the dominant nostril sets the tone for the day. The tradition watches the breath especially at sunrise.' },
  { verse:111, topic:'Bright and Dark Fortnights', sanskrit:'', meaning:'In the waxing fortnight (Shukla) certain days begin with Ida; in the waning (Krishna), the pattern shifts. The moon governs the rhythm.' },
  { verse:114, topic:'The Lunar Days',           sanskrit:'', meaning:'Each tithi of the lunar month carries its own quality, favouring some actions and discouraging others.' },

  // ── Practice & predictions ──
  { verse:120, topic:'Victory and the Breath',   sanskrit:'', meaning:'Before any contest or important meeting, note your active breath; tradition gives guidance on which side favours success.' },
  { verse:123, topic:'The Breath in Travel',     sanskrit:'', meaning:'Stepping out with the favourable nostril and foot is said to smooth a journey. Pause if the breath warns against it.' },
  { verse:126, topic:'Changing the Breath',      sanskrit:'', meaning:'The flowing nostril can be changed deliberately — by lying on one side, by pressure, or by focused attention — to suit the task at hand.' },
  { verse:129, topic:'Breath and Decisions',     sanskrit:'', meaning:'Match the action to the current: gentle matters to the lunar breath, forceful matters to the solar, inner work to the central.' },
  { verse:132, topic:'Healing with Svara',       sanskrit:'', meaning:'Balancing the breath between the two nostrils is said to restore health and harmony to body and mind.' },
  { verse:138, topic:'Breath and Emotion',       sanskrit:'', meaning:'Agitation often rides the solar breath; calm rides the lunar. Shift the breath and the mood may follow.' },

  // ── Higher aim ──
  { verse:150, topic:'Balancing the Currents',   sanskrit:'', meaning:'When Ida and Pingala are balanced, Sushumna awakens and the breath becomes a ladder to deeper states.' },
  { verse:165, topic:'Breath and Consciousness', sanskrit:'', meaning:'The subtle act of breathing influences the level of awareness. To refine the breath is to refine the mind.' },
  { verse:180, topic:'The Inner Sun and Moon',   sanskrit:'', meaning:'Pingala is the inner sun, Ida the inner moon. Their union in the central channel is the aim of the yogi.' },
  { verse:200, topic:'Prana and the Universe',   sanskrit:'', meaning:'The same prana that moves the breath moves the stars. The microcosm of the body mirrors the macrocosm.' },
  { verse:250, topic:'Steadiness of Breath',     sanskrit:'', meaning:'As the breath grows slow and even, the restless mind settles and clarity dawns.' },
  { verse:300, topic:'The Witness',              sanskrit:'', meaning:'Beyond the moving breath is the unmoving witness. Watch the breath long enough and you glimpse that stillness.' },
  { verse:360, topic:'Living by the Breath',     sanskrit:'', meaning:'To live attuned to the svara is to move with the cosmic rhythm rather than against it — the heart of this science.' },
  { verse:395, topic:'The Teaching Concludes',   sanskrit:'', meaning:'Shiva ends by reminding Parvati that this knowledge bears fruit only through practice — observe your own breath, and the truth reveals itself.' },
];

const LUNAR_DAYS = [
  {day:1,  nadi:'ida',     name:'Pratipada',  emoji:'🌑',  meaning:'Beginning · new intention', desc:'The first sliver of moon. A day to plant seeds of intention and gently begin new cycles. Energy is subtle but pure — best used for setting direction, not for force.', favor:['Plant intentions','Begin new study','Light cleansing'], avoid:['Heavy work','Travel','Major decisions']},
  {day:2,  nadi:'ida',     name:'Dwitiya',    emoji:'🌒',  meaning:'Growth · gentle expansion', desc:'Lunar energy expands gently. Excellent for nurturing what was started yesterday — relationships, learning, food. Avoid harsh exchanges; the day is soft and impressionable.', favor:['Build relationships','Learn skills','Cook & nourish'], avoid:['Conflict','Long journeys']},
  {day:3,  nadi:'ida',     name:'Tritiya',    emoji:'🌒',  meaning:'Auspicious · sacred work', desc:'One of the most blessed tithis for spiritual and sacred work. Marriages, sacred ceremonies, music, and devotion all flourish. Avoid surgery, conflict and harsh speech.', favor:['Sacred art','Music','Spiritual study','Marriage rites'], avoid:['Surgery','Disputes']},
  {day:4,  nadi:'pingala', name:'Chaturthi',  emoji:'🌓',  meaning:'Obstacle · honor Ganesha', desc:'Sacred to Ganesha, remover of obstacles. Inner work and worship of Ganesha clear blockages, but launching new external projects today often meets resistance. Look inward.', favor:['Remove obstacles','Worship Ganesha','Inner work'], avoid:['Major launches','Travel south']},
  {day:5,  nadi:'pingala', name:'Panchami',   emoji:'🌓',  meaning:'Wisdom · serpent power', desc:'Sacred to the Nagas (serpent forces) and to learning. A day for mantras, sacred study, and awakening kundalini-like energies. Avoid surgery, especially on snakes or skin.', favor:['Knowledge work','Mantras','Snake/Naga worship'], avoid:['Surgery on snakes/skin','Underground work']},
  {day:6,  nadi:'pingala', name:'Shashthi',   emoji:'🌔',  meaning:'Skanda · warrior energy', desc:'Sacred to Skanda/Kartikeya, the celestial warrior. Strong day for courage, physical training, healing, and protective rituals. Travel and risky ventures are less favored.', favor:['Courage tasks','Physical training','Health work'], avoid:['Travel','Risky ventures']},
  {day:7,  nadi:'ida',     name:'Saptami',    emoji:'🌔',  meaning:'Sun-blessed · clear light', desc:'Solar-blessed day with clarity and bright energy. Excellent for health work, solar practices, and any endeavor done openly. Hidden or shadowy work meets exposure.', favor:['Health rituals','Solar mantras','Bright endeavors'], avoid:['Dark deeds','Hidden plans']},
  {day:8,  nadi:'ida',     name:'Ashtami',    emoji:'🌔',  meaning:'Power · Durga energy', desc:'Sacred to Durga, the fierce protective Mother. A day of inner power. Spiritual practice and inner battles are favored; worldly business and travel are less so.', favor:['Worship','Spiritual practice','Inner battles'], avoid:['Worldly business','Travel']},
  {day:9,  nadi:'ida',     name:'Navami',     emoji:'🌕',  meaning:'Fierce · transformative', desc:'Highly transformative tithi. Deep sadhana, letting go of old patterns, and goddess worship are powerful. Avoid worldly pleasures, light socializing and journeys today.', favor:['Deep sadhana','Letting go','Goddess worship'], avoid:['Pleasures','Light socializing','Travel']},
  {day:10, nadi:'pingala', name:'Dashami',    emoji:'🌕',  meaning:'Victory · success energy', desc:'Tithi of victory and momentum. Strong support for achievement, travel north or east, and large decisions. Procrastination and self-doubt weigh more heavily today.', favor:['Travel north/east','Big decisions','Achievement'], avoid:['Defeatist thinking','Procrastination']},
  {day:11, nadi:'pingala', name:'Ekadashi',   emoji:'🌕',  meaning:'Sacred fast · purification', desc:'The most sacred fasting day in Hindu tradition. Vishnu mantras, fasting (especially from grains), meditation and yoga purify deeply. Avoid heavy food and excess speech.', favor:['Fast & meditate','Vishnu mantras','Yoga'], avoid:['Heavy food','Grains','Excess speech']},
  {day:12, nadi:'pingala', name:'Dwadashi',   emoji:'🌖',  meaning:'Renewal · break fast', desc:'The day to gently break the Ekadashi fast and reset. Charity, service, and soft eating bring blessings. Anger, greed, and conflict undo the purification gained yesterday.', favor:['Charity','Gentle eating','Service'], avoid:['Anger','Greed','Conflict']},
  {day:13, nadi:'ida',     name:'Trayodashi', emoji:'🌖',  meaning:'Auspicious · attractive', desc:'A beautiful, harmonious day. Beauty, art, diplomacy, romance, and gentle negotiation flow naturally. Crude speech and aggressive deal-making clash with the energy.', favor:['Beauty work','Arts','Diplomacy','Romance'], avoid:['Crude speech','Aggressive deals']},
  {day:14, nadi:'ida',     name:'Chaturdashi',emoji:'🌗',  meaning:'Fierce · Shiva energy', desc:'Sacred to Shiva in his fierce form. Deep tantric practice, inner alchemy, and Shiva worship are powerful. Avoid travel, celebrations, and worldly ventures today.', favor:['Tantric practice','Inner work','Shiva worship'], avoid:['Travel','Worldly ventures','Celebrations']},
  {day:15, nadi:'pingala', name:'Purnima/Amavasya', emoji:'🌕', meaning:'Full/New Moon · turning point', desc:'The peak of the half-cycle (Full Moon in Shukla, New Moon in Krishna). A turning point — pause, meditate, reflect, give charity. Major undertakings and heavy meals work against this stillness.', favor:['Meditation','Ritual','Reflection','Charity'], avoid:['Major undertakings','Aggressive action','Heavy meals']},
];

// ── RECOMMENDATIONS MATRIX (Nadi × Tattva = 15 combinations) ──────────────────
const RECOMMENDATIONS = {
  // IDA = cooling, lunar, feminine, peaceful
  ida_prithvi:  { mood:'Most auspicious — peaceful & grounded', favor:['Long-term planning','Meditation, study, prayer','Healing & rest','Planting, building, slow work'], avoid:['Hasty decisions','Travel south or west'] },
  ida_apas:     { mood:'Highly auspicious — flowing & creative', favor:['Romance & affection','Healing arts & medicine','Writing, music, art','Drinking water, cleansing'], avoid:['Conflict & arguments','Burning bridges'] },
  ida_tejas:    { mood:'Mixed — gentle channel, intense fire', favor:['Reading sacred texts','Light cooking','Brief, focused tasks'], avoid:['Starting new ventures','Surgery, intense exertion','Lengthy arguments'] },
  ida_vayu:     { mood:'Restless — calm channel, moving fire', favor:['Walking gently','Light correspondence','Adjusting plans'], avoid:['Important travel','Long meetings','Financial commitments'] },
  ida_akasha:   { mood:'Sacred — transcendent stillness', favor:['Deep meditation','Mantra & japa','Stillness, prayer','Contemplation of death/liberation'], avoid:['ANY worldly task','Business, conflict, food'] },

  // PINGALA = warming, solar, masculine, active
  pingala_prithvi: { mood:'Strong & stable — grounded power', favor:['Heavy physical work','Construction, agriculture','Endurance training','Defending boundaries'], avoid:['Subtle/delicate work','Emotional conversations'] },
  pingala_apas:    { mood:'Mixed — active channel, soft element', favor:['Cooking, eating, hydration','Brief social gatherings','Athletic recovery'], avoid:['Prolonged debate','Aggressive negotiation'] },
  pingala_tejas:   { mood:'Peak intensity — fierce courage', favor:['Bold decisions & action','Physical contests','Confrontation if needed','Surgery, fire ceremonies'], avoid:['Gentle conversations','Sensitive matters','Romance'] },
  pingala_vayu:    { mood:'Dynamic — movement & speed', favor:['Travel & journeys','Sports, running','Quick negotiations','Sales & deals'], avoid:['Sitting meditation','Slow detailed work','Important contracts'] },
  pingala_akasha:  { mood:'Sacred — power meets stillness', favor:['Brief, powerful prayer','Strong intention setting','Letting go'], avoid:['Starting anything new','Major decisions','Travel'] },

  // SUSHUMNA = balanced, sacred, RARE
  sushumna_prithvi: { mood:'★ Rare gift — sit immediately', favor:['Meditation, japa, prayer','Total silence','Inner contemplation'], avoid:['ALL worldly activity'] },
  sushumna_apas:    { mood:'★ Rare gift — sit immediately', favor:['Meditation, japa, prayer','Devotional song','Inner flow'], avoid:['ALL worldly activity'] },
  sushumna_tejas:   { mood:'★ Rare gift — sit immediately', favor:['Meditation, japa, prayer','Burning karma in silence'], avoid:['ALL worldly activity'] },
  sushumna_vayu:    { mood:'★ Rare gift — sit immediately', favor:['Meditation, japa, prayer','Watching breath, watching mind'], avoid:['ALL worldly activity'] },
  sushumna_akasha:  { mood:'★★ Most sacred moment in the day', favor:['Deepest meditation','Surrender, devotion','Ask for liberation'], avoid:['Speaking, eating, anything outer'] },
};

// ── UTILS ─────────────────────────────────────────────────────────────────────
function calcSunrise(lat, lng, date = new Date()) {
  const times = SunCalc.getTimes(date, lat, lng);
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
// Logo + page subtitle + current time, shown on every screen.
function AppHeader({ subtitle }) {
  const [timeStr, setTimeStr] = useState(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  });
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setTimeStr(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
    }, 10000);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={hd.header}>
      <Image source={require('./assets/logo-header.png')} style={hd.logoHeader} resizeMode="contain"/>
      <View style={hd.headerRow}>
        <Text style={hd.subtitle}>{subtitle}</Text>
        <Text style={hd.timeLabel}>{timeStr}</Text>
      </View>
    </View>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomeScreen({ config, isGhatika, manualSvara }) {
  const { sunriseMin, sunriseStr, sunsetStr, locationMode, sunriseMode } = config;
  const lunar = getLunarDay();
  const [autoSvara,    setAutoSvara]    = useState(() => getSvaraFromSunrise(sunriseMin, lunar.day, lunar.paksha));
  const [activeTattva, setActiveTattva] = useState(() => getTattvaFromSunrise(sunriseMin, isGhatika));
  const [progress,     setProgress]     = useState(() => getTattvaProgress(sunriseMin, isGhatika, getTattvaFromSunrise(sunriseMin, isGhatika)));
  const [nextNadi,     setNextNadi]     = useState(() => getNextNadiChange(sunriseMin, lunar.day));
  const [now,          setNow]          = useState(new Date());

  useEffect(() => {
    const tick = () => {
      const l = getLunarDay();
      const t = getTattvaFromSunrise(sunriseMin, isGhatika);
      setAutoSvara(getSvaraFromSunrise(sunriseMin, l.day, l.paksha));
      setActiveTattva(t);
      setProgress(getTattvaProgress(sunriseMin, isGhatika, t));
      setNextNadi(getNextNadiChange(sunriseMin, l.day));
      setNow(new Date());
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [sunriseMin, isGhatika]);

  const svara = manualSvara || autoSvara;
  const seq = isGhatika ? TATTVAS_GHATIKA : TATTVAS_CLASSIC;
  const nextTattva = seq[(seq.findIndex(t=>t.id===activeTattva.id)+1) % seq.length];

  const SVARA_META = {
    ida:      { name:'Ida Nadi',     tag:'🌙 Lunar · Cooling · Feminine'  },
    pingala:  { name:'Pingala Nadi', tag:'☀️ Solar · Warming · Masculine' },
    sushumna: { name:'Sushumna',     tag:'🔥 Central · Sacred · Rare'     },
  };
  const sm = SVARA_META[svara];
  const srcLabel = locationMode==='gps' ? '📡 GPS' : locationMode==='manual' ? '✏️ Manual' : '⚙️ Default';

  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      <AppHeader subtitle={`${lunar.paksha==='shukla'?'🌒 Shukla':'🌘 Krishna'} · ${(LUNAR_DAYS.find(d=>d.day===lunar.day)||{}).name || ('Day '+lunar.day)}`}/>

      <View style={hd.sunBig}>
        <View style={hd.sunItem}>
          <Text style={hd.sunIcon}>🌅</Text>
          <Text style={hd.sunTime}>{sunriseStr}</Text>
          <Text style={hd.sunLabelBig}>Sunrise</Text>
        </View>
        <View style={hd.sunDivider}/>
        <View style={hd.sunItem}>
          <Text style={hd.sunIcon}>🌇</Text>
          <Text style={hd.sunTime}>{sunsetStr}</Text>
          <Text style={hd.sunLabelBig}>Sunset</Text>
        </View>
      </View>
      <Text style={hd.srcLabel}>{srcLabel} · {isGhatika?'Ghatika':'Classic'} system</Text>

      <View style={s.svaraCard}>
        <Text style={s.svaraLabel}>{manualSvara?'Active Now (Manual)':'Active Svara'}</Text>
        <Text style={s.svaraName}>{sm.name}</Text>
        <View style={s.badge}><Text style={s.badgeText}>{sm.tag}</Text></View>
        <Text style={s.nextNadiText}>
          Next: {SVARA_META[nextNadi.nextNadi].name.replace(' Nadi','')} in {formatDuration(nextNadi.minutesUntil)}
        </Text>
      </View>

      {manualSvara && manualSvara !== autoSvara && (
        <View style={s.compareCard}>
          <View style={s.compareItem}>
            <Text style={s.compareLabel}>📜 By Sunrise</Text>
            <Text style={s.compareValue}>{SVARA_META[autoSvara].name}</Text>
          </View>
          <Text style={s.compareArrow}>vs</Text>
          <View style={s.compareItem}>
            <Text style={s.compareLabel}>👃 You Feel</Text>
            <Text style={[s.compareValue,{color:C.gold}]}>{sm.name}</Text>
          </View>
        </View>
      )}
      {manualSvara && manualSvara === autoSvara && (
        <View style={[s.compareCard,{borderColor:C.green,backgroundColor:C.greenBg}]}>
          <Text style={[s.compareLabel,{color:C.green,fontSize:14}]}>✓ Match — your breath aligns with the sunrise calculation</Text>
        </View>
      )}

      <View style={s.tattvaRow}>
        {seq.map(t=>(
          <View key={t.id} style={[s.tattvaPill, activeTattva.id===t.id && s.tattvaPillActive]}>
            <Text style={s.tattvaIcon}>{t.emoji}</Text>
            <Text style={[s.tattvaName, activeTattva.id===t.id&&{color:C.gold}]}>{t.name}</Text>
            {activeTattva.id===t.id && <Text style={{fontSize:11,color:C.gold,marginTop:3,fontWeight:'500'}}>{progress.remaining}m</Text>}
          </View>
        ))}
      </View>

      <View style={[td.card,{borderColor:activeTattva.color}]}>
        <View style={td.topRow}>
          <View style={[td.colorDot,{backgroundColor:activeTattva.color}]}/>
          <View style={{flex:1}}>
            <Text style={td.name}>{activeTattva.emoji}  {activeTattva.name}</Text>
            <Text style={td.chakra}>{activeTattva.chakra}</Text>
          </View>
          <View style={td.symbolBox}><Text style={[td.symbol,{color:activeTattva.color}]}>{activeTattva.symbol}</Text></View>
        </View>
        <View style={td.divider}/>
        <View style={td.infoRow}>
          <View style={td.infoItem}><Text style={td.infoLabel}>Sense</Text><Text style={[td.infoVal,{color:activeTattva.color}]}>{activeTattva.sense}</Text></View>
          <View style={td.infoItem}><Text style={td.infoLabel}>Duration</Text><Text style={[td.infoVal,{color:activeTattva.color}]}>{isGhatika?activeTattva.ghatika:activeTattva.classic} min</Text></View>
          <View style={td.infoItem}><Text style={td.infoLabel}>Remaining</Text><Text style={[td.infoVal,{color:activeTattva.color}]}>{progress.remaining} min</Text></View>
        </View>
        <View style={{height:6,backgroundColor:'#2a1040',borderRadius:3,overflow:'hidden',marginTop:12}}>
          <View style={{height:6,width:`${progress.percent}%`,backgroundColor:activeTattva.color,borderRadius:3}}/>
        </View>
        <Text style={td.desc}>{activeTattva.description}</Text>
        <Text style={{fontSize:12,color:C.faint,marginTop:8}}>Next → {nextTattva.emoji} {nextTattva.name}</Text>
      </View>

      <View style={s.moodCard}>
        <Text style={s.moodLabel}>{sm.name.split(' ')[0]} + {activeTattva.name}</Text>
        <Text style={s.moodText}>{(RECOMMENDATIONS[svara+'_'+activeTattva.id]||{}).mood||'Observing the moment'}</Text>
      </View>

      <View style={s.ddRow}>
        <View style={[s.ddBox,{backgroundColor:C.greenBg,borderColor:C.greenBorder}]}>
          <Text style={[s.ddHeader,{color:C.green}]}>✓  Favorable</Text>
          {((RECOMMENDATIONS[svara+'_'+activeTattva.id]||{}).favor||["Calm, peaceful activities","Learning & reflection","Healing & rest"]).map((d,i)=>
            <View key={i} style={s.ddItem}><View style={[s.ddDot,{backgroundColor:C.green}]}/><Text style={[s.ddText,{color:'#5ac090'}]}>{d}</Text></View>
          )}
        </View>
        <View style={[s.ddBox,{backgroundColor:C.redBg,borderColor:C.redBorder}]}>
          <Text style={[s.ddHeader,{color:C.red}]}>✕  Avoid</Text>
          {((RECOMMENDATIONS[svara+'_'+activeTattva.id]||{}).avoid||["Conflict & arguments","Heavy exertion","Major decisions"]).map((d,i)=>
            <View key={i} style={s.ddItem}><View style={[s.ddDot,{backgroundColor:C.red}]}/><Text style={[s.ddText,{color:'#c06060'}]}>{d}</Text></View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// ── SVARA ─────────────────────────────────────────────────────────────────────
function SvaraScreen({ picked, setPicked }) {
  const RESULTS = {
    ida:      { title:'Ida Nadi — Left Nostril active',    body:'The lunar, cooling channel flows. Ideal for peaceful, creative, and social activities.' },
    pingala:  { title:'Pingala Nadi — Right Nostril active', body:'The solar, warming channel flows. Energy and willpower heightened. Ideal for physical work and business.' },
    sushumna: { title:'Sushumna — Both nostrils equal',    body:'This rare sacred state occurs at nadi transitions. Sit immediately for meditation or mantra japa.' },
  };
  const toggle = (id) => setPicked(picked === id ? null : id);
  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      <AppHeader subtitle="Svara Identifier"/>
      <View style={s.card}>
        {[{n:1,t:'Close your right nostril. Breathe in gently through the left.'},{n:2,t:'Close your left nostril. Breathe in through the right.'},{n:3,t:'Notice which side flows more freely and smoothly.'},{n:4,t:'Hold your wrist under each nostril — feel the breath warmth.'}].map(st=>
          <Text key={st.n} style={s.step}><Text style={{color:C.gold,fontWeight:'bold'}}>Step {st.n}:  </Text>{st.t}</Text>
        )}
      </View>
      <View style={s.btnRow}>
        {[{id:'ida',label:'Left (Ida)',icon:'🌙'},{id:'pingala',label:'Right (Pingala)',icon:'☀️'},{id:'sushumna',label:'Both equal',icon:'🔥'}].map(b=>(
          <TouchableOpacity key={b.id} style={[s.svaraBtn,picked===b.id&&s.svaraBtnActive]} onPress={()=>toggle(b.id)}>
            <Text style={s.svaraBtnIcon}>{b.icon}</Text>
            <Text style={[s.svaraBtnLabel,picked===b.id&&{color:C.gold}]}>{b.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {picked&&<View style={s.resultBox}><Text style={s.resultTitle}>{RESULTS[picked].title}</Text><Text style={s.resultBody}>{RESULTS[picked].body}</Text><Text style={[s.resultBody,{marginTop:8,fontStyle:'italic',color:C.gold}]}>✓ Active on Home screen (tap again to clear)</Text></View>}
    </ScrollView>
  );
}

// ── LUNAR ─────────────────────────────────────────────────────────────────────
function LunarScreen() {
  const { day, paksha } = getLunarDay();
  const [selectedDay, setSelectedDay] = useState(day);

  const detail   = LUNAR_DAYS.find(x => x.day === selectedDay) || LUNAR_DAYS[0];
  const nextDay  = (selectedDay % 15) + 1;
  const nextDetail = LUNAR_DAYS.find(x => x.day === nextDay) || LUNAR_DAYS[0];

  const renderCard = (d, label, isToday) => (
    <View style={[s.card,{borderColor:d.nadi==='ida'?'#2a4a7a':'#6a3a1a',borderWidth:1}]}>
      <Text style={{fontSize:12,color:C.muted,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>{label}</Text>
      <Text style={{fontSize:20,color:C.gold,fontWeight:'500',marginBottom:4}}>{d.emoji}  {d.name}</Text>
      <Text style={{fontSize:14,color:d.nadi==='ida'?C.blue:C.orange,marginBottom:10,fontStyle:'italic'}}>{d.meaning}</Text>
      {d.desc && <Text style={{fontSize:13,color:'#a08ab0',lineHeight:20,marginBottom:10}}>{d.desc}</Text>}
      <Text style={{fontSize:13,color:C.muted,marginBottom:10}}>{d.nadi==='ida'?'🌙 Ida Nadi dominates · cool, lunar energy':'☀️ Pingala Nadi dominates · warm, solar energy'}</Text>
      <View style={{flexDirection:'row',gap:10}}>
        <View style={[s.lunarDDBox,{backgroundColor:C.greenBg,borderColor:C.greenBorder}]}>
          <Text style={{fontSize:11,color:C.green,fontWeight:'500',marginBottom:4}}>✓ FAVOR</Text>
          {d.favor.map((x,i)=><Text key={i} style={{fontSize:12,color:'#7ac0a0',lineHeight:18}}>• {x}</Text>)}
        </View>
        <View style={[s.lunarDDBox,{backgroundColor:C.redBg,borderColor:C.redBorder}]}>
          <Text style={{fontSize:11,color:C.red,fontWeight:'500',marginBottom:4}}>✕ AVOID</Text>
          {d.avoid.map((x,i)=><Text key={i} style={{fontSize:12,color:'#c08080',lineHeight:18}}>• {x}</Text>)}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      <AppHeader subtitle="Lunar Cycle Guide"/>

      <View style={s.card}>
        <View style={{flexDirection:'row',gap:14,marginBottom:10}}>
          <Text style={{fontSize:12,color:C.blue}}>🔵 Ida</Text>
          <Text style={{fontSize:12,color:C.orange}}>🟠 Pingala</Text>
          <Text style={{fontSize:12,color:C.gold,marginLeft:'auto'}}>● Today: {paksha==='shukla'?'Shukla':'Krishna'} {day}</Text>
        </View>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:5}}>
          {LUNAR_DAYS.map(d=>(
            <TouchableOpacity
              key={d.day}
              onPress={()=>setSelectedDay(d.day)}
              style={[
                s.dayCell,
                d.nadi==='ida'?{backgroundColor:C.blueBg,borderColor:'#2a4a7a'}:{backgroundColor:C.orangeBg,borderColor:'#6a3a1a'},
                d.day===day&&{borderWidth:2,borderColor:C.gold},
                d.day===selectedDay&&d.day!==day&&{borderWidth:2,borderColor:C.goldLight},
              ]}>
              <Text style={{fontSize:13,fontWeight:'500',color:d.nadi==='ida'?C.blue:C.orange}}>{d.day}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {renderCard(detail, selectedDay===day ? '● Selected · Today' : '● Selected · Day '+selectedDay, selectedDay===day)}
      {renderCard(nextDetail, '▶ Next · Day '+nextDay, false)}
    </ScrollView>
  );
}

// ── SHLOKAS ───────────────────────────────────────────────────────────────────
function ShlokasScreen() {
  const [expanded, setExpanded] = useState(null);
  // Pick verse of the day: rotate based on day of year
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  const verseOfDay = SHLOKAS[dayOfYear % SHLOKAS.length];
  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      <AppHeader subtitle="Shlokas & Teachings"/>
      <View style={{padding:14}}>
        <View style={[s.shlokaCard,{borderColor:C.gold,borderWidth:1,backgroundColor:C.purple}]}>
          <Text style={{fontSize:11,color:C.gold,textTransform:'uppercase',letterSpacing:1.5,marginBottom:8}}>★ Verse of the Day</Text>
          <Text style={{fontSize:13,color:C.muted,marginBottom:6}}>Verse {verseOfDay.verse} · {verseOfDay.topic}</Text>
          <Text style={{fontSize:16,color:C.gold,fontStyle:'italic',lineHeight:26}}>{verseOfDay.meaning}</Text>
        </View>
        {SHLOKAS.map(sh=>(
          <TouchableOpacity key={sh.verse} style={s.shlokaCard} onPress={()=>setExpanded(expanded===sh.verse?null:sh.verse)}>
            <Text style={{fontSize:12,color:C.faint,marginBottom:4}}>Sutra ~{sh.verse}</Text>
            <Text style={{fontSize:15,color:C.gold,fontWeight:'500',marginBottom:6}}>{sh.topic}</Text>
            {sh.sanskrit?<Text style={{fontSize:15,color:C.goldLight,marginBottom:6}}>{sh.sanskrit}</Text>:null}
            {expanded===sh.verse&&<Text style={{fontSize:14,color:'#a08ab0',lineHeight:22,marginBottom:8}}>{sh.meaning}</Text>}
            <Text style={{fontSize:12,color:C.faint}}>{expanded===sh.verse?'▲ collapse':'▼ tap to read meaning'}</Text>
          </TouchableOpacity>
        ))}

        <View style={[s.shlokaCard,{borderColor:C.border,borderWidth:0.5,marginTop:4}]}>
          <Text style={{fontSize:11,color:C.gold,textTransform:'uppercase',letterSpacing:1.5,marginBottom:8}}>📖 Source</Text>
          <Text style={{fontSize:13,color:'#a08ab0',lineHeight:20,marginBottom:10}}>
            These teachings are paraphrased in our own words from the Shiva Svarodaya tradition. The complete original Sanskrit text (395 sutras) with full English translation is published in:
          </Text>
          <Text style={{fontSize:14,color:C.gold,fontWeight:'500',marginBottom:2}}>Swara Yoga: The Tantric Science of Brain Breathing</Text>
          <Text style={{fontSize:13,color:C.muted,marginBottom:2}}>Swami Muktibodhananda</Text>
          <Text style={{fontSize:13,color:C.muted,marginBottom:12}}>Bihar School of Yoga · Yoga Publications Trust</Text>
          <TouchableOpacity onPress={()=>Linking.openURL('https://www.biharyoga.net')} style={{backgroundColor:C.purple,borderWidth:0.5,borderColor:C.gold,borderRadius:10,paddingVertical:10,alignItems:'center'}}>
            <Text style={{fontSize:13,color:C.gold,fontWeight:'500'}}>🔗  biharyoga.net</Text>
          </TouchableOpacity>
          <Text style={{fontSize:11,color:C.faint,marginTop:10,fontStyle:'italic'}}>Svara (also spelled Swara) — both are valid transliterations of the Sanskrit स्वर.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsScreen({ config, setConfig, isGhatika, setIsGhatika }) {
  // Mode = 'auto' (GPS on every app open) | 'gps-once' (GPS now, fixed) | 'manual' (typed)
  const [mode,    setMode]    = useState(config.locationMode === 'auto' ? 'auto' : config.locationMode === 'gps' ? 'gps-once' : 'manual');
  const [city,    setCity]    = useState(config.city);
  const [lat,     setLat]     = useState(String(config.lat));
  const [lng,     setLng]     = useState(String(config.lng));
  const [srH,     setSrH]     = useState(String(config.srH).padStart(2,'0'));
  const [srM,     setSrM]     = useState(String(config.srM).padStart(2,'0'));
  const [ssH,     setSsH]     = useState(String(config.ssH).padStart(2,'0'));
  const [ssM,     setSsM]     = useState(String(config.ssM).padStart(2,'0'));
  const [useManualTime, setUseManualTime] = useState(config.sunriseMode === 'manual');
  const [notifs,  setNotifs]  = useState(config.notifs || {nadi:true,tattva:true});
  const [gpsLoad, setGpsLoad] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const toggleNotif = k => setNotifs(n=>({...n,[k]:!n[k]}));
  const ghSeq = isGhatika ? TATTVAS_GHATIKA : TATTVAS_CLASSIC;

  const fetchGPS = async () => {
    setGpsLoad(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsLoad(false);
        Alert.alert('Permission denied','Please enable location for Svara Yoga in your phone settings.');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const latN = loc.coords.latitude;
      const lngN = loc.coords.longitude;
      let newCity = 'Current Location';
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude: latN, longitude: lngN });
        if (geo && geo.length > 0) {
          newCity = geo[0].city || geo[0].district || geo[0].region || 'Current Location';
        }
      } catch(e) {}
      setLat(latN.toFixed(4));
      setLng(lngN.toFixed(4));
      setCity(newCity);
      setGpsLoad(false);
      return { latN, lngN, newCity };
    } catch(e) {
      setGpsLoad(false);
      Alert.alert('GPS Error', e.message||'Could not get location');
      return null;
    }
  };

  const handleApply = async () => {
    // Use whatever lat/lng/city are currently in the input state — these were
    // already set by the GPS card on selection or by user typing. NO GPS re-fetch
    // here; that's what makes Apply instant.
    const latN = parseFloat(lat) || config.lat;
    const lngN = parseFloat(lng) || config.lng;
    const cityName = city || 'Current Location';

    let sunriseMin, sunsetMin, sunriseStr, sunsetStr;
    if (useManualTime) {
      sunriseMin = parseInt(srH)*60+parseInt(srM);
      sunsetMin  = parseInt(ssH)*60+parseInt(ssM);
      sunriseStr = `${srH}:${srM}`; sunsetStr = `${ssH}:${ssM}`;
    } else {
      const calc = calcSunrise(latN,lngN);
      sunriseMin=calc.sunriseMin; sunsetMin=calc.sunsetMin;
      sunriseStr=calc.sunriseStr; sunsetStr=calc.sunsetStr;
    }
    const newConfig = {
      city:cityName, lat:latN, lng:lngN,
      srH:parseInt(srH), srM:parseInt(srM), ssH:parseInt(ssH), ssM:parseInt(ssM),
      sunriseMin, sunsetMin, sunriseStr, sunsetStr,
      locationMode: mode === 'auto' ? 'auto' : mode === 'gps-once' ? 'gps' : 'manual',
      sunriseMode: useManualTime ? 'manual' : 'auto',
      notifs,
    };
    setConfig(newConfig);
    setSaved(true);
    setTimeout(()=>setSaved(false),2500);
    // Persist in background (don't await — UI updates immediately)
    (async () => {
      try {
        const existing = await AsyncStorage.getItem('appConfig');
        const merged = { ...(existing ? JSON.parse(existing) : {}), ...newConfig };
        await AsyncStorage.setItem('appConfig', JSON.stringify(merged));
      } catch(e) {}
    })();
  };

  const ModeCard = ({id, icon, title, subtitle, children}) => {
    const active = mode === id;
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={()=>setMode(id)} style={[ss.modeCard, active && ss.modeCardActive]}>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <View style={[ss.modeRadio, active && ss.modeRadioActive]}>{active && <View style={ss.modeRadioInner}/>}</View>
          <Text style={ss.modeCardIcon}>{icon}</Text>
          <View style={{flex:1}}>
            <Text style={[ss.modeCardTitle, active && {color:C.gold}]}>{title}</Text>
            <Text style={ss.modeCardSub}>{subtitle}</Text>
          </View>
        </View>
        {active && children && <View style={ss.modeCardBody}>{children}</View>}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      <AppHeader subtitle="Settings"/>
      <View style={{padding:14,gap:14}}>

        <Text style={s.sectionLabel}>📍  Location</Text>
        <View style={s.settingCard}>
          <View style={ss.tabRow}>
            <TouchableOpacity onPress={()=>setMode('auto')} style={[ss.tabBtn, (mode==='auto'||mode==='gps-once') && ss.tabBtnActive]}>
              <Text style={[ss.tabBtnText, (mode==='auto'||mode==='gps-once') && {color:C.gold}]}>🌐  Auto</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setMode('manual')} style={[ss.tabBtn, mode==='manual' && ss.tabBtnActive]}>
              <Text style={[ss.tabBtnText, mode==='manual' && {color:C.gold}]}>✏️  Manual</Text>
            </TouchableOpacity>
          </View>
          <View style={ss.tabBody}>
            {(mode==='auto' || mode==='gps-once') && (
              <>
                {gpsLoad
                  ? <Text style={ss.modeStatus}>📡 Detecting location...</Text>
                  : <>
                      <Text style={ss.modeStatus}>📍 {city}</Text>
                      <Text style={ss.modeCoords}>{lat}°, {lng}°</Text>
                    </>
                }
                <TouchableOpacity disabled={gpsLoad} onPress={fetchGPS} style={[ss.modeBtnInline,{marginTop:10}]}>
                  <Text style={{color:C.gold,fontSize:14,fontWeight:'500'}}>{gpsLoad?'📡 Detecting…':'📡  Refresh GPS now'}</Text>
                </TouchableOpacity>
              </>
            )}
            {mode==='manual' && (
              <>
                <View style={ss.manualRow}>
                  <Text style={ss.manualLabel}>City</Text>
                  <TextInput style={ss.input} value={city} onChangeText={setCity} placeholderTextColor={C.faint}/>
                </View>
                <View style={ss.manualRow}>
                  <Text style={ss.manualLabel}>Latitude</Text>
                  <TextInput style={ss.input} value={lat} onChangeText={setLat} keyboardType="numeric" placeholderTextColor={C.faint}/>
                </View>
                <View style={ss.manualRow}>
                  <Text style={ss.manualLabel}>Longitude</Text>
                  <TextInput style={ss.input} value={lng} onChangeText={setLng} keyboardType="numeric" placeholderTextColor={C.faint}/>
                </View>
              </>
            )}
          </View>
        </View>

        <Text style={s.sectionLabel}>🌅  Sunrise Time</Text>
        <View style={s.settingCard}>
          <View style={ss.tabRow}>
            <TouchableOpacity onPress={()=>{
              setUseManualTime(false);
            }} style={[ss.tabBtn, !useManualTime && ss.tabBtnActive]}>
              <Text style={[ss.tabBtnText, !useManualTime && {color:C.gold}]}>🌐  Auto</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>{
              // When switching to Manual, prefill with current calculated values
              const latN = parseFloat(lat) || config.lat;
              const lngN = parseFloat(lng) || config.lng;
              const calc = calcSunrise(latN, lngN);
              const [srHh, srMm] = calc.sunriseStr.split(':');
              const [ssHh, ssMm] = calc.sunsetStr.split(':');
              setSrH(srHh); setSrM(srMm);
              setSsH(ssHh); setSsM(ssMm);
              setUseManualTime(true);
            }} style={[ss.tabBtn, useManualTime && ss.tabBtnActive]}>
              <Text style={[ss.tabBtnText, useManualTime && {color:C.gold}]}>⏰  Manual</Text>
            </TouchableOpacity>
          </View>
          <View style={ss.tabBody}>
            {!useManualTime && (
              <>
                <Text style={{fontSize:11,color:C.muted,marginBottom:4}}>Calculated from your location:</Text>
                <Text style={{fontSize:16,color:C.gold,fontWeight:'500'}}>🌅 {config.sunriseStr}  ·  🌇 {config.sunsetStr}</Text>
              </>
            )}
            {useManualTime && (
              <>
                <View style={ss.manualRow}>
                  <Text style={ss.manualLabel}>Sunrise</Text>
                  <View style={ss.timeRow}>
                    <TextInput style={[ss.input,ss.timePart]} value={srH} onChangeText={setSrH} keyboardType="numeric" maxLength={2}/>
                    <Text style={{color:C.gold,fontSize:16,fontWeight:'500'}}>:</Text>
                    <TextInput style={[ss.input,ss.timePart]} value={srM} onChangeText={setSrM} keyboardType="numeric" maxLength={2}/>
                  </View>
                </View>
                <View style={ss.manualRow}>
                  <Text style={ss.manualLabel}>Sunset</Text>
                  <View style={ss.timeRow}>
                    <TextInput style={[ss.input,ss.timePart]} value={ssH} onChangeText={setSsH} keyboardType="numeric" maxLength={2}/>
                    <Text style={{color:C.gold,fontSize:16,fontWeight:'500'}}>:</Text>
                    <TextInput style={[ss.input,ss.timePart]} value={ssM} onChangeText={setSsM} keyboardType="numeric" maxLength={2}/>
                  </View>
                </View>
                <TouchableOpacity onPress={() => {
                  const latN = parseFloat(lat) || config.lat;
                  const lngN = parseFloat(lng) || config.lng;
                  const calc = calcSunrise(latN, lngN);
                  const [srHh, srMm] = calc.sunriseStr.split(':');
                  const [ssHh, ssMm] = calc.sunsetStr.split(':');
                  setSrH(srHh); setSrM(srMm);
                  setSsH(ssHh); setSsM(ssMm);
                }} style={[ss.modeBtnInline,{marginTop:6}]}>
                  <Text style={{fontSize:13,color:C.gold,fontWeight:'500'}}>⤴  Reset to calculated ({config.sunriseStr})</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <Text style={s.sectionLabel}>⏱️  Tattva Duration System</Text>
        <View style={s.settingCard}>
          <View style={s.settingRow}>
            <View style={{flex:1}}>
              <Text style={s.settingTitle}>{isGhatika?'🕐 Ghatika System':'📜 Classic System'}</Text>
              <Text style={s.settingSub}>{isGhatika?'Akasha→Vayu→Tejas→Apas→Prithvi · 24 min each':'Prithvi 20 · Apas 16 · Tejas 12 · Vayu 8 · Akasha 4 min'}</Text>
            </View>
            <Switch value={isGhatika} onValueChange={setIsGhatika} trackColor={{false:'#3a1a5a',true:C.purple}} thumbColor={isGhatika?C.gold:'#6a4a8a'}/>
          </View>
          <View style={{padding:12,borderTopWidth:0.5,borderColor:'#3a1a5a'}}>
            {ghSeq.map(t=>(
              <View key={t.id} style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                <Text style={{fontSize:11,color:C.muted}}>{t.emoji}  {t.name}</Text>
                <Text style={{fontSize:11,color:t.color}}>{isGhatika?t.ghatika:t.classic} min</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={s.sectionLabel}>🔔  Notifications</Text>
        <View style={s.settingCard}>
          <View style={s.settingRow}>
            <View style={{flex:1}}>
              <Text style={s.settingTitle}>🌬  Nadi Changes</Text>
              <Text style={s.settingSub}>Alert when Ida, Pingala or Sushumna becomes active</Text>
            </View>
            <Switch value={notifs.nadi} onValueChange={()=>toggleNotif('nadi')} trackColor={{false:'#3a1a5a',true:C.purple}} thumbColor={notifs.nadi?C.gold:'#6a4a8a'}/>
          </View>
          <View style={[s.settingRow,{borderBottomWidth:0}]}>
            <View style={{flex:1}}>
              <Text style={s.settingTitle}>🪐  Tattva Changes</Text>
              <Text style={s.settingSub}>Alert when the active element shifts</Text>
            </View>
            <Switch value={notifs.tattva} onValueChange={()=>toggleNotif('tattva')} trackColor={{false:'#3a1a5a',true:C.purple}} thumbColor={notifs.tattva?C.gold:'#6a4a8a'}/>
          </View>
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={handleApply}>
          <Text style={{color:C.gold,fontSize:16,fontWeight:'500'}}>{saved?'✅  Applied!':'💾  Apply'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.saveBtn,{marginTop:10,backgroundColor:C.bgCard}]} onPress={async()=>{
          try {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
              const req = await Notifications.requestPermissionsAsync();
              if (req.status !== 'granted') {
                Alert.alert('Permission denied','Please enable notifications in your phone settings for Svara Yoga.');
                return;
              }
            }
            if (Platform.OS === 'android') {
              await Notifications.setNotificationChannelAsync('svara-transitions', {
                name: 'Svara Transitions',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#c9a96e',
                sound: 'default',
              });
            }
            await Notifications.scheduleNotificationAsync({
              identifier: 'svara-test',
              content:{
                title:'🕉️ Svara Yoga',
                body:'Test notification — notifications are working!',
                sound:true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                ...(Platform.OS === 'android' ? { channelId:'svara-transitions' } : {}),
              },
              trigger: null,
            });
            const all = await Notifications.getAllScheduledNotificationsAsync();
            const perm = await Notifications.getPermissionsAsync();
            Alert.alert(
              '✓ Test sent',
              `Permission: ${perm.status}\nScheduled count: ${all.length}\n\nCheck notification shade. If nothing appears, check:\n• Phone Settings → Apps → Svara Yoga → Notifications (allow all)\n• Battery → Unrestricted background`
            );
          } catch(e) {
            Alert.alert('Error',e.message||'Could not send notification');
          }
        }}>
          <Text style={{color:C.muted,fontSize:14}}>🔔  Send Test Notification</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── INNER APP ─────────────────────────────────────────────────────────────────
const DEFAULT_LAT = 25.3176, DEFAULT_LNG = 82.9739;

function InnerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isGhatika, setIsGhatika] = useState(true);
  const [manualSvara, setManualSvara] = useState(null);
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState(() => {
    const calc = calcSunrise(DEFAULT_LAT, DEFAULT_LNG);
    return {
      city:'Varanasi', lat:DEFAULT_LAT, lng:DEFAULT_LNG,
      srH:6, srM:12, ssH:18, ssM:34,
      sunriseMin:calc.sunriseMin, sunsetMin:calc.sunsetMin,
      sunriseStr:calc.sunriseStr, sunsetStr:calc.sunsetStr,
      locationMode:'default', sunriseMode:'auto',
      notifs:{ nadi:true, tattva:true },
    };
  });

  // Load saved config on app start.
  // Persistence model:
  //   AsyncStorage 'appConfig' holds the whole saved config object.
  //   On start: load this and apply it. Then:
  //   - If locationMode is 'auto', refresh GPS in background (and re-calc sunrise
  //     ONLY if sunriseMode is also 'auto'; if user has manual time we keep it)
  //   - If locationMode is 'gps' (gps-once) or 'manual', leave coordinates alone
  //   - Manual sunrise time always wins over auto-calc, regardless of location mode
  useEffect(() => {
    (async () => {
      let saved = null;
      try {
        const raw = await AsyncStorage.getItem('appConfig');
        if (raw) saved = JSON.parse(raw);
      } catch(e) {}

      if (saved && typeof saved === 'object') {
        // Apply everything from saved config
        setConfig(prev => ({ ...prev, ...saved }));
        if (typeof saved.isGhatika === 'boolean') setIsGhatika(saved.isGhatika);
      }

      const mode = saved?.locationMode || 'auto';
      const srMode = saved?.sunriseMode || 'auto';

      // If location mode is 'auto', refresh GPS in background
      if (mode === 'auto') {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const latN = loc.coords.latitude;
            const lngN = loc.coords.longitude;
            let cityName = 'Current Location';
            try {
              const geo = await Location.reverseGeocodeAsync({ latitude: latN, longitude: lngN });
              if (geo && geo.length > 0) {
                cityName = geo[0].city || geo[0].district || geo[0].region || 'Current Location';
              }
            } catch(e) {}
            setConfig(prev => {
              const next = { ...prev, city: cityName, lat: latN, lng: lngN, locationMode: 'auto' };
              // Only update sunrise/sunset if user wants auto-calculated times
              if (srMode === 'auto') {
                const calc = calcSunrise(latN, lngN);
                next.sunriseMin = calc.sunriseMin;
                next.sunsetMin  = calc.sunsetMin;
                next.sunriseStr = calc.sunriseStr;
                next.sunsetStr  = calc.sunsetStr;
              }
              // Persist immediately so next restart sees fresh location
              try { AsyncStorage.setItem('appConfig', JSON.stringify(next)); } catch(e) {}
              return next;
            });
          }
        } catch(e) {}
      }
    })();
  }, []);

  // Persist isGhatika changes (separate from config in case user toggles only this)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('appConfig');
        const obj = raw ? JSON.parse(raw) : {};
        obj.isGhatika = isGhatika;
        await AsyncStorage.setItem('appConfig', JSON.stringify(obj));
      } catch(e) {}
    })();
  }, [isGhatika]);

  // Request notification permissions + create Android notification channel
  useEffect(() => {
    (async () => {
      try {
        // Android 8+ requires a notification channel to display notifications
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('svara-transitions', {
            name: 'Svara Transitions',
            description: 'Notifications when nadi or tattva changes',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#c9a96e',
            sound: 'default',
            enableVibrate: true,
            showBadge: false,
            bypassDnd: false,
          });
        }

        const { status, canAskAgain } = await Notifications.getPermissionsAsync();
        if (status !== 'granted' && canAskAgain) {
          await Notifications.requestPermissionsAsync({
            android: {},
            ios: { allowAlert:true, allowSound:true, allowBadge:false },
          });
        }
      } catch(e) {}
    })();
  }, []);

  // Notifications strategy:
  // - Compute EXACT moments when nadi or tattva will change in the next 24 hours.
  // - Schedule one notification per transition with trigger:{seconds:N}.
  // - Android delivers these even when the app is closed.
  // - Re-schedule whenever sunrise/Ghatika/toggles change, or when the app is
  //   opened (the useEffect re-runs).
  // - We tag scheduled notifications with identifier='svara-tx' so we cancel
  //   only ours, not user-test ones.
  useEffect(() => {
    const TATTVA_INFO = {
      prithvi: { emoji:'🌍', name:'Prithvi', desc:'Earth · stable, grounding. Good for steady work.' },
      apas:    { emoji:'💧', name:'Apas',    desc:'Water · flowing, creative. Good for art & study.' },
      tejas:   { emoji:'🔥', name:'Tejas',   desc:'Fire · intense, transformative. Avoid new starts.' },
      vayu:    { emoji:'🌬', name:'Vayu',    desc:'Air · movement, change. Good for travel & exchange.' },
      akasha:  { emoji:'✨', name:'Akasha',  desc:'Ether · transcendent, vast. Best for meditation.' },
    };
    const NADI_INFO = {
      ida:      { emoji:'🌙', name:'Ida',      desc:'Left nostril · lunar, cooling. Calm, healing tasks.' },
      pingala:  { emoji:'☀️', name:'Pingala',  desc:'Right nostril · solar, warming. Action, courage.' },
      sushumna: { emoji:'🔥', name:'Sushumna', desc:'Both equal · sacred, rare. Sit for meditation now.' },
    };

    const scheduleAll = async () => {
      try {
        // Clear any previously scheduled svara notifications
        const all = await Notifications.getAllScheduledNotificationsAsync();
        for (const n of (all || [])) {
          if (n.content?.data?.kind === 'svara-tx') {
            try { await Notifications.cancelScheduledNotificationAsync(n.identifier); } catch(e) {}
          }
        }

        const now = new Date();
        const nowMin = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
        const sr = config.sunriseMin;
        const cycleDur = isGhatika ? 120 : 60;
        const seq = isGhatika ? TATTVAS_GHATIKA : TATTVAS_CLASSIC;
        const lunarNow = getLunarDay();
        const startNadi = (LUNAR_DAYS.find(d => d.day === lunarNow.day) || LUNAR_DAYS[0]).nadi;

        // Helper: compute nadi at a given offset (minutes from now).
        // Nadi alternates every 60 min in a 120-min cycle, all day long (24h).
        // Sushumna appears for 2 min at each transition (minute 0, 60, 120, ...).
        const nadiAt = (offsetMin) => {
          const minFromSR = nowMin + offsetMin - sr;
          // Use modulo so cycle continues past 12h
          const adjusted = ((minFromSR % 1440) + 1440) % 1440;
          const cyclePos = adjusted % 120;
          if (cyclePos < 2 || (cyclePos >= 60 && cyclePos < 62)) return 'sushumna';
          if (cyclePos < 60) return startNadi;
          return startNadi === 'ida' ? 'pingala' : 'ida';
        };

        // Helper: compute tattva at a given offset
        const tattvaAt = (offsetMin) => {
          const mFromSR = nowMin + offsetMin - sr;
          if (mFromSR < 0) return seq[0];
          const pos = ((mFromSR % cycleDur) + cycleDur) % cycleDur;
          let elapsed = 0;
          for (const t of seq) { elapsed += isGhatika ? t.ghatika : t.classic; if (pos < elapsed) return t; }
          return seq[seq.length-1];
        };

        // Build list of TATTVA and NADI transitions in the next 24h.
        // Walk minute-by-minute, detect when value changes from previous.
        // Skip the first 5 minutes — anything that close may have just fired
        // or be in the queue; re-scheduling creates duplicate "ghost" notifications.
        const txs = []; // {dm, type:'tattva'|'nadi', toId}
        let lastTat = tattvaAt(0).id;
        let lastNadi = nadiAt(0);
        for (let dm = 1; dm <= 1440; dm++) {
          if (config.notifs?.tattva) {
            const t = tattvaAt(dm).id;
            if (t !== lastTat) {
              if (dm >= 5) txs.push({ dm, type:'tattva', toId: t });
              lastTat = t;
            }
          }
          if (config.notifs?.nadi) {
            const n = nadiAt(dm);
            if (n !== lastNadi) {
              if (dm >= 5) txs.push({ dm, type:'nadi', toId: n });
              lastNadi = n;
            }
          }
        }

        // Sort and limit (Android caps at ~50 scheduled notifications per app)
        txs.sort((a,b) => a.dm - b.dm);
        const limited = txs.slice(0, 45);

        // Schedule each transition with appropriate trigger
        for (const tx of limited) {
          // Compute what nadi/tattva will be active AT that moment for the body text
          const futureMFromSR = (nowMin - sr + tx.dm + 1440) % 1440;
          const pos = ((futureMFromSR % cycleDur) + cycleDur) % cycleDur;
          let activeTat = seq[0];
          let e = 0;
          for (const x of seq) { e += isGhatika ? x.ghatika : x.classic; if (pos < e) { activeTat = x; break; } }
          const androidFields = Platform.OS === 'android'
            ? { channelId:'svara-transitions', priority: Notifications.AndroidNotificationPriority.HIGH }
            : {};
          if (tx.type === 'tattva') {
            const ti = TATTVA_INFO[tx.toId];
            if (!ti) continue;
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${ti.emoji}  ${ti.name}`,
                body:  ti.desc,
                sound: true,
                data:  { kind:'svara-tx' },
                ...androidFields,
              },
              trigger: { seconds: Math.max(1, Math.round(tx.dm*60)) },
            });
          } else {
            const ni = NADI_INFO[tx.toId];
            if (!ni) continue;
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${ni.emoji}  ${ni.name}`,
                body:  ni.desc,
                sound: true,
                data:  { kind:'svara-tx' },
                ...androidFields,
              },
              trigger: { seconds: Math.max(1, Math.round(tx.dm*60)) },
            });
          }
        }
      } catch(e) {}
    };

    // Debounce: wait 1.5s after deps change before re-scheduling. This avoids
    // cancel/reschedule storms when user toggles several settings in a row, or
    // when Apply changes multiple config keys at once.
    const debouncedId = setTimeout(scheduleAll, 1500);
    // Also re-schedule every 10 min while app is open to keep the pipeline fresh
    // as old notifications fire and the 24h window slides forward.
    const intervalId = setInterval(scheduleAll, 10*60*1000);
    return () => { clearTimeout(debouncedId); clearInterval(intervalId); };
  }, [config.sunriseMin, isGhatika, config.notifs?.nadi, config.notifs?.tattva]);

  const screens = {
    home:     <HomeScreen config={config} isGhatika={isGhatika} manualSvara={manualSvara}/>,
    svara:    <SvaraScreen picked={manualSvara} setPicked={setManualSvara}/>,
    lunar:    <LunarScreen/>,
    shlokas:  <ShlokasScreen/>,
    settings: <SettingsScreen config={config} setConfig={setConfig} isGhatika={isGhatika} setIsGhatika={setIsGhatika}/>,
  };

  return (
    <View style={{flex:1,backgroundColor:C.bg,paddingTop:insets.top}}>
      <View style={{flex:1}}>{screens[activeTab]}</View>
      <View style={[s.bottomNav,{paddingBottom:insets.bottom+8}]}>
        {TABS.map(t=>(
          <TouchableOpacity key={t.id} style={s.navItem} onPress={()=>setActiveTab(t.id)}>
            <Text style={s.navIcon}>{t.icon}</Text>
            <Text style={[s.navLabel,activeTab===t.id&&{color:C.gold}]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  return <SafeAreaProvider><InnerApp/></SafeAreaProvider>;
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const hd = StyleSheet.create({
  header:    { flexDirection:'column', alignItems:'center', backgroundColor:C.bgDeep, paddingHorizontal:16, paddingVertical:14, borderBottomWidth:0.5, borderColor:C.borderFaint },
  om:        { fontSize:36, color:C.gold },
  logo:      { width:44, height:44 },
  logoHeader:{ width:280, height:58, marginBottom:6 },
  headerRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', width:'100%', paddingHorizontal:8 },
  center:    { flex:1 },
  title:     { fontSize:22, fontWeight:'500', color:C.goldLight, letterSpacing:0.8 },
  subtitle:  { fontSize:13, color:C.muted },
  timeLabel: { fontSize:18, color:C.gold, fontWeight:'500' },
  sunBig:    { flexDirection:'row', alignItems:'center', justifyContent:'space-around', backgroundColor:C.bgDeep, paddingVertical:10, paddingHorizontal:20, borderBottomWidth:0.5, borderColor:C.borderFaint },
  sunItem:   { flex:1, alignItems:'center' },
  sunDivider:{ width:0.5, height:34, backgroundColor:C.borderFaint },
  sunIcon:   { fontSize:20, marginBottom:2 },
  sunTime:   { fontSize:18, fontWeight:'500', color:C.goldLight, letterSpacing:0.5 },
  sunLabelBig:{ fontSize:9, color:C.muted, marginTop:1, textTransform:'uppercase', letterSpacing:1 },
  srcLabel:  { fontSize:11, color:C.faint, textAlign:'center', paddingVertical:6, backgroundColor:C.bgDeep, borderBottomWidth:0.5, borderColor:C.borderFaint },
});

const td = StyleSheet.create({
  card:     { marginHorizontal:16, marginBottom:12, backgroundColor:C.bgCard, borderRadius:14, borderWidth:1, padding:16 },
  topRow:   { flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 },
  colorDot: { width:16, height:16, borderRadius:8 },
  name:     { fontSize:19, fontWeight:'500', color:C.goldLight },
  chakra:   { fontSize:13, color:C.muted, marginTop:3 },
  symbolBox:{ backgroundColor:'#2a1040', borderRadius:8, padding:8 },
  symbol:   { fontSize:14, fontWeight:'500' },
  divider:  { height:0.5, backgroundColor:C.border, marginBottom:12 },
  infoRow:  { flexDirection:'row' },
  infoItem: { alignItems:'center', flex:1 },
  infoLabel:{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 },
  infoVal:  { fontSize:14, fontWeight:'500' },
  desc:     { fontSize:14, color:'#a08ab0', lineHeight:22, marginTop:12 },
});

const s = StyleSheet.create({
  svaraCard:    { margin:16, marginBottom:12, backgroundColor:C.bgCard, borderRadius:16, borderWidth:1, borderColor:C.gold, paddingVertical:20, paddingHorizontal:16, alignItems:'center' },
  nextNadiText: { fontSize:13, color:C.muted, marginTop:12, textAlign:'center' },
  svaraLabel:   { fontSize:12, color:C.muted, textTransform:'uppercase', letterSpacing:1.2, marginBottom:8 },
  svaraName:    { fontSize:28, fontWeight:'500', color:C.gold, letterSpacing:0.5 },
  badge:        { marginTop:10, paddingVertical:6, paddingHorizontal:16, borderRadius:20, backgroundColor:C.purple, borderWidth:0.5, borderColor:C.purpleBorder },
  badgeText:    { fontSize:13, color:C.gold },
  compareCard:  { marginHorizontal:16, marginBottom:12, backgroundColor:C.bgCard, borderRadius:12, borderWidth:0.5, borderColor:C.border, paddingVertical:12, paddingHorizontal:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  compareItem:  { flex:1, alignItems:'center' },
  compareLabel: { fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 },
  compareValue: { fontSize:14, fontWeight:'500', color:C.goldLight },
  compareArrow: { fontSize:12, color:C.faint, marginHorizontal:8, fontStyle:'italic' },
  moodCard:     { marginHorizontal:16, marginBottom:8, paddingVertical:12, paddingHorizontal:14, backgroundColor:C.purple, borderRadius:12, borderWidth:0.5, borderColor:C.gold, alignItems:'center' },
  moodLabel:    { fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:4 },
  moodText:     { fontSize:15, color:C.gold, fontWeight:'500', textAlign:'center', fontStyle:'italic' },
  tattvaRow:    { flexDirection:'row', marginHorizontal:16, marginBottom:12, gap:6 },
  tattvaPill:   { flex:1, backgroundColor:C.bgCard, borderWidth:0.5, borderColor:C.border, borderRadius:12, paddingVertical:14, alignItems:'center' },
  tattvaPillActive:{ backgroundColor:C.purple, borderColor:C.gold },
  tattvaIcon:   { fontSize:22, marginBottom:3 },
  tattvaName:   { fontSize:12, color:C.muted },
  ddRow:        { flexDirection:'row', marginHorizontal:16, marginBottom:16, gap:8 },
  ddBox:        { flex:1, borderRadius:14, padding:14, borderWidth:0.5 },
  ddHeader:     { fontSize:13, fontWeight:'500', textTransform:'uppercase', letterSpacing:1, marginBottom:10 },
  ddItem:       { flexDirection:'row', alignItems:'flex-start', gap:6, marginBottom:7 },
  ddDot:        { width:5, height:5, borderRadius:2.5, marginTop:6 },
  ddText:       { fontSize:13, lineHeight:18, flex:1 },
  verseCard:    { marginHorizontal:16, marginBottom:14, backgroundColor:C.bgCard, borderRadius:14, borderWidth:0.5, borderColor:C.border, padding:14 },
  verseLabel:   { fontSize:12, color:C.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:8 },
  verseText:    { fontSize:15, color:C.gold, lineHeight:24, fontStyle:'italic' },
  verseRef:     { fontSize:12, color:C.faint, marginTop:8 },
  screenHeader: { backgroundColor:C.bgDeep, paddingTop:24, paddingBottom:18, paddingHorizontal:20, borderBottomWidth:0.5, borderColor:C.borderFaint },
  screenTitle:  { fontSize:22, fontWeight:'500', color:C.goldLight },
  screenDesc:   { fontSize:14, color:C.muted, marginTop:4 },
  card:         { margin:14, backgroundColor:C.bgCard, borderRadius:14, borderWidth:0.5, borderColor:C.border, padding:16 },
  step:         { fontSize:15, color:'#a08ab0', marginBottom:12, lineHeight:24 },
  btnRow:       { flexDirection:'row', marginHorizontal:14, gap:8 },
  svaraBtn:     { flex:1, backgroundColor:C.bgCard, borderWidth:0.5, borderColor:C.border, borderRadius:14, paddingVertical:18, alignItems:'center', gap:6 },
  svaraBtnActive:{ backgroundColor:C.purple, borderColor:C.gold },
  svaraBtnIcon: { fontSize:30 },
  svaraBtnLabel:{ fontSize:14, color:C.muted },
  resultBox:    { margin:14, backgroundColor:C.purple, borderRadius:14, borderWidth:0.5, borderColor:C.gold, padding:16 },
  resultTitle:  { fontSize:16, color:C.gold, fontWeight:'500', marginBottom:8 },
  resultBody:   { fontSize:14, color:'#a08ab0', lineHeight:22 },
  dayCell:      { width:42, height:42, borderRadius:8, alignItems:'center', justifyContent:'center', borderWidth:0.5 },
  shlokaCard:   { backgroundColor:C.bgCard, borderWidth:0.5, borderColor:C.border, borderRadius:14, padding:16, marginBottom:12 },
  lunarDayCard: { marginHorizontal:16, marginBottom:10, backgroundColor:C.bgCard, borderRadius:14, borderWidth:1, padding:14 },
  lunarDayHeader:{ marginBottom:8 },
  lunarDayLabel:{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:4 },
  lunarDayTitle:{ fontSize:17, color:C.gold, fontWeight:'500', marginBottom:3 },
  lunarDayMeaning:{ fontSize:13, fontStyle:'italic' },
  lunarDayNadi: { backgroundColor:C.bg, borderRadius:8, padding:8, marginTop:4 },
  lunarDDBox:   { flex:1, borderRadius:10, padding:10, borderWidth:0.5 },
  sectionLabel: { fontSize:13, color:C.faint, textTransform:'uppercase', letterSpacing:1.5 },
  settingCard:  { backgroundColor:C.bgCard, borderRadius:14, borderWidth:0.5, borderColor:C.border, overflow:'hidden' },
  settingRow:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:14, paddingHorizontal:16, borderBottomWidth:0.5, borderColor:'#3a1a5a' },
  settingTitle: { fontSize:15, color:C.goldLight },
  settingSub:   { fontSize:12, color:C.muted, marginTop:3 },
  saveBtn:      { alignItems:'center', justifyContent:'center', backgroundColor:C.purple, borderWidth:0.5, borderColor:C.gold, borderRadius:14, padding:16 },
  bottomNav:    { flexDirection:'row', backgroundColor:C.bg, borderTopWidth:0.5, borderColor:C.borderFaint, paddingTop:10 },
  navItem:      { flex:1, alignItems:'center', gap:4 },
  navIcon:      { fontSize:26 },
  navLabel:     { fontSize:11, color:C.fainter },
});

const ss = StyleSheet.create({
  modeBtn:      { flex:1, padding:12, borderRadius:8, backgroundColor:C.bgCard, borderWidth:0.5, borderColor:C.border, alignItems:'center' },
  modeBtnActive:{ backgroundColor:C.purple, borderColor:C.gold },
  modeBtnText:  { fontSize:13, color:C.muted },
  modeCard:     { backgroundColor:C.bgCard, borderRadius:14, borderWidth:0.5, borderColor:C.border, padding:14 },
  modeCardActive:{ borderColor:C.gold, borderWidth:1, backgroundColor:C.purple },
  modeCardIcon: { fontSize:22, marginRight:10 },
  modeCardTitle:{ fontSize:15, color:C.goldLight, fontWeight:'500' },
  modeCardSub:  { fontSize:12, color:C.muted, marginTop:3, lineHeight:17 },
  modeRadio:    { width:18, height:18, borderRadius:9, borderWidth:1.5, borderColor:C.muted, marginRight:10, alignItems:'center', justifyContent:'center' },
  modeRadioActive:{ borderColor:C.gold },
  modeRadioInner:{ width:8, height:8, borderRadius:4, backgroundColor:C.gold },
  modeCardBody: { marginTop:12, paddingTop:12, borderTopWidth:0.5, borderColor:'#3a1a5a' },
  modeStatus:   { fontSize:14, color:C.goldLight, fontWeight:'500' },
  modeCoords:   { fontSize:12, color:C.muted, marginTop:2 },
  modeBtnInline:{ backgroundColor:C.bg, borderWidth:0.5, borderColor:C.gold, borderRadius:10, paddingVertical:10, alignItems:'center' },
  manualRow:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:8 },
  manualLabel:  { fontSize:14, color:C.goldLight, flex:1 },
  tabRow:       { flexDirection:'row', backgroundColor:'#1f0830', borderTopLeftRadius:14, borderTopRightRadius:14 },
  tabBtn:       { flex:1, paddingVertical:14, alignItems:'center', borderBottomWidth:2, borderColor:'transparent' },
  tabBtnActive: { borderColor:C.gold, backgroundColor:C.purple },
  tabBtnText:   { fontSize:14, color:C.muted, fontWeight:'500' },
  tabBody:      { padding:14 },
  useCalcRow:   { flexDirection:'row', alignItems:'center', padding:12, paddingHorizontal:16, borderTopWidth:0.5, borderBottomWidth:0.5, borderColor:'#3a1a5a', gap:10 },
  useCalcBtn:   { paddingVertical:6, paddingHorizontal:12, borderRadius:8, backgroundColor:C.purple, borderWidth:0.5, borderColor:C.gold },
  inputRow:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:14, paddingHorizontal:16, borderBottomWidth:0.5, borderColor:'#3a1a5a' },
  input:        { backgroundColor:C.bg, borderWidth:0.5, borderColor:C.border, borderRadius:8, color:C.gold, fontSize:15, paddingVertical:8, paddingHorizontal:12, minWidth:100, textAlign:'right' },
  timeRow:      { flexDirection:'row', alignItems:'center', gap:4 },
  timePart:     { width:48, textAlign:'center', minWidth:48 },
});
