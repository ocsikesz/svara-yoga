// Static app constants: SKUs, tabs, tattva tables, iconography, shlokas,
// lunar-day meanings, recommendation lookups, default coordinates.
// Everything here is pure data — no React, no side effects.

const PREMIUM_SKU = 'svara_premium';

const TABS = [
  { id:'home',     label:'Home',    img:require('../../assets/home.png') },
  { id:'svara',    label:'Svara',   img:require('../../assets/svara.png') },
  { id:'lunar',    label:'Lunar',   img:require('../../assets/lunar.png') },
  { id:'timeline', label:'Tattwa',  img:require('../../assets/tattwa.png') },
  { id:'settings', label:'Settings',img:require('../../assets/setting.png') },
];

const TATTVAS_CLASSIC = [
  { id:'prithvi', name:'Prithvi', emoji:'🌍', classic:20, ghatika:24, color:'#8B5E3C', sense:'Smell · Gandha',   chakra:'Muladhara · Root',       symbol:'Square',   description:'Earth element brings stability, patience and endurance. Ideal for planting, construction and long-term planning.' },
  { id:'apas',    name:'Apas',    emoji:'💧', classic:16, ghatika:24, color:'#4a8ec2', sense:'Taste · Rasa',    chakra:'Svadhisthana · Sacral',   symbol:'Crescent', description:'Water element brings flow, creativity and auspiciousness. Ideal for healing, romance and all gentle pursuits.' },
  { id:'tejas',   name:'Tejas',   emoji:'🔥', classic:12, ghatika:24, color:'#c2603a', sense:'Sight · Rupa',    chakra:'Manipura · Solar Plexus', symbol:'Triangle', description:'Fire element brings transformation and intensity. Use for cooking, debate and fierce activity. Avoid new beginnings.' },
  { id:'vayu',    name:'Vayu',    emoji:'🌬', classic:8,  ghatika:24, color:'#7ab89a', sense:'Touch · Sparsha', chakra:'Anahata · Heart',         symbol:'Hexagon',  description:'Air element brings movement and change. Good for short travel, music and communication. Avoid permanent decisions.' },
  { id:'akasha',  name:'Akasha',  emoji:'✨', classic:4,  ghatika:24, color:'#8a6aaa', sense:'Sound · Shabda',  chakra:'Vishuddha · Throat',      symbol:'Circle',   description:'Ether element is transcendent and rare. Use only for deep meditation, mantra japa and spiritual initiation.' },
];

const TATTVAS_GHATIKA = [
  { id:'akasha',  name:'Akasha',  emoji:'✨', classic:4,  ghatika:24, color:'#8a6aaa', sense:'Sound · Shabda',  chakra:'Vishuddha · Throat',      symbol:'Circle',   description:'Ether element is transcendent and rare. Use only for deep meditation, mantra japa and spiritual initiation.' },
  { id:'vayu',    name:'Vayu',    emoji:'🌬', classic:8,  ghatika:24, color:'#7ab89a', sense:'Touch · Sparsha', chakra:'Anahata · Heart',         symbol:'Hexagon',  description:'Air element brings movement and change. Good for short travel, music and communication. Avoid permanent decisions.' },
  { id:'tejas',   name:'Tejas',   emoji:'🔥', classic:12, ghatika:24, color:'#c2603a', sense:'Sight · Rupa',    chakra:'Manipura · Solar Plexus', symbol:'Triangle', description:'Fire element brings transformation and intensity. Use for cooking, debate and fierce activity. Avoid new beginnings.' },
  { id:'apas',    name:'Apas',    emoji:'💧', classic:16, ghatika:24, color:'#4a8ec2', sense:'Taste · Rasa',    chakra:'Svadhisthana · Sacral',   symbol:'Crescent', description:'Water element brings flow, creativity and auspiciousness. Ideal for healing, romance and all gentle pursuits.' },
  { id:'prithvi', name:'Prithvi', emoji:'🌍', classic:20, ghatika:24, color:'#8B5E3C', sense:'Smell · Gandha',  chakra:'Muladhara · Root',        symbol:'Square',   description:'Earth element brings stability, patience and endurance. Ideal for planting, construction and long-term planning.' },
];

