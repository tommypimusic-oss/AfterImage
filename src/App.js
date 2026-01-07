import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBpwWShz2nuKady_l6Wb_sYmKharj3PM6s",
  authDomain: "afterimage-beb00.firebaseapp.com",
  projectId: "afterimage-beb00",
  storageBucket: "afterimage-beb00.firebasestorage.app",
  messagingSenderId: "699281658938",
  appId: "1:699281658938:web:2fa493173a4539f52b1103",
  measurementId: "G-YSMMRWYSW8",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// --- THE CORPUS: 100+ Reflections ---

const CORPUS = {
  context: {
    nature: [
      "The green was indifferent to your passing.",
      "The soil remembered more than the stone.",
      "You stepped out of the built world.",
      "The trees kept their counsel.",
      "Roots move slower than thought.",
      "The canopy hid the sky.",
      "A chaos of leaves.",
      "Soft earth, quiet step.",
      "The wind spoke through the branches.",
      "Biology over geometry.",
      "The grass bent and recovered.",
      "Wildness waited at the edge.",
      "The air tasted of growth.",
      "No straight lines here.",
      "The birds saw you coming.",
      "Shadows played on organic forms.",
    ],
    commercial: [
      "The lights were too bright here.",
      "Exchange surrounds you.",
      "You walked through the noise of commerce.",
      "Everything has a price but this walk.",
      "Neon ghosts in the daylight.",
      "Glass reflecting your own face.",
      "The street wanted your attention.",
      "Buy, sell, move.",
      "A hollow kind of noise.",
      "The rhythm of transaction.",
      "Windows full of things you do not need.",
      "Crowds drifting like currency.",
      "Artificial day.",
      "The smell of manufactured desire.",
      "Bright packaging, empty space.",
    ],
    industrial: [
      "The machinery was sleeping.",
      "Function over form.",
      "Rust is the only clock here.",
      "Concrete endurance.",
      "The air smelled of iron.",
      "Hard edges, cold purpose.",
      "The work is never done.",
      "Pipes carrying secrets.",
      "A landscape of utility.",
      "The grind is silent now.",
      "Built to last, not to please.",
      "Shadows of industry.",
    ],
    academic: [
      "Thoughts piled in stone.",
      "The quiet of the library leaked out.",
      "Youth moving in tides.",
      "Knowledge is heavy here.",
      "Brick and ivy and ambition.",
      "The clock tower watched.",
      "Paths worn by questions.",
    ],
    cultural: [
      "History gathered in the corners.",
      "Beauty preserved in glass.",
      "The past feels closer here.",
      "Art is a way of seeing.",
      "Tourists looking for meaning.",
      "Statues watching the living.",
      "Echoes of old songs.",
    ],
    urban: [
      "The concrete held the heat.",
      "The grid guided you.",
      "Hard surfaces, fast lives.",
      "The city breathed around you.",
      "Thousands have walked here today.",
      "The pavement is a palimpsest.",
      "Wires cutting the sky.",
      "Stone canyons.",
      "The street was a river.",
      "Echoes of the crowd.",
      "The architecture of density.",
      "Signals blinking in unison.",
    ],
  },
  familiarity: {
    novel: [
      "The ground did not know you yet.",
      "You traced a new line.",
      "Unfamiliar geometry.",
      "The map was blank.",
      "First impressions are sharpest.",
      "A stranger's cadence.",
      "New light on old stone.",
      "You had to watch your step.",
      "Discovery requires attention.",
      "The path was a question.",
    ],
    worn: [
      "The turn knows your weight.",
      "You returned to the rhythm.",
      "The path remembered your step.",
      "A familiar echo.",
      "Gravity pulls you this way.",
      "The route greeted you.",
      "Memory overlaid on asphalt.",
      "You noticed something new in the old.",
      "Comfort in the repetition.",
    ],
    deep: [
      "Here again.",
      "No map needed.",
      "Walking without thinking.",
      "The body knows the way.",
      "An old friend in concrete form.",
      "The ritual is complete.",
      "You are part of the scenery now.",
      "Invisible tracks made visible.",
      "Home is a circle.",
    ],
  },
  motion: {
    slow: [
      "Observation requires stillness.",
      "You let the time pass.",
      "The world moved faster than you.",
      "Details emerged from the blur.",
      "A hesitation in the stream.",
      "Gravity felt heavy.",
      "You watched the light change.",
      "Drifting, not marching.",
      "The pause was necessary.",
      "Silence gathered.",
    ],
    fast: [
      "The distance closed quickly.",
      "Motion over meaning.",
      "You did not look back.",
      "Outrunning the thought.",
      "Blurring the edges.",
      "Time collapsed.",
      "Urgent steps.",
      "The wind resisted.",
      "No time to look.",
      "A fugue of motion.",
    ],
    steady: [
      "A steady cadence.",
      "One foot after the other.",
      "Balance in motion.",
      "The rhythm was kept.",
      "Walking is falling and catching yourself.",
      "Measured progress.",
      "The mind settled into the step.",
    ],
  },
  atmosphere: {
    rain: [
      "The water reclaimed the street.",
      "Reflections on wet stone.",
      "The world was washed clean.",
      "Grey skies, bright mind.",
      "The sound of falling water.",
    ],
    wind: [
      "The air was restless.",
      "Invisible hands pushing.",
      "The wind took the sound.",
      "Resistance from the air.",
      "Leaves dancing in chaos.",
    ],
    early: [
      "The day had not yet started.",
      "Pale light, cold air.",
      "The city waking up.",
      "Promise of the morning.",
      "Shadows stretched long.",
    ],
    late: [
      "The light was failing.",
      "Day dissolving into night.",
      "The end of the shift.",
      "Streetlights flickering on.",
      "The blue hour.",
    ],
    night: [
      "Darkness hid the horizon.",
      "Only the immediate exists.",
      "Quiet descended.",
      "The moon watched.",
      "Solitude in the dark.",
    ],
    default: [
      "The air was still.",
      "Nothing disturbed the view.",
      "Clarity of vision.",
      "Ordinary time.",
    ],
  },
};

