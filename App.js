import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, TextInput, Alert } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

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

// ── UTILS ─────────────────────────────────────────────────────────────────────
function calcSunrise(lat, lng, date = new Date()) {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(),0,0)) / 86400000);
  const B = (360/365)*(dayOfYear-81)*rad;
  const eot = 9.87*Math.sin(2*B) - 7.53*Math.cos(B) - 1.5*Math.sin(B);
  const ha = Math.acos(-Math.tan(lat*rad)*Math.tan(23.45*rad*Math.sin(B))) / rad;
  const lngCorr = 4*(lng%15);
  const sunriseMin = 720 - 4*ha - eot + lngCorr;
  const sunsetMin  = 720 + 4*ha - eot + lngCorr;
  const toHHMM = m => { const h=Math.floor(m/60)%24; const mn=Math.floor(m%60); return `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}`; };
  return { sunriseMin, sunsetMin, sunriseStr:toHHMM(sunriseMin), sunsetStr:toHHMM(sunsetMin) };
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
function HomeScreen({ config, isGhatika }) {
  const { sunriseMin, sunriseStr, sunsetStr, locationMode, sunriseMode } = config;
  const lunar = getLunarDay();
  const [svara,        setSvara]        = useState(() => getSvaraFromSunrise(sunriseMin, lunar.day, lunar.paksha));
  const [activeTattva, setActiveTattva] = useState(() => getTattvaFromSunrise(sunriseMin, isGhatika));
  const [progress,     setProgress]     = useState(() => getTattvaProgress(sunriseMin, isGhatika, getTattvaFromSunrise(sunriseMin, isGhatika)));
  const [now,          setNow]          = useState(new Date());

  useEffect(() => {
    const tick = () => {
      const l = getLunarDay();
      const t = getTattvaFromSunrise(sunriseMin, isGhatika);
      setSvara(getSvaraFromSunrise(sunriseMin, l.day, l.paksha));
      setActiveTattva(t);
      setProgress(getTattvaProgress(sunriseMin, isGhatika, t));
      setNow(new Date());
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [sunriseMin, isGhatika]);

  const timeStr = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', hour12:false });
  const seq = isGhatika ? TATTVAS_GHATIKA : TATTVAS_CLASSIC;
  const nextTattva = seq[(seq.findIndex(t=>t.id===activeTattva.id)+1) % seq.length];

  const SVARA_META = {
    ida:      { name:'Ida Nadi',     sanskrit:'इड़ा नाड़ी · Left Nostril',  tag:'🌙 Lunar · Cooling · Feminine'  },
    pingala:  { name:'Pingala Nadi', sanskrit:'पिङ्गला · Right Nostril',    tag:'☀️ Solar · Warming · Masculine' },
    sushumna: { name:'Sushumna',     sanskrit:'सुषुम्ना · Both Nostrils',   tag:'🔥 Central · Sacred · Rare'     },
  };
  const sm = SVARA_META[svara];
  const srcLabel = locationMode==='gps' ? '📡 GPS' : locationMode==='manual' ? '✏️ Manual' : '⚙️ Default';

  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      <View style={hd.header}>
        <Text style={hd.om}>ॐ</Text>
        <View style={hd.center}>
          <Text style={hd.title}>Svara Yoga</Text>
          <Text style={hd.subtitle}>Shiva Svarodaya · {lunar.paksha==='shukla'?'Shukla':'Krishna'} D{lunar.day}</Text>
        </View>
        <View style={hd.right}>
          <Text style={hd.timeLabel}>🕐 {timeStr}</Text>
          <Text style={hd.sunLabel}>🌅 {sunriseStr}  🌇 {sunsetStr}</Text>
          <Text style={hd.srcLabel}>{srcLabel} · {isGhatika?'Ghatika':'Classic'}</Text>
        </View>
      </View>

      <View style={s.svaraCard}>
        <Text style={s.svaraLabel}>Active Svara Now</Text>
        <Text style={s.svaraName}>{sm.name}</Text>
        <Text style={s.svaraSanskrit}>{sm.sanskrit}</Text>
        <View style={s.badge}><Text style={s.badgeText}>{sm.tag}</Text></View>
      </View>

      <View style={{marginHorizontal:16,marginBottom:4}}>
        <Text style={{fontSize:9,color:C.faint,textAlign:'center'}}>
          {isGhatika ? '🕐 Ghatika: ✨→🌬→🔥→💧→🌍 (from sunrise)' : '📜 Classic: 🌍→💧→🔥→🌬→✨'}
        </Text>
      </View>
      <View style={s.tattvaRow}>
        {seq.map(t=>(
          <View key={t.id} style={[s.tattvaPill, activeTattva.id===t.id && s.tattvaPillActive]}>
            <Text style={s.tattvaIcon}>{t.emoji}</Text>
            <Text style={[s.tattvaName, activeTattva.id===t.id&&{color:C.gold}]}>{t.name}</Text>
            {activeTattva.id===t.id && <Text style={{fontSize:8,color:C.gold,marginTop:2}}>{progress.remaining}m</Text>}
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
        <View style={{height:4,backgroundColor:'#2a1040',borderRadius:2,overflow:'hidden',marginTop:10}}>
          <View style={{height:4,width:`${progress.percent}%`,backgroundColor:activeTattva.color,borderRadius:2}}/>
        </View>
        <Text style={td.desc}>{activeTattva.description}</Text>
        <Text style={{fontSize:9,color:C.faint,marginTop:6}}>Next → {nextTattva.emoji} {nextTattva.name}</Text>
      </View>

      <View style={s.ddRow}>
        <View style={[s.ddBox,{backgroundColor:C.greenBg,borderColor:C.greenBorder}]}>
          <Text style={[s.ddHeader,{color:C.green}]}>✓  Do's</Text>
          {["Study & Learning","Healing & Medicine","Travel North/East","Meeting loved ones","Meditation & prayer","Planting & gardening"].map((d,i)=>
            <View key={i} style={s.ddItem}><View style={[s.ddDot,{backgroundColor:C.green}]}/><Text style={[s.ddText,{color:'#5ac090'}]}>{d}</Text></View>
          )}
        </View>
        <View style={[s.ddBox,{backgroundColor:C.redBg,borderColor:C.redBorder}]}>
          <Text style={[s.ddHeader,{color:C.red}]}>✕  Don'ts</Text>
          {["Fierce confrontation","Heavy physical labor","Large financial deals","Arguments & debate","Travel south/west","Starting new ventures"].map((d,i)=>
            <View key={i} style={s.ddItem}><View style={[s.ddDot,{backgroundColor:C.red}]}/><Text style={[s.ddText,{color:'#c06060'}]}>{d}</Text></View>
          )}
        </View>
      </View>

      <View style={s.verseCard}>
        <Text style={s.verseLabel}>Verse of the Day</Text>
        <Text style={s.verseText}>"When the breath flows through the left nostril, one should undertake all auspicious and peaceful works — learning, healing, and journeys toward water."</Text>
        <Text style={s.verseRef}>Shiva Svarodaya · Verse 47</Text>
      </View>
    </ScrollView>
  );
}

// ── SVARA ─────────────────────────────────────────────────────────────────────
function SvaraScreen() {
  const [picked, setPicked] = useState(null);
  const RESULTS = {
    ida:      { title:'Ida Nadi — Left Nostril active',    body:'The lunar, cooling channel flows. Ideal for peaceful, creative, and social activities.' },
    pingala:  { title:'Pingala Nadi — Right Nostril active', body:'The solar, warming channel flows. Energy and willpower heightened. Ideal for physical work and business.' },
    sushumna: { title:'Sushumna — Both nostrils equal',    body:'This rare sacred state occurs at nadi transitions. Sit immediately for meditation or mantra japa.' },
  };
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
          <TouchableOpacity key={b.id} style={[s.svaraBtn,picked===b.id&&s.svaraBtnActive]} onPress={()=>setPicked(b.id)}>
            <Text style={s.svaraBtnIcon}>{b.icon}</Text>
            <Text style={[s.svaraBtnLabel,picked===b.id&&{color:C.gold}]}>{b.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {picked&&<View style={s.resultBox}><Text style={s.resultTitle}>{RESULTS[picked].title}</Text><Text style={s.resultBody}>{RESULTS[picked].body}</Text></View>}
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
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <View><Text style={{fontSize:11,color:C.muted}}>Current Paksha</Text><Text style={{fontSize:14,color:C.gold,fontWeight:'500'}}>{paksha==='shukla'?'Shukla Paksha · Waxing':'Krishna Paksha · Waning'}</Text></View>
          <Text style={{fontSize:32}}>{paksha==='shukla'?'🌙':'🌑'}</Text>
        </View>
        <View style={{flexDirection:'row',gap:14,marginBottom:10}}>
          <Text style={{fontSize:10,color:C.blue}}>🔵 Ida (Left)</Text>
          <Text style={{fontSize:10,color:C.orange}}>🟠 Pingala (Right)</Text>
        </View>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:4}}>
          {LUNAR_DAYS.map(d=>(
            <View key={d.day} style={[s.dayCell,d.nadi==='ida'?{backgroundColor:C.blueBg,borderColor:'#2a4a7a'}:{backgroundColor:C.orangeBg,borderColor:'#6a3a1a'},d.day===day&&{borderWidth:2,borderColor:C.gold}]}>
              <Text style={{fontSize:9,fontWeight:'500',color:d.nadi==='ida'?C.blue:C.orange}}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={s.card}>
        <Text style={{fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Today · Day {day} of {paksha==='shukla'?'Shukla':'Krishna'} Paksha</Text>
        <Text style={{fontSize:13,color:C.gold,lineHeight:20}}>{LUNAR_DAYS.find(d=>d.day===day)?.nadi==='ida'?'Ida Nadi dominates from sunrise. Favorable for learning, healing and all peaceful activities.':'Pingala Nadi dominates. Favorable for physical work, business and courageous acts.'}</Text>
      </View>
    </ScrollView>
  );
}

// ── SHLOKAS ───────────────────────────────────────────────────────────────────
function ShlokasScreen() {
  const [expanded, setExpanded] = useState(null);
  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      <View style={s.screenHeader}><Text style={s.screenTitle}>Shlokas & Teachings</Text><Text style={s.screenDesc}>Key verses — tap to expand</Text></View>
      <View style={{padding:14}}>
        {SHLOKAS.map(sh=>(
          <TouchableOpacity key={sh.verse} style={s.shlokaCard} onPress={()=>setExpanded(expanded===sh.verse?null:sh.verse)}>
            <Text style={{fontSize:10,color:C.faint,marginBottom:4}}>Verse {sh.verse} · {sh.topic}</Text>
            <Text style={{fontSize:13,color:C.gold,fontStyle:'italic',lineHeight:20,marginBottom:4}}>{sh.sanskrit}</Text>
            {expanded===sh.verse&&<Text style={{fontSize:11,color:'#a08ab0',lineHeight:18,marginBottom:6}}>{sh.meaning}</Text>}
            <Text style={{fontSize:10,color:C.faint}}>{expanded===sh.verse?'▲ collapse':'▼ tap to read meaning'}</Text>
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
  const [notifs,  setNotifs]  = useState(config.notifs || {ida:true,pingala:true,sushumna:false,prithvi:true,apas:true,tejas:false,vayu:false,akasha:true});
  const [gpsLoad, setGpsLoad] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const toggleNotif = k => setNotifs(n=>({...n,[k]:!n[k]}));

  const ghSeq = isGhatika ? TATTVAS_GHATIKA : TATTVAS_CLASSIC;

  const getGPS = async () => {
    setGpsLoad(true);
    await new Promise(r=>setTimeout(r,1500));
    setLat('46.5386'); setLng('24.5578'); setCity('Târgu Mureș');
    setLocMode('gps');
    Alert.alert('📡 GPS','Location detected! Real GPS active in APK build.');
    setGpsLoad(false);
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

        <Text style={s.sectionLabel}>🔔  Svara Notifications</Text>
        <View style={s.settingCard}>
          {[{k:'ida',l:'🌙  Ida Nadi begins',sb:'Left nostril becomes dominant'},{k:'pingala',l:'☀️  Pingala Nadi begins',sb:'Right nostril becomes dominant'},{k:'sushumna',l:'🔥  Sushumna window',sb:'Alert at nadi transition moments'}].map((r,i,arr)=>(
            <View key={r.k} style={[s.settingRow,i===arr.length-1&&{borderBottomWidth:0}]}>
              <View style={{flex:1}}><Text style={s.settingTitle}>{r.l}</Text><Text style={s.settingSub}>{r.sb}</Text></View>
              <Switch value={notifs[r.k]} onValueChange={()=>toggleNotif(r.k)} trackColor={{false:'#3a1a5a',true:C.purple}} thumbColor={notifs[r.k]?C.gold:'#6a4a8a'}/>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>🪐  Tattva Notifications</Text>
        <View style={s.settingCard}>
          {[{k:'prithvi',l:'🌍  Prithvi (Earth)',sb:'Stable, grounding energy'},{k:'apas',l:'💧  Apas (Water)',sb:'Flowing, creative energy'},{k:'tejas',l:'🔥  Tejas (Fire)',sb:'Intense — avoid new beginnings'},{k:'vayu',l:'🌬  Vayu (Air)',sb:'Movement energy'},{k:'akasha',l:'✨  Akasha (Ether)',sb:'Transcendent — meditation'}].map((r,i,arr)=>(
            <View key={r.k} style={[s.settingRow,i===arr.length-1&&{borderBottomWidth:0}]}>
              <View style={{flex:1}}><Text style={s.settingTitle}>{r.l}</Text><Text style={s.settingSub}>{r.sb}</Text></View>
              <Switch value={notifs[r.k]} onValueChange={()=>toggleNotif(r.k)} trackColor={{false:'#3a1a5a',true:C.purple}} thumbColor={notifs[r.k]?C.gold:'#6a4a8a'}/>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Text style={{color:C.gold,fontSize:14,fontWeight:'500'}}>{saved?'✅  Settings Applied!':'💾  Save & Apply'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── INNER APP ─────────────────────────────────────────────────────────────────
const DEFAULT_LAT = 25.3176, DEFAULT_LNG = 82.9739;

function InnerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isGhatika, setIsGhatika] = useState(false);
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState(() => {
    const calc = calcSunrise(DEFAULT_LAT, DEFAULT_LNG);
    return {
      city:'Varanasi', lat:DEFAULT_LAT, lng:DEFAULT_LNG,
      srH:6, srM:12, ssH:18, ssM:34,
      sunriseMin:calc.sunriseMin, sunsetMin:calc.sunsetMin,
      sunriseStr:calc.sunriseStr, sunsetStr:calc.sunsetStr,
      locationMode:'default', sunriseMode:'auto',
      notifs:{ ida:true, pingala:true, sushumna:false, prithvi:true, apas:true, tejas:false, vayu:false, akasha:true },
    };
  });

  const screens = {
    home:     <HomeScreen config={config} isGhatika={isGhatika}/>,
    svara:    <SvaraScreen/>,
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
  header:   { flexDirection:'row', alignItems:'center', backgroundColor:C.bgDeep, paddingHorizontal:14, paddingVertical:8, borderBottomWidth:0.5, borderColor:C.borderFaint, gap:8 },
  om:       { fontSize:24, color:C.gold },
  center:   { flex:1 },
  title:    { fontSize:15, fontWeight:'500', color:C.goldLight, letterSpacing:0.8 },
  subtitle: { fontSize:9, color:C.muted, marginTop:1 },
  right:    { alignItems:'flex-end' },
  timeLabel:{ fontSize:11, color:C.gold, fontWeight:'500' },
  sunLabel: { fontSize:9, color:C.muted, marginTop:1 },
  srcLabel: { fontSize:8, color:C.faint, marginTop:1 },
});

const td = StyleSheet.create({
  card:     { marginHorizontal:16, marginBottom:10, backgroundColor:C.bgCard, borderRadius:14, borderWidth:1, padding:14 },
  topRow:   { flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 },
  colorDot: { width:12, height:12, borderRadius:6 },
  name:     { fontSize:15, fontWeight:'500', color:C.goldLight },
  chakra:   { fontSize:10, color:C.muted, marginTop:2 },
  symbolBox:{ backgroundColor:'#2a1040', borderRadius:8, padding:6 },
  symbol:   { fontSize:11, fontWeight:'500' },
  divider:  { height:0.5, backgroundColor:C.border, marginBottom:10 },
  infoRow:  { flexDirection:'row' },
  infoItem: { alignItems:'center', flex:1 },
  infoLabel:{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 },
  infoVal:  { fontSize:11, fontWeight:'500' },
  desc:     { fontSize:11, color:'#a08ab0', lineHeight:17, marginTop:10 },
});

const s = StyleSheet.create({
  svaraCard:    { margin:16, marginBottom:10, backgroundColor:C.bgCard, borderRadius:16, borderWidth:0.5, borderColor:C.border, padding:16, alignItems:'center' },
  svaraLabel:   { fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:6 },
  svaraName:    { fontSize:22, fontWeight:'500', color:C.gold },
  svaraSanskrit:{ fontSize:13, color:C.faint, marginTop:2 },
  badge:        { marginTop:10, paddingVertical:4, paddingHorizontal:14, borderRadius:20, backgroundColor:C.purple, borderWidth:0.5, borderColor:C.purpleBorder },
  badgeText:    { fontSize:11, color:C.gold },
  tattvaRow:    { flexDirection:'row', marginHorizontal:16, marginBottom:10, gap:6 },
  tattvaPill:   { flex:1, backgroundColor:C.bgCard, borderWidth:0.5, borderColor:C.border, borderRadius:12, paddingVertical:10, alignItems:'center' },
  tattvaPillActive:{ backgroundColor:C.purple, borderColor:C.gold },
  tattvaIcon:   { fontSize:16, marginBottom:2 },
  tattvaName:   { fontSize:10, color:C.muted },
  ddRow:        { flexDirection:'row', marginHorizontal:16, marginBottom:10, gap:8 },
  ddBox:        { flex:1, borderRadius:14, padding:12, borderWidth:0.5 },
  ddHeader:     { fontSize:11, fontWeight:'500', textTransform:'uppercase', letterSpacing:1, marginBottom:8 },
  ddItem:       { flexDirection:'row', alignItems:'flex-start', gap:5, marginBottom:5 },
  ddDot:        { width:4, height:4, borderRadius:2, marginTop:5 },
  ddText:       { fontSize:10, lineHeight:16, flex:1 },
  verseCard:    { marginHorizontal:16, marginBottom:14, backgroundColor:C.bgCard, borderRadius:14, borderWidth:0.5, borderColor:C.border, padding:14 },
  verseLabel:   { fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:6 },
  verseText:    { fontSize:12, color:C.gold, lineHeight:20, fontStyle:'italic' },
  verseRef:     { fontSize:10, color:C.faint, marginTop:6 },
  screenHeader: { backgroundColor:C.bgDeep, paddingTop:20, paddingBottom:14, paddingHorizontal:20, borderBottomWidth:0.5, borderColor:C.borderFaint },
  screenTitle:  { fontSize:16, fontWeight:'500', color:C.goldLight },
  screenDesc:   { fontSize:11, color:C.muted, marginTop:2 },
  card:         { margin:14, backgroundColor:C.bgCard, borderRadius:14, borderWidth:0.5, borderColor:C.border, padding:14 },
  step:         { fontSize:12, color:'#a08ab0', marginBottom:10, lineHeight:20 },
  btnRow:       { flexDirection:'row', marginHorizontal:14, gap:8 },
  svaraBtn:     { flex:1, backgroundColor:C.bgCard, borderWidth:0.5, borderColor:C.border, borderRadius:14, paddingVertical:14, alignItems:'center', gap:4 },
  svaraBtnActive:{ backgroundColor:C.purple, borderColor:C.gold },
  svaraBtnIcon: { fontSize:22 },
  svaraBtnLabel:{ fontSize:12, color:C.muted },
  resultBox:    { margin:14, backgroundColor:C.purple, borderRadius:14, borderWidth:0.5, borderColor:C.gold, padding:14 },
  resultTitle:  { fontSize:13, color:C.gold, fontWeight:'500', marginBottom:6 },
  resultBody:   { fontSize:11, color:'#a08ab0', lineHeight:18 },
  dayCell:      { width:38, height:38, borderRadius:8, alignItems:'center', justifyContent:'center', borderWidth:0.5 },
  shlokaCard:   { backgroundColor:C.bgCard, borderWidth:0.5, borderColor:C.border, borderRadius:14, padding:14, marginBottom:10 },
  sectionLabel: { fontSize:10, color:C.faint, textTransform:'uppercase', letterSpacing:1.5 },
  settingCard:  { backgroundColor:C.bgCard, borderRadius:14, borderWidth:0.5, borderColor:C.border, overflow:'hidden' },
  settingRow:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:12, paddingHorizontal:14, borderBottomWidth:0.5, borderColor:'#3a1a5a' },
  settingTitle: { fontSize:13, color:C.goldLight },
  settingSub:   { fontSize:10, color:C.muted, marginTop:2 },
  saveBtn:      { alignItems:'center', justifyContent:'center', backgroundColor:C.purple, borderWidth:0.5, borderColor:C.gold, borderRadius:14, padding:14 },
  bottomNav:    { flexDirection:'row', backgroundColor:C.bg, borderTopWidth:0.5, borderColor:C.borderFaint, paddingTop:8 },
  navItem:      { flex:1, alignItems:'center', gap:3 },
  navIcon:      { fontSize:20 },
  navLabel:     { fontSize:9, color:C.fainter },
});

const ss = StyleSheet.create({
  modeBtn:      { flex:1, padding:8, borderRadius:8, backgroundColor:C.bgCard, borderWidth:0.5, borderColor:C.border, alignItems:'center' },
  modeBtnActive:{ backgroundColor:C.purple, borderColor:C.gold },
  modeBtnText:  { fontSize:11, color:C.muted },
  inputRow:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:12, paddingHorizontal:14, borderBottomWidth:0.5, borderColor:'#3a1a5a' },
  input:        { backgroundColor:C.bg, borderWidth:0.5, borderColor:C.border, borderRadius:8, color:C.gold, fontSize:13, paddingVertical:6, paddingHorizontal:10, minWidth:90, textAlign:'right' },
  timeRow:      { flexDirection:'row', alignItems:'center', gap:4 },
  timePart:     { width:44, textAlign:'center', minWidth:44 },
});
