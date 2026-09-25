import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { hd, C } from '../constants/theme';

// App header — logo, subtitle strip, live clock, city + sun times.
// Rendered by every screen; subtitle is the current svara/shloka context.
export default function AppHeader({ subtitle, city, sunriseStr, sunsetStr }) {
  const [timeStr, setTimeStr] = useState(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  });
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setTimeStr(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
    }, 10000);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={hd.header}>
      <Image source={require('../../assets/logo-header.png')} style={hd.logoHeader} resizeMode="contain"/>
      {city ? (
        <Text style={{fontSize:11, color:C.faint, marginTop:2, letterSpacing:0.5}}>📍 {city}</Text>
      ) : null}
      <View style={hd.headerRow}>
        <Text style={hd.subtitle}>{subtitle}</Text>
        <Text style={hd.timeLabel}>{timeStr}</Text>
      </View>
      {sunriseStr && sunsetStr ? (
        <View style={{flexDirection:'row', justifyContent:'center', gap:20, marginTop:6, paddingTop:6, borderTopWidth:0.5, borderTopColor:C.borderFaint, width:'100%'}}>
          <Text style={{fontSize:12, color:C.gold}}>🌅 {sunriseStr}</Text>
          <Text style={{fontSize:12, color:'#c2603a'}}>🌇 {sunsetStr}</Text>
        </View>
      ) : null}
    </View>
  );
}
