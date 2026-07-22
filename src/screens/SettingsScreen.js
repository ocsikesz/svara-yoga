import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Alert, Platform, Image, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { C, s, ss } from '../constants/theme';
import { TATTVAS_CLASSIC, TATTVAS_GHATIKA, TATTVA_IMG, NADI_IMG } from '../constants/data';
import { calcSunrise } from '../utils/timeMath';
import { PRESET_CITIES } from '../constants/cities';
import AppHeader from '../components/AppHeader';

export default function SettingsScreen({ config, setConfig, isGhatika, setIsGhatika, isPremium, iapPrice, iapBusy, requestPremium, restorePremium }) {
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
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [citySearch,     setCitySearch]    = useState('');
  const [cityHistory,    setCityHistory]   = useState([]);

  // Load city history from AsyncStorage on mount
  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('cityHistory');
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) setCityHistory(arr.slice(0, 5));
        }
      } catch (e) {}
    })();
  }, []);

  // Save a picked city to history (max 5, most recent first, deduplicated)
  const saveToHistory = async (city) => {
    try {
      const next = [city, ...cityHistory.filter(h => h.name !== city.name)].slice(0, 5);
      setCityHistory(next);
      await AsyncStorage.setItem('cityHistory', JSON.stringify(next));
    } catch (e) {}
  };

  // When user picks a city (either from history or presets)
  const pickCity = (item) => {
    setCity(item.name);
    setLat(String(item.lat));
    setLng(String(item.lng));
    saveToHistory(item);
    setCityPickerOpen(false);
  };
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
    // If the user Apply'd with a custom (typed) city name that's not empty,
    // and we're in manual mode, add it to the history so it's easy to pick
    // again next time.
    if (mode === 'manual' && cityName && cityName !== 'Current Location') {
      saveToHistory({ name: cityName, country: '', lat: latN, lng: lngN, alt: null });
    }
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
                  <TouchableOpacity
                    style={[ss.input, {flexDirection:'row', alignItems:'center', justifyContent:'space-between'}]}
                    activeOpacity={0.7}
                    onPress={() => { setCitySearch(''); setCityPickerOpen(true); }}
                  >
                    <Text style={{color: city ? C.text : C.faint, flex:1}} numberOfLines={1}>
                      {city || 'Select city...'}
                    </Text>
                    <Text style={{color: C.faint, fontSize:14, marginLeft:8}}>▼</Text>
                  </TouchableOpacity>
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

      {/* City Picker Modal — history at top, then presets, then manual entry hint */}
      <Modal
        visible={cityPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCityPickerOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', padding:20}}
          onPress={() => setCityPickerOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{backgroundColor:C.card, borderRadius:12, padding:16, maxHeight:'85%'}}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{color:C.text, fontSize:16, fontWeight:'600', marginBottom:12, textAlign:'center'}}>
              Select Location
            </Text>
            <TextInput
              style={[ss.input, {marginBottom:12}]}
              value={citySearch}
              onChangeText={setCitySearch}
              placeholder="Search or type your own..."
              placeholderTextColor={C.faint}
            />
            <ScrollView keyboardShouldPersistTaps="handled" style={{maxHeight:400}}>
              {/* Recent locations section */}
              {cityHistory.length > 0 && !citySearch && (
                <View style={{marginBottom:12}}>
                  <Text style={{color:C.faint, fontSize:12, fontWeight:'600', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4, paddingHorizontal:4}}>
                    Recent
                  </Text>
                  {cityHistory.map((item, idx) => (
                    <TouchableOpacity
                      key={`hist-${idx}`}
                      style={{paddingVertical:10, paddingHorizontal:8, borderBottomWidth:1, borderBottomColor:C.border}}
                      onPress={() => pickCity(item)}
                    >
                      <Text style={{color:C.text, fontSize:15}}>🕐  {item.name}</Text>
                      <Text style={{color:C.faint, fontSize:12, marginTop:2, marginLeft:22}}>
                        {item.country ? `${item.country} · ` : ''}{item.lat.toFixed(2)}°, {item.lng.toFixed(2)}°{item.alt != null ? ` · ${item.alt}m` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Preset cities (filtered by search) */}
              {(() => {
                const filtered = PRESET_CITIES.filter(c =>
                  c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                  c.country.toLowerCase().includes(citySearch.toLowerCase())
                );
                if (filtered.length === 0) return null;
                return (
                  <View>
                    <Text style={{color:C.faint, fontSize:12, fontWeight:'600', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4, paddingHorizontal:4}}>
                      Cities
                    </Text>
                    {filtered.map((item) => (
                      <TouchableOpacity
                        key={item.name}
                        style={{paddingVertical:10, paddingHorizontal:8, borderBottomWidth:1, borderBottomColor:C.border}}
                        onPress={() => pickCity(item)}
                      >
                        <Text style={{color:C.text, fontSize:15}}>{item.name}</Text>
                        <Text style={{color:C.faint, fontSize:12, marginTop:2}}>
                          {item.country} · {item.lat.toFixed(2)}°, {item.lng.toFixed(2)}° · {item.alt}m
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })()}

              {/* Use typed name (for custom locations not in the list) */}
              {citySearch.trim().length > 0 && (
                <TouchableOpacity
                  style={{paddingVertical:12, paddingHorizontal:8, marginTop:8, backgroundColor:C.border, borderRadius:8}}
                  onPress={() => {
                    setCity(citySearch.trim());
                    setCityPickerOpen(false);
                    setCitySearch('');
                    // Latitude/longitude left as-is — user can then edit them
                    // in the lat/lng fields below.
                  }}
                >
                  <Text style={{color:C.text, fontSize:14, textAlign:'center'}}>
                    ✏️  Use "{citySearch.trim()}" (enter coordinates manually)
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setCityPickerOpen(false)}
              style={{marginTop:12, paddingVertical:10, alignItems:'center', backgroundColor:C.border, borderRadius:8}}
            >
              <Text style={{color:C.text, fontSize:14}}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}