// PNG icon maps (require must be static, so we key by id here)
const TATTVA_IMG = {
  akasha:  require('../../assets/akasha.png'),
  vayu:    require('../../assets/vayu.png'),
  tejas:   require('../../assets/tejas.png'),
  apas:    require('../../assets/apas.png'),
  prithvi: require('../../assets/Prithvi.png'),
};
const NADI_IMG = {
  ida:      require('../../assets/ida.png'),
  pingala:  require('../../assets/pingala.png'),
  sushumna: require('../../assets/shushumna.png'),
};

// Teachings paraphrased in our own words from the Shiva Svarodaya tradition.
// These are NOT copied translations — the full Sanskrit text with a proper
// English translation is in: "Swara Yoga: The Tantric Science of Brain
// Breathing" by Swami Muktibodhananda (Bihar School of Yoga). See the source
// card at the bottom of this screen. Verse numbers are approximate references
// to where each theme appears in the 395-sutra text.
const SHLOKAS = [
  // ── Foundations ──
  { verse:1,   topic:'The Dialogue Begins',      sanskrit:'', meaning:'The teaching opens as Parvati asks Shiva to reveal the science of the breath — knowledge once kept secret, passed only from teacher to student.' },
  { verse:9,   topic:'Svara as Supreme Knowledge', sanskrit:'स्वरे शास्त्राणि विद्यन्ते', meaning:'All scriptures, all music, all knowledge are said to rest within the svara — the flow of the breath. To know the breath is to know the cosmos in miniature.' },
  { verse:12,  topic:'Secrecy of the Science',   sanskrit:'', meaning:'This knowledge is described as the most precious of secrets — to be shared only with the sincere, the devoted, and those who will honour it.' },
  { verse:15,  topic:'Breath as Life-Force',     sanskrit:'', meaning:'The breath carries prana, the vital force. As the breath moves, so moves the mind; steady the one and you steady the other.' },

  // ── The Three Nadis ──
  { verse:21,  topic:'The Three Channels',       sanskrit:'इडा पिङ्गला सुषुम्ना', meaning:'Three subtle channels carry the breath: Ida on the left, Pingala on the right, and Sushumna in the centre. From these all rhythms of life unfold.' },
  { verse:24,  topic:'Ida — The Lunar Channel',  sanskrit:'', meaning:'When breath flows in the left nostril, the cooling lunar current (Ida) is active — calm, nourishing, inward-turning.' },
  { verse:27,  topic:'Pingala — The Solar Channel', sanskrit:'', meaning:'When breath flows in the right nostril, the heating solar current (Pingala) is active — energetic, outward, ready for action.' },
  { verse:30,  topic:'Sushumna — The Central Fire', sanskrit:'', meaning:'When both nostrils flow equally, Sushumna awakens. This rare state is the gateway to meditation and higher consciousness.' },
  { verse:33,  topic:'Reading Your Own Breath',  sanskrit:'', meaning:'Place a finger beneath the nostrils on waking. Notice which side flows more freely — that current colours the hours ahead.' },

  // ── Ida activities ──
  { verse:47,  topic:'When Ida Flows',           sanskrit:'इडायां शुभकार्याणि', meaning:'While the left breath flows, favour gentle and lasting works: study, healing, planting, acts of kindness, beginning peaceful ventures.' },
  { verse:50,  topic:'Ida and the Mind',         sanskrit:'', meaning:'The lunar breath quiets the mind and cools the emotions. A good time for reflection, art, and matters of the heart.' },
  { verse:53,  topic:'Ida for Health',           sanskrit:'', meaning:'Tradition holds that drinking, eating and resting during the left-breath supports digestion and recovery.' },

  // ── Pingala activities ──
  { verse:58,  topic:'When Pingala Flows',       sanskrit:'पिङ्गलायां च दारुणम्', meaning:'While the right breath flows, favour vigorous works: physical effort, travel, debate, competition, and bold undertakings.' },
  { verse:61,  topic:'Pingala and Digestion',    sanskrit:'', meaning:'The solar breath kindles the inner fire. Heavier meals are said to digest best while Pingala is active.' },
  { verse:64,  topic:'Pingala for Courage',      sanskrit:'', meaning:'When willpower and stamina are needed, the right-breath lends its heat. Confront challenges while the sun-channel flows.' },

  // ── Sushumna ──
  { verse:71,  topic:'When Sushumna Flows',      sanskrit:'सुषुम्नायां न कार्याणि', meaning:'When the central channel opens, set aside worldly tasks. This is the moment for meditation, mantra, and turning within.' },
  { verse:74,  topic:'The Sacred Pause',         sanskrit:'', meaning:'Sushumna arises briefly as the breath shifts from one nostril to the other. Catch this pause and the mind grows still.' },

  // ── The Five Tattvas ──
  { verse:82,  topic:'The Five Elements',        sanskrit:'पृथ्वी आपस् तेजस् वायु आकाश', meaning:'Each breath carries one of five elements in turn: Earth, Water, Fire, Air and Ether — each shaping the quality of the moment.' },
  { verse:85,  topic:'Prithvi — Earth',          sanskrit:'', meaning:'When the Earth element flows, the breath is steady and grounding. Favourable for stable, long-lasting work and important foundations.' },
  { verse:88,  topic:'Apas — Water',             sanskrit:'', meaning:'When Water flows, the breath is cool and moving. Auspicious for nourishing, creative and flowing activities.' },
  { verse:91,  topic:'Tejas — Fire',             sanskrit:'', meaning:'When Fire flows, the breath is sharp and hot. A destructive, transforming current — avoid new beginnings; good for cutting away.' },
  { verse:94,  topic:'Vayu — Air',               sanskrit:'', meaning:'When Air flows, the breath is light and mobile. Favourable for movement, travel, communication and quick exchanges.' },
  { verse:97,  topic:'Akasha — Ether',           sanskrit:'', meaning:'When Ether flows, the breath is subtle and vast. Worldly action bears little fruit now — best given to meditation and stillness.' },
  { verse:100, topic:'Recognising the Tattvas',  sanskrit:'', meaning:'The elements may be sensed by the breath\u2019s temperature, direction and texture, and by the colours seen in meditation.' },

  // ── Timing & the Moon ──
  { verse:108, topic:'The Breath at Sunrise',    sanskrit:'', meaning:'At dawn the dominant nostril sets the tone for the day. The tradition watches the breath especially at sunrise.' },
  { verse:111, topic:'Bright and Dark Fortnights', sanskrit:'', meaning:'In the waxing fortnight (Shukla) certain days begin with Ida; in the waning (Krishna), the pattern shifts. The moon governs the rhythm.' },
  { verse:114, topic:'The Lunar Days',           sanskrit:'', meaning:'Each tithi of the lunar month carries its own quality, favouring some actions and discouraging others.' },

  // ── Practice & predictions ──
  { verse:120, topic:'Victory and the Breath',   sanskrit:'', meaning:'Before any contest or important meeting, note your active breath; tradition gives guidance on which side favours success.' },
  { verse:123, topic:'The Breath in Travel',     sanskrit:'', meaning:'Stepping out with the favourable nostril and foot is said to smooth a journey. Pause if the breath warns against it.' },
  { verse:126, topic:'Changing the Breath',      sanskrit:'', meaning:'The flowing nostril can be changed deliberately — by lying on one side, by pressure, or by focused attention — to suit the task at hand.' },
  { verse:129, topic:'Breath and Decisions',     sanskrit:'', meaning:'Match the action to the current: gentle matters to the lunar breath, forceful matters to the solar, inner work to the central.' },
  { verse:132, topic:'Healing with Svara',       sanskrit:'', meaning:'Balancing the breath between the two nostrils is said to restore health and harmony to body and mind.' },
  { verse:138, topic:'Breath and Emotion',       sanskrit:'', meaning:'Agitation often rides the solar breath; calm rides the lunar. Shift the breath and the mood may follow.' },

  // ── Higher aim ──
  { verse:150, topic:'Balancing the Currents',   sanskrit:'', meaning:'When Ida and Pingala are balanced, Sushumna awakens and the breath becomes a ladder to deeper states.' },
  { verse:165, topic:'Breath and Consciousness', sanskrit:'', meaning:'The subtle act of breathing influences the level of awareness. To refine the breath is to refine the mind.' },
  { verse:180, topic:'The Inner Sun and Moon',   sanskrit:'', meaning:'Pingala is the inner sun, Ida the inner moon. Their union in the central channel is the aim of the yogi.' },
  { verse:200, topic:'Prana and the Universe',   sanskrit:'', meaning:'The same prana that moves the breath moves the stars. The microcosm of the body mirrors the macrocosm.' },
  { verse:250, topic:'Steadiness of Breath',     sanskrit:'', meaning:'As the breath grows slow and even, the restless mind settles and clarity dawns.' },
  { verse:300, topic:'The Witness',              sanskrit:'', meaning:'Beyond the moving breath is the unmoving witness. Watch the breath long enough and you glimpse that stillness.' },
  { verse:360, topic:'Living by the Breath',     sanskrit:'', meaning:'To live attuned to the svara is to move with the cosmic rhythm rather than against it — the heart of this science.' },
  { verse:395, topic:'The Teaching Concludes',   sanskrit:'', meaning:'Shiva ends by reminding Parvati that this knowledge bears fruit only through practice — observe your own breath, and the truth reveals itself.' },
];

