import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, TextInput, Alert, StatusBar, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

// --- CONFIG ---
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
const TATTVAS_CLASSIC=[{id:'prithvi',name:'Prithvi',emoji:'🌍',classic:20,ghatika:24,color:'#8B5E3C',sense:'Smell',chakra:'Muladhara'},{id:'apas',name:'Apas',emoji:'💧',classic:16,ghatika:24,color:'#4a8ec2',sense:'Taste',chakra:'Svadhisthana'},{id:'tejas',name:'Tejas',emoji:'🔥',classic:12,ghatika:24,color:'#c2603a',sense:'Sight',chakra:'Manipura'},{id:'vayu',name:'Vayu',emoji:'💨',classic:8,ghatika:24,color:'#7ab89a',sense:'Touch',chakra:'Anahata'},{id:'akasha',name:'Akasha',emoji:'✨',classic:4,ghatika:24,color:'#8a6aaa',sense:'Sound',chakra:'Vishuddha'}];
const TATTVAS_GHATIKA=[...TATTVAS_CLASSIC].reverse();
const LUNAR_DAYS=[{day:1,nadi:'ida'},{day:2,nadi:'ida'},{day:3,nadi:'ida'},{day:4,nadi:'pingala'},{day:5,nadi:'pingala'},{day:6,nadi:'pingala'},{day:7,nadi:'ida'},{day:8,nadi:'ida'},{day:9,nadi:'ida'},{day:10,nadi:'pingala'},{day:11,nadi:'pingala'},{day:12,nadi:'pingala'},{day:13,nadi:'ida'},{day:14,nadi:'ida'},{day:15,nadi:'pingala'}];

// --- LOGICĂ ---
function calcSunrise(lat, lng) {
  return { sunriseMin: 360, sunriseStr: '06:00', sunsetStr: '18:00' };
}
function getLunarDay() { return { day: 1, paksha: 'shukla' }; }
function getSvara(sm, ld) { return 'ida'; }
function getTattva(sm, ig) { return TATTVAS_CLASSIC[0]; }

// --- COMPONENTE ECRANE ---
const HomeScreen = ({ config, isGhatika }) => (
  <ScrollView style={{ flex: 1 }}>
    <View style={s.svaraCard}>
      <Text style={s.svaraLabel}>Active Svara Now</Text>
      <Text style={s.svaraName}>Ida Nadi</Text>
      <Text style={s.svaraSanskrit}>इड़ा नाड़ी · Left</Text>
    </View>
    <View style={td.card}>
      <Text style={td.name}>🌍 Prithvi Tattva</Text>
      <Text style={td.desc}>Stabilitate și concentrare. Ideal pentru începuturi durabile.</Text>
    </View>
  </ScrollView>
);

const SettingsScreen = ({ isGhatika, setIsGhatika }) => (
  <View style={{ padding: 20 }}>
    <Text style={s.screenTitle}>Settings</Text>
    <View style={s.settingRow}>
      <Text style={{ color: '#fff' }}>Ghatika Mode (24m)</Text>
      <Switch value={isGhatika} onValueChange={setIsGhatika} />
    </View>
  </View>
);

// --- APP ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isGhatika, setIsGhatika] = useState(false);
  const [config, setConfig] = useState({ sunriseMin: 360, sunriseStr: '06:00' });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        const sun = calcSunrise(loc.coords.latitude, loc.coords.longitude);
        setConfig(prev => ({ ...prev, ...sun }));
      }
    })();
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen config={config} isGhatika={isGhatika} />;
      case 'settings': return <SettingsScreen isGhatika={isGhatika} setIsGhatika={setIsGhatika} />;
      default: return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text style={{color:'#fff'}}>Screen: {activeTab}</Text></View>;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: 50 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1 }}>{renderScreen()}</View>
      <View style={s.bottomNav}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} style={s.navItem} onPress={() => setActiveTab(t.id)}>
            <Text style={{ fontSize: 20 }}>{t.icon}</Text>
            <Text style={[s.navLabel, activeTab === t.id && { color: C.gold }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// --- STILURI ---
const s = StyleSheet.create({
  bottomNav: { flexDirection: 'row', backgroundColor: C.bgDeep, paddingBottom: 30, paddingTop: 10, borderTopWidth: 0.5, borderColor: C.borderFaint },
  navItem: { flex: 1, alignItems: 'center' },
  navLabel: { fontSize: 9, color: C.fainter },
  svaraCard: { margin: 16, backgroundColor: C.bgCard, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  svaraLabel: { fontSize: 10, color: C.muted, textTransform: 'uppercase' },
  svaraName: { fontSize: 24, color: C.gold, fontWeight: '600', marginTop: 5 },
  svaraSanskrit: { fontSize: 14, color: C.faint, marginTop: 2 },
  screenTitle: { color: C.goldLight, fontSize: 18, fontWeight: '500', marginBottom: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.bgCard, padding: 15, borderRadius: 12 }
});

const td = StyleSheet.create({
  card: { margin: 16, backgroundColor: C.bgCard, borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: C.gold },
  name: { color: C.goldLight, fontSize: 16, fontWeight: '500' },
  desc: { color: '#a08ab0', fontSize: 12, marginTop: 8, lineHeight: 18 }
});
