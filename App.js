import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, TextInput, Alert, Platform, Image } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as RNIap from 'react-native-iap';
import { C, hd, td, s, tl, ss } from './src/constants/theme';
import { PREMIUM_SKU, TABS, TATTVAS_CLASSIC, TATTVAS_GHATIKA, TATTVA_IMG, NADI_IMG, SHLOKAS, LUNAR_DAYS, RECOMMENDATIONS, DEFAULT_LAT, DEFAULT_LNG } from './src/constants/data';
import { calcSunrise, getLunarDay, getSvaraFromSunrise, getNextNadiChange, formatDuration, getTattvaFromSunrise, getTattvaTimeline, getTattvaProgress } from './src/utils/timeMath';
import AppHeader from './src/components/AppHeader';
import SvaraScreen from './src/screens/SvaraScreen';
import LunarScreen from './src/screens/LunarScreen';
import TimelineScreen from './src/screens/TimelineScreen';
import HomeScreen from './src/screens/HomeScreen';

// IAP product ID — must match the SKU created in Google Play Console.
// Single non-consumable product (one-time premium unlock, no subscription).

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});



// Logo + page subtitle + current time, shown on every screen.

// ── HOME ──────────────────────────────────────────────────────────────────────

// ── SVARA ─────────────────────────────────────────────────────────────────────

// ── LUNAR ─────────────────────────────────────────────────────────────────────

