import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { hd } from '../constants/theme';

// App header — logo, subtitle strip, live clock that ticks every 10 s.
// Rendered by every screen; subtitle is the current svara/shloka context.
export default function AppHeader({ subtitle }) {
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
      <View style={hd.headerRow}>
        <Text style={hd.subtitle}>{subtitle}</Text>
        <Text style={hd.timeLabel}>{timeStr}</Text>
      </View>
    </View>
  );
}
