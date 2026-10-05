import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SvaraWidget } from './SvaraWidget';
import { calcSunrise, getLunarDay, getSvaraFromSunrise, getTattvaFromSunrise } from '../utils/timeMath';
import { SVARA_META } from '../constants/data';
import { TATTVAS_CLASSIC } from '../constants/data';

// Build the data that the widget needs from the current app config.
// Reads config from AsyncStorage (same key App.js writes to) so the widget
// is always consistent with what the user sees inside the app.
async function buildWidgetData() {
  let config = null;
  try {
    const raw = await AsyncStorage.getItem('appConfig');
    if (raw) config = JSON.parse(raw);
  } catch (e) {}

  // Fallback: no saved config yet (user hasn't opened app). Show placeholders.
  if (!config || typeof config.lat !== 'number') {
    return {
      nadiName: 'Open app',
      nadiTag: 'to set location',
      tattvaName: '—',
      tattvaChakra: '',
      sunriseStr: '--:--',
      sunsetStr: '--:--',
    };
  }

  // Recompute sunrise with sea-level altitude (matches main app).
  const sun = calcSunrise(config.lat, config.lng, 0);
  const lunar = getLunarDay();

  // Resolve current nadi + tattva from sunrise.
  const svara = getSvaraFromSunrise(sun.sunriseMin, lunar.day, lunar.paksha);
  const isGhatika = config.isGhatika === true;
  const tattva = getTattvaFromSunrise(sun.sunriseMin, isGhatika);

  const sm = SVARA_META[svara] || {};
  const nadiName = (sm.name || '').replace(' Nadi', '').trim() || '—';

  return {
    nadiName,
    nadiTag: sm.tag || '',
    tattvaName: tattva?.name || '—',
    tattvaChakra: tattva?.chakra || '',
    sunriseStr: sun.sunriseStr || '--:--',
    sunsetStr: sun.sunsetStr || '--:--',
  };
}

// Entry point called by Android when the widget needs to render/update.
// `props.widgetAction` is one of: WIDGET_ADDED, WIDGET_UPDATE, WIDGET_RESIZED,
//   WIDGET_DELETED, WIDGET_CLICK. We render on everything except DELETED.
export async function widgetTaskHandler(props) {
  const widgetInfo = props.widgetInfo;
  if (!widgetInfo) return;

  if (props.widgetAction === 'WIDGET_DELETED') return;

  const data = await buildWidgetData();

  props.renderWidget(<SvaraWidget {...data} />);
}