const LUNAR_DAYS = [
  {day:1,  nadi:'ida',     name:'Pratipada',  emoji:'🌑',  meaning:'Beginning · new intention', desc:'The first sliver of moon. A day to plant seeds of intention and gently begin new cycles. Energy is subtle but pure — best used for setting direction, not for force.', favor:['Plant intentions','Begin new study','Light cleansing'], avoid:['Heavy work','Travel','Major decisions']},
  {day:2,  nadi:'ida',     name:'Dwitiya',    emoji:'🌒',  meaning:'Growth · gentle expansion', desc:'Lunar energy expands gently. Excellent for nurturing what was started yesterday — relationships, learning, food. Avoid harsh exchanges; the day is soft and impressionable.', favor:['Build relationships','Learn skills','Cook & nourish'], avoid:['Conflict','Long journeys']},
  {day:3,  nadi:'ida',     name:'Tritiya',    emoji:'🌒',  meaning:'Auspicious · sacred work', desc:'One of the most blessed tithis for spiritual and sacred work. Marriages, sacred ceremonies, music, and devotion all flourish. Avoid surgery, conflict and harsh speech.', favor:['Sacred art','Music','Spiritual study','Marriage rites'], avoid:['Surgery','Disputes']},
  {day:4,  nadi:'pingala', name:'Chaturthi',  emoji:'🌓',  meaning:'Obstacle · honor Ganesha', desc:'Sacred to Ganesha, remover of obstacles. Inner work and worship of Ganesha clear blockages, but launching new external projects today often meets resistance. Look inward.', favor:['Remove obstacles','Worship Ganesha','Inner work'], avoid:['Major launches','Travel south']},
  {day:5,  nadi:'pingala', name:'Panchami',   emoji:'🌓',  meaning:'Wisdom · serpent power', desc:'Sacred to the Nagas (serpent forces) and to learning. A day for mantras, sacred study, and awakening kundalini-like energies. Avoid surgery, especially on snakes or skin.', favor:['Knowledge work','Mantras','Snake/Naga worship'], avoid:['Surgery on snakes/skin','Underground work']},
  {day:6,  nadi:'pingala', name:'Shashthi',   emoji:'🌔',  meaning:'Skanda · warrior energy', desc:'Sacred to Skanda/Kartikeya, the celestial warrior. Strong day for courage, physical training, healing, and protective rituals. Travel and risky ventures are less favored.', favor:['Courage tasks','Physical training','Health work'], avoid:['Travel','Risky ventures']},
  {day:7,  nadi:'ida',     name:'Saptami',    emoji:'🌔',  meaning:'Sun-blessed · clear light', desc:'Solar-blessed day with clarity and bright energy. Excellent for health work, solar practices, and any endeavor done openly. Hidden or shadowy work meets exposure.', favor:['Health rituals','Solar mantras','Bright endeavors'], avoid:['Dark deeds','Hidden plans']},
  {day:8,  nadi:'ida',     name:'Ashtami',    emoji:'🌔',  meaning:'Power · Durga energy', desc:'Sacred to Durga, the fierce protective Mother. A day of inner power. Spiritual practice and inner battles are favored; worldly business and travel are less so.', favor:['Worship','Spiritual practice','Inner battles'], avoid:['Worldly business','Travel']},
  {day:9,  nadi:'ida',     name:'Navami',     emoji:'🌕',  meaning:'Fierce · transformative', desc:'Highly transformative tithi. Deep sadhana, letting go of old patterns, and goddess worship are powerful. Avoid worldly pleasures, light socializing and journeys today.', favor:['Deep sadhana','Letting go','Goddess worship'], avoid:['Pleasures','Light socializing','Travel']},
  {day:10, nadi:'pingala', name:'Dashami',    emoji:'🌕',  meaning:'Victory · success energy', desc:'Tithi of victory and momentum. Strong support for achievement, travel north or east, and large decisions. Procrastination and self-doubt weigh more heavily today.', favor:['Travel north/east','Big decisions','Achievement'], avoid:['Defeatist thinking','Procrastination']},
  {day:11, nadi:'pingala', name:'Ekadashi',   emoji:'🌕',  meaning:'Sacred fast · purification', desc:'The most sacred fasting day in Hindu tradition. Vishnu mantras, fasting (especially from grains), meditation and yoga purify deeply. Avoid heavy food and excess speech.', favor:['Fast & meditate','Vishnu mantras','Yoga'], avoid:['Heavy food','Grains','Excess speech']},
  {day:12, nadi:'pingala', name:'Dwadashi',   emoji:'🌖',  meaning:'Renewal · break fast', desc:'The day to gently break the Ekadashi fast and reset. Charity, service, and soft eating bring blessings. Anger, greed, and conflict undo the purification gained yesterday.', favor:['Charity','Gentle eating','Service'], avoid:['Anger','Greed','Conflict']},
  {day:13, nadi:'ida',     name:'Trayodashi', emoji:'🌖',  meaning:'Auspicious · attractive', desc:'A beautiful, harmonious day. Beauty, art, diplomacy, romance, and gentle negotiation flow naturally. Crude speech and aggressive deal-making clash with the energy.', favor:['Beauty work','Arts','Diplomacy','Romance'], avoid:['Crude speech','Aggressive deals']},
  {day:14, nadi:'ida',     name:'Chaturdashi',emoji:'🌗',  meaning:'Fierce · Shiva energy', desc:'Sacred to Shiva in his fierce form. Deep tantric practice, inner alchemy, and Shiva worship are powerful. Avoid travel, celebrations, and worldly ventures today.', favor:['Tantric practice','Inner work','Shiva worship'], avoid:['Travel','Worldly ventures','Celebrations']},
  {day:15, nadi:'pingala', name:'Purnima/Amavasya', emoji:'🌕', meaning:'Full/New Moon · turning point', desc:'The peak of the half-cycle (Full Moon in Shukla, New Moon in Krishna). A turning point — pause, meditate, reflect, give charity. Major undertakings and heavy meals work against this stillness.', favor:['Meditation','Ritual','Reflection','Charity'], avoid:['Major undertakings','Aggressive action','Heavy meals']},
];

