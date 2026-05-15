import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, TextInput, Alert, StatusBar, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

// --- CONFIGURARE NOTIFICARI ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
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

const TABS=[{id:'home',label:'Home',icon:'🏠'},{id:'svara',label:'Svara',icon:'🌬️'},{id:'lunar',label:'Lunar',icon:'🌙'},{id:'shlokas',label:'Shlokas',icon:'📖'},{id:'settings',label:'Settings',icon:'⚙️'}];
const TATTVAS_CLASSIC=[{id:'prithvi',name:'Prithvi',emoji:'🌍',classic:20,ghatika:24,color:'#8B5E3C',sense:'Smell · Gandha',chakra:'Muladhara · Root',symbol:'Square',description:'Earth element brings stability and endurance.'},{id:'apas',name:'Apas',emoji:'💧',classic:16,ghatika:24,color:'#4a8ec2',sense:'Taste · Rasa',chakra:'Svadhisthana · Sacral',symbol:'Crescent',description:'Water element brings flow and auspiciousness.'},{id:'tejas',name:'Tejas',emoji:'🔥',classic:12,ghatika:24,color:'#c2603a',sense:'Sight · Rupa',chakra:'Manipura · Solar Plexus',symbol:'Triangle',description:'Fire element brings transformation.'},{id:'vayu',name:'Vayu',emoji:'💨',classic:8,ghatika:24,color:'#7ab89a',sense:'Touch · Sparsha',chakra:'Anahata · Heart',symbol:'Hexagon',description:'Air element brings movement and change.'},{id:'akasha',name:'Akasha',emoji:'✨',classic:4,ghatika:24,color:'#8a6aaa',sense:'Sound · Shabda',chakra:'Vishuddha · Throat',symbol:'Circle',description:'Ether element is transcendent.'}];
const TATTVAS_GHATIKA=[...TATTVAS_CLASSIC].reverse();
const SHLOKAS=[{verse:9,topic:'Svara as Supreme Knowledge',sanskrit:'स्वरे शास्त्राणि विद्यन्ते',meaning:'In svara lies all knowledge.'},{verse:47,topic:'Ida vs Pingala',sanskrit:'इडायां शुभकार्याणि',meaning:'During Ida, perform auspicious deeds.'},{verse:82,topic:'Pancha Tattva',sanskrit:'पृथ्वी-तत्त्वे स्थिरं कार्यं',meaning:'Earth gives stability.'},{verse:116,topic:'Sushumna',sanskrit:'सुषुम्नायां न कार्याणि',meaning:'During Sushumna, use this moment for meditation only.'}];
const LUNAR_DAYS=[{day:1,nadi:'ida'},{day:2,nadi:'ida'},{day:3,nadi:'ida'},{day:4,nadi:'pingala'},{day:5,nadi:'pingala'},{day:6,nadi:'pingala'},{day:7,nadi:'ida'},{day:8,nadi:'ida'},{day:9,nadi:'ida'},{day:10,nadi:'pingala'},{day:11,nadi:'pingala'},{day:12,nadi:'pingala'},{day:13,nadi:'ida'},{day:14,nadi:'ida'},{day:15,nadi:'pingala'}];