// --- HELPER FUNCTIONS ---

const sample = (arr) => {
  if (!arr || arr.length === 0) return "";
  return arr[Math.floor(Math.random() * arr.length)];
};

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const generateRouteId = (startCoords, endCoords) => {
  if (!startCoords || !endCoords) return "unknown-path";
  const r = (n) => n.toFixed(3);
  return `${r(startCoords.latitude)},${r(startCoords.longitude)}-${r(
    endCoords.latitude
  )},${r(endCoords.longitude)}`;
};

const detectPlaceContext = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
    );
    const data = await response.json();

    if (!data || !data.address) return "urban";

    const { leisure, amenity, shop, building, tourism } = data.address;

    if (
      leisure === "park" ||
      leisure === "garden" ||
      leisure === "nature_reserve"
    )
      return "nature";
    if (shop || amenity === "marketplace" || building === "retail")
      return "commercial";
    if (
      amenity === "school" ||
      amenity === "university" ||
      amenity === "college"
    )
      return "academic";
    if (
      tourism === "museum" ||
      amenity === "arts_centre" ||
      amenity === "place_of_worship"
    )
      return "cultural";
    if (building === "industrial" || amenity === "factory") return "industrial";

    return "urban";
  } catch (e) {
    console.warn("Place detection failed", e);
    return "urban";
  }
};

