import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { C, s, hd, td } from '../constants/theme';
import { TATTVAS_CLASSIC, TATTVAS_GHATIKA, TATTVA_IMG, NADI_IMG, SHLOKAS, LUNAR_DAYS, RECOMMENDATIONS } from '../constants/data';
import { getLunarDay, getSvaraFromSunrise, getNextNadiChange, formatDuration, getTattvaFromSunrise, getTattvaProgress } from '../utils/timeMath';
import AppHeader from '../components/AppHeader';

export default function HomeScreen({ config, isGhatika, manualSvara, hasFullAccess }) {
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
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  const verseOfDay = SHLOKAS[dayOfYear % SHLOKAS.length];

  const SVARA_META = {
    ida:      { name:'Ida Nadi',     tag:'🌙 Lunar · Cooling · Feminine'  },
    pingala:  { name:'Pingala Nadi', tag:'☀️ Solar · Warming · Masculine' },
    sushumna: { name:'Sushumna',     tag:'🔥 Central · Sacred · Rare'     },
  };
  const sm = SVARA_META[svara];
  const srcLabel = locationMode==='gps' ? '📡 GPS' : locationMode==='manual' ? '✏️ Manual' : '⚙️ Default';

  // ── FREE HOME VIEW ─────────────────────────────────────────────────────────
  // After trial ends (and before purchase), show only the absolute minimum:
  // current nadi name + current tattva name. No timeline, no countdown, no
  // descriptions, no shloka. This is the "free tier" home screen.
  if (!hasFullAccess) {
    return (
      <ScrollView style={{flex:1,backgroundColor:C.bg}} contentContainerStyle={{flexGrow:1,justifyContent:'center'}}>
        <AppHeader subtitle="Free version"/>
        <View style={s.freeHomeCenter}>
          <View style={s.freeCard}>
            <Text style={s.freeLabel}>Active Svara</Text>
            <Image source={NADI_IMG[svara]} style={s.svaraIconImg} resizeMode="contain"/>
            <Text style={s.freeName}>{sm.name}</Text>
          </View>
          <View style={s.freeCard}>
            <Text style={s.freeLabel}>Active Tattva</Text>
            <Image source={TATTVA_IMG[activeTattva.id]} style={s.svaraIconImg} resizeMode="contain"/>
            <Text style={s.freeName}>{activeTattva.name}</Text>
          </View>
          <Text style={s.freeHint}>
            Unlock the full experience to see the Tattva Timeline, Lunar Guide, descriptions, sunrise & sunset times, and reliable notifications.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      <AppHeader subtitle={`${lunar.paksha==='shukla'?'🌒 Shukla':'🌘 Krishna'} · ${(LUNAR_DAYS.find(d=>d.day===lunar.day)||{}).name || ('Day '+lunar.day)}`}/>

      <View style={hd.sunBig}>
        <View style={hd.sunItem}>
          <View style={hd.sunRow}>
            <View style={hd.sunTextCol}>
              <Text style={hd.sunTime}>{sunriseStr}</Text>
              <Text style={hd.sunLabelBig}>Sunrise</Text>
            </View>
            <Image source={require('../../assets/sunrise-icon.png')} style={hd.sunImg} resizeMode="contain"/>
          </View>
        </View>
        <View style={hd.sunDivider}/>
        <View style={hd.sunItem}>
          <View style={hd.sunRow}>
            <View style={hd.sunTextCol}>
              <Text style={hd.sunTime}>{sunsetStr}</Text>
              <Text style={hd.sunLabelBig}>Sunset</Text>
            </View>
            <Image source={require('../../assets/sunset-icon.png')} style={hd.sunImg} resizeMode="contain"/>
          </View>
        </View>
      </View>

      <View style={s.svaraCard}>
        <Text style={s.svaraLabel}>{manualSvara?'Active Now (Manual)':'Active Svara'}</Text>
        <Image source={NADI_IMG[svara]} style={s.svaraIconImg} resizeMode="contain"/>
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
            <Image source={TATTVA_IMG[t.id]} style={s.tattvaIconImg} resizeMode="contain"/>
            <Text style={[s.tattvaName, activeTattva.id===t.id&&{color:C.gold}]}>{t.name}</Text>
            {activeTattva.id===t.id && <Text style={{fontSize:11,color:C.gold,marginTop:3,fontWeight:'500'}}>{progress.remaining}m</Text>}
          </View>
        ))}
      </View>

      <View style={[td.card,{borderColor:activeTattva.color}]}>
        <View style={td.topRow}>
          <Image source={TATTVA_IMG[activeTattva.id]} style={td.iconImg} resizeMode="contain"/>
          <View style={{flex:1}}>
            <Text style={td.name}>{activeTattva.name}</Text>
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
        <View style={{flexDirection:'row',alignItems:'center',marginTop:8,gap:6}}>
          <Text style={{fontSize:12,color:C.faint}}>Next →</Text>
          <Image source={TATTVA_IMG[nextTattva.id]} style={{width:20,height:20}} resizeMode="contain"/>
          <Text style={{fontSize:12,color:C.faint}}>{nextTattva.name}</Text>
        </View>
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

      <View style={[s.shlokaCard,{marginHorizontal:16,marginBottom:20,borderColor:C.gold,borderWidth:0.5,backgroundColor:C.purple}]}>
        <Text style={{fontSize:11,color:C.gold,textTransform:'uppercase',letterSpacing:1.5,marginBottom:8}}>★ Teaching of the Day</Text>
        <Text style={{fontSize:13,color:C.muted,marginBottom:6}}>{verseOfDay.topic}{verseOfDay.sanskrit?'  ·  '+verseOfDay.sanskrit:''}</Text>
        <Text style={{fontSize:15,color:C.gold,fontStyle:'italic',lineHeight:24}}>{verseOfDay.meaning}</Text>
        <Text style={{fontSize:10,color:C.faint,marginTop:10}}>Shiva Svarodaya · sutra ~{verseOfDay.verse}</Text>
      </View>
    </ScrollView>
  );
}
