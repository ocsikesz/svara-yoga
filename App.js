import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, TextInput, Alert, Platform, Image } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from 'react-native-iap';
import { C, s } from './src/constants/theme';
import { PREMIUM_SKU, TABS, TATTVAS_CLASSIC, TATTVAS_GHATIKA, LUNAR_DAYS, DEFAULT_LAT, DEFAULT_LNG } from './src/constants/data';
import { calcSunrise, getLunarDay } from './src/utils/timeMath';
import AppHeader from './src/components/AppHeader';
import SvaraScreen from './src/screens/SvaraScreen';
import LunarScreen from './src/screens/LunarScreen';
import TimelineScreen from './src/screens/TimelineScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// IAP product ID — must match the SKU created in Google Play Console.
// Single non-consumable product (one-time premium unlock, no subscription).

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});



// Logo + page subtitle + current time, shown on every screen.

// ── HOME ──────────────────────────────────────────────────────────────────────

// ── SVARA ─────────────────────────────────────────────────────────────────────

// ── LUNAR ─────────────────────────────────────────────────────────────────────

// ── TIMELINE ──────────────────────────────────────────────────────────────────

// ── INNER APP ─────────────────────────────────────────────────────────────────

function InnerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isGhatika, setIsGhatika] = useState(true);
  const [manualSvara, setManualSvara] = useState(null);
  const insets = useSafeAreaInsets();

  // ── TRIAL & PREMIUM STATE ───────────────────────────────────────────────────
  // Stores the first time the user opened THIS version of the app (so existing
  // production users who update get a fresh 10-day trial from update time).
  // After trial, features will be gated on `isPremium` (set by IAP — wired in
  // a later commit). For now isPremium stays false; banner shows remaining days.
  const TRIAL_DAYS = 10;
  const [firstRunAt, setFirstRunAt] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [tick, setTick] = useState(0); // forces re-render once a day for the counter

  useEffect(() => {
    (async () => {
      try {
        let stored = await AsyncStorage.getItem('svaraFirstRun');
        if (!stored) {
          stored = String(Date.now());
          await AsyncStorage.setItem('svaraFirstRun', stored);
        }
        setFirstRunAt(parseInt(stored, 10));
        const prem = await AsyncStorage.getItem('svaraPremium');
        setIsPremium(prem === 'true');
      } catch(e) {}
    })();
    // Re-render once an hour so the days-remaining counter updates cleanly
    // (the trial cutoff itself is computed on demand, this is just for the UI).
    const id = setInterval(() => setTick(t => t + 1), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const trialInfo = (() => {
    if (firstRunAt == null) return { daysSince: 0, daysLeft: TRIAL_DAYS, inTrial: true };
    const ms = Date.now() - firstRunAt;
    const daysSince = Math.floor(ms / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, TRIAL_DAYS - daysSince);
    return { daysSince, daysLeft, inTrial: daysLeft > 0 };
  })();
  const hasFullAccess = isPremium || trialInfo.inTrial;

  // ── IAP (PURCHASES) ─────────────────────────────────────────────────────────
  // One-time purchase product 'svara_premium' from Google Play. The flow:
  //   1. On mount, initConnection() opens the Billing connection.
  //   2. Verify any past purchase (getAvailablePurchases) so reinstalls and
  //      app-data clears still restore premium without manual action.
  //   3. Subscribe to purchaseUpdatedListener — fires on successful buy.
  //      We finishTransaction(isConsumable:false) to ACK to Google (otherwise
  //      Google auto-refunds within 3 days), then save 'svaraPremium' = true.
  //   4. Subscribe to purchaseErrorListener for failures (USER_CANCELED is
  //      silent; everything else gets a friendly Alert).
  //   5. fetchProduct() loads the localized price string so we can show it on
  //      the unlock UI (best-effort — purchase still works if it fails).
  //   6. On unmount, endConnection() cleans up.
  // requestPremium() is what we wire to the "Unlock" tap from the banner.
  // restorePremium() is exposed for the Settings screen and called silently
  // on mount.
  const [iapPrice, setIapPrice] = useState(null);     // e.g. "4.99 €" — null if not loaded
  const [iapBusy,  setIapBusy]  = useState(false);    // true while a request is in flight
  const iapReadyRef = useRef(false);

  const restorePremium = async (showAlert) => {
    try {
      // IAP 15.x: getAvailablePurchases returns Purchase[] with productId (both platforms).
      const purchases = await getAvailablePurchases();
      const owned = (purchases || []).some(p => p.productId === PREMIUM_SKU);
      if (owned) {
        await AsyncStorage.setItem('svaraPremium', 'true');
        setIsPremium(true);
        if (showAlert) Alert.alert('Restored', 'Your premium access is now active.');
        return true;
      }
      if (showAlert) Alert.alert('No purchases found', 'There is no previous Svara Yoga premium purchase on this Google account.');
      return false;
    } catch (e) {
      if (showAlert) Alert.alert('Restore failed', e?.message || 'Please try again later.');
      return false;
    }
  };

  const requestPremium = async () => {
    if (iapBusy) return;
    if (!iapReadyRef.current) {
      Alert.alert('Store not ready', 'The Google Play store is not available right now. Please try again in a moment.');
      return;
    }
    setIapBusy(true);
    try {
      // IAP 15.x API — nested request object per platform. We ship Android
      // only, but we include the apple wrapper so the same call would work
      // on iOS in a hypothetical future without further refactor.
      await requestPurchase({
        request: {
          android: { skus: [PREMIUM_SKU] },
          ios: { sku: PREMIUM_SKU },
        },
        type: 'in-app',
      });
      // The actual unlock happens in purchaseUpdatedListener below.
    } catch (e) {
      const code = e?.code || '';
      if (code === 'E_USER_CANCELLED' || code === 'E_USER_CANCELED') {
        // silent
      } else if (code === 'E_ALREADY_OWNED') {
        // The user already owns it — treat as a restore.
        await restorePremium(true);
      } else {
        Alert.alert('Purchase failed', e?.message || 'Please try again later.');
      }
    } finally {
      setIapBusy(false);
    }
  };

  useEffect(() => {
    let purchaseUpdateSub = null;
    let purchaseErrorSub = null;
    let cancelled = false;
    (async () => {
      try {
        // IAP 15.x: same initConnection() as 12.x
        await initConnection();
        if (cancelled) return;
        iapReadyRef.current = true;
        // Best-effort: fetch the product to get the localized price string.
        // IAP 15.x renamed getProducts → fetchProducts and requires an explicit
        // 'type: in-app' argument. localizedPrice → displayPrice.
        try {
          const products = await fetchProducts({ skus: [PREMIUM_SKU], type: 'in-app' });
          const p = Array.isArray(products) ? products[0] : null;
          if (p && (p.displayPrice || p.localizedPrice)) {
            setIapPrice(p.displayPrice || p.localizedPrice);
          }
        } catch (e) {}
        // Silent restore so users who reinstall or clear data don't have to
        // press a button to get their premium back.
        await restorePremium(false);
        // Listen for future purchases. Signature is same as 12.x.
        purchaseUpdateSub = purchaseUpdatedListener(async (purchase) => {
          try {
            if (purchase?.productId !== PREMIUM_SKU) return;
            // Android: purchaseStateAndroid 1 = purchased, 2 = pending, 0 = unspecified.
            // Acknowledge regardless; finishTransaction is idempotent.
            await finishTransaction({ purchase, isConsumable: false });
            await AsyncStorage.setItem('svaraPremium', 'true');
            setIsPremium(true);
            Alert.alert('Thank you 🙏', 'Premium is now unlocked. Enjoy the full Svara Yoga experience.');
          } catch (e) {}
        });
        purchaseErrorSub = purchaseErrorListener((err) => {
          // Errors from requestPurchase() are also caught above in requestPremium's
          // try/catch — this listener catches errors that bubble up out-of-band.
          if (err?.code === 'E_USER_CANCELLED' || err?.code === 'E_USER_CANCELED') return;
        });
      } catch (e) {
        // Billing unavailable in this environment (dev build, sideloaded APK,
        // missing Play services, etc.). Premium stays locked but the rest of
        // the app works.
        iapReadyRef.current = false;
      }
    })();
    return () => {
      cancelled = true;
      try { purchaseUpdateSub?.remove(); } catch (e) {}
      try { purchaseErrorSub?.remove(); } catch (e) {}
      try { endConnection(); } catch (e) {}
    };
  }, []);

  const [config, setConfig] = useState(() => {
    const calc = calcSunrise(DEFAULT_LAT, DEFAULT_LNG);
    return {
      city:'Varanasi', lat:DEFAULT_LAT, lng:DEFAULT_LNG,
      srH:6, srM:12, ssH:18, ssM:34,
      sunriseMin:calc.sunriseMin, sunsetMin:calc.sunsetMin,
      sunriseStr:calc.sunriseStr, sunsetStr:calc.sunsetStr,
      locationMode:'default', sunriseMode:'auto',
      notifs:{
        nadi:   { ida:true, pingala:true, sushumna:true },
        tattva: { akasha:true, vayu:true, tejas:true, apas:true, prithvi:true },
      },
    };
  });

  // Load saved config on app start.
  // Persistence model:
  //   AsyncStorage 'appConfig' holds the whole saved config object.
  //   On start: load this and apply it. Then:
  //   - If locationMode is 'auto', refresh GPS in background (and re-calc sunrise
  //     ONLY if sunriseMode is also 'auto'; if user has manual time we keep it)
  //   - If locationMode is 'gps' (gps-once) or 'manual', leave coordinates alone
  //   - Manual sunrise time always wins over auto-calc, regardless of location mode
  useEffect(() => {
    (async () => {
      let saved = null;
      try {
        const raw = await AsyncStorage.getItem('appConfig');
        if (raw) saved = JSON.parse(raw);
      } catch(e) {}

      if (saved && typeof saved === 'object') {
        // Apply everything from saved config
        setConfig(prev => ({ ...prev, ...saved }));
        if (typeof saved.isGhatika === 'boolean') setIsGhatika(saved.isGhatika);
      }

      const mode = saved?.locationMode || 'auto';
      const srMode = saved?.sunriseMode || 'auto';

      // If location mode is 'auto', refresh GPS in background
      if (mode === 'auto') {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const latN = loc.coords.latitude;
            const lngN = loc.coords.longitude;
            let cityName = 'Current Location';
            try {
              const geo = await Location.reverseGeocodeAsync({ latitude: latN, longitude: lngN });
              if (geo && geo.length > 0) {
                cityName = geo[0].city || geo[0].district || geo[0].region || 'Current Location';
              }
            } catch(e) {}
            setConfig(prev => {
              const next = { ...prev, city: cityName, lat: latN, lng: lngN, locationMode: 'auto' };
              // Only update sunrise/sunset if user wants auto-calculated times
              if (srMode === 'auto') {
                const calc = calcSunrise(latN, lngN);
                next.sunriseMin = calc.sunriseMin;
                next.sunsetMin  = calc.sunsetMin;
                next.sunriseStr = calc.sunriseStr;
                next.sunsetStr  = calc.sunsetStr;
              }
              // Persist immediately so next restart sees fresh location
              try { AsyncStorage.setItem('appConfig', JSON.stringify(next)); } catch(e) {}
              return next;
            });
          }
        } catch(e) {}
      }
    })();
  }, []);

  // Persist isGhatika changes (separate from config in case user toggles only this)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('appConfig');
        const obj = raw ? JSON.parse(raw) : {};
        obj.isGhatika = isGhatika;
        await AsyncStorage.setItem('appConfig', JSON.stringify(obj));
      } catch(e) {}
    })();
  }, [isGhatika]);

  // Notification permission + channel setup — Android 13+ requires this order:
  //   1. requestPermissionsAsync() — MUST be first. Creating the channel
  //      before the permission is granted can trigger a native crash on
  //      Android 13+ (permission race).
  //   2. Once granted, setNotificationChannelAsync() creates the channel.
  //   3. Set notifReady=true. All scheduling code guards on this so it
  //      never touches the notification system while permission is pending.
  const [notifReady, setNotifReady] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const { status, canAskAgain } = await Notifications.getPermissionsAsync();
        let finalStatus = status;
        if (status !== 'granted' && canAskAgain) {
          // expo-notifications 0.32 (SDK 54) tightened the request shape:
          // NotificationPermissionsRequest only accepts an 'ios' key now.
          // Passing 'android: {}' (which was harmless on 0.29) crashes
          // natively on 0.32 because the type is no longer part of the
          // schema and the native call errors out mid-dialog — that's what
          // was closing the app when the permission dialog appeared.
          // On Android, all permissions are granted by default from the
          // manifest declaration; the runtime dialog just confirms, and
          // needs no per-platform arguments.
          const result = await Notifications.requestPermissionsAsync({
            ios: { allowAlert:true, allowSound:true, allowBadge:false },
          });
          finalStatus = result.status;
        }
        if (finalStatus !== 'granted') return; // notifReady stays false

        // Only NOW create the channel — permission is granted.
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('svara-transitions', {
            name: 'Svara Transitions',
            description: 'Notifications when nadi or tattva changes',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#c9a96e',
            sound: 'default',
            enableVibrate: true,
            showBadge: false,
            bypassDnd: false,
          });
        }

        // Fresh-install cleanup: on very first launch after install, wipe
        // any stale notifications that Android kept from a prior version of
        // this app. Android doesn't dismiss on uninstall — the shade can
        // hold delivered items for hours. Both calls are safe if the queue
        // and shade are empty.
        try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch(e) {}
        try { await Notifications.dismissAllNotificationsAsync(); } catch(e) {}

        setNotifReady(true);
      } catch(e) {}
    })();
  }, []);

  // Notifications strategy:
  // - Compute EXACT moments when nadi or tattva will change in the next 24 hours.
  // - Schedule one notification per transition with trigger:{seconds:N}.
  // - Android delivers these even when the app is closed.
  // - Re-schedule whenever sunrise/Ghatika/toggles change, or when the app is
  //   opened (the useEffect re-runs).
  // - We tag scheduled notifications with identifier='svara-tx' so we cancel
  //   only ours, not user-test ones.
  // Concurrency lock — scheduleAll() reads this and refuses to run if a prior
  // call hasn't finished. Without it, the refill listener firing during a
  // config change re-schedule could double-queue 500 notifications, with many
  // landing on the same minute (that's how 49 notifications can arrive at
  // the exact same time).
  const schedulingRef = useRef(false);
  useEffect(() => {
    const TATTVA_INFO = {
      prithvi: { emoji:'🌍', name:'Prithvi', desc:'Earth · stable, grounding. Good for steady work.' },
      apas:    { emoji:'💧', name:'Apas',    desc:'Water · flowing, creative. Good for art & study.' },
      tejas:   { emoji:'🔥', name:'Tejas',   desc:'Fire · intense, transformative. Avoid new starts.' },
      vayu:    { emoji:'🌬', name:'Vayu',    desc:'Air · movement, change. Good for travel & exchange.' },
      akasha:  { emoji:'✨', name:'Akasha',  desc:'Ether · transcendent, vast. Best for meditation.' },
    };
    const NADI_INFO = {
      ida:      { emoji:'🌙', name:'Ida',      desc:'Left nostril · lunar, cooling. Calm, healing tasks.' },
      pingala:  { emoji:'☀️', name:'Pingala',  desc:'Right nostril · solar, warming. Action, courage.' },
      sushumna: { emoji:'🔥', name:'Sushumna', desc:'Both equal · sacred, rare. Sit for meditation now.' },
    };

    const scheduleAll = async () => {
      // Guard: don't touch notification system until permission + channel
      // are both confirmed ready. Prevents races on Android 13+ first install.
      if (!notifReady) return;
      // Concurrency lock — scheduleAll should never run in parallel with
      // itself. Without it, the refill listener firing during a config
      // change could double-queue 500 notifications, with many landing on
      // the same minute (that's how 49 could arrive together).
      if (schedulingRef.current) return;
      schedulingRef.current = true;
      try {
        // FULL cleanup — cancel ALL scheduled notifications, not just our
        // svara-tx kind. Critical because:
        //   (a) old app versions (105, 108, 111, 112, 116, 218, 305–315…)
        //       left orphan alarms in Android's AlarmManager that we can
        //       no longer selectively identify. They all stack at
        //       predictable minutes (sunrise + N), so 49 of them can fire
        //       at once.
        //   (b) cancelAllScheduledNotificationsAsync is O(1) at the OS
        //       level; clearing everything is the only safe way to purge
        //       orphans.
        // Safe because we own the entire notification namespace in this
        // app (no non-svara notifications shipped).
        await Notifications.cancelAllScheduledNotificationsAsync();
        // ALSO dismiss anything already sitting in the status bar. Android
        // does NOT dismiss notifications when an app is uninstalled — old
        // notifications from previous installs of THIS package can persist
        // in the shade for hours/days. This is why the user saw 49
        // notifications immediately after a fresh install: they were
        // leftover items from the prior version that got 'bug-bombed'.
        // dismissAll clears them.
        await Notifications.dismissAllNotificationsAsync();

        const now = new Date();
        const nowMin = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60;
        const sr = config.sunriseMin;
        const cycleDur = isGhatika ? 120 : 60;
        const seq = isGhatika ? TATTVAS_GHATIKA : TATTVAS_CLASSIC;
        const lunarNow = getLunarDay();
        const startNadi = (LUNAR_DAYS.find(d => d.day === lunarNow.day) || LUNAR_DAYS[0]).nadi;

        // Helper: compute nadi at a given offset (minutes from now).
        // Nadi alternates every 60 min in a 120-min cycle, all day long (24h).
        // Sushumna appears for 2 min at each transition (minute 0, 60, 120, ...).
        const nadiAt = (offsetMin) => {
          const minFromSR = nowMin + offsetMin - sr;
          // Use modulo so cycle continues past 12h
          const adjusted = ((minFromSR % 1440) + 1440) % 1440;
          const cyclePos = adjusted % 120;
          if (cyclePos < 2 || (cyclePos >= 60 && cyclePos < 62)) return 'sushumna';
          if (cyclePos < 60) return startNadi;
          return startNadi === 'ida' ? 'pingala' : 'ida';
        };

        // Helper: compute tattva at a given offset
        const tattvaAt = (offsetMin) => {
          const mFromSR = nowMin + offsetMin - sr;
          if (mFromSR < 0) return seq[0];
          const pos = ((mFromSR % cycleDur) + cycleDur) % cycleDur;
          let elapsed = 0;
          for (const t of seq) { elapsed += isGhatika ? t.ghatika : t.classic; if (pos < elapsed) return t; }
          return seq[seq.length-1];
        };

        // Build list of TATTVA and NADI transitions in the next 24h.
        // Walk minute-by-minute, detect when value changes from previous.
        // Skip the first 5 minutes — anything that close may have just fired
        // or be in the queue; re-scheduling creates duplicate "ghost" notifications.
        // Horizon extended to 7 days (10080 min) so we can pre-fill up to 500
        // notifications and survive long stretches without app being opened.
        const HORIZON_MIN = 7 * 24 * 60; // 10080
        const txs = []; // {dm, type:'tattva'|'nadi', toId}
        let lastTat = tattvaAt(0).id;
        let lastNadi = nadiAt(0);
        for (let dm = 1; dm <= HORIZON_MIN; dm++) {
          // Tattva transitions — only push if this specific tattva is enabled
          const t = tattvaAt(dm).id;
          if (t !== lastTat) {
            if (dm >= 5 && config.notifs?.tattva?.[t]) txs.push({ dm, type:'tattva', toId: t });
            lastTat = t;
          }
          // Nadi transitions — only push if this specific nadi is enabled
          const n = nadiAt(dm);
          if (n !== lastNadi) {
            if (dm >= 5 && config.notifs?.nadi?.[n]) txs.push({ dm, type:'nadi', toId: n });
            lastNadi = n;
          }
        }

        // Sort and limit. Android can handle ~500 scheduled notifications per
        // app — we use that as our cap. With ~3.5 events/hour in Ghatika mode
        // (nadi transitions + tattva transitions), 500 covers ~6 days. The
        // listener below refills on each delivery, so the queue stays full
        // even longer in practice.
        txs.sort((a,b) => a.dm - b.dm);
        const limited = txs.slice(0, 500);

        // Schedule each transition with appropriate trigger
        for (const tx of limited) {
          // Compute what nadi/tattva will be active AT that moment for the body text
          const futureMFromSR = (nowMin - sr + tx.dm + 1440) % 1440;
          const pos = ((futureMFromSR % cycleDur) + cycleDur) % cycleDur;
          let activeTat = seq[0];
          let e = 0;
          for (const x of seq) { e += isGhatika ? x.ghatika : x.classic; if (pos < e) { activeTat = x; break; } }
          const androidFields = Platform.OS === 'android'
            ? { channelId:'svara-transitions', priority: Notifications.AndroidNotificationPriority.HIGH }
            : {};
          if (tx.type === 'tattva') {
            const ti = TATTVA_INFO[tx.toId];
            if (!ti) continue;
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${ti.emoji}  ${ti.name}`,
                body:  ti.desc,
                sound: true,
                data:  { kind:'svara-tx' },
                ...androidFields,
              },
              // CRITICAL for SDK 52: type must be explicit. expo-notifications
              // 0.29 (bundled with SDK 52) tightened trigger parsing —
              // a bare { seconds: N } without a 'type' field is ambiguous and
              // no longer reliably interpreted as a one-shot time-interval
              // trigger. Result on SDK 52: notifications either fire
              // immediately or repeat, which is why the user saw the 49-item
              // burst and phone vibrating every ~10s.
              // SDK 51 (expo-notifications 0.28) accepted the bare shape, so
              // v1.105 works — but we're on SDK 52 now.
              // Explicit 'timeInterval' + repeats:false gives the correct
              // one-shot behaviour on both SDKs.
              trigger: {
                type: 'timeInterval',
                seconds: Math.max(1, Math.round(tx.dm*60)),
                repeats: false,
              },
            });
          } else {
            const ni = NADI_INFO[tx.toId];
            if (!ni) continue;
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${ni.emoji}  ${ni.name}`,
                body:  ni.desc,
                sound: true,
                data:  { kind:'svara-tx' },
                ...androidFields,
              },
              trigger: {
                type: 'timeInterval',
                seconds: Math.max(1, Math.round(tx.dm*60)),
                repeats: false,
              },
            });
          }
        }
      } catch(e) {
      } finally {
        schedulingRef.current = false;
      }
    };

    // Debounce: wait 1.5s after deps change before re-scheduling. This avoids
    // cancel/reschedule storms when user toggles several settings in a row, or
    // when Apply changes multiple config keys at once.
    const debouncedId = setTimeout(scheduleAll, 1500);
    // Also re-schedule every 10 min while app is open to keep the pipeline fresh
    // as old notifications fire and the 24h window slides forward.
    const intervalId = setInterval(scheduleAll, 10*60*1000);
    // LOOP REFILL: each time a svara-tx notification is received (or wakes
    // the app briefly), top up the queue so the buffer never empties.
    // Debounced 5 s so that when 3 notifications fire within the same minute
    // we only re-schedule once, not three times in parallel.
    let refillTimeout = null;
    const sub = Notifications.addNotificationReceivedListener((notif) => {
      try {
        if (notif?.request?.content?.data?.kind === 'svara-tx') {
          if (refillTimeout) clearTimeout(refillTimeout);
          refillTimeout = setTimeout(() => { scheduleAll(); }, 5000);
        }
      } catch(e) {}
    });
    return () => {
      clearTimeout(debouncedId);
      clearInterval(intervalId);
      if (refillTimeout) clearTimeout(refillTimeout);
      sub.remove();
    };
  }, [notifReady, config.sunriseMin, isGhatika, JSON.stringify(config.notifs)]);

  const screens = {
    home:     <HomeScreen config={config} isGhatika={isGhatika} manualSvara={manualSvara} hasFullAccess={hasFullAccess}/>,
    svara:    <SvaraScreen picked={manualSvara} setPicked={setManualSvara}/>,
    lunar:    <LunarScreen/>,
    timeline: <TimelineScreen config={config} isGhatika={isGhatika}/>,
    settings: <SettingsScreen config={config} setConfig={setConfig} isGhatika={isGhatika} setIsGhatika={setIsGhatika}
                              isPremium={isPremium} iapPrice={iapPrice} iapBusy={iapBusy}
                              requestPremium={requestPremium} restorePremium={restorePremium}/>,
  };

  return (
    <View style={{flex:1,backgroundColor:C.bg,paddingTop:insets.top}}>
      {/* Trial banner — visible only when not premium. During trial shows the
          remaining days; after trial it's tappable and triggers the IAP flow.
          Wraps in TouchableOpacity so the whole banner is the unlock affordance. */}
      {!isPremium && (
        <TouchableOpacity
          onPress={requestPremium}
          disabled={iapBusy}
          activeOpacity={0.75}
          style={s.trialBanner}
        >
          <Text style={s.trialText}>
            {iapBusy
              ? '⏳ Opening Google Play…'
              : trialInfo.inTrial
                ? `✨ Free trial · ${trialInfo.daysLeft} day${trialInfo.daysLeft === 1 ? '' : 's'} left  ·  Tap to unlock${iapPrice ? '  ('+iapPrice+')' : ''}`
                : `🔒 Trial ended  ·  Tap to unlock${iapPrice ? '  ('+iapPrice+')' : ''}`}
          </Text>
        </TouchableOpacity>
      )}
      <View style={{flex:1}}>{screens[activeTab]}</View>
      <View style={[s.bottomNav,{paddingBottom:insets.bottom+8}]}>
        {TABS.map(t=>(
          <TouchableOpacity key={t.id} style={s.navItem} onPress={()=>setActiveTab(t.id)}>
            <Image source={t.img} style={[s.navIconImg, {opacity: activeTab===t.id ? 1 : 0.45}]} resizeMode="contain"/>
            <Text style={[s.navLabel,activeTab===t.id&&{color:C.gold}]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  return <SafeAreaProvider><InnerApp/></SafeAreaProvider>;
}

// ── STYLES ────────────────────────────────────────────────────────────────────
