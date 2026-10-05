import { registerRootComponent } from 'expo';
import App from './App';

// Register the home-screen widget's background update handler in a try that
// swallows any error. Reason: if the widget library or widget task handler
// fails to load (bad native linkage, missing dependency in headless JS
// runtime, etc.), the main app would otherwise crash the moment the user
// opens it from the launcher icon — because this import runs synchronously
// at startup, before the UI mounts.
//
// Observed bug: user reported launcher-icon tap crashed the app but
// widget-click (which also opens the app, via a different Intent path)
// worked fine. That pattern points at exactly this early-startup import
// chain failing, so we isolate it.
try {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/widgets/widgetTaskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
} catch (e) {
  // Widget registration failed — log and continue so the main app still
  // boots. The widget will show its "Open app" fallback until the next
  // build fixes the underlying cause.
  console.log('[Widget] registration failed:', e && e.message);
}

registerRootComponent(App);