const generateReflection = (telemetry, history) => {
  const { routeId, speedAvg, weather, placeContext } = telemetry;

  // 1. Determine Familiarity
  const timesWalked = history.filter((h) => h.routeId === routeId).length;
  let familiarityKey = "novel";
  if (timesWalked > 1) familiarityKey = "worn";
  if (timesWalked > 5) familiarityKey = "deep";

  // 2. Determine Speed Key
  let speedKey = "steady";
  if (speedAvg < 1.0) speedKey = "slow";
  else if (speedAvg > 1.5) speedKey = "fast";

  // 3. Determine Time/Weather Key
  const hour = new Date().getHours();
  let atmosphereKey = "default";
  if (weather === "Rain") atmosphereKey = "rain";
  else if (weather === "Wind") atmosphereKey = "wind";
  else if (hour < 6) atmosphereKey = "early";
  else if (hour > 18 && hour < 22) atmosphereKey = "late";
  else if (hour >= 22 || hour < 4) atmosphereKey = "night";

  // 4. Draft Components
  // We want to combine two distinct thoughts.
  // Strategy:
  // A) Context + Familiarity
  // B) Context + Motion
  // C) Atmosphere + Familiarity

  // Get random sentences from the relevant buckets
  const contextSentence = sample(
    CORPUS.context[placeContext] || CORPUS.context.urban
  );
  const familiaritySentence = sample(CORPUS.familiarity[familiarityKey]);
  const motionSentence = sample(CORPUS.motion[speedKey]);
  const atmosphereSentence = sample(CORPUS.atmosphere[atmosphereKey]);

  // Roll for structure
  const roll = Math.random();
  let result = "";

  if (roll < 0.33) {
    // Context dominant
    result = `${contextSentence} ${familiaritySentence}`;
  } else if (roll < 0.66) {
    // Motion dominant
    result = `${motionSentence} ${contextSentence}`;
  } else {
    // Atmosphere dominant
    result = `${atmosphereSentence} ${familiaritySentence}`;
  }

  // Occasional override for pure context if it's strong (like nature or industrial)
  if (
    (placeContext === "nature" || placeContext === "industrial") &&
    Math.random() > 0.8
  ) {
    result = contextSentence;
  }

  return result;
};

// --- COMPONENTS ---

