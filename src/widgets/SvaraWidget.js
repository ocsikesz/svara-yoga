import React from 'react';
import { FlexWidget, TextWidget, ImageWidget } from 'react-native-android-widget';

// Svara Yoga home-screen widget.
// Keeps the look of the HTML mockup: dark purple card, gold accents,
// active nadi + active tattva side-by-side, with sunrise/sunset at the top.
//
// Updates every 30 minutes (Android minimum useful cadence) via a background
// task registered in App.js. All data is passed in from props by the task.

export function SvaraWidget({ nadiName, nadiTag, tattvaName, tattvaChakra, sunriseStr, sunsetStr }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        padding: 12,
        backgroundColor: '#1a0530',
        borderRadius: 16,
        flexDirection: 'column',
      }}
      clickAction="OPEN_APP"
    >
      {/* Top row: sunrise / sunset */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <TextWidget text={`🌅 ${sunriseStr || '--:--'}`} style={{ fontSize: 12, color: '#c9a96e' }} />
        <TextWidget text={`🌇 ${sunsetStr || '--:--'}`} style={{ fontSize: 12, color: '#c2603a' }} />
      </FlexWidget>

      {/* Divider */}
      <FlexWidget style={{ height: 1, backgroundColor: '#3a1f55', marginBottom: 8 }} />

      {/* Nadi + Tattva side by side */}
      <FlexWidget
        style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}
      >
        {/* Nadi */}
        <FlexWidget style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
          <TextWidget
            text="NADI"
            style={{ fontSize: 9, color: '#7a6a5a', letterSpacing: 1 }}
          />
          <TextWidget
            text={nadiName || '—'}
            style={{ fontSize: 18, color: '#e8d5a3', fontWeight: 'bold', marginTop: 2 }}
          />
          <TextWidget
            text={nadiTag || ''}
            style={{ fontSize: 10, color: '#b8a894', marginTop: 2 }}
          />
        </FlexWidget>

        {/* Vertical divider */}
        <FlexWidget style={{ width: 1, height: 50, backgroundColor: '#3a1f55', marginHorizontal: 8 }} />

        {/* Tattva */}
        <FlexWidget style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
          <TextWidget
            text="TATTVA"
            style={{ fontSize: 9, color: '#7a6a5a', letterSpacing: 1 }}
          />
          <TextWidget
            text={tattvaName || '—'}
            style={{ fontSize: 18, color: '#e8d5a3', fontWeight: 'bold', marginTop: 2 }}
          />
          <TextWidget
            text={tattvaChakra || ''}
            style={{ fontSize: 10, color: '#b8a894', marginTop: 2 }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