// --- LOGICA MATEMATICA ---
function calcSunrise(lat,lng,date=new Date()){const r=Math.PI/180;const d=Math.floor((date-new Date(date.getFullYear(),0,0))/86400000);const B=(360/365)*(d-81)*r;const e=9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B);const h=Math.acos(-Math.tan(lat*r)*Math.tan(23.45*r*Math.sin(B)))/r;const l=4*(lng%15);const sm=720-4*h-e+l;const ss=720+4*h-e+l;const f=m=>{const hh=Math.floor(m/60)%24;const mm=Math.floor(m%60);return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');};return{sunriseMin:sm,sunsetMin:ss,sunriseStr:f(sm),sunsetStr:f(ss)};}
function getLunarDay(){const s=29.53058867;const k=new Date('2024-01-11T11:57:00Z');const d=(new Date()-k)/86400000;const c=((d%s)+s)%s;if(c<15)return{day:Math.floor(c)+1,paksha:'shukla'};return{day:Math.floor(c-15)+1,paksha:'krishna'};}
function getSvara(sm,ld){const n=new Date();const nm=n.getHours()*60+n.getMinutes();const mfs=nm-sm;if(mfs<0||mfs>720)return'sushumna';const cp=mfs%120;if(cp<2||(cp>=60&&cp<62))return'sushumna';const e=LUNAR_DAYS.find(d=>d.day===ld);const sn=e?e.nadi:'ida';return cp<60?sn:sn==='ida'?'pingala':'ida';}
function getTattva(sm,ig){const seq=ig?TATTVAS_GHATIKA:TATTVAS_CLASSIC;const n=new Date();const nm=n.getHours()*60+n.getMinutes();const mfs=nm-sm;if(mfs<0)return seq[0];const cd=ig?120:60;const pos=mfs%cd;let el=0;for(const t of seq){el+=ig?t.ghatika:t.classic;if(pos<el)return t;}return seq[seq.length-1];}
function getProgress(sm,ig,tattva){const seq=ig?TATTVAS_GHATIKA:TATTVAS_CLASSIC;const n=new Date();const nm=n.getHours()*60+n.getMinutes();const mfs=nm-sm;const cd=ig?120:60;const pos=mfs<0?0:mfs%cd;let el=0;for(const t of seq){const dur=ig?t.ghatika:t.classic;if(t.id===tattva.id){const ti=pos-el;return{remaining:Math.max(0,Math.round(dur-ti)),duration:dur,percent:Math.min(100,Math.max(0,(ti/dur)*100))};}el+=dur;}return{remaining:0,duration:0,percent:0};}

// --- COMPONENTE ECRANE ---
function HomeScreen({config,isGhatika}){
  const{sunriseMin,sunriseStr,sunsetStr}=config;
  const lunar=getLunarDay();
  const[svara,setSvara]=useState(()=>getSvara(sunriseMin,lunar.day));
  const[at,setAt]=useState(()=>getTattva(sunriseMin,isGhatika));
  const[prog,setProg]=useState(()=>getProgress(sunriseMin,isGhatika,at));
  const[now,setNow]=useState(new Date());

  useEffect(()=>{
    const tick=()=>{
      const l=getLunarDay();
      const t=getTattva(sunriseMin,isGhatika);
      setSvara(getSvara(sunriseMin,l.day));
      setAt(t);
      setProg(getProgress(sunriseMin,isGhatika,t));
      setNow(new Date());
    };
    const id=setInterval(tick,10000);
    return()=>clearInterval(id);
  },[sunriseMin,isGhatika]);

  const timeStr=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});
  const seq=isGhatika?TATTVAS_GHATIKA:TATTVAS_CLASSIC;
  const nextT=seq[(seq.findIndex(t=>t.id===at.id)+1)%seq.length];
  const SM={ida:{name:'Ida Nadi',sanskrit:'इड़ा नाड़ी · Left',tag:'🌙 Lunar'},pingala:{name:'Pingala Nadi',sanskrit:'पिङ्गला · Right',tag:'☀️ Solar'},sushumna:{name:'Sushumna',sanskrit:'सुषुम्ना · Neutral',tag:'🔥 Central'}};
  const sm2=SM[svara] || SM.sushumna;

  return(
    <View style={{flex:1,backgroundColor:C.bg}}>
      <View style={hd.header}>
        <Text style={hd.om}>ॐ</Text>
        <View style={hd.center}><Text style={hd.title}>Svara Yoga</Text><Text style={hd.subtitle}>{lunar.paksha.toUpperCase()} · D{lunar.day}</Text></View>
        <View style={hd.right}><Text style={hd.timeLabel}>🕐 {timeStr}</Text><Text style={hd.sunLabel}>🌅 {sunriseStr}</Text></View>
      </View>
      <ScrollView>
        <View style={s.svaraCard}><Text style={s.svaraLabel}>Active Svara Now</Text><Text style={s.svaraName}>{sm2.name}</Text><Text style={s.svaraSanskrit}>{sm2.sanskrit}</Text><View style={s.badge}><Text style={s.badgeText}>{sm2.tag}</Text></View></View>
        <View style={s.tattvaRow}>{seq.map(t=>(<View key={t.id} style={[s.tattvaPill,at.id===t.id&&s.tattvaPillActive]}><Text style={s.tattvaIcon}>{t.emoji}</Text><Text style={[s.tattvaName,at.id===t.id&&{color:C.gold}]}>{t.name}</Text></View>))}</View>
        <View style={[td.card,{borderColor:at.color}]}>
          <View style={td.topRow}><View style={[td.colorDot,{backgroundColor:at.color}]}/><Text style={td.name}>{at.emoji} {at.name}</Text></View>
          <View style={td.infoRow}><View style={td.infoItem}><Text style={td.infoLabel}>Remaining</Text><Text style={[td.infoVal,{color:at.color}]}>{prog.remaining} min</Text></View></View>
          <View style={{height:4,backgroundColor:'#2a1040',borderRadius:2,marginTop:10}}><View style={{height:4,width:prog.percent+'%',backgroundColor:at.color,borderRadius:2}}/></View>
          <Text style={td.desc}>{at.description}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SvaraScreen(){return(<View style={{flex:1,backgroundColor:C.bg}}><Text style={s.screenTitle}>Svara Identifier</Text></View>);}
function LunarScreen(){return(<View style={{flex:1,backgroundColor:C.bg}}><Text style={s.screenTitle}>Lunar Cycle</Text></View>);}
function ShlokasScreen(){return(<View style={{flex:1,backgroundColor:C.bg}}><Text style={s.screenTitle}>Shlokas</Text></View>);}

function SettingsScreen({config,setConfig,isGhatika,setIsGhatika}){
  return(
    <View style={{flex:1,backgroundColor:C.bg, padding: 20}}>
       <Text style={s.sectionLabel}>Tattva System</Text>
       <View style={s.settingRow}>
          <Text style={{color: '#fff'}}>Ghatika Mode (24m)</Text>
          <Switch value={isGhatika} onValueChange={setIsGhatika} />
       </View>
    </View>
  );
}

// --- APP ENTRY POINT ---
export default function App(){
  const[activeTab,setActiveTab]=useState('home');
  const[isGhatika,setIsGhatika]=useState(false);
  const[config,setConfig]=useState({
    city:'București',lat:44.4268,lng:26.1025,
    sunriseMin:360,sunsetMin:1080,sunriseStr:'06:00',sunsetStr:'18:00',
    locationMode:'default',notifs:{}
  });

  useEffect(()=>{
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        const sun = calcSunrise(loc.coords.latitude, loc.coords.longitude);
        setConfig(prev => ({...prev, lat: loc.coords.latitude, lng: loc.coords.longitude, ...sun}));
      }
      await Notifications.requestPermissionsAsync();
    })();
  }, []);

  const renderScreen=()=>{
    switch(activeTab){
      case 'home':return<HomeScreen config={config} isGhatika={isGhatika}/>;
      case 'svara':return<SvaraScreen/>;
      case 'lunar':return<LunarScreen/>;
      case 'shlokas':return<ShlokasScreen/>;
      case 'settings':return<SettingsScreen config={config} setConfig={setConfig} isGhatika={isGhatika} setIsGhatika={setIsGhatika}/>;
      default:return<HomeScreen config={config} isGhatika={isGhatika}/>;
    }
  };

  return(
    <View style={{flex:1,backgroundColor:C.bg,paddingTop: Platform.OS === 'ios' ? 50 : 10}}>
      <StatusBar barStyle="light-content" />
      <View style={{flex:1}}>{renderScreen()}</View>
      <View style={s.bottomNav}>
        {TABS.map(t=>(<TouchableOpacity key={t.id} style={s.navItem} onPress={()=>setActiveTab(t.id)}><Text style={s.navIcon}>{t.icon}</Text><Text style={[s.navLabel,activeTab===t.id&&{color:C.gold}]}>{t.label}</Text></TouchableOpacity>))}
      </View>
    </View>
  );
}