// ── TIMELINE ──────────────────────────────────────────────────────────────────
function SettingsScreen({ config, setConfig, isGhatika, setIsGhatika, isPremium, iapPrice, iapBusy, requestPremium, restorePremium }) {
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
  // Notifications: support per-nadi/per-tattva granularity.
  // Legacy users have notifs.nadi/tattva as booleans → normalize to per-id maps.
  const normalizeNotifs = (n) => ({
    nadi:   typeof n?.nadi === 'object' && n.nadi !== null
              ? { ida:!!n.nadi.ida, pingala:!!n.nadi.pingala, sushumna:!!n.nadi.sushumna }
              : { ida:n?.nadi!==false, pingala:n?.nadi!==false, sushumna:n?.nadi!==false },
    tattva: typeof n?.tattva === 'object' && n.tattva !== null
              ? { akasha:!!n.tattva.akasha, vayu:!!n.tattva.vayu, tejas:!!n.tattva.tejas, apas:!!n.tattva.apas, prithvi:!!n.tattva.prithvi }
              : { akasha:n?.tattva!==false, vayu:n?.tattva!==false, tejas:n?.tattva!==false, apas:n?.tattva!==false, prithvi:n?.tattva!==false },
  });
  const [notifs,  setNotifs]  = useState(() => normalizeNotifs(config.notifs));
  const nadiAllOn   = notifs.nadi.ida && notifs.nadi.pingala && notifs.nadi.sushumna;
  const tattvaAllOn = notifs.tattva.akasha && notifs.tattva.vayu && notifs.tattva.tejas && notifs.tattva.apas && notifs.tattva.prithvi;
  const nadiAnyOn   = notifs.nadi.ida || notifs.nadi.pingala || notifs.nadi.sushumna;
  const tattvaAnyOn = notifs.tattva.akasha || notifs.tattva.vayu || notifs.tattva.tejas || notifs.tattva.apas || notifs.tattva.prithvi;
  const setNadiAll   = v => setNotifs(n => ({...n, nadi:   {ida:v, pingala:v, sushumna:v}}));
  const setTattvaAll = v => setNotifs(n => ({...n, tattva: {akasha:v, vayu:v, tejas:v, apas:v, prithvi:v}}));
  const toggleNadi   = id => setNotifs(n => ({...n, nadi:   {...n.nadi,   [id]:!n.nadi[id]}}));
  const toggleTattva = id => setNotifs(n => ({...n, tattva: {...n.tattva, [id]:!n.tattva[id]}}));
  const [gpsLoad, setGpsLoad] = useState(false);
  const [saved,   setSaved]   = useState(false);

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

        {/* ── PREMIUM ─────────────────────────────────────────────────────── */}
        <Text style={s.sectionLabel}>✨  Premium</Text>
        <View style={s.settingCard}>
          {isPremium ? (
            <View style={{padding:14,alignItems:'center',gap:8}}>
              <Text style={{fontSize:28}}>🙏</Text>
              <Text style={{color:C.gold,fontSize:16,fontWeight:'500'}}>Premium unlocked</Text>
              <Text style={{color:C.muted,fontSize:12,textAlign:'center'}}>Thank you for supporting Svara Yoga.</Text>
            </View>
          ) : (
            <View style={{padding:14,gap:10}}>
              <Text style={{color:C.goldLight,fontSize:14,lineHeight:20}}>
                Unlock the full experience: Tattva Timeline, Lunar Guide, sunrise & sunset, descriptions, and reliable notifications. One-time purchase, yours forever.
              </Text>
              <TouchableOpacity onPress={requestPremium} disabled={iapBusy} activeOpacity={0.75}
                style={{backgroundColor:C.gold,borderRadius:10,paddingVertical:12,alignItems:'center',marginTop:4,opacity:iapBusy?0.6:1}}>
                <Text style={{color:'#1a0a2e',fontSize:15,fontWeight:'500'}}>
                  {iapBusy ? 'Opening Google Play…' : (iapPrice ? `Unlock — ${iapPrice}` : 'Unlock Premium')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => restorePremium(true)} disabled={iapBusy} activeOpacity={0.6}
                style={{paddingVertical:8,alignItems:'center'}}>
                <Text style={{color:C.muted,fontSize:12,textDecorationLine:'underline'}}>Restore previous purchase</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
        <View style={[s.settingCard,{padding:12}]}>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <View style={{flex:1}}>
              <Text style={{fontSize:14,color:C.goldLight,fontWeight:'500'}}>{isGhatika?'Ghatika':'Classic'} system</Text>
              <Text style={{fontSize:11,color:C.faint,marginTop:1}}>{isGhatika?'Equal 24 min each':'Variable durations'}</Text>
            </View>
            <Switch value={isGhatika} onValueChange={setIsGhatika} trackColor={{false:'#3a1a5a',true:C.purple}} thumbColor={isGhatika?C.gold:'#6a4a8a'} style={{transform:[{scaleX:0.9},{scaleY:0.9}]}}/>
          </View>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',paddingTop:8,borderTopWidth:0.5,borderTopColor:'#3a1a5a'}}>
            {ghSeq.map(t=>(
              <View key={t.id} style={{flex:1,alignItems:'center'}}>
                <Image source={TATTVA_IMG[t.id]} style={{width:30,height:30,marginBottom:4}} resizeMode="contain"/>
                <Text style={{fontSize:10,color:C.muted,marginBottom:1}}>{t.name}</Text>
                <Text style={{fontSize:10,color:t.color,fontWeight:'500'}}>{isGhatika?t.ghatika:t.classic}m</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={s.sectionLabel}>🔔  Notifications</Text>
        <View style={s.settingCard}>
          {/* ── Nadi master + per-nadi sub-switches ───────────────── */}
          <View style={s.settingRow}>
            <View style={{flex:1}}>
              <Text style={s.settingTitle}>🌬  Nadi Changes</Text>
              <Text style={s.settingSub}>Alert when the active nadi changes</Text>
            </View>
            <Switch value={nadiAnyOn} onValueChange={v=>setNadiAll(v)} trackColor={{false:'#3a1a5a',true:C.purple}} thumbColor={nadiAnyOn?C.gold:'#6a4a8a'}/>
          </View>
          {nadiAnyOn && (
            <View style={{paddingHorizontal:16,paddingBottom:10,paddingTop:2,gap:4}}>
              {[
                {id:'ida',      label:'Ida (Left, lunar)',     img:NADI_IMG.ida},
                {id:'sushumna', label:'Sushumna (Both equal)', img:NADI_IMG.sushumna},
                {id:'pingala',  label:'Pingala (Right, solar)',img:NADI_IMG.pingala},
              ].map(it => (
                <View key={it.id} style={{flexDirection:'row',alignItems:'center',paddingVertical:6}}>
                  <Image source={it.img} style={{width:26,height:26,marginRight:10}} resizeMode="contain"/>
                  <Text style={{flex:1,fontSize:13,color:C.muted}}>{it.label}</Text>
                  <Switch
                    value={notifs.nadi[it.id]}
                    onValueChange={()=>toggleNadi(it.id)}
                    trackColor={{false:'#3a1a5a',true:C.purple}}
                    thumbColor={notifs.nadi[it.id]?C.gold:'#6a4a8a'}
                    style={{transform:[{scaleX:0.85},{scaleY:0.85}]}}
                  />
                </View>
              ))}
            </View>
          )}

          {/* ── Tattva master + per-tattva sub-switches ───────────── */}
          <View style={[s.settingRow,{borderBottomWidth:0,borderTopWidth:0.5,borderTopColor:'#3a1a5a'}]}>
            <View style={{flex:1}}>
              <Text style={s.settingTitle}>🪐  Tattva Changes</Text>
              <Text style={s.settingSub}>Alert when the active element shifts</Text>
            </View>
            <Switch value={tattvaAnyOn} onValueChange={v=>setTattvaAll(v)} trackColor={{false:'#3a1a5a',true:C.purple}} thumbColor={tattvaAnyOn?C.gold:'#6a4a8a'}/>
          </View>
          {tattvaAnyOn && (
            <View style={{paddingHorizontal:16,paddingBottom:10,paddingTop:2,gap:4}}>
              {[
                {id:'prithvi', label:'Prithvi (Earth)'},
                {id:'apas',    label:'Apas (Water)'},
                {id:'tejas',   label:'Tejas (Fire)'},
                {id:'vayu',    label:'Vayu (Air)'},
                {id:'akasha',  label:'Akasha (Ether)'},
              ].map(it => (
                <View key={it.id} style={{flexDirection:'row',alignItems:'center',paddingVertical:6}}>
                  <Image source={TATTVA_IMG[it.id]} style={{width:26,height:26,marginRight:10}} resizeMode="contain"/>
                  <Text style={{flex:1,fontSize:13,color:C.muted}}>{it.label}</Text>
                  <Switch
                    value={notifs.tattva[it.id]}
                    onValueChange={()=>toggleTattva(it.id)}
                    trackColor={{false:'#3a1a5a',true:C.purple}}
                    thumbColor={notifs.tattva[it.id]?C.gold:'#6a4a8a'}
                    style={{transform:[{scaleX:0.85},{scaleY:0.85}]}}
                  />
                </View>
              ))}
            </View>
          )}
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

function InnerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isGhatika, setIsGhatika] = useState(true);
  const [manualSvara, setManualSvara] = useState(null);
  const insets = useSafeAreaInsets();

  // ── TRIAL & PREMIUM STATE ───────────────────────────────────────────────────
  // Stores the first time the user opened THIS version of the app (so existing
  // production users who update get a fresh 10-day trial from update time).
  // After trial, features will be gated on `isPremium` (set by IAP — wired in
  // a later commit). For now isPremium stays false; banner shows remaining days.
  const TRIAL_DAYS = 10;
  const [firstRunAt, setFirstRunAt] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [tick, setTick] = useState(0); // forces re-render once a day for the counter

  useEffect(() => {
    (async () => {
      try {
        let stored = await AsyncStorage.getItem('svaraFirstRun');
        if (!stored) {
          stored = String(Date.now());
          await AsyncStorage.setItem('svaraFirstRun', stored);
        }
        setFirstRunAt(parseInt(stored, 10));
        const prem = await AsyncStorage.getItem('svaraPremium');
        setIsPremium(prem === 'true');
      } catch(e) {}
    })();
    // Re-render once an hour so the days-remaining counter updates cleanly
    // (the trial cutoff itself is computed on demand, this is just for the UI).
    const id = setInterval(() => setTick(t => t + 1), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const trialInfo = (() => {
    if (firstRunAt == null) return { daysSince: 0, daysLeft: TRIAL_DAYS, inTrial: true };
    const ms = Date.now() - firstRunAt;
    const daysSince = Math.floor(ms / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, TRIAL_DAYS - daysSince);
    return { daysSince, daysLeft, inTrial: daysLeft > 0 };
  })();
  const hasFullAccess = isPremium || trialInfo.inTrial;

  // ── IAP (PURCHASES) ─────────────────────────────────────────────────────────
  // One-time purchase product 'svara_premium' from Google Play. The flow:
  //   1. On mount, initConnection() opens the Billing connection.
  //   2. Verify any past purchase (getAvailablePurchases) so reinstalls and
  //      app-data clears still restore premium without manual action.
  //   3. Subscribe to purchaseUpdatedListener — fires on successful buy.
  //      We finishTransaction(isConsumable:false) to ACK to Google (otherwise
  //      Google auto-refunds within 3 days), then save 'svaraPremium' = true.
  //   4. Subscribe to purchaseErrorListener for failures (USER_CANCELED is
  //      silent; everything else gets a friendly Alert).
  //   5. fetchProduct() loads the localized price string so we can show it on
  //      the unlock UI (best-effort — purchase still works if it fails).
  //   6. On unmount, endConnection() cleans up.
  // requestPremium() is what we wire to the "Unlock" tap from the banner.
  // restorePremium() is exposed for the Settings screen and called silently
  // on mount.
  const [iapPrice, setIapPrice] = useState(null);     // e.g. "4.99 €" — null if not loaded
  const [iapBusy,  setIapBusy]  = useState(false);    // true while a request is in flight
  const iapReadyRef = useRef(false);

  const restorePremium = async (showAlert) => {
    try {
      const purchases = await RNIap.getAvailablePurchases();
      const owned = purchases.some(p => p.productId === PREMIUM_SKU);
      if (owned) {
        await AsyncStorage.setItem('svaraPremium', 'true');
        setIsPremium(true);
        if (showAlert) Alert.alert('Restored', 'Your premium access is now active.');
        return true;
      }
      if (showAlert) Alert.alert('No purchases found', 'There is no previous Svara Yoga premium purchase on this Google account.');
      return false;
    } catch (e) {
      if (showAlert) Alert.alert('Restore failed', e?.message || 'Please try again later.');
      return false;
    }
  };

  const requestPremium = async () => {
    if (iapBusy) return;
    if (!iapReadyRef.current) {
      Alert.alert('Store not ready', 'The Google Play store is not available right now. Please try again in a moment.');
      return;
    }
    setIapBusy(true);
    try {
      await RNIap.requestPurchase({ skus: [PREMIUM_SKU] });
      // The actual unlock happens in purchaseUpdatedListener below.
    } catch (e) {
      const code = e?.code || '';
      if (code === 'E_USER_CANCELLED' || code === 'E_USER_CANCELED') {
        // silent
      } else if (code === 'E_ALREADY_OWNED') {
        // The user already owns it — treat as a restore.
        await restorePremium(true);
      } else {
        Alert.alert('Purchase failed', e?.message || 'Please try again later.');
      }
    } finally {
      setIapBusy(false);
    }
  };

  useEffect(() => {
    let purchaseUpdateSub = null;
    let purchaseErrorSub = null;
    let cancelled = false;
    (async () => {
      try {
        await RNIap.initConnection();
        if (cancelled) return;
        iapReadyRef.current = true;
        // Best-effort: fetch the product to get the localized price string.
        try {
          const products = await RNIap.getProducts({ skus: [PREMIUM_SKU] });
          const p = products && products[0];
          if (p && p.localizedPrice) setIapPrice(p.localizedPrice);
        } catch (e) {}
        // Silent restore so users who reinstall or clear data don't have to
        // press a button to get their premium back.
        await restorePremium(false);
        // Listen for future purchases.
        purchaseUpdateSub = RNIap.purchaseUpdatedListener(async (purchase) => {
          try {
            if (purchase?.productId !== PREMIUM_SKU) return;
            // Android: purchaseStateAndroid 1 = purchased, 2 = pending, 0 = unspecified.
            // Acknowledge regardless; finishTransaction is idempotent.
            await RNIap.finishTransaction({ purchase, isConsumable: false });
            await AsyncStorage.setItem('svaraPremium', 'true');
            setIsPremium(true);
            Alert.alert('Thank you 🙏', 'Premium is now unlocked. Enjoy the full Svara Yoga experience.');
          } catch (e) {}
        });
        purchaseErrorSub = RNIap.purchaseErrorListener((err) => {
          // Errors from requestPurchase() are also caught above in requestPremium's
          // try/catch — this listener catches errors that bubble up out-of-band.
          if (err?.code === 'E_USER_CANCELLED' || err?.code === 'E_USER_CANCELED') return;
        });
      } catch (e) {
        // Billing unavailable in this environment (dev build, sideloaded APK,
        // missing Play services, etc.). Premium stays locked but the rest of
        // the app works.
        iapReadyRef.current = false;
      }
    })();
    return () => {
      cancelled = true;
      try { purchaseUpdateSub?.remove(); } catch (e) {}
      try { purchaseErrorSub?.remove(); } catch (e) {}
      try { RNIap.endConnection(); } catch (e) {}
    };
  }, []);

  const [config, setConfig] = useState(() => {
    const calc = calcSunrise(DEFAULT_LAT, DEFAULT_LNG);
    return {
      city:'Varanasi', lat:DEFAULT_LAT, lng:DEFAULT_LNG,
      srH:6, srM:12, ssH:18, ssM:34,
      sunriseMin:calc.sunriseMin, sunsetMin:calc.sunsetMin,
      sunriseStr:calc.sunriseStr, sunsetStr:calc.sunsetStr,
      locationMode:'default', sunriseMode:'auto',
      notifs:{
        nadi:   { ida:true, pingala:true, sushumna:true },
        tattva: { akasha:true, vayu:true, tejas:true, apas:true, prithvi:true },
      },
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
        // Horizon extended to 7 days (10080 min) so we can pre-fill up to 500
        // notifications and survive long stretches without app being opened.
        const HORIZON_MIN = 7 * 24 * 60; // 10080
        const txs = []; // {dm, type:'tattva'|'nadi', toId}
        let lastTat = tattvaAt(0).id;
        let lastNadi = nadiAt(0);
        for (let dm = 1; dm <= HORIZON_MIN; dm++) {
          // Tattva transitions — only push if this specific tattva is enabled
          const t = tattvaAt(dm).id;
          if (t !== lastTat) {
            if (dm >= 5 && config.notifs?.tattva?.[t]) txs.push({ dm, type:'tattva', toId: t });
            lastTat = t;
          }
          // Nadi transitions — only push if this specific nadi is enabled
          const n = nadiAt(dm);
          if (n !== lastNadi) {
            if (dm >= 5 && config.notifs?.nadi?.[n]) txs.push({ dm, type:'nadi', toId: n });
            lastNadi = n;
          }
        }

        // Sort and limit. Android can handle ~500 scheduled notifications per
        // app — we use that as our cap. With ~3.5 events/hour in Ghatika mode
        // (nadi transitions + tattva transitions), 500 covers ~6 days. The
        // listener below refills on each delivery, so the queue stays full
        // even longer in practice.
        txs.sort((a,b) => a.dm - b.dm);
        const limited = txs.slice(0, 500);

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
    // LOOP REFILL: each time a svara-tx notification is received (or wakes the
    // app briefly), top up the queue so the buffer never empties. Combined with
    // the 50-item buffer, this gives strong overnight coverage even when the
    // app is closed for long stretches.
    const sub = Notifications.addNotificationReceivedListener((notif) => {
      try {
        if (notif?.request?.content?.data?.kind === 'svara-tx') {
          scheduleAll();
        }
      } catch(e) {}
    });
    return () => { clearTimeout(debouncedId); clearInterval(intervalId); sub.remove(); };
  }, [config.sunriseMin, isGhatika, JSON.stringify(config.notifs)]);

  const screens = {
    home:     <HomeScreen config={config} isGhatika={isGhatika} manualSvara={manualSvara} hasFullAccess={hasFullAccess}/>,
    svara:    <SvaraScreen picked={manualSvara} setPicked={setManualSvara}/>,
    lunar:    <LunarScreen/>,
    timeline: <TimelineScreen config={config} isGhatika={isGhatika}/>,
    settings: <SettingsScreen config={config} setConfig={setConfig} isGhatika={isGhatika} setIsGhatika={setIsGhatika}
                              isPremium={isPremium} iapPrice={iapPrice} iapBusy={iapBusy}
                              requestPremium={requestPremium} restorePremium={restorePremium}/>,
  };

  return (
    <View style={{flex:1,backgroundColor:C.bg,paddingTop:insets.top}}>
      {/* Trial banner — visible only when not premium. During trial shows the
          remaining days; after trial it's tappable and triggers the IAP flow.
          Wraps in TouchableOpacity so the whole banner is the unlock affordance. */}
      {!isPremium && (
        <TouchableOpacity
          onPress={requestPremium}
          disabled={iapBusy}
          activeOpacity={0.75}
          style={s.trialBanner}
        >
          <Text style={s.trialText}>
            {iapBusy
              ? '⏳ Opening Google Play…'
              : trialInfo.inTrial
                ? `✨ Free trial · ${trialInfo.daysLeft} day${trialInfo.daysLeft === 1 ? '' : 's'} left  ·  Tap to unlock${iapPrice ? '  ('+iapPrice+')' : ''}`
                : `🔒 Trial ended  ·  Tap to unlock${iapPrice ? '  ('+iapPrice+')' : ''}`}
          </Text>
        </TouchableOpacity>
      )}
      <View style={{flex:1}}>{screens[activeTab]}</View>
      <View style={[s.bottomNav,{paddingBottom:insets.bottom+8}]}>
        {TABS.map(t=>(
          <TouchableOpacity key={t.id} style={s.navItem} onPress={()=>setActiveTab(t.id)}>
            <Image source={t.img} style={[s.navIconImg, {opacity: activeTab===t.id ? 1 : 0.45}]} resizeMode="contain"/>
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
