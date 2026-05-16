import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, TextInput, Alert } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SunCalc from 'suncalc';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert:true, shouldPlaySound:true, shouldSetBadge:false }),
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

const SHLOKAS = [
  { verse:9,   topic:'Svara as Supreme Knowledge', sanskrit:'स्वरे शास्त्राणि विद्यन्ते', meaning:'In svara lies all knowledge; in svara resides the highest music. Svara is the very essence of the Vedas.' },
  { verse:47,  topic:'Ida vs Pingala',              sanskrit:'इडायां शुभकार्याणि पिङ्गलायां च दारुणम्', meaning:'During Ida, perform auspicious and gentle deeds. During Pingala, undertake fierce and strenuous activities.' },
  { verse:82,  topic:'Pancha Tattva',               sanskrit:'पृथ्वी-तत्त्वे स्थिरं कार्यं', meaning:'Earth gives stability. Water brings auspicious results. Fire destroys; Air leads to travel; Ether grants liberation.' },
  { verse:116, topic:'Sushumna',                    sanskrit:'सुषुम्नायां न कार्याणि', meaning:'During Sushumna, avoid worldly tasks. Use this moment only for meditation and devotion.' },
];

const LUNAR_DAYS = [
  {day:1,nadi:'ida'},{day:2,nadi:'ida'},{day:3,nadi:'ida'},
  {day:4,nadi:'pingala'},{day:5,nadi:'pingala'},{day:6,nadi:'pingala'},
  {day:7,nadi:'ida'},{day:8,nadi:'ida'},{day:9,nadi:'ida'},
  {day:10,nadi:'pingala'},{day:11,nadi:'pingala'},{day:12,nadi:'pingala'},
  {day:13,nadi:'ida'},{day:14,nadi:'ida'},{day:15,nadi:'pingala'},
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
  const toLocalMin = d => {
    if (!d || isNaN(d.getTime())) return 0;
    return d.getHours()*60 + d.getMinutes() + d.getSeconds()/60;
  };
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
  if (minFromSunrise < 0 || minFromSunrise > 720) return 'sushumna';
  const cyclePos = minFromSunrise % 120;
  if (cyclePos < 2 || (cyclePos >= 60 && cyclePos < 62)) return 'sushumna';
  const lunarEntry = LUNAR_DAYS.find(d => d.day === lunarDay);
  const startNadi = lunarEntry ? lunarEntry.nadi : 'ida';
  if (cyclePos < 60) return startNadi;
  return startNadi === 'ida' ? 'pingala' : 'ida';
}

