import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { C, s, tl } from '../constants/theme';
import { TATTVA_IMG } from '../constants/data';
import { getTattvaTimeline, formatDuration } from '../utils/timeMath';
import AppHeader from '../components/AppHeader';

export default function TimelineScreen({ config, isGhatika }) {
  const [timeline, setTimeline] = useState(() => getTattvaTimeline(config.sunriseMin, isGhatika, 8));
  const [expanded, setExpanded] = useState(null);
  useEffect(() => {
    const tick = () => setTimeline(getTattvaTimeline(config.sunriseMin, isGhatika, 8));
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, [config.sunriseMin, isGhatika]);

  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      <AppHeader subtitle="Tattwa Timeline"/>
      <View style={{padding:14}}>
        <Text style={{fontSize:12,color:C.muted,textTransform:'uppercase',letterSpacing:1.5,marginBottom:4,marginLeft:4}}>Current & Next Tattwas</Text>
        <Text style={{fontSize:13,color:C.faint,marginBottom:14,marginLeft:4}}>{isGhatika?'Ghatika system · 24 min each':'Classic system'} · tap any for details</Text>

        {timeline.map((item, i) => {
          const showDesc = item.isNow || expanded === i;
          return (
          <TouchableOpacity key={i} activeOpacity={0.7} onPress={()=>setExpanded(expanded===i?null:(item.isNow?null:i))} style={[
            tl.row,
            item.isNow && tl.rowNow,
            (!item.isNow && expanded===i) && {borderColor:item.tattva.color,borderWidth:1},
          ]}>
            <View style={tl.timeCol}>
              <Text style={[tl.time, item.isNow && {color:C.gold,fontWeight:'700'}]}>{item.isNow ? item.startedAt : item.time}</Text>
              {!item.isNow && <Text style={tl.until}>in {formatDuration(item.minutesUntil)}</Text>}
              {item.isNow && <Text style={[tl.until,{color:C.gold}]}>{item.elapsedMin>0 ? 'started '+formatDuration(item.elapsedMin)+' ago' : 'just started'}</Text>}
            </View>
            <Image source={TATTVA_IMG[item.tattva.id]} style={tl.icon} resizeMode="contain"/>
            <View style={tl.tattvaCol}>
              <Text style={[tl.tattvaName, item.isNow && {color:C.gold}]}>{item.tattva.name}</Text>
              {item.isNow && <Text style={[tl.until,{color:C.gold,marginTop:0}]}>● active now</Text>}
              {showDesc && <Text style={tl.tattvaDesc}>{item.tattva.description}</Text>}
              {!item.isNow && expanded!==i && <Text style={[tl.until,{marginTop:2}]}>tap for details ▾</Text>}
            </View>
          </TouchableOpacity>
          );
        })}

        <Text style={{fontSize:11,color:C.faint,textAlign:'center',marginTop:16,fontStyle:'italic'}}>
          The cycle repeats every {isGhatika?'2 hours':'1 hour'} from sunrise, continuing through the night until the next sunrise.
        </Text>
      </View>
    </ScrollView>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
