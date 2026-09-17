// All tunable progression and spacecraft values live here.
const craft=(id,name,price,stats,ability,description,exploreBehavior,tapBehavior,fin,requirements={})=>({id,name,price,cost:price,...stats,ability,abilityDescription:description,description,exploreBehavior,tapBehavior,fin,agility:exploreBehavior.handling,requirements,visualModel:id,sideViewModel:id,unlockStatus:'requirements',className:ability.replaceAll('_',' ')});
export const ROCKETS=[
 craft('pioneer','SCOUT',0,{durability:1,handling:4,magnet:0,boost:2,efficiency:2},'LIGHTWEIGHT','Fast, precise handling. A direct impact is fatal.',{handling:1.18,armor:0,radius:9,magnet:0,fuel:1},{gravity:410,impulse:-202,radius:9},'#df6552'),
 craft('ranger','RANGER',1000,{durability:2,handling:2,magnet:0,boost:2,efficiency:2},'REINFORCED_HULL','Survive one light scrape. Major impacts remain fatal.',{handling:.8,armor:1,radius:9,magnet:0,fuel:1},{gravity:380,impulse:-194,radius:9},'#4fbda9'),
 craft('atlas','ATLAS',3000,{durability:4,handling:1,magnet:0,boost:1,efficiency:2},'HEAVY_ARMOUR','Two light impacts. Heavy steering and a larger profile.',{handling:.48,armor:2,radius:13,magnet:0,fuel:1.08},{gravity:290,impulse:-173,radius:12},'#e1ad54'),
 craft('comet','COMET',6000,{durability:2,handling:4,magnet:1,boost:4,efficiency:1},'OVERDRIVE','Explore near misses and Tap Perfect/Skim passes charge overdrive. Activate a short speed and bonus-score burst.',{handling:1.3,armor:0,radius:8,magnet:26,fuel:1.1},{gravity:450,impulse:-229,radius:8},'#bb70f0'),
 craft('magnetar','MAGNETAR',10000,{durability:2,handling:3,magnet:4,boost:2,efficiency:2},'GRAVITY_COLLECTOR','Curves nearby coins toward the ship. Stars need direct contact.',{handling:.94,armor:0,radius:10,magnet:95,fuel:1},{gravity:365,impulse:-191,radius:10},'#d3a65d'),
 craft('voyager','VOYAGER',18000,{durability:3,handling:3,magnet:2,boost:3,efficiency:4},'DEEP_SPACE_SYSTEMS','Efficient fuel use and resistance to gravity and sensor interference.',{handling:.95,armor:1,radius:10,magnet:45,fuel:.65,resistance:.55},{gravity:330,impulse:-181,radius:10},'#4eaff2',{distance:15000}),
 craft('phantom','PHANTOM',30000,{durability:2,handling:4,magnet:1,boost:3,efficiency:3},'PHASE','Activate one second of phase once per run. Timing is yours.',{handling:1.12,armor:0,radius:9,magnet:24,fuel:.85},{gravity:370,impulse:-194,radius:9},'#958ac1',{distance:35000}),
 craft('odyssey','ODYSSEY',50000,{durability:4,handling:3,magnet:3,boost:3,efficiency:4},'ADAPTIVE_SYSTEM','Choose one temporary system every 5 km in Explore or 25 cleared formations in Tap. Upgrades expire after the run.',{handling:.92,armor:2,radius:11,magnet:65,fuel:.7},{gravity:345,impulse:-186,radius:10},'#c78977',{distance:50000}),
 // Earlier purchases remain usable; legacy craft are not silently removed.
 craft('red_fury','CRIMSON',150,{durability:1,handling:4,magnet:0,boost:2,efficiency:1},'LEGACY_THRUST','Original crimson explorer. Agile but fragile.',{handling:1.22,armor:0,radius:9,magnet:0,fuel:1.1},{gravity:420,impulse:-210,radius:9},'#bb3947'),
 craft('cosmic_pink','AURORA',300,{durability:2,handling:2,magnet:0,boost:2,efficiency:3},'LEGACY_SHIELD','Original explorer with longer collectible shields.',{handling:.9,armor:0,radius:9,magnet:0,fuel:.9},{gravity:350,impulse:-188,radius:9},'#9385ba')
];
export const BALANCE={nearWindow:4,nearMax:5,nearPoints:5,perfectTolerance:17,skimTolerance:15,perfectBonus:1,skimBonus:1,lightPenetration:7,damageGrace:.65,phaseSeconds:1,overdriveSeconds:5,overdriveCharge:10,trialSeconds:15,scanSeconds:2.2,eventSeconds:12,cycleSeconds:70,metersPerPixel:.9};
export const REGIONS=[
 {at:0,name:'EARTH ORBIT',speed:150,interval:1.8,tint:'#263d76',events:['debris','gravity']},
 {at:2000,name:'ASTEROID FRONTIER',speed:170,interval:1.55,tint:'#39446c',events:['meteor','rings']},
 {at:5000,name:'PLANETARY RINGS',speed:185,interval:1.4,tint:'#384767',events:['rings','comet']},
 {at:10000,name:'VIOLET NEBULA',speed:195,interval:1.4,tint:'#554072',events:['debris','flare']},
 {at:15000,name:'DEEP SPACE',speed:205,interval:1.35,tint:'#182447',events:['gravity','debris','flare']},
 {at:25000,name:'UNKNOWN REGION',speed:215,interval:1.3,tint:'#344452',events:['comet','flare','meteor']},
 {at:35000,name:'PHANTOM TERRITORY',speed:225,interval:1.3,tint:'#4a3b62',events:['flare','gravity']},
 {at:50000,name:'ODYSSEY FRONTIER',speed:235,interval:1.25,tint:'#3d516a',events:['meteor','rings','comet']}
];
export const EVENTS={meteor:'METEOR STORM',gravity:'GRAVITY WELL',rings:'PLANETARY RINGS',debris:'DEBRIS FIELD',flare:'SOLAR FLARE',comet:'COMET CHASE',nebula:'NEBULA'};
export const EXPLORE_MILESTONES=[
 [500,'100 coins','coins',100],[1000,'Ion engine trail','trail','ion'],[2000,'Asteroid Frontier','region',1],[3000,'300 coins','coins',300],[5000,'Planetary Rings','region',2],[7500,'Scout arctic paint','paint','arctic'],[10000,'Nebula paint','paint','nebula'],[15000,'Voyager access','access','voyager'],[20000,'1,000 coins','coins',1000],[25000,'750 coins','coins',750],[35000,'Phantom navigation core','component','navigation_core'],[50000,'Odyssey access','access','odyssey'],[75000,'Aurora engine trail','trail','aurora'],[100000,'Legend of the Void','badge','legend']
].map(([at,label,type,value])=>({id:`explore-${at}`,at,label,type,value}));
export const TAP_MILESTONES=[
 [10,'100 coins','coins',100],[25,'Orange engine trail','trail','orange'],[50,'250 coins','coins',250],[75,'Ranger solar paint','paint','solar'],[100,'Pilot badge','badge','pilot'],[150,'500 coins','coins',500],[250,'Comet pilot insignia','badge','comet'],[500,'Ace trail','trail','ace'],[750,'Phantom paint','paint','phantom'],[1000,'ACE PILOT','badge','ace']
].map(([at,label,type,value])=>({id:`tap-${at}`,at,label,type,value}));
export const COSMETICS=[
 {id:'ion',kind:'trail',label:'Ion trail',color:'#70daff',price:200},{id:'orange',kind:'trail',label:'Orange trail',color:'#ffb363',price:300},{id:'aurora',kind:'trail',label:'Aurora trail',color:'#98e8cc'},{id:'ace',kind:'trail',label:'Ace trail',color:'#d6bcff'},{id:'arctic',kind:'paint',label:'Arctic paint',color:'#a1cde8',price:500},{id:'nebula',kind:'paint',label:'Nebula paint',color:'#9890ce'},{id:'solar',kind:'paint',label:'Solar paint',color:'#e6af69'},{id:'phantom',kind:'paint',label:'Phantom paint',color:'#6d739c'}
];
export const MISSIONS=[
 {id:'near',period:'daily',label:'Get 5 near misses',metric:'near',target:5,reward:100},
 {id:'perfect',period:'daily',label:'Chain 3 Perfect passes',metric:'perfectStreak',target:3,reward:150},
 {id:'storm',period:'daily',label:'Survive a meteor storm',metric:'storms',target:1,reward:200},
 {id:'frontier',period:'weekly',label:'Reach Asteroid Frontier',metric:'distance',target:2000,reward:300},
 {id:'star-chain',period:'weekly',label:'Collect a star at ×2 or higher',metric:'chainStars',target:1,reward:200}
];
export const TAP_CONFIG={width:390,height:780,ceiling:62,floor:740,thresholds:[10,25,50],speeds:[94,105,116,126],gaps:[230,216,202,190],spacing:244,centerStep:85,centerMin:230,centerMax:570};
export const EXPLORE_BADGES=[[10,'Rookie Pilot'],[25,'Space Ranger'],[50,'Galaxy Commander'],[100,'Cosmic Legend'],[200,'Void Walker'],[500,'Star Lord'],[1000,'Universal Entity']];
export const STORE_ITEMS=[
 {id:'magnet',name:'MAGNET',icon:'🧲',cost:50,max:5,desc:'Pulls coins toward your ship for 8s. Double-tap to activate.'},
 {id:'key',name:'REVIVE KEY',icon:'🔑',cost:150,max:3,desc:'Auto-revive once after crashing. Keeps your run alive.'},
 {id:'shield_pack',name:'SHIELD PACK',icon:'🛡️',cost:80,max:5,desc:'Instant 6s shield on demand. Double-tap to activate.'},
 {id:'fuel_tank',name:'FUEL TANK',icon:'⛽',cost:40,max:5,desc:'Auto-refills 50% fuel when you drop below 10%.'}
];
