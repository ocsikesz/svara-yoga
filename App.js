import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, TextInput, Alert, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

// ── CONFIGURARE TEMA ────────────────────────────────────────────────────────
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
  { id:'home', label:'Home', icon:'🏠' },
  { id:'svara', label:'Svara', icon:'🌬️' },
  { id:'lunar', label:'Lunar', icon:'🌙' },
  { id:'shlokas', label:'Shlokas', icon:'📖' },
  { id:'settings', label:'Settings', icon:'⚙️' },
];

const TATTVAS_CLASSIC = [
  { id:'prithvi', name:'Prithvi', emoji:'🌍', classic:20, ghatika:24, color:'#8B5E3C', sense:'Smell · Gandha', chakra:'Muladhara · Root', symbol:'Square', description:'Earth element brings stability and endurance. Ideal for long-term planning.' },
  { id:'apas', name:'Apas', emoji:'💧', classic:16, ghatika:24, color:'#4a8ec2', sense:'Taste · Rasa', chakra:'Svadhisthana · Sacral', symbol:'Crescent', description:'Water element brings flow and auspiciousness.' },
  { id:'tejas', name:'Tejas', emoji:'🔥', classic:12, ghatika:24, color:'#c2603a', sense:'Sight · Rupa', chakra:'Manipura · Solar Plexus', symbol:'Triangle', description:'Fire element brings transformation. Use for fierce activity.' },
  { id:'vayu', name:'Vayu', emoji:'🌬️', classic:8, ghatika:24, color:'#7ab89a', sense:'Touch · Sparsha', chakra:'Anahata · Heart', symbol:'Hexagon', description:'Air element brings movement and change.' },
  { id:'akasha', name:'Akasha', emoji:'✨', classic:4, ghatika:24, color:'#8a6aaa', sense:'Sound · Shabda', chakra:'Vishuddha · Throat', symbol:'Circle', description:'Ether element is transcendent. Use only for meditation.' },
];
const TATTVAS_GHATIKA = [
  { id:'akasha', name:'Akasha', emoji:'✨', classic:4, ghatika:24, color:'#8a6aaa', sense:'Sound · Shabda', chakra:'Vishuddha · Throat', symbol:'Circle', description:'Ether element is transcendent.' },
  { id:'vayu', name:'Vayu', emoji:'🌬️', classic:8, ghatika:24, color:'#7ab89a', sense:'Touch · Sparsha', chakra:'Anahata · Heart', symbol:'Hexagon', description:'Air element brings movement.' },
  { id:'tejas', name:'Tejas', emoji:'🔥', classic:12, ghatika:24, color:'#c2603a', sense:'Sight · Rupa', chakra:'Manipura · Solar Plexus', symbol:'Triangle', description:'Fire element brings transformation.' },
  { id:'apas', name:'Apas', emoji:'💧', classic:16, ghatika:24, color:'#4a8ec2', sense:'Taste · Rasa', chakra:'Svadhisthana · Sacral', symbol:'Crescent', description:'Water element brings flow.' },
  { id:'prithvi', name:'Prithvi', emoji:'🌍', classic:20, ghatika:24, color:'#8B5E3C', sense:'Smell · Gandha', chakra:'Muladhara · Root', symbol:'Square', description:'Earth element brings stability.' },
];

const SHLOKAS = [
  { verse:9, topic:'Supreme Knowledge', sanskrit:'स्वरे शास्त्राणि विद्यन्ते', meaning:'In svara lies all knowledge. Svara is the essence of the Vedas.' },
  { verse:47, topic:'Ida vs Pingala', sanskrit:'इडायां शुभकार्याणि', meaning:'During Ida, perform auspicious deeds. During Pingala, undertake fierce activities.' },
  { verse:116, topic:'Sushumna', sanskrit:'सुषुम्नायां न कार्याणि', meaning:'During Sushumna, avoid worldly tasks. Use this moment for meditation.' },
];

const LUNAR_DAYS = [{day:1,nadi:'ida'},{day:2,nadi:'ida'},{day:3,nadi:'ida'},{day:4,nadi:'pingala'},{day:5,nadi:'pingala'},{day:6,nadi:'pingala'},{day:7,nadi:'ida'},{day:8,nadi:'ida'},{day:9,nadi:'ida'},{day:10,nadi:'pingala'},{day:11,nadi:'pingala'},{day:12,nadi:'pingala'},{day:13,nadi:'ida'},{day:14,nadi:'ida'},{day:15,nadi:'pingala'}];

