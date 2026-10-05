import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import App from './App';
import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';

// Register the home-screen widget's background update handler. Called by
// Android when the widget is added, resized, clicked, or needs to refresh
// (every 30 min per the updatePeriodMillis in app.json).
registerWidgetTaskHandler(widgetTaskHandler);

registerRootComponent(App);