function getTattvaFromSunrise(sunriseMin, isGhatika) {
  const seq = isGhatika ? TATTVAS_GHATIKA : TATTVAS_CLASSIC;
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
  const minFromSunrise = nowMin - sunriseMin;
  if (minFromSunrise < 0) return seq[0];
  const cycleDur = isGhatika ? 120 : 60;
  const pos = minFromSunrise % cycleDur;
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

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomeScreen({ config, isGhatika, manualSvara }) {
  const { sunriseMin, sunriseStr, sunsetStr, locationMode, sunriseMode } = config;
  const lunar = getLunarDay();
  const [autoSvara,    setAutoSvara]    = useState(() => getSvaraFromSunrise(sunriseMin, lunar.day, lunar.paksha));
  const [activeTattva, setActiveTattva] = useState(() => getTattvaFromSunrise(sunriseMin, isGhatika));
  const [progress,     setProgress]     = useState(() => getTattvaProgress(sunriseMin, isGhatika, getTattvaFromSunrise(sunriseMin, isGhatika)));
  const [now,          setNow]          = useState(new Date());

  useEffect(() => {
    const tick = () => {
      const l = getLunarDay();
      const t = getTattvaFromSunrise(sunriseMin, isGhatika);
      setAutoSvara(getSvaraFromSunrise(sunriseMin, l.day, l.paksha));
      setActiveTattva(t);
      setProgress(getTattvaProgress(sunriseMin, isGhatika, t));
      setNow(new Date());
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [sunriseMin, isGhatika]);

  const svara = manualSvara || autoSvara;
  const timeStr = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', hour12:false });
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
      <View style={hd.header}>
        <Text style={hd.om}>ॐ</Text>
        <View style={hd.center}>
          <Text style={hd.title}>Svara Yoga</Text>
          <Text style={hd.subtitle}>{lunar.paksha==='shukla'?'Shukla':'Krishna'} · Day {lunar.day}</Text>
        </View>
        <Text style={hd.timeLabel}>🕐 {timeStr}</Text>
      </View>

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
      <View style={s.screenHeader}><Text style={s.screenTitle}>Svara Identifier</Text><Text style={s.screenDesc}>Detect your active nadi right now</Text></View>
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
  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      <View style={s.screenHeader}><Text style={s.screenTitle}>Lunar Cycle Guide</Text><Text style={s.screenDesc}>Nostril dominance by lunar day</Text></View>
      <View style={s.card}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <View><Text style={{fontSize:13,color:C.muted}}>Current Paksha</Text><Text style={{fontSize:18,color:C.gold,fontWeight:'500',marginTop:2}}>{paksha==='shukla'?'Shukla · Waxing':'Krishna · Waning'}</Text></View>
          <Text style={{fontSize:40}}>{paksha==='shukla'?'🌙':'🌑'}</Text>
        </View>
        <View style={{flexDirection:'row',gap:18,marginBottom:12}}>
          <Text style={{fontSize:13,color:C.blue}}>🔵 Ida (Left)</Text>
          <Text style={{fontSize:13,color:C.orange}}>🟠 Pingala (Right)</Text>
        </View>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:5}}>
          {LUNAR_DAYS.map(d=>(
            <View key={d.day} style={[s.dayCell,d.nadi==='ida'?{backgroundColor:C.blueBg,borderColor:'#2a4a7a'}:{backgroundColor:C.orangeBg,borderColor:'#6a3a1a'},d.day===day&&{borderWidth:2,borderColor:C.gold}]}>
              <Text style={{fontSize:12,fontWeight:'500',color:d.nadi==='ida'?C.blue:C.orange}}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={s.card}>
        <Text style={{fontSize:12,color:C.muted,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Today · Day {day} of {paksha==='shukla'?'Shukla':'Krishna'} Paksha</Text>
        <Text style={{fontSize:16,color:C.gold,lineHeight:24}}>{LUNAR_DAYS.find(d=>d.day===day)?.nadi==='ida'?'Ida Nadi dominates from sunrise. Favorable for learning, healing and all peaceful activities.':'Pingala Nadi dominates. Favorable for physical work, business and courageous acts.'}</Text>
      </View>
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
      <View style={s.screenHeader}><Text style={s.screenTitle}>Shlokas & Teachings</Text><Text style={s.screenDesc}>Key verses — tap to expand</Text></View>
      <View style={{padding:14}}>
        <View style={[s.shlokaCard,{borderColor:C.gold,borderWidth:1,backgroundColor:C.purple}]}>
          <Text style={{fontSize:11,color:C.gold,textTransform:'uppercase',letterSpacing:1.5,marginBottom:8}}>★ Verse of the Day</Text>
          <Text style={{fontSize:13,color:C.muted,marginBottom:6}}>Verse {verseOfDay.verse} · {verseOfDay.topic}</Text>
          <Text style={{fontSize:16,color:C.gold,fontStyle:'italic',lineHeight:26}}>{verseOfDay.meaning}</Text>
        </View>
        {SHLOKAS.map(sh=>(
          <TouchableOpacity key={sh.verse} style={s.shlokaCard} onPress={()=>setExpanded(expanded===sh.verse?null:sh.verse)}>
            <Text style={{fontSize:12,color:C.faint,marginBottom:6}}>Verse {sh.verse} · {sh.topic}</Text>
            <Text style={{fontSize:15,color:C.gold,fontWeight:'500',marginBottom:6}}>{sh.topic}</Text>
            {expanded===sh.verse&&<Text style={{fontSize:14,color:'#a08ab0',lineHeight:22,marginBottom:8}}>{sh.meaning}</Text>}
            <Text style={{fontSize:12,color:C.faint}}>{expanded===sh.verse?'▲ collapse':'▼ tap to read meaning'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsScreen({ config, setConfig, isGhatika, setIsGhatika }) {
  const [city,    setCity]    = useState(config.city);
  const [lat,     setLat]     = useState(String(config.lat));
  const [lng,     setLng]     = useState(String(config.lng));
  const [srH,     setSrH]     = useState(String(config.srH).padStart(2,'0'));
  const [srM,     setSrM]     = useState(String(config.srM).padStart(2,'0'));
  const [ssH,     setSsH]     = useState(String(config.ssH).padStart(2,'0'));
  const [ssM,     setSsM]     = useState(String(config.ssM).padStart(2,'0'));
  const [locMode, setLocMode] = useState(config.locationMode);
  const [srMode,  setSrMode]  = useState(config.sunriseMode);
  const [notifs,  setNotifs]  = useState(config.notifs || {nadi:true,tattva:true});
  const [gpsLoad, setGpsLoad] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const toggleNotif = k => setNotifs(n=>({...n,[k]:!n[k]}));

  const ghSeq = isGhatika ? TATTVAS_GHATIKA : TATTVAS_CLASSIC;

  const getGPS = async () => {
    setGpsLoad(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsLoad(false);
        Alert.alert('Permission denied','Location permission is required to detect sunrise from your position.');
        return;
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
      const newLat = latN.toFixed(4);
      const newLng = lngN.toFixed(4);
      setLat(newLat); setLng(newLng); setCity(newCity);
      setLocMode('gps');
      // Auto-apply: recalculate sunrise/sunset and save config + persist to storage
      let sunriseMin, sunsetMin, sunriseStr, sunsetStr;
      if (srMode==='manual') {
        sunriseMin = parseInt(srH)*60+parseInt(srM);
        sunsetMin  = parseInt(ssH)*60+parseInt(ssM);
        sunriseStr = `${srH}:${srM}`; sunsetStr = `${ssH}:${ssM}`;
      } else {
        const calc = calcSunrise(latN,lngN);
        sunriseMin=calc.sunriseMin; sunsetMin=calc.sunsetMin;
        sunriseStr=calc.sunriseStr; sunsetStr=calc.sunsetStr;
      }
      const newConfig = { city:newCity, lat:latN, lng:lngN, srH:parseInt(srH), srM:parseInt(srM), ssH:parseInt(ssH), ssM:parseInt(ssM), sunriseMin, sunsetMin, sunriseStr, sunsetStr, locationMode:'gps', sunriseMode:srMode, notifs };
      setConfig(newConfig);
      try { await AsyncStorage.setItem('lastGPS', JSON.stringify({lat:latN, lng:lngN, city:newCity})); } catch(e){}
      setGpsLoad(false);
      Alert.alert('📡 GPS', `${newCity}\n${latN.toFixed(4)}, ${lngN.toFixed(4)}\nSunrise: ${sunriseStr} · Sunset: ${sunsetStr}`);
    } catch(e) {
      setGpsLoad(false);
      Alert.alert('GPS Error', 'Could not get location: '+(e.message||'unknown error'));
    }
  };

  const handleSave = () => {
    const latN = parseFloat(lat)||config.lat;
    const lngN = parseFloat(lng)||config.lng;
    let sunriseMin, sunsetMin, sunriseStr, sunsetStr;
    if (srMode==='manual') {
      sunriseMin = parseInt(srH)*60+parseInt(srM);
      sunsetMin  = parseInt(ssH)*60+parseInt(ssM);
      sunriseStr = `${srH}:${srM}`; sunsetStr = `${ssH}:${ssM}`;
    } else {
      const calc = calcSunrise(latN,lngN);
      sunriseMin=calc.sunriseMin; sunsetMin=calc.sunsetMin;
      sunriseStr=calc.sunriseStr; sunsetStr=calc.sunsetStr;
    }
    setConfig({ city, lat:latN, lng:lngN, srH:parseInt(srH), srM:parseInt(srM), ssH:parseInt(ssH), ssM:parseInt(ssM), sunriseMin, sunsetMin, sunriseStr, sunsetStr, locationMode:locMode, sunriseMode:srMode, notifs });
    setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  const ModeBtn = ({label,active,onPress}) => (
    <TouchableOpacity onPress={onPress} style={[ss.modeBtn,active&&ss.modeBtnActive]}>
      <Text style={[ss.modeBtnText,active&&{color:C.gold}]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      <View style={s.screenHeader}><Text style={s.screenTitle}>Settings</Text><Text style={s.screenDesc}>Location, sunrise & notifications</Text></View>
      <View style={{padding:14,gap:12}}>

        <Text style={s.sectionLabel}>📍  Location Source</Text>
        <View style={s.settingCard}>
          <View style={{flexDirection:'row',padding:10,gap:8}}>
            <ModeBtn label="⚙️ Default" active={locMode==='default'} onPress={()=>setLocMode('default')}/>
            <ModeBtn label="✏️ Manual"  active={locMode==='manual'}  onPress={()=>setLocMode('manual')}/>
            <ModeBtn label="📡 GPS"     active={locMode==='gps'}     onPress={getGPS}/>
          </View>
          {locMode!=='default' && <>
            <View style={ss.inputRow}><View style={{flex:1}}><Text style={s.settingTitle}>City</Text></View><TextInput style={ss.input} value={city} onChangeText={setCity} placeholderTextColor={C.faint}/></View>
            <View style={ss.inputRow}><View style={{flex:1}}><Text style={s.settingTitle}>Latitude</Text></View><TextInput style={ss.input} value={lat} onChangeText={setLat} keyboardType="numeric" placeholderTextColor={C.faint}/></View>
            <View style={[ss.inputRow,{borderBottomWidth:0}]}><View style={{flex:1}}><Text style={s.settingTitle}>Longitude</Text></View><TextInput style={ss.input} value={lng} onChangeText={setLng} keyboardType="numeric" placeholderTextColor={C.faint}/></View>
          </>}
          {locMode==='default'&&<View style={{padding:12,borderTopWidth:0.5,borderColor:'#3a1a5a'}}><Text style={{fontSize:11,color:C.muted}}>Default: Varanasi (25.3176°N, 82.9739°E)</Text></View>}
        </View>

        <Text style={s.sectionLabel}>🌅  Sunrise Calculation</Text>
        <View style={s.settingCard}>
          <View style={{flexDirection:'row',padding:10,gap:8}}>
            <ModeBtn label="🌐 Auto" active={srMode==='auto'}   onPress={()=>setSrMode('auto')}/>
            <ModeBtn label="✏️ Manual" active={srMode==='manual'} onPress={()=>setSrMode('manual')}/>
          </View>
          {srMode==='auto'&&<View style={{padding:12,borderTopWidth:0.5,borderColor:'#3a1a5a'}}><Text style={{fontSize:11,color:C.muted}}>Calculated from coordinates.</Text><Text style={{fontSize:12,color:C.gold,marginTop:4}}>🌅 {config.sunriseStr}  🌇 {config.sunsetStr}</Text></View>}
          {srMode==='manual'&&<>
            <View style={ss.inputRow}><View style={{flex:1}}><Text style={s.settingTitle}>Sunrise (HH:MM)</Text></View><View style={ss.timeRow}><TextInput style={[ss.input,ss.timePart]} value={srH} onChangeText={setSrH} keyboardType="numeric" maxLength={2}/><Text style={{color:C.gold,fontSize:16,fontWeight:'500'}}>:</Text><TextInput style={[ss.input,ss.timePart]} value={srM} onChangeText={setSrM} keyboardType="numeric" maxLength={2}/></View></View>
            <View style={[ss.inputRow,{borderBottomWidth:0}]}><View style={{flex:1}}><Text style={s.settingTitle}>Sunset (HH:MM)</Text></View><View style={ss.timeRow}><TextInput style={[ss.input,ss.timePart]} value={ssH} onChangeText={setSsH} keyboardType="numeric" maxLength={2}/><Text style={{color:C.gold,fontSize:16,fontWeight:'500'}}>:</Text><TextInput style={[ss.input,ss.timePart]} value={ssM} onChangeText={setSsM} keyboardType="numeric" maxLength={2}/></View></View>
          </>}
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

        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Text style={{color:C.gold,fontSize:16,fontWeight:'500'}}>{saved?'✅  Settings Applied!':'💾  Save & Apply'}</Text>
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
            await Notifications.scheduleNotificationAsync({
              content:{ title:'🕉️ Svara Yoga', body:'Test notification — notifications are working!', sound:true },
              trigger: null,
            });
            Alert.alert('✓ Sent','Check your notification shade');
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

  // Load last GPS location on app start
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('lastGPS');
        if (raw) {
          const last = JSON.parse(raw);
          if (last && typeof last.lat === 'number' && typeof last.lng === 'number') {
            const calc = calcSunrise(last.lat, last.lng);
            setConfig(prev => ({
              ...prev,
              city: last.city || prev.city,
              lat: last.lat, lng: last.lng,
              sunriseMin: calc.sunriseMin, sunsetMin: calc.sunsetMin,
              sunriseStr: calc.sunriseStr, sunsetStr: calc.sunsetStr,
              locationMode: 'gps',
            }));
          }
        }
      } catch(e) {}
    })();
  }, []);

  // Request notification permissions on first launch
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') await Notifications.requestPermissionsAsync();
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
      prithvi: { emoji:'🌍', name:'Prithvi (Earth)' },
      apas:    { emoji:'💧', name:'Apas (Water)' },
      tejas:   { emoji:'🔥', name:'Tejas (Fire)' },
      vayu:    { emoji:'🌬', name:'Vayu (Air)' },
      akasha:  { emoji:'✨', name:'Akasha (Ether)' },
    };
    const NADI_INFO = {
      ida:      { emoji:'🌙', name:'Ida' },
      pingala:  { emoji:'☀️', name:'Pingala' },
      sushumna: { emoji:'🔥', name:'Sushumna' },
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

        // Build list of TATTVA transitions in the next 24h (1440 min).
        // Tattva pattern repeats every cycleDur min starting from sunrise.
        const txs = []; // {dm:minutesFromNow, type:'tattva'|'nadi', toId}
        if (config.notifs?.tattva) {
          // Find the position-within-cycle at "now"
          let mFromSR = nowMin - sr;
          if (mFromSR < 0) mFromSR += 1440; // before sunrise → use yesterday's cycle continuation
          // Walk forward 24h, finding each tattva boundary
          for (let dm = 0; dm <= 1440; dm++) {
            const futureMFromSR = mFromSR + dm;
            const pos = ((futureMFromSR % cycleDur) + cycleDur) % cycleDur;
            // Check if pos is exactly at a tattva boundary
            let e = 0;
            for (let i = 0; i < seq.length; i++) {
              e += isGhatika ? seq[i].ghatika : seq[i].classic;
              if (pos === e % cycleDur) {
                // Transition to next tattva
                const nextIdx = (i + 1) % seq.length;
                if (dm > 0) txs.push({ dm, type:'tattva', toId: seq[nextIdx].id });
                break;
              }
            }
          }
        }

        // NADI transitions happen at sunrise each day; nadi for a given day
        // depends on lunar paksha and tithi (already in getSvaraFromSunrise).
        // Compute when tomorrow's sunrise is in minutes-from-now.
        if (config.notifs?.nadi) {
          let dmSunriseTomorrow = sr - nowMin;
          if (dmSunriseTomorrow <= 0) dmSunriseTomorrow += 1440;
          // Schedule the next ~5 sunrises (5 days of nadi alerts)
          for (let day = 0; day < 5; day++) {
            const dm = dmSunriseTomorrow + day*1440;
            if (dm > 0 && dm <= 5*1440) {
              // We don't know tomorrow's exact nadi without recomputing lunar
              // day for that date — but for a same-day approximation, use
              // today's lunar day shifted by `day`.
              const futureDate = new Date(now.getTime() + dm*60000);
              const dayInMonth = Math.floor((futureDate - new Date(2024,5,6))/86400000);
              const dInCycle = ((dayInMonth % 30) + 30) % 30;
              const paksha = dInCycle < 15 ? 'shukla' : 'krishna';
              const tithi = (dInCycle % 15) + 1;
              const nadiAtSunrise = getSvaraFromSunrise(sr, tithi, paksha);
              txs.push({ dm, type:'nadi', toId: nadiAtSunrise });
            }
          }
        }

        // Sort and limit (Android caps at ~50 scheduled notifications per app)
        txs.sort((a,b) => a.dm - b.dm);
        const limited = txs.slice(0, 40);

        // Schedule each transition with appropriate trigger
        for (const tx of limited) {
          // Compute what nadi/tattva will be active AT that moment for the body text
          const futureMFromSR = (nowMin - sr + tx.dm + 1440) % 1440;
          const pos = ((futureMFromSR % cycleDur) + cycleDur) % cycleDur;
          let activeTat = seq[0];
          let e = 0;
          for (const x of seq) { e += isGhatika ? x.ghatika : x.classic; if (pos < e) { activeTat = x; break; } }
          // For tattva transitions, the new tattva is tx.toId
          // For nadi transitions, recompute active tattva at sunrise
          if (tx.type === 'tattva') {
            const ti = TATTVA_INFO[tx.toId];
            if (!ti) continue;
            const ni = NADI_INFO[ tx.type === 'nadi' ? tx.toId : 'ida' ];
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${ti.emoji}  ${ti.name.split(' ')[0]} active`,
                body:  `Tattva changed to ${ti.name}`,
                sound: true,
                data:  { kind:'svara-tx' },
              },
              trigger: { seconds: Math.max(1, Math.round(tx.dm*60)) },
            });
          } else {
            const ni = NADI_INFO[tx.toId];
            if (!ni) continue;
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${ni.emoji}  ${ni.name} active`,
                body:  `${ni.name} nadi is now flowing`,
                sound: true,
                data:  { kind:'svara-tx' },
              },
              trigger: { seconds: Math.max(1, Math.round(tx.dm*60)) },
            });
          }
        }
      } catch(e) {}
    };

    scheduleAll();
    // Re-schedule periodically while app is open (every 5 min) to keep the
    // pipeline fresh as time passes and old notifications fire.
    const id = setInterval(scheduleAll, 5*60*1000);
    return () => clearInterval(id);
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
  header:    { flexDirection:'row', alignItems:'center', backgroundColor:C.bgDeep, paddingHorizontal:16, paddingVertical:14, borderBottomWidth:0.5, borderColor:C.borderFaint, gap:12 },
  om:        { fontSize:36, color:C.gold },
  center:    { flex:1 },
  title:     { fontSize:22, fontWeight:'500', color:C.goldLight, letterSpacing:0.8 },
  subtitle:  { fontSize:13, color:C.muted, marginTop:3 },
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
  inputRow:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:14, paddingHorizontal:16, borderBottomWidth:0.5, borderColor:'#3a1a5a' },
  input:        { backgroundColor:C.bg, borderWidth:0.5, borderColor:C.border, borderRadius:8, color:C.gold, fontSize:15, paddingVertical:8, paddingHorizontal:12, minWidth:100, textAlign:'right' },
  timeRow:      { flexDirection:'row', alignItems:'center', gap:4 },
  timePart:     { width:48, textAlign:'center', minWidth:48 },
});