// ── UTILS ─────────────────────────────────────────────────────────────────────
function calcSunrise(lat, lng) {
  const rad = Math.PI / 180;
  const d = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  const B = (360/365)*(d-81)*rad;
  const eot = 9.87*Math.sin(2*B) - 7.53*Math.cos(B) - 1.5*Math.sin(B);
  const ha = Math.acos(-Math.tan(lat*rad)*Math.tan(23.45*rad*Math.sin(B))) / rad;
  const sunriseMin = 720 - 4*ha - eot + (4*(lng%15));
  const toStr = m => { const h=Math.floor(m/60)%24; const mn=Math.floor(m%60); return `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}`; };
  return { sunriseMin, sunriseStr: toStr(sunriseMin), sunsetStr: toStr(sunriseMin+720) };
}

function getLunarDay() {
  const diff = (new Date() - new Date('2024-01-11T11:57:00Z')) / 86400000;
  const cycle = diff % 29.53;
  return { day: Math.floor(cycle % 15) + 1, paksha: cycle < 15 ? 'shukla' : 'krishna' };
}

function getSvara(sm, ld) {
  const nm = new Date().getHours()*60 + new Date().getMinutes();
  const mfs = nm - sm; if (mfs < 0 || mfs > 720) return 'sushumna';
  const pos = mfs % 120; if (pos < 2 || (pos >= 60 && pos < 62)) return 'sushumna';
  const sn = LUNAR_DAYS.find(d => d.day === ld)?.nadi || 'ida';
  return pos < 60 ? sn : (sn === 'ida' ? 'pingala' : 'ida');
}

function getTattva(sm, ig) {
  const seq = ig ? TATTVAS_GHATIKA : TATTVAS_CLASSIC;
  const nm = new Date().getHours()*60 + new Date().getMinutes();
  const mfs = Math.max(0, nm - sm) % (ig ? 120 : 60);
  let el = 0; for(const t of seq){ el += ig ? t.ghatika : t.classic; if(mfs < el) return t; }
  return seq[0];
}

// ── ECRANE ───────────────────────────────────────────────────────────────────
function HomeScreen({ config, isGhatika }) {
  const lunar = getLunarDay();
  const svara = getSvara(config.sunriseMin, lunar.day);
  const activeT = getTattva(config.sunriseMin, isGhatika);
  const SM = { ida: { n:'Ida Nadi', s:'🌙 Left Nostril', t:'Cooling · Lunar' }, pingala: { n:'Pingala Nadi', s:'☀️ Right Nostril', t:'Warming · Solar' }, sushumna: { n:'Sushumna', s:'🔥 Both Nostrils', t:'Sacred · Neutral' } };

  return (
    <ScrollView style={{flex:1}}>
      <View style={hd.header}>
        <Text style={hd.om}>ॐ</Text>
        <View style={hd.center}><Text style={hd.title}>Svara Yoga</Text><Text style={hd.subtitle}>{lunar.paksha.toUpperCase()} · Day {lunar.day}</Text></View>
        <View style={hd.right}><Text style={hd.timeLabel}>🌅 {config.sunriseStr}</Text></View>
      </View>
      <View style={s.svaraCard}>
        <Text style={s.svaraLabel}>Active Svara</Text>
        <Text style={s.svaraName}>{SM[svara].n}</Text>
        <Text style={s.svaraSanskrit}>{SM[svara].s}</Text>
        <View style={s.badge}><Text style={s.badgeText}>{SM[svara].t}</Text></View>
      </View>
      <View style={[td.card, {borderColor: activeT.color}]}>
        <View style={td.topRow}><View style={[td.colorDot, {backgroundColor: activeT.color}]}/><Text style={td.name}>{activeT.emoji} {activeT.name}</Text></View>
        <View style={td.infoRow}><View style={td.infoItem}><Text style={td.infoLabel}>Sense</Text><Text style={[td.infoVal,{color:activeT.color}]}>{activeT.sense}</Text></View><View style={td.infoItem}><Text style={td.infoLabel}>Chakra</Text><Text style={[td.infoVal,{color:activeT.color}]}>{activeT.chakra}</Text></View></View>
        <Text style={td.desc}>{activeT.description}</Text>
      </View>
    </ScrollView>
  );
}

function LunarScreen() {
  const ld = getLunarDay();
  return (
    <View style={s.p20}>
      <Text style={s.screenTitle}>Lunar Cycle Guide</Text>
      <View style={s.card}>
        <Text style={{color:C.gold, fontSize:32, textAlign:'center'}}>{ld.paksha==='shukla'?'🌙':'🌑'}</Text>
        <Text style={{color:'#fff', textAlign:'center', marginTop:10}}>{ld.paksha.toUpperCase()} Phase - Day {ld.day}</Text>
      </View>
    </View>
  );
}