// --- STILURI ---
const s = StyleSheet.create({
  svaraCard: { margin: 16, backgroundColor: C.bgCard, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 0.5, borderColor: C.border },
  svaraLabel: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  svaraName: { fontSize: 22, color: C.gold, fontWeight: '500', marginTop: 5 },
  svaraSanskrit: { fontSize: 13, color: C.faint, marginTop: 2 },
  badge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: C.purple, borderRadius: 20 },
  badgeText: { color: C.gold, fontSize: 11 },
  tattvaRow: { flexDirection: 'row', marginHorizontal: 16, gap: 5, marginBottom: 10 },
  tattvaPill: { flex: 1, backgroundColor: C.bgCard, padding: 8, borderRadius: 10, alignItems: 'center', borderWidth: 0.5, borderColor: C.border },
  tattvaPillActive: { borderColor: C.gold, backgroundColor: C.purple },
  tattvaIcon: { fontSize: 16 },
  tattvaName: { fontSize: 9, color: C.muted },
  bottomNav: { flexDirection: 'row', backgroundColor: C.bgDeep, paddingBottom: 25, paddingTop: 10, borderTopWidth: 0.5, borderColor: C.borderFaint },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 9, color: C.fainter },
  screenTitle: { color: C.gold, fontSize: 18, textAlign: 'center', marginTop: 20 },
  sectionLabel: { color: C.muted, fontSize: 12, marginBottom: 10 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.bgCard, padding: 15, borderRadius: 10 }
});