const PhoneScreen = ({
  state,
  lastReflection,
  history,
  distance,
  gpsStatus,
  traces,
  onSubmitTrace,
}) => {
  const [traceInput, setTraceInput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const getOpacity = (timestamp) => {
    const now = Date.now();
    const maxLife = 5 * 60 * 1000;
    const age = now - timestamp;
    let opacity = 1 - age / maxLife;
    return Math.max(0, opacity);
  };

  const handleTraceSubmit = (e) => {
    e.preventDefault();
    if (traceInput.trim().length > 0) {
      onSubmitTrace(traceInput);
      setHasSubmitted(true);
      setTraceInput("");
    }
  };

  if (state === "WALKING") {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-neutral-600 transition-colors duration-1000">
        <div className="animate-pulse tracking-widest text-xs uppercase opacity-40 mb-4">
          Tracking Absence
        </div>
        <div className="serif text-xl text-neutral-800 text-center px-8">
          You are here,
          <br />
          not there.
        </div>
        <div className="absolute bottom-10 text-[10px] text-neutral-900 font-mono">
          {distance.toFixed(0)}m / {gpsStatus}
        </div>
      </div>
    );
  }

  if (state === "COOLDOWN") {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black">
        <div className="w-1 h-1 bg-white rounded-full animate-ping"></div>
        <div className="mt-8 text-neutral-700 text-xs tracking-widest uppercase">
          Gathering Context...
        </div>
      </div>
    );
  }

  // IDLE / REFLECTION VIEW
  return (
    <div className="h-full flex flex-col bg-[#080808] relative overflow-y-auto">
      <div className="scanlines"></div>

      <div className="flex-1 flex flex-col justify-center items-center px-8 z-20 min-h-[60vh] py-12">
        {lastReflection ? (
          <div className="fade-in w-full max-w-sm">
            <p className="serif text-2xl md:text-3xl text-neutral-200 leading-relaxed text-center mb-8">
              {lastReflection.text}
            </p>

            <div className="flex justify-center gap-2 text-[10px] uppercase tracking-widest text-neutral-600 mb-12">
              <span>
                {new Date(lastReflection.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>//</span>
              <span>{lastReflection.placeContext.toUpperCase()}</span>
            </div>

            {/* TRACES SECTION */}
            <div className="border-t border-neutral-800 pt-8">
              {traces.length > 0 ? (
                <div className="mb-8">
                  <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-4 text-center">
                    Traces left by others
                  </h3>
                  <div className="space-y-4">
                    {traces.map((trace, idx) => (
                      <div
                        key={idx}
                        className="serif text-neutral-400 text-sm text-center italic"
                      >
                        "{trace.text}"
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-8 text-center">
                  <h3 className="text-[10px] uppercase tracking-widest text-neutral-800 mb-1">
                    No traces here yet
                  </h3>
                </div>
              )}

              {/* ADD TRACE */}
              {!hasSubmitted ? (
                <form
                  onSubmit={handleTraceSubmit}
                  className="flex flex-col gap-2"
                >
                  <input
                    type="text"
                    value={traceInput}
                    onChange={(e) => setTraceInput(e.target.value)}
                    placeholder="Leave a vague note..."
                    maxLength={60}
                    className="bg-neutral-900/50 border border-neutral-800 text-neutral-300 text-xs p-3 rounded text-center focus:outline-none focus:border-neutral-600"
                  />
                  <button
                    type="submit"
                    className="text-[10px] uppercase text-neutral-600 hover:text-neutral-400 transition-colors"
                  >
                    Leave Trace
                  </button>
                </form>
              ) : (
                <div className="text-center text-[10px] text-neutral-600 uppercase tracking-widest">
                  Trace Left
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-neutral-800 text-sm italic">
            The device is dormant.
          </div>
        )}
      </div>

      {/* Ghostly History Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-hidden opacity-30">
        {history
          .slice()
          .reverse()
          .map((h, i) => {
            const op = getOpacity(h.timestamp);
            if (op <= 0.05) return null;
            const style = {
              top: `${((i * 15) % 80) + 10}%`,
              left: `${((i * 10) % 40) + 10}%`,
              opacity: op * 0.5,
            };
            return (
              <div
                key={h.timestamp}
                style={style}
                className="absolute w-64 text-neutral-500 text-xs serif"
              >
                {h.text}
              </div>
            );
          })}
      </div>

      <div className="h-12 border-t border-white/5 flex items-center justify-between px-6 text-[10px] uppercase tracking-widest text-neutral-600 z-30 bg-[#080808]">
        <span>Signal: {gpsStatus === "active" ? "Ready" : gpsStatus}</span>
        <span>{history.length} Echoes</span>
      </div>
    </div>
  );
};

// 3. Main App Container
function App() {
  const [appState, setAppState] = useState("IDLE");
  const [history, setHistory] = useState([]);
  const [lastReflection, setLastReflection] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("off");
  const [user, setUser] = useState(null);
  const [routeTraces, setRouteTraces] = useState([]); // Traces for the current route

  // Tracking Refs
  const watchId = useRef(null);
  const trackData = useRef({
    points: [],
    startTime: 0,
    startCoords: null,
    distance: 0,
  });

  const [liveDist, setLiveDist] = useState(0);

  // --- AUTHENTICATION ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- STYLES ---
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;600&display=swap');
            body { margin: 0; background-color: #050505; }
            .serif { font-family: 'EB Garamond', serif; }
            .fade-in { animation: fadeIn 2s ease-in forwards; }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .scanlines {
                background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1));
                background-size: 100% 4px;
                position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 10;
            }
        `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // --- LOCAL HISTORY ---
  useEffect(() => {
    const saved = localStorage.getItem("afterimage_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const fresh = parsed.filter(
          (p) => now - p.timestamp < 1000 * 60 * 60 * 24 * 7
        );
        setHistory(fresh);
        if (fresh.length > 0) setLastReflection(fresh[fresh.length - 1]);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("afterimage_history", JSON.stringify(history));
  }, [history]);

  // --- TRACKING LOGIC ---

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setAppState("WALKING");
    setGpsStatus("acquiring");
    setRouteTraces([]); // Clear traces from previous view

    trackData.current = {
      points: [],
      startTime: Date.now(),
      startCoords: null,
      distance: 0,
    };
    setLiveDist(0);

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        const now = Date.now();
        const pt = { latitude, longitude, speed, time: now };

        setGpsStatus("active");

        if (!trackData.current.startCoords) {
          trackData.current.startCoords = pt;
        }

        const len = trackData.current.points.length;
        if (len > 0) {
          const lastPt = trackData.current.points[len - 1];
          const d = getDistance(
            lastPt.latitude,
            lastPt.longitude,
            latitude,
            longitude
          );
          if (d > 2) {
            trackData.current.distance += d;
            trackData.current.points.push(pt);
            setLiveDist(trackData.current.distance);
          }
        } else {
          trackData.current.points.push(pt);
        }
      },
      (err) => {
        console.warn("GPS Error", err);
        setGpsStatus("error");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const stopTracking = async () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    setAppState("COOLDOWN");

    const endTime = Date.now();
    const durationSeconds = (endTime - trackData.current.startTime) / 1000;
    const totalDist = trackData.current.distance;
    const speedAvg = durationSeconds > 0 ? totalDist / durationSeconds : 0;

    // 1. Determine Route ID
    const endCoords =
      trackData.current.points.length > 0
        ? trackData.current.points[trackData.current.points.length - 1]
        : trackData.current.startCoords;

    // Safety: If no gps data at all, fallback to fake coords or handle error
    if (!endCoords) {
      setAppState("IDLE");
      setGpsStatus("off");
      return;
    }

    const routeId = generateRouteId(trackData.current.startCoords, endCoords);

    // 2. Detect Place Context (Real World)
    const placeContext = await detectPlaceContext(
      endCoords.latitude,
      endCoords.longitude
    );

    // 3. Fetch Traces from Firebase
    if (user) {
      try {
        const tracesRef = collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "traces"
        );
        const q = query(tracesRef, where("routeId", "==", routeId), limit(5));
        const querySnapshot = await getDocs(q);
        const fetchedTraces = [];
        querySnapshot.forEach((doc) => {
          fetchedTraces.push(doc.data());
        });
        setRouteTraces(fetchedTraces);
      } catch (e) {
        console.error("Error fetching traces", e);
      }
    }

    // 4. Generate Reflection
    const weather = sample(["Clear", "Rain", "Wind", "Fog", "Snow"]); // Simulate weather for now

    const telemetry = {
      routeId,
      speedAvg,
      weather,
      placeContext,
    };

    const text = generateReflection(telemetry, history);
    const newEntry = {
      id: Date.now(),
      timestamp: Date.now(),
      text: text,
      routeId: routeId,
      dist: Math.round(totalDist),
      placeContext: placeContext,
    };

    setHistory((prev) => [...prev, newEntry]);
    setLastReflection(newEntry);
    setAppState("IDLE");
    setGpsStatus("off");
  };

  // --- HANDLE TRACE SUBMISSION ---
  const submitTrace = async (text) => {
    if (!user || !lastReflection) return;

    try {
      const tracesRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "traces"
      );
      await addDoc(tracesRef, {
        routeId: lastReflection.routeId,
        text: text,
        timestamp: Date.now(),
        userId: user.uid,
      });
      // Update local view immediately
      setRouteTraces((prev) => [
        ...prev,
        { text, routeId: lastReflection.routeId },
      ]);
    } catch (e) {
      console.error("Error saving trace", e);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto shadow-2xl overflow-hidden border-x border-neutral-900 bg-[#050505] text-[#d4d4d4] font-sans">
      <div className="flex-1 relative overflow-hidden">
        <PhoneScreen
          state={appState}
          lastReflection={lastReflection}
          history={history}
          distance={liveDist}
          gpsStatus={gpsStatus}
          traces={routeTraces}
          onSubmitTrace={submitTrace}
        />
      </div>

      <div className="bg-[#0a0a0a] border-t border-neutral-900 p-6 z-40">
        {appState === "IDLE" ? (
          <button
            onClick={startTracking}
            className="w-full bg-neutral-200 hover:bg-white text-black text-xs font-bold py-4 uppercase tracking-widest rounded transition-all"
          >
            Open Eye (Start)
          </button>
        ) : appState === "WALKING" ? (
          <button
            onClick={stopTracking}
            className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 text-xs font-bold py-4 uppercase tracking-widest rounded transition-all animate-pulse"
          >
            Close Eye (End)
          </button>
        ) : (
          <div className="w-full text-center text-neutral-600 text-xs py-4 uppercase tracking-widest">
            ...
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