function ShlokasScreen() {
  return (
    <ScrollView style={s.p20}>
      <Text style={s.screenTitle}>Shlokas & Teachings</Text>
      {SHLOKAS.map((sh,i) => (
        <View key={i} style={s.shlokaCard}>
          <Text style={{color:C.gold, fontSize:10}}>Verse {sh.verse}</Text>
          <Text style={{color:C.goldLight, fontStyle:'italic', marginVertical:5}}>{sh.sanskrit}</Text>
          <Text style={{color:C.muted, fontSize:12}}>{sh.meaning}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ── INNER APP ─────────────────────────────────────────────────────────────────
function InnerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isGhatika, setIsGhatika] = useState(false);
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState({ sunriseMin: 360, sunriseStr: '06:00', sunsetStr: '18:00' });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setConfig(prev => ({ ...prev, ...calcSunrise(loc.coords.latitude, loc.coords.longitude) }));
      }
    })();
  }, []);

  const renderScreen = () => {
    switch(activeTab) {
      case 'home': return <HomeScreen config={config} isGhatika={isGhatika} />;
      case 'lunar': return <LunarScreen />;
      case 'shlokas': return <ShlokasScreen />;
      case 'settings': return (
        <View style={s.p20}>
          <Text style={s.screenTitle}>Settings</Text>
          <View style={s.settingRow}><Text style={{color:'#fff'}}>Ghatika Mode (24m)</Text><Switch value={isGhatika} onValueChange={setIsGhatika} /></View>
        </View>
      );
      default: return <HomeScreen config={config} isGhatika={isGhatika} />;
    }
  };

  return (
    <View style={{flex:1, backgroundColor:C.bg, paddingTop: insets.top}}>
      <StatusBar barStyle="light-content" />
      <View style={{flex:1}}>{renderScreen()}</View>
      <View style={[s.bottomNav, {paddingBottom: insets.bottom + 10}]}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} style={s.navItem} onPress={() => setActiveTab(t.id)}>
            <Text style={{fontSize:20}}>{t.icon}</Text>
            <Text style={[s.navLabel, activeTab === t.id && {color: C.gold}]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  return <SafeAreaProvider><InnerApp /></SafeAreaProvider>;
}

// ── STYLES ───────────────────────────────────────────────────────────────────
const hd = StyleSheet.create({
  header: { flexDirection:'row', alignItems:'center', backgroundColor:C.bgDeep, padding:14, borderBottomWidth:0.5, borderColor:C.borderFaint },
  om: { fontSize:24, color:C.gold, marginRight:10 },
  center: { flex:1 },
  title: { fontSize:15, fontWeight:'500', color:C.goldLight },
  subtitle: { fontSize:9, color:C.muted },
  right: { alignItems:'flex-end' },
  timeLabel: { fontSize:11, color:C.gold }
});

const td = StyleSheet.create({
  card: { margin:16, backgroundColor:C.bgCard, borderRadius:14, borderWidth:1, padding:14 },
  topRow: { flexDirection:'row', alignItems:'center', marginBottom:10 },
  colorDot: { width:12, height:12, borderRadius:6, marginRight:10 },
  name: { fontSize:16, fontWeight:'bold', color:C.goldLight },
  infoRow: { flexDirection:'row', marginVertical:10 },
  infoItem: { flex:1 },
  infoLabel: { fontSize:9, color:C.muted },
  infoVal: { fontSize:11, color:C.gold },
  desc: { fontSize:12, color:'#a08ab0', lineHeight:18 }
});

const s = StyleSheet.create({
  p20: { padding:20 },
  card: { backgroundColor:C.bgCard, padding:20, borderRadius:15, borderWidth:1, borderColor:C.border },
  screenTitle: { color:C.gold, fontSize:20, fontWeight:'bold', marginBottom:20 },
  svaraCard: { margin:16, backgroundColor:C.bgCard, borderRadius:16, padding:20, alignItems:'center', borderWidth:0.5, borderColor:C.border },
  svaraLabel: { fontSize:10, color:C.muted, textTransform:'uppercase' },
  svaraName: { fontSize:22, color:C.gold, fontWeight:'600' },
  svaraSanskrit: { fontSize:13, color:C.faint },
  badge: { marginTop:10, paddingHorizontal:12, paddingVertical:4, backgroundColor:C.purple, borderRadius:20 },
  badgeText: { color:C.gold, fontSize:11 },
  shlokaCard: { backgroundColor:C.bgCard, padding:15, borderRadius:12, marginBottom:10, borderWidth:0.5, borderColor:C.border },
  bottomNav: { flexDirection:'row', backgroundColor:C.bgDeep, paddingTop:10, borderTopWidth:0.5, borderColor:C.borderFaint },
  navItem: { flex:1, alignItems:'center' },
  navLabel: { fontSize:9, color:C.fainter, marginTop:4 },
  settingRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:C.bgCard, padding:15, borderRadius:12 }
});
