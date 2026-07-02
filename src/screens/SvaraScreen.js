import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { C, s } from '../constants/theme';
import { NADI_IMG } from '../constants/data';
import AppHeader from '../components/AppHeader';

export default function SvaraScreen({ picked, setPicked }) {
  const RESULTS = {
    ida:      { title:'Ida Nadi — Left Nostril active',    body:'The lunar, cooling channel flows. Ideal for peaceful, creative, and social activities.' },
    pingala:  { title:'Pingala Nadi — Right Nostril active', body:'The solar, warming channel flows. Energy and willpower heightened. Ideal for physical work and business.' },
    sushumna: { title:'Sushumna — Both nostrils equal',    body:'This rare sacred state occurs at nadi transitions. Sit immediately for meditation or mantra japa.' },
  };
  const toggle = (id) => setPicked(picked === id ? null : id);
  return (
    <ScrollView style={{flex:1,backgroundColor:C.bg}}>
      <AppHeader subtitle="Svara Identifier"/>
      <View style={s.card}>
        {[{n:1,t:'Close your right nostril. Breathe in gently through the left.'},{n:2,t:'Close your left nostril. Breathe in through the right.'},{n:3,t:'Notice which side flows more freely and smoothly.'},{n:4,t:'Hold your wrist under each nostril — feel the breath warmth.'}].map(st=>
          <Text key={st.n} style={s.step}><Text style={{color:C.gold,fontWeight:'bold'}}>Step {st.n}:  </Text>{st.t}</Text>
        )}
      </View>
      <View style={s.btnRow}>
        {[{id:'ida',label:'Left (Ida)'},{id:'sushumna',label:'Both equal'},{id:'pingala',label:'Right (Pingala)'}].map(b=>(
          <TouchableOpacity key={b.id} style={[s.svaraBtn,picked===b.id&&s.svaraBtnActive]} onPress={()=>toggle(b.id)}>
            <Image source={NADI_IMG[b.id]} style={s.svaraBtnIconImg} resizeMode="contain"/>
            <Text style={[s.svaraBtnLabel,picked===b.id&&{color:C.gold}]}>{b.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {picked&&<View style={s.resultBox}><Text style={s.resultTitle}>{RESULTS[picked].title}</Text><Text style={s.resultBody}>{RESULTS[picked].body}</Text><Text style={[s.resultBody,{marginTop:8,fontStyle:'italic',color:C.gold}]}>✓ Active on Home screen (tap again to clear)</Text></View>}
    </ScrollView>
  );
}
