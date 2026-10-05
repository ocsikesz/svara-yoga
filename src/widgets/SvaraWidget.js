import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

// Svara Yoga home-screen widget.
// Root must have explicit dimensions (match_parent gives size 0 on some
// launchers and produces a transparent/blank widget). We use a solid
// background colour that fills the entire widget bounds instead.

export function SvaraWidget({ nadiName, nadiTag, tattvaName, tattvaChakra, sunriseStr, sunsetStr }) {
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        padding: 12,
        backgroundColor: '#1a0530',
        borderRadius: 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      {/* Top row: sunrise / sunset */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 'match_parent',
        }}
      >
        <TextWidget text={`🌅 ${sunriseStr || '--:--'}`} style={{ fontSize: 13, color: '#c9a96e' }} />
        <TextWidget text={`🌇 ${sunsetStr || '--:--'}`} style={{ fontSize: 13, color: '#c2603a' }} />
      </FlexWidget>

      {/* Nadi + Tattva side by side */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          justifyContent: 'space-between',
        }}
      >
        {/* Nadi column */}
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget text="NADI" style={{ fontSize: 10, color: '#7a6a5a' }} />
          <TextWidget
            text={nadiName || '—'}
            style={{ fontSize: 18, color: '#e8d5a3', fontWeight: 'bold' }}
          />
          <TextWidget
            text={nadiTag || ' '}
            style={{ fontSize: 11, color: '#b8a894' }}
          />
        </FlexWidget>

        {/* Tattva column */}
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget text="TATTVA" style={{ fontSize: 10, color: '#7a6a5a' }} />
          <TextWidget
            text={tattvaName || '—'}
            style={{ fontSize: 18, color: '#e8d5a3', fontWeight: 'bold' }}
          />
          <TextWidget
            text={tattvaChakra || ' '}
            style={{ fontSize: 11, color: '#b8a894' }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
