import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { C, s } from '../constants/theme';
import { LUNAR_DAYS } from '../constants/data';
import { getLunarDay } from '../utils/timeMath';
import AppHeader from '../components/AppHeader';

export default function LunarScreen() {
  const { day, paksha } = getLunarDay();
  const [selectedDay, setSelectedDay] = useState(day);

  const detail   = LUNAR_DAYS.find(x => x.day === selectedDay) || LUNAR_DAYS[0];

  const renderCard = (d, label, isToday) => (
    <View style={[s.card,{borderColor:d.nadi==='ida'?'#2a4a7a':'#6a3a1a',borderWidth:1}]}>
      <Text style={{fontSize:12,color:C.muted,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>{label}</Text>
      <Text style={{fontSize:20,color:C.gold,fontWeight:'500',marginBottom:4}}>{d.emoji}  {d.name}</Text>
      <Text style={{fontSize:14,color:d.nadi==='ida'?C.blue:C.orange,marginBottom:10,fontStyle:'italic'}}>{d.meaning}</Text>
      {d.desc && <Text style={{fontSize:13,color:'#a08ab0',lineHeight:20,marginBottom:10}}>{d.desc}</Text>}
      <Text style={{fontSize:13,color:C.muted,marginBottom:10}}>{d.nadi==='ida'?'🌙 Ida Nadi dominates · cool, lunar energy':'☀️ Pingala Nadi dominates · warm, solar energy'}</Text>
      <View style={{flexDirection:'row',gap:10}}>
        <View style={[s.lunarDDBox,{backgroundColor:C.greenBg,borderColor:C.greenBorder}]}>
          <Text style={{fontSize:11,color:C.green,fontWeight:'500',marginBottom:4}}>✓ FAVOR</Text>
          {d.favor.map((x,i)=><Text key={i} style={{fontSize:12,color:'#7ac0a0',lineHeight:18}}>• {x}</Text>)}
        </View>
        <View style={[s.lunarDDBox,{backgroundColor:C.redBg,borderColor:C.redBorder}]}>
          <Text style={{fontSize:11,color:C.red,fontWeight:'500',marginBottom:4}}>✕ AVOID</Text>
          {d.avoid.map((x,i)=><Text key={i} style={{fontSize:12,color:'#c08080',lineHeight:18}}>• {x}</Text>)}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      <AppHeader subtitle="Lunar Cycle Guide"/>

      <View style={s.card}>
        <View style={{flexDirection:'row',gap:14,marginBottom:10}}>
          <Text style={{fontSize:12,color:C.blue}}>🔵 Ida</Text>
          <Text style={{fontSize:12,color:C.orange}}>🟠 Pingala</Text>
          <Text style={{fontSize:12,color:C.gold,marginLeft:'auto'}}>● Today: {paksha==='shukla'?'Shukla':'Krishna'} {day}</Text>
        </View>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:5}}>
          {LUNAR_DAYS.map(d=>(
            <TouchableOpacity
              key={d.day}
              onPress={()=>setSelectedDay(d.day)}
              style={[
                s.dayCell,
                d.nadi==='ida'?{backgroundColor:C.blueBg,borderColor:'#2a4a7a'}:{backgroundColor:C.orangeBg,borderColor:'#6a3a1a'},
                d.day===day&&{borderWidth:2,borderColor:C.gold},
                d.day===selectedDay&&d.day!==day&&{borderWidth:2,borderColor:C.goldLight},
              ]}>
              <Text style={{fontSize:13,fontWeight:'500',color:d.nadi==='ida'?C.blue:C.orange}}>{d.day}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {renderCard(detail, selectedDay===day ? '● Selected · Today' : '● Selected · Day '+selectedDay, selectedDay===day)}
    </ScrollView>
  );
}
