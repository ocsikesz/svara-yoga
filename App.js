import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, TextInput, Alert, StatusBar, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

// 1. Configurare Notificări
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
const TATTVAS_CLASSIC=[{id:'prithvi',name:'Prithvi',emoji:'🌍',classic:20,ghatika:24,color:'#8B5E3C',description:'Earth element brings stability.'},{id:'apas',name:'Apas',emoji:'💧',classic:16,ghatika:24,color:'#4a8ec2',description:'Water element brings flow.'},{id:'tejas',name:'Tejas',emoji:'🔥',classic:12,ghatika:24,color:'#c2603a',description:'Fire element brings transformation.'},{id:'vayu',name:'Vayu',emoji:'💨',classic:8,ghatika:24,color:'#7ab89a',description:'Air element brings movement.'},{id:'akasha',name:'Akasha',emoji:'✨',classic:4,ghatika:24,color:'#8a6aaa',description:'Ether element is transcendent.'}];
const TATTVAS_GHATIKA=[...TATTVAS_CLASSIC].reverse();
const LUNAR_DAYS=[{day:1,nadi:'ida'},{day:2,nadi:'ida'},{day:3,nadi:'ida'},{day:4,nadi:'pingala'},{day:5,nadi:'pingala'},{day:6,nadi:'pingala'},{day:7,nadi:'ida'},{day:8,nadi:'ida'},{day:9,nadi:'ida'},{day:10,nadi:'pingala'},{day:11,nadi:'pingala'},{day:12,nadi:'pingala'},{day:13,nadi:'ida'},{day:14,nadi:'ida'},{day:15,nadi:'pingala'}];

// Funcții de calcul
function calcSunrise(lat,lng){
  const f=m=>{
    const hh=Math.floor(m/60)%24;
    const mm=Math.floor(m%60);
    return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
  };
  return {sunriseMin:360, sunsetMin:1080, sunriseStr:'06:00', sunsetStr:'18:00'}; 
}
function getLunarDay(){ return {day:1, paksha:'shukla'}; }
function getSvara(sm,ld){ return 'ida'; }
function getTattva(sm,ig){ return TATTVAS_CLASSIC[0]; }
function getProgress(){ return {remaining:10, percent:50}; }

// Ecranul Home
function HomeScreen({config, isGhatika}){
  const lunar = getLunarDay();
  const at = getTattva(config.sunriseMin, isGhatika);
  const prog = getProgress();
  return (
    <View style={s.container}><Text style={{color:C.gold, textAlign:'center', marginTop:20}}>Svara Yoga Active</Text></View>
  );
}

// APP PRINCIPAL
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isGhatika, setIsGhatika] = useState(false);
  const [config, setConfig] = useState({
    sunriseMin: 360, sunriseStr: '06:00', sunsetStr: '18:00'
  });

  useEffect(() => {
    (async () => {
      try {
        const { status: lStatus } = await Location.requestForegroundPermissionsAsync();
        if (lStatus === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          // Update config here
        }
        await Notifications.requestPermissionsAsync();
      } catch (e) {
        console.log("Error loading location", e);
      }
    })();
  }, []);

  return (
    <View style={{flex:1, backgroundColor:C.bg, paddingTop:50}}>
      <HomeScreen config={config} isGhatika={isGhatika} />
      <View style={s.bottomNav}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} style={s.navItem} onPress={() => setActiveTab(t.id)}>
            <Text style={{fontSize:20}}>{t.icon}</Text>
            <Text style={[s.navLabel, activeTab === t.id && {color:C.gold}]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// STILURI COMPLETE (Verificate)
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  bottomNav: { flexDirection: 'row', backgroundColor: C.bgDeep, paddingBottom: 25, paddingTop: 10, borderTopWidth: 0.5, borderColor: C.borderFaint },
  navItem: { flex: 1, alignItems: 'center' },
  navLabel: { fontSize: 9, color: C.fainter },
  svaraCard: { margin: 16, backgroundColor: C.bgCard, borderRadius: 16, padding: 16, alignItems: 'center' },
  svaraLabel: { fontSize: 10, color: C.muted }
});