// ── RECOMMENDATIONS MATRIX (Nadi × Tattva = 15 combinations) ──────────────────
const RECOMMENDATIONS = {
  // IDA = cooling, lunar, feminine, peaceful
  ida_prithvi:  { mood:'Most auspicious — peaceful & grounded', favor:['Long-term planning','Meditation, study, prayer','Healing & rest','Planting, building, slow work'], avoid:['Hasty decisions','Travel south or west'] },
  ida_apas:     { mood:'Highly auspicious — flowing & creative', favor:['Romance & affection','Healing arts & medicine','Writing, music, art','Drinking water, cleansing'], avoid:['Conflict & arguments','Burning bridges'] },
  ida_tejas:    { mood:'Mixed — gentle channel, intense fire', favor:['Reading sacred texts','Light cooking','Brief, focused tasks'], avoid:['Starting new ventures','Surgery, intense exertion','Lengthy arguments'] },
  ida_vayu:     { mood:'Restless — calm channel, moving fire', favor:['Walking gently','Light correspondence','Adjusting plans'], avoid:['Important travel','Long meetings','Financial commitments'] },
  ida_akasha:   { mood:'Sacred — transcendent stillness', favor:['Deep meditation','Mantra & japa','Stillness, prayer','Contemplation of death/liberation'], avoid:['ANY worldly task','Business, conflict, food'] },

  // PINGALA = warming, solar, masculine, active
  pingala_prithvi: { mood:'Strong & stable — grounded power', favor:['Heavy physical work','Construction, agriculture','Endurance training','Defending boundaries'], avoid:['Subtle/delicate work','Emotional conversations'] },
  pingala_apas:    { mood:'Mixed — active channel, soft element', favor:['Cooking, eating, hydration','Brief social gatherings','Athletic recovery'], avoid:['Prolonged debate','Aggressive negotiation'] },
  pingala_tejas:   { mood:'Peak intensity — fierce courage', favor:['Bold decisions & action','Physical contests','Confrontation if needed','Surgery, fire ceremonies'], avoid:['Gentle conversations','Sensitive matters','Romance'] },
  pingala_vayu:    { mood:'Dynamic — movement & speed', favor:['Travel & journeys','Sports, running','Quick negotiations','Sales & deals'], avoid:['Sitting meditation','Slow detailed work','Important contracts'] },
  pingala_akasha:  { mood:'Sacred — power meets stillness', favor:['Brief, powerful prayer','Strong intention setting','Letting go'], avoid:['Starting anything new','Major decisions','Travel'] },

  // SUSHUMNA = balanced, sacred, RARE
  sushumna_prithvi: { mood:'★ Rare gift — sit immediately', favor:['Meditation, japa, prayer','Total silence','Inner contemplation'], avoid:['ALL worldly activity'] },
  sushumna_apas:    { mood:'★ Rare gift — sit immediately', favor:['Meditation, japa, prayer','Devotional song','Inner flow'], avoid:['ALL worldly activity'] },
  sushumna_tejas:   { mood:'★ Rare gift — sit immediately', favor:['Meditation, japa, prayer','Burning karma in silence'], avoid:['ALL worldly activity'] },
  sushumna_vayu:    { mood:'★ Rare gift — sit immediately', favor:['Meditation, japa, prayer','Watching breath, watching mind'], avoid:['ALL worldly activity'] },
  sushumna_akasha:  { mood:'★★ Most sacred moment in the day', favor:['Deepest meditation','Surrender, devotion','Ask for liberation'], avoid:['Speaking, eating, anything outer'] },
};

// Fallback location — Varanasi, India. Used before GPS/user config resolves.
const DEFAULT_LAT = 25.3176, DEFAULT_LNG = 82.9739;

export {
  PREMIUM_SKU, TABS,
  TATTVAS_CLASSIC, TATTVAS_GHATIKA,
  TATTVA_IMG, NADI_IMG,
  SHLOKAS, LUNAR_DAYS, RECOMMENDATIONS,
  DEFAULT_LAT, DEFAULT_LNG,
};
