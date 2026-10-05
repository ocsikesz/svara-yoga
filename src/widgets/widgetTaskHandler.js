import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SvaraWidget } from './SvaraWidget';

// Build the data that the widget needs from the current app config.
// Reads config from AsyncStorage. Everything is wrapped in a try that falls
// back to an "Open app" placeholder, so a bad config or missing data never
// leaves the widget blank (which looks like a bug to the user).
async function buildWidgetData() {
  try {
    let config = null;
    try {
      const raw = await AsyncStorage.getItem('appConfig');
      if (raw) config = JSON.parse(raw);
    } catch (e) {}

    if (!config || typeof config.sunriseMin !== 'number') {
      return {
        nadiName: 'Open app',
        nadiTag: 'to set up',
        tattvaName: '—',
        tattvaChakra: '',
        sunriseStr: config?.sunriseStr || '--:--',
        sunsetStr: config?.sunsetStr || '--:--',
      };
    }

    // Lazy-import timeMath so a crash in the import chain (e.g. constants/data
    // pulling in something that doesn't work in the headless widget JS runtime)
    // doesn't nuke the whole widget. If the import fails we still render the
    // sunrise/sunset values we already read from config.
    let nadiName = '—', nadiTag = '', tattvaName = '—', tattvaChakra = '';
    try {
      const { getLunarDay, getSvaraFromSunrise, getTattvaFromSunrise } = require('../utils/timeMath');
      const { SVARA_META } = require('../constants/data');
      const lunar = getLunarDay();
      const svara = getSvaraFromSunrise(config.sunriseMin, lunar.day, lunar.paksha);
      const isGhatika = config.isGhatika === true;
      const tattva = getTattvaFromSunrise(config.sunriseMin, isGhatika);
      const sm = (SVARA_META && SVARA_META[svara]) || {};
      nadiName = (sm.name || '').replace(' Nadi', '').trim() || '—';
      nadiTag = sm.tag || '';
      tattvaName = tattva?.name || '—';
      tattvaChakra = tattva?.chakra || '';
    } catch (e) {
      // Fall through — we still have sunrise/sunset.
      nadiName = 'Open app';
      nadiTag = `(${(e && e.message) ? e.message.slice(0,20) : 'err'})`;
    }

    return {
      nadiName,
      nadiTag,
      tattvaName,
      tattvaChakra,
      sunriseStr: config.sunriseStr || '--:--',
      sunsetStr: config.sunsetStr || '--:--',
    };
  } catch (e) {
    return {
      nadiName: 'Widget',
      nadiTag: 'error',
      tattvaName: '—',
      tattvaChakra: (e && e.message) ? e.message.slice(0, 20) : '',
      sunriseStr: '--:--',
      sunsetStr: '--:--',
    };
  }
}

// Entry point called by Android when the widget needs to render/update.
// We render on every action except DELETED, including CLICK (so tap can
// trigger an immediate refresh in addition to opening the app).
export async function widgetTaskHandler(props) {
  if (!props || !props.renderWidget) return;
  if (props.widgetAction === 'WIDGET_DELETED') return;

  try {
    const data = await buildWidgetData();
    props.renderWidget(<SvaraWidget {...data} />);
  } catch (e) {
    // Last-resort: still render SOMETHING so the user sees the widget is
    // alive, instead of a transparent block.
    try {
      props.renderWidget(
        <SvaraWidget
          nadiName="Widget"
          nadiTag="error"
          tattvaName="—"
          tattvaChakra={(e && e.message) ? e.message.slice(0, 20) : ''}
          sunriseStr="--:--"
          sunsetStr="--:--"
        />
      );
    } catch (e2) {}
  }
}
