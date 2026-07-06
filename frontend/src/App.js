import React from "react";
import { useState, useEffect, useRef } from "react";

const ANTHROPIC_API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY || "";

const callClaude = async (prompt, useWebSearch = false) => {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }]
  };
  if (useWebSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true", "x-api-key": ANTHROPIC_API_KEY },
    body: JSON.stringify(body)
  });
  const d = await r.json();
  // Extract text from all content blocks (web search returns multiple blocks)
  if (d.content && Array.isArray(d.content)) {
    const textBlock = d.content.find((b) => b.type === "text");
    return textBlock ? textBlock.text : "";
  }
  return "";
};

const callClaudeVision = async (b64, mt, prompt) => {
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const mediaType = validTypes.includes(mt) ? mt : "image/jpeg";
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true", "x-api-key": ANTHROPIC_API_KEY },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mediaType, data: b64 } }, { type: "text", text: prompt }] }] })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d.content?.[0]?.text || "";
};

const f2b64 = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(f); });
const pJSON = (t) => { try { return JSON.parse(t.replace(/```json|```/g, "").trim()); } catch { return null; } };

// Persistent storage - uses localStorage for iOS app, falls back to memory for preview
let _userData = null;
const STORAGE_KEY = "s2t_user_v1";
const saveUser = (d) => {
  _userData = d;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch(e) {}
};
const loadUser = () => {
  if (_userData) return _userData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { _userData = JSON.parse(raw); return _userData; }
  } catch(e) {}
  return null;
};
const clearUser = () => {
  _userData = null;
  try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
};

const DIETARY = ["None", "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Paleo", "Halal", "Kosher"];
const CUISINES = ["Italian", "Asian", "Mexican", "Mediterranean", "American", "Indian", "French", "Japanese", "Middle Eastern"];
const ALLERGENS = ["Nuts", "Peanuts", "Gluten", "Dairy", "Eggs", "Soy", "Shellfish", "Fish", "Sesame", "Sulphites"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const FOOD_PHOTOS = {
  Italian: ["https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=900&h=500&fit=crop"],
  Asian: ["https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=900&h=500&fit=crop"],
  Mexican: ["https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=900&h=500&fit=crop"],
  Mediterranean: ["https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=900&h=500&fit=crop"],
  American: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=500&fit=crop"],
  Indian: ["https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=900&h=500&fit=crop"],
  French: ["https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=900&h=500&fit=crop"],
  Japanese: ["https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&h=500&fit=crop"],
  "Middle Eastern": ["https://images.unsplash.com/photo-1544025162-d76694265947?w=900&h=500&fit=crop"],
  default: [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&h=500&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&h=500&fit=crop",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=900&h=500&fit=crop",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=900&h=500&fit=crop",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&h=500&fit=crop",
  ],
};

const STEP_BG = [
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=1200&fit=crop",
];

const DISCOVER = [
  { name: "Korean Fried Chicken", cuisine: "Korean", rating: 4.9, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop" },
  { name: "Butter Chicken", cuisine: "Indian", rating: 4.8, img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop" },
  { name: "Tacos Al Pastor", cuisine: "Mexican", rating: 4.7, img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=200&fit=crop" },
  { name: "Sushi Bowl", cuisine: "Japanese", rating: 4.9, img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&h=200&fit=crop" },
  { name: "Pad Thai", cuisine: "Asian", rating: 4.8, img: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300&h=200&fit=crop" },
  { name: "Greek Salad", cuisine: "Mediterranean", rating: 4.6, img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=200&fit=crop" },
];

const CAT = {
  Produce:    { icon: "🥦", color: "#22c55e", bg: "#dcfce7", border: "#bbf7d0", label: "Produce" },
  Meat:       { icon: "🥩", color: "#ef4444", bg: "#fee2e2", border: "#fecaca", label: "Meat & Fish" },
  Dairy:      { icon: "🧀", color: "#f59e0b", bg: "#fef3c7", border: "#fde68a", label: "Dairy & Eggs" },
  Grains:     { icon: "🌾", color: "#d97706", bg: "#fef9c3", border: "#fde68a", label: "Grains & Pasta" },
  Spices:     { icon: "🌶️", color: "#f97316", bg: "#fff7ed", border: "#fed7aa", label: "Spices & Herbs" },
  Condiments: { icon: "🫙", color: "#8b5cf6", bg: "#f3e8ff", border: "#ddd6fe", label: "Condiments & Oils" },
  Frozen:     { icon: "❄️", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", label: "Frozen" },
  Other:      { icon: "🛒", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0", label: "Other" },
};

const SAMPLE_ITEMS = [
  { name: "chicken breast", cat: "Meat", emoji: "🍗" },
  { name: "salmon", cat: "Meat", emoji: "🐟" },
  { name: "eggs", cat: "Dairy", emoji: "🥚" },
  { name: "milk", cat: "Dairy", emoji: "🥛" },
  { name: "cheddar cheese", cat: "Dairy", emoji: "🧀" },
  { name: "butter", cat: "Dairy", emoji: "🧈" },
  { name: "garlic", cat: "Produce", emoji: "🧄" },
  { name: "onion", cat: "Produce", emoji: "🧅" },
  { name: "tomatoes", cat: "Produce", emoji: "🍅" },
  { name: "spinach", cat: "Produce", emoji: "🥬" },
  { name: "carrots", cat: "Produce", emoji: "🥕" },
  { name: "lemon", cat: "Produce", emoji: "🍋" },
  { name: "pasta", cat: "Grains", emoji: "🍝" },
  { name: "rice", cat: "Grains", emoji: "🍚" },
  { name: "bread", cat: "Grains", emoji: "🍞" },
  { name: "olive oil", cat: "Condiments", emoji: "olive" },
  { name: "soy sauce", cat: "Condiments", emoji: "🍶" },
  { name: "honey", cat: "Condiments", emoji: "🍯" },
  { name: "paprika", cat: "Spices", emoji: "🌶️" },
  { name: "cumin", cat: "Spices", emoji: "🌿" },
  { name: "black pepper", cat: "Spices", emoji: "🫙" },
  { name: "salt", cat: "Spices", emoji: "🧂" },
];

const autoCategory = (name) => {
  const n = name.toLowerCase();
  if (/spinach|tomato|carrot|onion|garlic|pepper|cucumber|broccoli|potato|avocado|lemon|lime|apple|banana|berry|fruit|vegetable|herb|basil|parsley|cilantro|mint|ginger|corn|pea|cabbage/.test(n)) return "Produce";
  if (/chicken|beef|pork|lamb|fish|salmon|tuna|shrimp|prawn|turkey|bacon|sausage|steak|mince|meat/.test(n)) return "Meat";
  if (/milk|cheese|butter|cream|yogurt|egg|cheddar|mozzarella|parmesan|dairy|ricotta/.test(n)) return "Dairy";
  if (/pasta|rice|flour|bread|oat|cereal|noodle|quinoa|barley|wheat|grain|tortilla/.test(n)) return "Grains";
  if (/salt|pepper|cumin|paprika|turmeric|cinnamon|oregano|thyme|rosemary|spice|chili|curry|nutmeg|coriander/.test(n)) return "Spices";
  if (/oil|vinegar|sauce|ketchup|mustard|mayo|soy|honey|jam|syrup|dressing|paste|tahini/.test(n)) return "Condiments";
  return "Other";
};

const useBG = (cuisines) => {
  const [idx, setIdx] = useState(0);
  const [imgs, setImgs] = useState(FOOD_PHOTOS.default);
  useEffect(() => {
    const photos = cuisines.length > 0 ? [...new Set(cuisines.flatMap((c) => FOOD_PHOTOS[c] || []))].slice(0, 8) : FOOD_PHOTOS.default;
    setImgs(photos.length > 0 ? photos : FOOD_PHOTOS.default);
    setIdx(0);
  }, [cuisines.join(",")]);
  useEffect(() => {
    if (imgs.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % imgs.length), 6000);
    return () => clearInterval(t);
  }, [imgs.length]);
  return { imgs, idx };
};

const Spin = ({ color, size }) => (
  <div style={{ width: size || 36, height: size || 36, border: "3px solid #e2e8f0", borderTopColor: color || "#22c55e", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
);

// ── Im Feeling Lucky Screen ───────────────────────────────────────────────────
const LuckyScreen = ({ onContinue }) => {
  const [phase, setPhase] = useState("welcome");
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const fileRef = useRef(null);
  const BG_IMGS = [
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=1200&fit=crop",
    "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&h=1200&fit=crop",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=1200&fit=crop",
  ];
  const [bgIdx, setBgIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setBgIdx((i) => (i + 1) % BG_IMGS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const scan = async (file) => {
    if (!file) return;
    setLoading(true);
    setPhase("scanning");
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const b64 = e.target.result.split(",")[1];
        // Step 1: identify ingredients
        const r1 = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
            "x-api-key": ANTHROPIC_API_KEY,
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 500,
            messages: [{
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: b64 } },
                { type: "text", text: 'Identify all food ingredients visible. Return ONLY a JSON array: ["item1","item2"]' }
              ]
            }]
          })
        });
        const d1 = await r1.json();
        const raw1 = d1.content?.[0]?.text || "[]";
        const ings = pJSON(raw1) || [];
        setIngredients(ings);

        if (ings.length === 0) {
          setPhase("error");
          setLoading(false);
          return;
        }

        // Step 2: generate one perfect recipe
        const prompt = "I have these ingredients: " + ings.join(", ") + ". Suggest ONE amazing recipe I can make right now. Return ONLY JSON: {name:x, description:x, time:x, difficulty:Easy or Medium, ingredients:[list], steps:[list], tip:x}";
        const r2 = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
            "x-api-key": ANTHROPIC_API_KEY,
          },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, messages: [{ role: "user", content: prompt }] })
        });
        const d2 = await r2.json();
        const raw2 = d2.content?.[0]?.text || "{}";
        const rec = pJSON(raw2);
        if (rec?.name) {
          setRecipe(rec);
          setPhase("result");
        } else {
          setPhase("error");
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setPhase("error");
      setLoading(false);
    }
  };

  if (phase === "welcome") return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Background */}
      {BG_IMGS.map((src, i) => (
        <div key={src} style={{ position: "absolute", inset: 0, backgroundImage: "url(" + src + ")", backgroundSize: "cover", backgroundPosition: "center", opacity: i === bgIdx ? 1 : 0, transition: "opacity 1.5s ease" }} />
      ))}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.85) 100%)" }} />

      {/* Content */}
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "70px 24px 48px" }}>
        {/* Top branding */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🍽️</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "white", letterSpacing: -0.5 }}>Stock2Table</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Curated Freshness</div>
        </div>

        {/* Main CTA */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: "white", lineHeight: 1.2, marginBottom: 12 }}>
            What's in your kitchen?
          </div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", marginBottom: 40, lineHeight: 1.5 }}>
            Point your camera at your ingredients and we'll suggest the perfect recipe instantly
          </div>

          {/* I'm Feeling Lucky button */}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => scan(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()}
            style={{ width: "100%", padding: "20px 0", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", border: "none", borderRadius: 20, fontFamily: "inherit", fontSize: 20, fontWeight: 900, cursor: "pointer", marginBottom: 14, boxShadow: "0 8px 32px rgba(34,197,94,0.4)", letterSpacing: -0.3 }}>
            🍀 I'm Feeling Lucky
          </button>

          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 24 }}>— or —</div>

          {/* Sign in / Sign up */}
          <button onClick={onContinue}
            style={{ width: "100%", padding: "16px 0", background: "rgba(255,255,255,0.12)", color: "white", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 16, fontFamily: "inherit", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            Sign In / Sign Up
          </button>
        </div>
      </div>
    </div>
  );

  if (phase === "scanning") return (
    <div style={{ flex: 1, background: "#0f172a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 24, animation: "spin 2s linear infinite" }}>🔍</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 8 }}>Scanning your kitchen...</div>
      <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", textAlign: "center" }}>Claude is identifying your ingredients and crafting the perfect recipe</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (phase === "error") return (
    <div style={{ flex: 1, background: "#0f172a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 8 }}>Couldn't spot any ingredients</div>
      <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 32 }}>Try pointing at a clearer view of your ingredients or pantry shelf</div>
      <button onClick={() => { setPhase("welcome"); fileRef.current?.click(); }}
        style={{ width: "100%", padding: 16, background: "#22c55e", color: "white", border: "none", borderRadius: 16, fontFamily: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 12 }}>
        Try Again
      </button>
      <button onClick={onContinue}
        style={{ width: "100%", padding: 16, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "none", borderRadius: 16, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
        Continue to App
      </button>
    </div>
  );

  if (phase === "result" && recipe) return (
    <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", paddingBottom: 20 }}>
      {/* Hero */}
      <div style={{ position: "relative", height: 260, background: "linear-gradient(135deg,#134e20,#22c55e)", overflow: "hidden" }}>
        <img src={"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=300&fit=crop"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.35, position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "20px 20px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.8)", letterSpacing: 2, marginBottom: 6 }}>YOUR LUCKY RECIPE</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "white", lineHeight: 1.2, marginBottom: 6 }}>{recipe.name}</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)" }}>{recipe.description}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>⏱ {recipe.time}</span>
            <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{recipe.difficulty}</span>
          </div>
        </div>
      </div>

      {/* Detected ingredients */}
      <div style={{ margin: "16px 16px 0", background: "#dcfce7", borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#16a34a", marginBottom: 8 }}>INGREDIENTS I SPOTTED</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ingredients.map((ing) => <span key={ing} style={{ fontSize: 12, fontWeight: 700, background: "white", color: "#16a34a", padding: "3px 10px", borderRadius: 20, border: "1px solid #86efac", textTransform: "capitalize" }}>{ing}</span>)}
        </div>
      </div>

      {/* Recipe ingredients */}
      <div style={{ margin: "12px 16px 0", background: "white", borderRadius: 14, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Ingredients</div>
        {recipe.ingredients?.map((ing, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < recipe.ingredients.length - 1 ? "1px solid #f1f5f9" : "none" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: "#1e293b" }}>{ing}</span>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div style={{ margin: "12px 16px 0", background: "white", borderRadius: 14, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Steps</div>
        {recipe.steps?.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: i < recipe.steps.length - 1 ? "1px solid #f1f5f9" : "none" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.5 }}>{step}</span>
          </div>
        ))}
      </div>

      {/* Chef tip */}
      {recipe.tip && (
        <div style={{ margin: "12px 16px 0", background: "#fef9c3", borderRadius: 14, padding: 14, border: "1px solid #fbbf24" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#ca8a04", marginBottom: 4 }}>CHEF TIP</div>
          <div style={{ fontSize: 14, color: "#92400e" }}>{recipe.tip}</div>
        </div>
      )}

      {/* CTAs */}
      <div style={{ margin: "20px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={onContinue}
          style={{ width: "100%", padding: 16, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", border: "none", borderRadius: 16, fontFamily: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
          Save Recipe & Sign Up
        </button>
        <button onClick={() => { setPhase("welcome"); setRecipe(null); setIngredients([]); }}
          style={{ width: "100%", padding: 14, background: "white", color: "#22c55e", border: "2px solid #22c55e", borderRadius: 16, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          🍀 Try Again
        </button>
        <button onClick={onContinue}
          style={{ width: "100%", padding: 12, background: "none", color: "#94a3b8", border: "none", borderRadius: 16, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Skip for now
        </button>
      </div>
    </div>
  );

  return null;
};


const AuthScreen = ({ onAuth }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bgIdx, setBgIdx] = useState(0);
  const BG = FOOD_PHOTOS.default;
  useEffect(() => { const t = setInterval(() => setBgIdx((i) => (i + 1) % BG.length), 4000); return () => clearInterval(t); }, []);

  const submit = async () => {
    setError("");
    if (!email.trim()) return setError("Please enter your email");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (mode === "signup" && !name.trim()) return setError("Please enter your name");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const stored = loadUser();
    if (mode === "login") {
      if (stored && stored.email === email.toLowerCase()) {
        onAuth(stored);
      } else {
        setError("No account found. Please sign up first.");
      }
    } else {
      const newUser = { email: email.toLowerCase(), name: name.trim(), dietary: [], cuisines: [], servings: 2, pantry: [], shopping: [], onboarded: false };
      saveUser(newUser);
      onAuth(newUser);
    }
    setLoading(false);
  };

  const iStyle = { width: "100%", padding: "14px 16px", borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {BG.map((src, i) => (
        <div key={src} style={{ position: "absolute", inset: 0, backgroundImage: "url(" + src + ")", backgroundSize: "cover", backgroundPosition: "center", opacity: i === bgIdx ? 1 : 0, transition: "opacity 1.5s ease-in-out" }} />
      ))}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,0.4) 0%,rgba(0,0,0,0.75) 50%,rgba(0,0,0,0.92) 100%)" }} />
      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", padding: "0 28px 40px", color: "white" }}>
        <div style={{ paddingTop: 0, textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🥘</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Stock2Table</h1>
          <p style={{ margin: "6px 0 0", fontSize: 15, color: "rgba(255,255,255,0.65)" }}>From your pantry to your plate</p>
        </div>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 4, marginBottom: 28 }}>
          {["login", "signup"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "12px 0", border: "none", borderRadius: 12, background: mode === m ? "white" : "transparent", color: mode === m ? "#1e293b" : "rgba(255,255,255,0.7)", fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 6 }}>Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={iStyle} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 6 }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" style={iStyle} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 6 }}>Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder={mode === "signup" ? "Min 6 characters" : "Your password"} onKeyDown={(e) => e.key === "Enter" && submit()} style={iStyle} />
          </div>
          {error && <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 12, padding: "12px 16px" }}><p style={{ margin: 0, color: "#fca5a5", fontSize: 14, fontWeight: 600 }}>! {error}</p></div>}
          <button onClick={submit} disabled={loading} style={{ width: "100%", padding: 18, background: loading ? "#86efac" : "#22c55e", color: "white", border: "none", borderRadius: 16, fontFamily: "inherit", fontSize: 17, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 4 }}>
            {loading ? <><Spin color="white" size={20} /> Please wait...</> : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
        </div>
        <button onClick={() => onAuth({ name: "Guest", email: "guest", dietary: [], cuisines: [], servings: 2, pantry: [], shopping: [], onboarded: false, guest: true })} style={{ width: "100%", padding: 16, background: "transparent", color: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 16, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Continue as Guest
        </button>
      </div>
    </div>
  );
};

const Onboarding = ({ onDone, initialName }) => {
  const hasName = !!(initialName && initialName.trim() && initialName !== "Guest");
  const [step, setStep] = useState(hasName ? 1 : 0);
  const [p, setP] = useState({ name: initialName || "", dietary: [], cuisines: [], servings: 2 });
  const tog = (key, val) => { const a = p[key]; setP({ ...p, [key]: a.includes(val) ? a.filter((x) => x !== val) : [...a, val] }); };
  const chip = (active) => ({ margin: 4, padding: "9px 18px", borderRadius: 22, border: active ? "2px solid white" : "2px solid rgba(255,255,255,0.35)", background: active ? "white" : "rgba(0,0,0,0.25)", color: active ? "#16a34a" : "white", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" });

  const steps = [
    { title: "Welcome to Stock2Table", sub: "Turn your pantry into delicious meal ideas",
      body: <div style={{ textAlign: "left" }}>
        <label style={{ fontSize: 15, fontWeight: 700, display: "block", marginBottom: 10, color: "white" }}>What is your name?</label>
        <input style={{ width: "100%", padding: "15px 18px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.3)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} placeholder="Your name..." value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
      </div> },
    { title: "Dietary Preferences", sub: "We will personalise every recipe just for you",
      body: <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>{DIETARY.map((o) => <button key={o} onClick={() => tog("dietary", o)} style={chip(p.dietary.includes(o))}>{o}</button>)}</div> },
    { title: "Favourite Cuisines", sub: "Pick the cuisines you love most",
      body: <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>{CUISINES.map((o) => <button key={o} onClick={() => tog("cuisines", o)} style={chip(p.cuisines.includes(o))}>{o}</button>)}</div> },
    { title: "Household Size", sub: "How many people are you cooking for?",
      body: <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
        <button onClick={() => setP({ ...p, servings: Math.max(1, p.servings - 1) })} style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: 26, cursor: "pointer" }}>-</button>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 64, fontWeight: 900, display: "block", color: "white" }}>{p.servings}</span>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 16 }}>{p.servings === 1 ? "person" : "people"}</span>
        </div>
        <button onClick={() => setP({ ...p, servings: Math.min(12, p.servings + 1) })} style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: 26, cursor: "pointer" }}>+</button>
      </div> },
  ];

  return (
    <div style={{ width: "100%", minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column" }}>
      {STEP_BG.map((src, i) => <div key={src} style={{ position: "fixed", inset: 0, backgroundImage: "url(" + src + ")", backgroundSize: "cover", backgroundPosition: "center", opacity: i === step ? 1 : 0, transition: "opacity 0.8s ease-in-out", zIndex: 0 }} />)}
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,0.3) 0%,rgba(0,0,0,0.55) 40%,rgba(0,0,0,0.85) 100%)", zIndex: 1 }} />
      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", padding: "0 24px 40px", color: "white" }}>
        <div style={{ display: "flex", gap: 8, paddingTop: 0, justifyContent: "center" }}>
          {steps.map((_, i) => <div key={i} style={{ width: i === step ? 28 : 8, height: 8, borderRadius: 4, background: i <= step ? "white" : "rgba(255,255,255,0.3)", transition: "all 0.3s" }} />)}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, margin: "0 0 10px", textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}>{steps[step].title}</h1>
          <p style={{ fontSize: 16, opacity: 0.85, margin: "0 0 28px", lineHeight: 1.5 }}>{steps[step].sub}</p>
          <div style={{ width: "100%" }}>{steps[step].body}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => step < steps.length - 1 ? setStep(step + 1) : onDone(p)} style={{ width: "100%", padding: 18, background: "#22c55e", color: "white", border: "none", borderRadius: 20, fontFamily: "inherit", fontSize: 17, fontWeight: 800, cursor: "pointer" }}>
            {step < steps.length - 1 ? "Continue" : "Lets Cook! 🍳"}
          </button>
          {step > 0 && <button onClick={() => setStep(step - 1)} style={{ background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(255,255,255,0.3)", color: "white", padding: 13, borderRadius: 20, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Back</button>}
        </div>
      </div>
    </div>
  );
};

const BottomNav = ({ tab, setTab }) => (
  <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #f1f5f9", display: "flex", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
    {[["home","🏠","Home"],["pantry","🧺","Pantry"],["recipes","📖","Recipes"],["planner","📅","Plan"],["shopping","🛒","Shop"],["profile","👤","Profile"]].map(([id, icon, label]) => (
      <button key={id} onClick={() => setTab(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 2px", border: "none", background: "none", cursor: "pointer" }}>
        <span style={{ fontSize: 20, transform: tab === id ? "scale(1.15)" : "scale(1)", transition: "transform 0.2s" }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: tab === id ? "#22c55e" : "#94a3b8" }}>{label}</span>
      </button>
    ))}
  </div>
);

const ScanModal = ({ onClose, onAdd }) => {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState(null);
  const [found, setFound] = useState([]);
  const [err, setErr] = useState("");
  const ref = useRef();

  const analyze = async (file) => {
    setScanning(true); setFound([]); setErr("");
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Image too large (max 5MB)");
      const b64 = await f2b64(file);
      setPreview(URL.createObjectURL(file));
      const t = await callClaudeVision(b64, file.type, "Identify all food items, ingredients, or products visible in this image. If you see a barcode, product label, or packaging, identify the product name. Return ONLY a JSON array of food/ingredient names in lowercase: [\"item1\",\"item2\"]. No markdown, no explanation.");
      const r = pJSON(t);
      if (r && r.length > 0) setFound(r);
      else setErr("No ingredients detected. Try a clearer photo.");
    } catch (e) { setErr("Error: " + (e.message || "Please try again")); }
    setScanning(false);
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85%", overflowY: "auto", padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>📷 Scan Ingredients</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", fontSize: 18, cursor: "pointer" }}>x</button>
        </div>
        {!preview && !scanning && (
          <div>
            <p style={{ color: "#64748b", marginBottom: 12 }}>What would you like to scan?</p>
            {[["📷", "Pantry Shelf", false], ["🛒", "Shopping Cart / Receipt", false], ["📦", "Single Item / Barcode", false], ["🖼️", "Upload Photo", false]].map(([icon, lb]) => (
              <button key={lb} onClick={() => ref.current.click()} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, background: "#f8fafc", border: "2px solid #e2e8f0", borderRadius: 12, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%", marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{lb}</div>
                  {lb === "Single Item / Barcode" && <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Point at barcode or product label</div>}
                </div>
              </button>
            ))}
            <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files[0] && analyze(e.target.files[0])} />
          </div>
        )}
        {scanning && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>{preview && <img src={preview} style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 12 }} alt="scan" />}<Spin /><p>Claude is analysing your photo...</p></div>}
        {err && !scanning && <div style={{ background: "#fee2e2", borderRadius: 12, padding: 16 }}><p style={{ margin: 0, color: "#dc2626", fontSize: 14, fontWeight: 600 }}>! {err}</p><button onClick={() => { setErr(""); setPreview(null); }} style={{ marginTop: 10, width: "100%", padding: 10, background: "white", border: "2px solid #e2e8f0", borderRadius: 10, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Try Again</button></div>}
        {found.length > 0 && !scanning && (
          <div>
            {preview && <img src={preview} style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 12, marginBottom: 12 }} alt="scan" />}
            <p style={{ fontWeight: 800, color: "#16a34a", marginBottom: 10 }}>Found {found.length} ingredients</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {found.map((f, i) => <span key={i} style={{ padding: "6px 12px", background: "#dcfce7", border: "2px solid #22c55e", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "#16a34a", display: "inline-flex", alignItems: "center", gap: 6 }}>{f}<button onClick={() => setFound(found.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontSize: 16 }}>x</button></span>)}
            </div>
            <button onClick={() => { onAdd(found); onClose(); }} style={{ width: "100%", padding: 16, background: "#22c55e", color: "white", border: "none", borderRadius: 20, fontFamily: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>Add all to Pantry</button>
            <button onClick={() => { setPreview(null); setFound([]); ref.current.click(); }} style={{ width: "100%", padding: 12, background: "white", color: "#64748b", border: "2px solid #e2e8f0", borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Scan Again</button>
          </div>
        )}
      </div>
    </div>
  );
};

const SamplePicker = ({ onClose, onAdd }) => {
  const [selected, setSelected] = useState(SAMPLE_ITEMS.map((i) => i.name));
  const toggle = (name) => setSelected((s) => s.includes(name) ? s.filter((x) => x !== name) : [...s, name]);
  const cats = [...new Set(SAMPLE_ITEMS.map((i) => i.cat))];
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", maxHeight: "90%", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Choose Ingredients</h3>
            <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", fontSize: 18, cursor: "pointer" }}>x</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => setSelected(SAMPLE_ITEMS.map((i) => i.name))} style={{ flex: 1, padding: 8, background: "#dcfce7", border: "1.5px solid #22c55e", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "#16a34a", cursor: "pointer" }}>Select All</button>
            <button onClick={() => setSelected([])} style={{ flex: 1, padding: 8, background: "#f1f5f9", border: "1.5px solid #e2e8f0", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "#64748b", cursor: "pointer" }}>Clear All</button>
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "12px 20px" }}>
          {cats.map((cat) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{cat}</p>
              {SAMPLE_ITEMS.filter((i) => i.cat === cat).map((item) => (
                <div key={item.name} onClick={() => toggle(item.name)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: selected.includes(item.name) ? "#f0fdf4" : "white", border: "1.5px solid " + (selected.includes(item.name) ? "#22c55e" : "#e2e8f0"), borderRadius: 12, cursor: "pointer", marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>{item.emoji}</span>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "#1e293b", textTransform: "capitalize" }}>{item.name}</span>
                  <div style={{ width: 24, height: 24, borderRadius: 6, border: "2px solid " + (selected.includes(item.name) ? "#22c55e" : "#cbd5e1"), background: selected.includes(item.name) ? "#22c55e" : "white", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 900 }}>{selected.includes(item.name) ? "v" : ""}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
          <button onClick={() => { onAdd(selected); onClose(); }} style={{ width: "100%", padding: 16, background: "#22c55e", color: "white", border: "none", borderRadius: 16, fontFamily: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
            Add {selected.length} ingredient{selected.length !== 1 ? "s" : ""} to Pantry
          </button>
        </div>
      </div>
    </div>
  );
};

const HomeScreen = ({ pantry, setPantry, setTab, profile }) => {
  const { imgs, idx } = useBG(profile.cuisines);
  const [showScan, setShowScan] = useState(false);
  const addBulk = (names) => { const ni = names.map((n) => n.trim().toLowerCase()).filter((n) => n && !pantry.find((i) => i.name === n)).map((name) => ({ name, category: autoCategory(name) })); setPantry((p) => [...p, ...ni]); };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc" }}>
      {showScan && <ScanModal onClose={() => setShowScan(false)} onAdd={addBulk} />}
      <div style={{ position: "relative", height: 260, overflow: "hidden", borderRadius: "0 0 20px 20px", marginTop: 54 }}>
        {imgs.map((src, i) => <div key={src} style={{ position: "absolute", inset: 0, backgroundImage: "url(" + src + ")", backgroundSize: "cover", backgroundPosition: "center", opacity: i === idx ? 1 : 0, transition: "opacity 1.5s ease-in-out" }} />)}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.6) 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px 20px", color: "white" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 21, fontWeight: 800 }}>Mediterranean Salad Bowl</h2>
          <p style={{ margin: "0 0 10px", fontSize: 12, opacity: 0.9, lineHeight: 1.4, maxWidth: "70%" }}>Fresh and vibrant salad with feta, olives, and grilled chicken</p>
        </div>
        <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 4 }}>{imgs.slice(0, 5).map((_, i) => <div key={i} style={{ width: i === idx % 5 ? 16 : 5, height: 5, borderRadius: 3, background: i === idx % 5 ? "white" : "rgba(255,255,255,0.4)", transition: "all 0.3s" }} />)}</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 90 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {[["📷","Scan","#22c55e",() => setShowScan(true)],["🧺","Pantry","#f97316",() => setTab("pantry")],["📅","Plan","#a855f7",() => setTab("planner")],["🛒","Shop","#3b82f6",() => setTab("shopping")]].map(([icon, label, color, action]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={action}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: "0 4px 16px " + color + "55" }}>{icon}</div>
                {label === "Pantry" && pantry.length > 0 && <div style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "white", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{pantry.length}</div>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Use Today Section */}
      {pantry.filter((i) => i.useToday).length > 0 && (
        <div style={{ margin: "16px 16px 0", background: "linear-gradient(135deg,#fef9c3,#fef3c7)", borderRadius: 16, padding: 16, border: "1.5px solid #fbbf24" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#92400e" }}>Use Today</div>
              <div style={{ fontSize: 12, color: "#92400e", opacity: 0.8 }}>{pantry.filter((i) => i.useToday).length} items to use up</div>
            </div>
            <button onClick={() => setTab("recipes")} style={{ background: "#f59e0b", color: "white", border: "none", padding: "8px 14px", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Find Recipes</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {pantry.filter((i) => i.useToday).map((item) => (
              <span key={item.name} style={{ fontSize: 12, fontWeight: 700, background: "white", color: "#92400e", padding: "4px 10px", borderRadius: 20, border: "1px solid #fbbf24", textTransform: "capitalize" }}>{item.name}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ margin: "20px 16px", background: "white", borderRadius: 16, padding: "16px 8px", display: "flex", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        {[["🧺", pantry.length, "Pantry Items","#f97316"],["📅","1","Active Plans","#a855f7"],["🛒","0","Shopping Lists","#3b82f6"]].map(([ic, val, lb, color], i) => (
          <div key={lb} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, borderRight: i < 2 ? "1px solid #f1f5f9" : "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: color + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{ic}</div>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>{val}</span>
            <span style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>{lb}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 16px 20px" }}>
        {/* Cuisine of the Week */}
        {(() => {
          const cotw = getCuisineOfWeek();
          return (
            <div style={{ marginBottom: 16, borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
              <div style={{ position: "relative", height: 130 }}>
                <img src={cotw.img} alt={cotw.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.1) 100%)" }} />
                <div style={{ position: "absolute", top: 12, left: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.8)", letterSpacing: 1, marginBottom: 4 }}>CUISINE OF THE WEEK</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{cotw.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>{cotw.desc}</div>
                </div>
              </div>
              <div style={{ background: cotw.bg, padding: "10px 14px", border: "1px solid " + cotw.color + "33" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: cotw.color }}>Key Ingredients this week</span>
                  <button onClick={() => setTab("shopping")} style={{ fontSize: 11, fontWeight: 800, color: "white", background: cotw.color, border: "none", padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>Add to List</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {cotw.ingredients.slice(0, 6).map((ing) => (
                    <span key={ing} style={{ fontSize: 11, fontWeight: 700, color: cotw.color, background: "white", padding: "3px 8px", borderRadius: 10, border: "1px solid " + cotw.color + "44" }}>{ing}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Discover</h3>
          <button onClick={() => setTab("recipes")} style={{ background: "none", border: "none", color: "#22c55e", fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Explore</button>
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {DISCOVER.map((r, i) => (
            <div key={i} onClick={() => setTab("recipes")} style={{ flexShrink: 0, width: 158, borderRadius: 16, overflow: "hidden", background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", cursor: "pointer" }}>
              <div style={{ position: "relative", height: 108 }}>
                <img src={r.img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={r.name} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.65) 100%)" }} />
                <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", alignItems: "center", gap: 3 }}><span style={{ color: "#fbbf24", fontSize: 11 }}>★</span><span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>{r.rating}</span></div>
                <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.4)", borderRadius: 6, padding: "2px 6px" }}><span style={{ color: "white", fontSize: 9, fontWeight: 700 }}>{r.cuisine}</span></div>
              </div>
              <div style={{ padding: "10px 12px" }}><p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#1e293b", lineHeight: 1.3 }}>{r.name}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
      </div>
  );
};


// ── Allergen check ────────────────────────────────────────────────────────────
const checkAllergens = (ingredients, allergens) => {
  if (!allergens || allergens.length === 0) return [];
  const allergenMap = {
    Nuts: ["walnut","almond","cashew","pecan","hazelnut","pistachio","macadamia","brazil nut","pine nut"],
    Peanuts: ["peanut","groundnut","peanut butter"],
    Gluten: ["wheat","flour","bread","pasta","barley","rye","oat","crouton","breadcrumb"],
    Dairy: ["milk","cheese","butter","cream","yogurt","mozzarella","cheddar","parmesan","ricotta","ghee"],
    Eggs: ["egg","mayonnaise","mayo","meringue"],
    Soy: ["soy","tofu","edamame","miso","tempeh","soy sauce"],
    Shellfish: ["shrimp","prawn","crab","lobster","scallop","oyster","clam","mussel"],
    Fish: ["salmon","tuna","cod","tilapia","anchovies","sardine","bass","trout","halibut"],
    Sesame: ["sesame","tahini","sesame oil","sesame seed"],
    Sulphites: ["wine","vinegar","dried fruit","preserved"],
  };
  const found = [];
  allergens.forEach((a) => {
    const keywords = allergenMap[a] || [a.toLowerCase()];
    const inRecipe = ingredients?.some((ing) => keywords.some((k) => ing.toLowerCase().includes(k)));
    if (inRecipe) found.push(a);
  });
  return found;
};


// ── Cuisine of the Week ────────────────────────────────────────────────────────
const COTW_LIST = [
  { name: "Italian", emoji: "🍝", desc: "Pasta, risotto, and wood-fired classics", color: "#dc2626", bg: "#fef2f2",
    ingredients: ["pasta","san marzano tomatoes","parmesan","mozzarella","basil","olive oil","garlic","pancetta"],
    img: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&h=300&fit=crop" },
  { name: "Japanese", emoji: "🍣", desc: "Umami-rich, precise, and deeply satisfying", color: "#be123c", bg: "#fff1f2",
    ingredients: ["sushi rice","miso paste","nori","dashi","mirin","soy sauce","wasabi","edamame"],
    img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=300&fit=crop" },
  { name: "Mexican", emoji: "🌮", desc: "Bold flavours, fresh salsas, and vibrant spices", color: "#d97706", bg: "#fffbeb",
    ingredients: ["corn tortillas","black beans","cumin","avocado","lime","coriander","jalapeno","queso fresco"],
    img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=300&fit=crop" },
  { name: "Indian", emoji: "🍛", desc: "Aromatic spices and rich, layered curries", color: "#ea580c", bg: "#fff7ed",
    ingredients: ["basmati rice","garam masala","turmeric","cumin","coriander","ghee","yogurt","paneer"],
    img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=300&fit=crop" },
  { name: "Mediterranean", emoji: "🥗", desc: "Fresh, healthy, and bursting with colour", color: "#059669", bg: "#ecfdf5",
    ingredients: ["olive oil","feta","chickpeas","lemon","hummus","tahini","kalamata olives","flatbread"],
    img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=300&fit=crop" },
  { name: "French", emoji: "🥐", desc: "Refined techniques and buttery perfection", color: "#9333ea", bg: "#fdf4ff",
    ingredients: ["butter","heavy cream","shallots","thyme","dijon mustard","gruyere","baguette","white wine"],
    img: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=600&h=300&fit=crop" },
  { name: "Asian", emoji: "🍜", desc: "Wok-fired, fresh, and full of texture", color: "#7c3aed", bg: "#f5f3ff",
    ingredients: ["soy sauce","sesame oil","ginger","spring onions","mirin","rice vinegar","tofu","bok choy"],
    img: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&h=300&fit=crop" },
];
const getCuisineOfWeek = () => {
  const weekNum = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
  return COTW_LIST[weekNum % COTW_LIST.length];
};


// ── Status Bar Spacer ─────────────────────────────────────────────────────────
// Fixed 60px spacer that sits above all screen content, below iPhone status bar
const StatusBar = () => (
  <div style={{ height: 60, background: "white", flexShrink: 0, width: "100%" }} />
);
const StatusBarDark = () => (
  <div style={{ height: 60, background: "transparent", position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }} />
);

// ── Expiry helpers ──────────────────────────────────────────────────────────
const daysUntilExpiry = (expiry) => {
  if (!expiry) return null;
  const diff = new Date(expiry) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
const expiryStatus = (expiry) => {
  const d = daysUntilExpiry(expiry);
  if (d === null) return null;
  if (d < 0) return { label: "Expired", color: "#ef4444", bg: "#fee2e2" };
  if (d <= 2) return { label: "Expires today" + (d === 1 ? " tomorrow" : d === 0 ? "" : ""), color: "#ef4444", bg: "#fee2e2" };
  if (d <= 5) return { label: "Exp in " + d + "d", color: "#f97316", bg: "#fff7ed" };
  if (d <= 10) return { label: "Exp in " + d + "d", color: "#ca8a04", bg: "#fefce8" };
  return { label: "Good", color: "#16a34a", bg: "#dcfce7" };
};

// ── Add Item Modal ───────────────────────────────────────────────────────────
const AddItemModal = ({ onClose, onAdd, existingNames }) => {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("units");
  const [expiry, setExpiry] = useState("");
  const units = ["units", "g", "kg", "ml", "L", "cups", "tbsp", "tsp", "bunch", "pack"];
  const submit = () => {
    const t = name.trim().toLowerCase();
    if (!t) return;
    if (existingNames.includes(t)) return alert(t + " is already in your pantry");
    onAdd({ name: t, category: autoCategory(t), qty: qty || "1", unit, expiry: expiry || null, addedAt: new Date().toISOString() });
    onClose();
  };
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Add Ingredient</h3>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", fontSize: 18, cursor: "pointer" }}>x</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Ingredient Name</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. chicken breast" style={{ width: "100%", padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: 12, fontFamily: "inherit", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Quantity</label>
              <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min="0" step="0.1"
                style={{ width: "100%", padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: 12, fontFamily: "inherit", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: 12, fontFamily: "inherit", fontSize: 15, outline: "none", background: "white", boxSizing: "border-box" }}>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Expiry Date (optional)</label>
            <input value={expiry} onChange={(e) => setExpiry(e.target.value)} type="date"
              style={{ width: "100%", padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: 12, fontFamily: "inherit", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={submit} style={{ width: "100%", padding: 16, background: "#22c55e", color: "white", border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
            Add to Pantry
          </button>
        </div>
      </div>
    </div>
  );
};

const PantryScreen = ({ pantry, setPantry, setTab }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [scan, setScan] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceResult, setVoiceResult] = useState("");

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice input not supported on this device.");
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => { setIsListening(false); alert("Could not hear anything. Please try again."); };
    recognition.onresult = async (e) => {
      const transcript = e.results[0][0].transcript;
      setVoiceResult(transcript);
      try {
        const t = await callClaude('Extract all food ingredient names from this speech: "' + transcript + '". Return ONLY a JSON array of ingredient names in lowercase: ["item1","item2"]');
        const items = pJSON(t);
        if (items && items.length > 0) {
          addBulk(items);
          setVoiceResult("");
          alert("Added " + items.length + " ingredient" + (items.length > 1 ? "s" : "") + " from voice!");
        } else {
          setVoiceResult("");
          alert("Could not identify ingredients. Try saying e.g. eggs, garlic, pasta.");
        }
      } catch { setVoiceResult(""); }
    };
    recognition.start();
  };

  const addItem = (item) => setPantry((p) => [...p, item]);
  const addBulk = (names) => {
    const existing = pantry.map((i) => i.name);
    const ni = names.map((n) => n.trim().toLowerCase()).filter((n) => n && !existing.includes(n))
      .map((name) => ({ name, category: autoCategory(name), qty: "1", unit: "units", expiry: null, addedAt: new Date().toISOString() }));
    setPantry((p) => [...p, ...ni]);
  };
  const rm = (n) => setPantry(pantry.filter((i) => i.name !== n));
  const updateItem = (name, changes) => setPantry((p) => p.map((i) => i.name === name ? { ...i, ...changes } : i));

  const filtered = search ? pantry.filter((i) => i.name.includes(search.toLowerCase())) : pantry;
  const grouped = Object.keys(CAT).reduce((acc, cat) => { const items = filtered.filter((i) => i.category === cat); if (items.length > 0) acc[cat] = items; return acc; }, {});

  // Expiry alerts
  const expiring = pantry.filter((i) => { const d = daysUntilExpiry(i.expiry); return d !== null && d <= 5; });
  const expired = pantry.filter((i) => { const d = daysUntilExpiry(i.expiry); return d !== null && d < 0; });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc" }}>
      {scan && <ScanModal onClose={() => setScan(false)} onAdd={addBulk} />}
      {showSample && <SamplePicker onClose={() => setShowSample(false)} onAdd={addBulk} />}
      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onAdd={addItem} existingNames={pantry.map((i) => i.name)} />}
      {editItem && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "flex-end" }} onClick={() => setEditItem(null)}>
          <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, textTransform: "capitalize" }}>{editItem.name}</h3>
              <button onClick={() => setEditItem(null)} style={{ background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", fontSize: 18, cursor: "pointer" }}>x</button>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Quantity</label>
                <input value={editItem.qty || "1"} onChange={(e) => setEditItem({ ...editItem, qty: e.target.value })} type="number"
                  style={{ width: "100%", padding: "11px 14px", border: "2px solid #e2e8f0", borderRadius: 10, fontFamily: "inherit", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Unit</label>
                <select value={editItem.unit || "units"} onChange={(e) => setEditItem({ ...editItem, unit: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", border: "2px solid #e2e8f0", borderRadius: 10, fontFamily: "inherit", fontSize: 15, outline: "none", background: "white", boxSizing: "border-box" }}>
                  {["units","g","kg","ml","L","cups","tbsp","tsp","bunch","pack"].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Expiry Date</label>
              <input value={editItem.expiry || ""} onChange={(e) => setEditItem({ ...editItem, expiry: e.target.value || null })} type="date"
                style={{ width: "100%", padding: "11px 14px", border: "2px solid #e2e8f0", borderRadius: 10, fontFamily: "inherit", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button onClick={() => { updateItem(editItem.name, { qty: editItem.qty, unit: editItem.unit, expiry: editItem.expiry, useToday: !editItem.useToday }); setEditItem({ ...editItem, useToday: !editItem.useToday }); }}
                style={{ flex: 1, padding: 12, background: editItem.useToday ? "#fef9c3" : "#f8fafc", color: editItem.useToday ? "#ca8a04" : "#64748b", border: "2px solid " + (editItem.useToday ? "#fbbf24" : "#e2e8f0"), borderRadius: 12, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {editItem.useToday ? "★ Use Today" : "☆ Mark Use Today"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { updateItem(editItem.name, { qty: editItem.qty, unit: editItem.unit, expiry: editItem.expiry, useToday: editItem.useToday }); setEditItem(null); }}
                style={{ flex: 1, padding: 14, background: "#22c55e", color: "white", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Save</button>
              <button onClick={() => { rm(editItem.name); setEditItem(null); }}
                style={{ padding: 14, background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: "white", paddingTop: 54, paddingLeft: 16, paddingRight: 16, paddingBottom: 0, borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingTop: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>My Pantry</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{pantry.length} ingredients{expiring.length > 0 ? " - " + (expiring.length + expired.length) + " need attention" : ""}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setScan(true)} style={{ padding: "10px 14px", background: "#f97316", color: "white", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>📷</button>
            <button onClick={startVoice} style={{ padding: "10px 14px", background: isListening ? "#ef4444" : "#6366f1", color: "white", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer", minWidth: 46 }}>
              {isListening ? "..." : "🎤"}
            </button>
            <button onClick={() => setShowAdd(true)} style={{ padding: "10px 14px", background: "#22c55e", color: "white", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>+ Add</button>
            {pantry.length > 0 && (
              <button onClick={() => { setPantry([]); }}
                style={{ padding: "10px 12px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                Clear
              </button>
            )}
          </div>
        </div>
        {isListening && (
          <div style={{ background: "#eff6ff", border: "1.5px solid #93c5fd", borderRadius: 10, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 13, color: "#1d4ed8", fontWeight: 600 }}>Listening... say your ingredients</span>
          </div>
        )}
        {voiceResult && (
          <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#16a34a", fontWeight: 700 }}>Heard: "{voiceResult}"</p>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Parsing ingredients...</p>
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <input style={{ width: "100%", padding: "9px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontFamily: "inherit", fontSize: 13, outline: "none", background: "#f8fafc" }}
            placeholder="Search ingredients..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 90 }}>
      {/* Expiry alerts banner */}
      {(expired.length > 0 || expiring.length > 0) && !search && (
        <div style={{ margin: "12px 16px 0", background: "#fff7ed", borderRadius: 14, padding: 14, border: "1.5px solid #fed7aa" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 14, color: "#c2410c" }}>Expiry Alert</p>
          {[...expired, ...expiring.filter((i) => daysUntilExpiry(i.expiry) >= 0)].map((item) => {
            const st = expiryStatus(item.expiry);
            return (
              <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>{item.name}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: st.color, background: st.bg, padding: "2px 8px", borderRadius: 8 }}>{st.label}</span>
                  <button onClick={() => setTab("recipes")} style={{ fontSize: 11, fontWeight: 700, color: "#f97316", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Use it</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pantry.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "48px 20px", textAlign: "center" }}>
          <span style={{ fontSize: 56 }}>🛒</span>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Your pantry is empty</p>
          <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>Scan your pantry or choose from common ingredients</p>
          <button onClick={() => setScan(true)} style={{ padding: "14px 28px", background: "#f97316", color: "white", border: "none", borderRadius: 20, fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>📷 Scan Now</button>
          <button onClick={() => setShowSample(true)} style={{ padding: "12px 24px", background: "white", color: "#22c55e", border: "2px solid #22c55e", borderRadius: 20, fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Choose Ingredients</button>
        </div>
      ) : (
        <div style={{ padding: "16px 16px 0" }}>
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}><p style={{ margin: 0, fontWeight: 700 }}>No results for "{search}"</p></div>}
          {Object.entries(grouped).map(([cat, items]) => {
            const meta = CAT[cat];
            return (
              <div key={cat} style={{ marginBottom: 16, background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid " + meta.border }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: meta.bg, borderBottom: "1px solid " + meta.border }}>
                  <span style={{ fontSize: 20 }}>{meta.icon}</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>{meta.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: meta.color, background: "white", padding: "3px 10px", borderRadius: 20, border: "1px solid " + meta.border }}>{items.length} items</span>
                </div>
                {items.map((item, rowIdx) => {
                  const expSt = expiryStatus(item.expiry);
                  return (
                    <div key={item.name} onClick={() => setEditItem({ ...item })}
                      style={{ display: "flex", alignItems: "center", padding: "11px 16px", borderBottom: rowIdx < items.length - 1 ? "1px solid " + meta.border + "44" : "none", background: expSt && expSt.color === "#ef4444" ? "#fff5f5" : rowIdx % 2 === 0 ? "white" : meta.bg + "44", cursor: "pointer" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0, marginRight: 10 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", textTransform: "capitalize" }}>{item.name}</span>
                        {(item.qty && item.qty !== "1") || item.unit !== "units" ? (
                          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>{item.qty} {item.unit}</span>
                        ) : null}
                      {item.useToday && <span style={{ fontSize: 10, fontWeight: 800, color: "#ca8a04", background: "#fef9c3", padding: "1px 6px", borderRadius: 6, marginLeft: 6 }}>USE TODAY</span>}
                      </div>
                      {expSt && <span style={{ fontSize: 11, fontWeight: 700, color: expSt.color, background: expSt.bg, padding: "2px 8px", borderRadius: 8, marginRight: 8, flexShrink: 0 }}>{expSt.label}</span>}
                      <span style={{ fontSize: 18, color: "#e2e8f0" }}>›</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};

// ── Recipe Detail with Scaling ───────────────────────────────────────────────
const RecipeDetail = ({ recipe, onBack, isBookmarked, onToggleBookmark, baseServings, profile }) => {
  const [servings, setServings] = useState(baseServings || 2);
  const [scaledIngredients, setScaledIngredients] = useState(recipe.ingredients || []);
  const [scaling, setScaling] = useState(false);
  const origServings = baseServings || 2;

  const scaleIngredients = async (newServings) => {
    if (newServings === origServings) { setScaledIngredients(recipe.ingredients || []); return; }
    setScaling(true);
    try {
      const ratio = newServings + "/" + origServings;
      const t = await callClaude('Scale these recipe ingredients by a factor of ' + ratio + ' (from ' + origServings + ' to ' + newServings + ' servings). Return ONLY a JSON array of the scaled ingredient strings, no markdown: ' + JSON.stringify(recipe.ingredients || []));
      const r = pJSON(t);
      if (r && r.length > 0) setScaledIngredients(r);
    } catch { /* keep original */ }
    setScaling(false);
  };

  const changeServings = (n) => {
    setServings(n);
    scaleIngredients(n);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc" }}>
    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 90 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 0" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#16a34a", fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Back</button>
        <button onClick={onToggleBookmark} style={{ background: isBookmarked ? "#fef9c3" : "#f1f5f9", border: "none", padding: "8px 16px", borderRadius: 20, fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer", color: isBookmarked ? "#ca8a04" : "#64748b" }}>
          {isBookmarked ? "★ Saved" : "☆ Save"}
        </button>
      </div>
      <div style={{ padding: "12px 16px 16px" }}>
        <div style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <div style={{ height: 180, background: "url(https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=300&fit=crop) center/cover", position: "relative" }}>
            {recipe.videoUrl && (
              <a href={recipe.videoUrl} target="_blank" rel="noopener noreferrer" style={{ position: "absolute", bottom: 12, right: 12, background: "#ef4444", color: "white", padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 800, textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                Watch on YouTube
              </a>
            )}
          </div>
          <div style={{ padding: 20 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>{recipe.name}</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ padding: "4px 12px", background: "#f1f5f9", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#64748b" }}>{recipe.time}</span>
              <span style={{ padding: "4px 12px", background: recipe.difficulty === "Easy" ? "#dcfce7" : "#fef9c3", borderRadius: 20, fontSize: 12, fontWeight: 700, color: recipe.difficulty === "Easy" ? "#16a34a" : "#ca8a04" }}>{recipe.difficulty}</span>
              {recipe.calories && <span style={{ padding: "4px 12px", background: "#fff7ed", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#ea580c" }}>{recipe.calories}</span>}
            </div>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{recipe.description}</p>

            {/* Allergen warning */}
            {checkAllergens(recipe.ingredients, profile.allergens).length > 0 && (
              <div style={{ background: "#fee2e2", border: "1.5px solid #fecaca", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#dc2626", marginBottom: 2 }}>Allergen Warning</div>
                  <div style={{ fontSize: 13, color: "#9a3412" }}>This recipe contains: {checkAllergens(recipe.ingredients, profile.allergens).join(", ")}</div>
                </div>
              </div>
            )}

            {/* Serving scaler */}
            <div style={{ background: "#f0fdf4", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a", flex: 1 }}>Servings</span>
              <button onClick={() => changeServings(Math.max(1, servings - 1))} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #22c55e", background: "white", color: "#16a34a", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>-</button>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#16a34a", minWidth: 24, textAlign: "center" }}>{servings}</span>
              <button onClick={() => changeServings(servings + 1)} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #22c55e", background: "white", color: "#16a34a", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>+</button>
              {servings !== origServings && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, background: "#dcfce7", padding: "2px 8px", borderRadius: 8 }}>Scaled {servings > origServings ? "up" : "down"}</span>}
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontWeight: 800 }}>Ingredients</h3>
                {scaling && <Spin size={18} color="#22c55e" />}
              </div>
              <ul style={{ paddingLeft: 20, margin: 0 }}>{scaledIngredients.map((ing, i) => <li key={i} style={{ fontSize: 14, lineHeight: 1.8 }}>{ing}</li>)}</ul>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: "0 0 10px", fontWeight: 800 }}>Steps</h3>
              <ol style={{ paddingLeft: 20, margin: 0 }}>{recipe.steps?.map((s, i) => <li key={i} style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 4 }}>{s}</li>)}</ol>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};


const RecipesScreen = ({ pantry, profile, bookmarks, setBookmarks }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [cardIdx, setCardIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState("pantry");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const isBookmarked = (name) => bookmarks.some((b) => b.name === name);
  const toggleBookmark = (recipe) => {
    if (isBookmarked(recipe.name)) {
      setBookmarks((b) => b.filter((r) => r.name !== recipe.name));
    } else {
      setBookmarks((b) => [...b, { ...recipe, savedAt: new Date().toISOString() }]);
    }
  };

  const fetchFromPantry = async () => {
    if (!pantry.length) return alert("Add ingredients to your pantry first!");
    setLoading(true); setRecipes([]); setCardIdx(0);
    try {
      const p = 'Pantry: ' + pantry.map((i) => i.name).join(', ') + '. Dietary: ' + (profile.dietary.join(',') || 'none') + '. Cuisines: ' + (profile.cuisines.join(',') || 'any') + '. Servings: ' + profile.servings + '. Suggest 6 recipes. JSON array only, no markdown: [{"name":"x","time":"20 mins","difficulty":"Easy","description":"x","emoji":"x","calories":"x","ingredients":["x"],"steps":["x"],"cuisine":"x"}]';
      const t = await callClaude(p);
      const r = pJSON(t);
      if (r) setRecipes(r.map((rec) => ({ ...rec, videoUrl: "https://www.youtube.com/results?search_query=" + encodeURIComponent(rec.name + " recipe") })));
    } catch { alert("Could not fetch recipes."); }
    setLoading(false);
  };

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true); setSearchResults([]);
    try {
      const dietary = profile.dietary.filter((d) => d !== "None").join(", ");
      const note = dietary ? " dietary: " + dietary : "";
      const p = 'Give me 6 popular recipes for: ' + searchQuery + note + '. JSON array only, no markdown: [{"name":"x","time":"20 mins","difficulty":"Easy","description":"x","emoji":"x","calories":"x","ingredients":["x"],"steps":["x"],"cuisine":"x"}]';
      const t = await callClaude(p);
      const r = pJSON(t);
      if (r && r.length > 0) {
        setSearchResults(r.map((rec) => ({ ...rec, videoUrl: "https://www.youtube.com/results?search_query=" + encodeURIComponent(rec.name + " recipe") })));
      } else {
        alert("No results found. Try a different search.");
      }
    } catch { alert("Search failed. Please try again."); }
    setSearchLoading(false);
  };

  const RecipeRow = ({ r }) => {
    const allergenWarnings = checkAllergens(r.ingredients, profile.allergens);
    return (
      <div style={{ background: "white", borderRadius: 12, marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", border: allergenWarnings.length > 0 ? "1.5px solid #fecaca" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, cursor: "pointer" }}>
          <div onClick={() => setSelected(r)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <span style={{ fontSize: 28 }}>{r.emoji || "🍽️"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{r.time} - {r.difficulty}{r.videoUrl ? " - Video" : ""}</div>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); toggleBookmark(r); }} style={{ background: isBookmarked(r.name) ? "#fef9c3" : "#f1f5f9", border: "none", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 18, flexShrink: 0 }}>
            {isBookmarked(r.name) ? "★" : "☆"}
          </button>
        </div>
        {allergenWarnings.length > 0 && (
          <div style={{ background: "#fee2e2", padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>Contains: {allergenWarnings.join(", ")}</span>
          </div>
        )}
      </div>
    );
  };

  if (selected) return (
    <RecipeDetail
      recipe={selected}
      onBack={() => setSelected(null)}
      isBookmarked={isBookmarked(selected.name)}
      onToggleBookmark={() => toggleBookmark(selected)}
      baseServings={profile.servings || 2}
      profile={profile}
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc" }}>
      <div style={{ background: "white", paddingTop: 54, paddingLeft: 16, paddingRight: 16, paddingBottom: 0, borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingTop: 16 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Recipes</h2>
          <span style={{ fontSize: 13, color: "#ca8a04", background: "#fef9c3", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
            {bookmarks.length} saved
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input style={{ flex: 1, padding: "11px 14px", border: "2px solid #e2e8f0", borderRadius: 12, fontFamily: "inherit", fontSize: 14, outline: "none", background: "#f8fafc", minWidth: 0 }}
            placeholder="Search recipes e.g. chicken pasta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setActiveView("search"); doSearch(); } }}
          />
          <button onClick={() => { setActiveView("search"); doSearch(); }} disabled={searchLoading}
            style={{ padding: "11px 16px", background: "#ef4444", color: "white", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer", opacity: searchLoading ? 0.6 : 1 }}>
            Search
          </button>
        </div>
        <div style={{ display: "flex" }}>
          {[["pantry","From Pantry"],["search","Search"],["bookmarks","Bookmarks"]].map(([v, label]) => (
            <button key={v} onClick={() => setActiveView(v)}
              style={{ flex: 1, padding: "10px 4px", border: "none", background: "transparent", fontFamily: "inherit", fontSize: 12, fontWeight: 800, cursor: "pointer", color: activeView === v ? "#a855f7" : "#94a3b8", borderBottom: "3px solid " + (activeView === v ? "#a855f7" : "transparent") }}>
              {label}{v === "bookmarks" && bookmarks.length > 0 ? " (" + bookmarks.length + ")" : ""}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 90 }}>
      <div style={{ padding: "16px 16px 0" }}>
        {activeView === "pantry" && (
          <>
            <button onClick={fetchFromPantry} disabled={loading}
              style={{ width: "100%", padding: 14, background: "#a855f7", color: "white", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer", opacity: loading ? 0.6 : 1, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading ? <><Spin color="white" size={18} /> Finding...</> : "Find Recipes from My Pantry"}
            </button>
            {!recipes.length && !loading && (
              <div style={{ textAlign: "center", padding: "32px 20px" }}>
                <span style={{ fontSize: 52, display: "block", marginBottom: 12 }}>🍳</span>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Ready to cook?</p>
                <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>Find recipes based on what is in your pantry</p>
              </div>
            )}
            {recipes.map((r, i) => <RecipeRow key={i} r={r} />)}
          </>
        )}

        {activeView === "search" && (
          <>
            {searchLoading && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "48px 20px", color: "#64748b" }}><Spin color="#ef4444" /><p>Searching recipes...</p></div>}
            {!searchResults.length && !searchLoading && (
              <div style={{ textAlign: "center", padding: "32px 20px" }}>
                <span style={{ fontSize: 52, display: "block", marginBottom: 12 }}>🔍</span>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Search for any recipe</p>
                <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>Type a dish name above and tap Search</p>
              </div>
            )}
            {searchResults.map((r, i) => <RecipeRow key={i} r={r} />)}
          </>
        )}

        {activeView === "bookmarks" && (
          <>
            {!bookmarks.length ? (
              <div style={{ textAlign: "center", padding: "32px 20px" }}>
                <span style={{ fontSize: 52, display: "block", marginBottom: 12 }}>☆</span>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>No bookmarks yet</p>
                <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>Tap the star on any recipe to save it here</p>
              </div>
            ) : bookmarks.map((r, i) => <RecipeRow key={i} r={r} />)}
          </>
        )}
      </div>
      </div>
    </div>
  );
};

// ── Editable Meal Row ─────────────────────────────────────────────────────────
const MealRow = ({ label, value, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <div style={{ borderBottom: "1px solid #f8fafc" }}>
      {!editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
          <span style={{ fontSize: 13, flexShrink: 0, color: "#64748b", minWidth: 70 }}>{label}:</span>
          {value ? (
            <a href={"https://www.youtube.com/results?search_query=" + encodeURIComponent(value + " recipe")} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: "#2563eb", textDecoration: "none", flex: 1 }}>
              {value}
            </a>
          ) : (
            <span style={{ fontSize: 13, color: "#94a3b8", flex: 1, fontStyle: "italic" }}>Tap + to add</span>
          )}
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button onClick={() => { setDraft(value); setEditing(true); }}
              style={{ background: "#f0fdf4", border: "none", color: "#16a34a", width: 28, height: 28, borderRadius: 8, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {value ? "✎" : "+"}
            </button>
            {value && (
              <button onClick={onDelete}
                style={{ background: "#fee2e2", border: "none", color: "#ef4444", width: 28, height: 28, borderRadius: 8, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                x
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: "8px 14px", background: "#f8fafc" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>{label}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
              placeholder={"Enter " + label.toLowerCase() + " meal..."}
              style={{ flex: 1, padding: "9px 12px", border: "2px solid #22c55e", borderRadius: 10, fontFamily: "inherit", fontSize: 14, outline: "none" }}
            />
            <button onClick={save}
              style={{ padding: "9px 14px", background: "#22c55e", color: "white", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Save</button>
            <button onClick={() => setEditing(false)}
              style={{ padding: "9px 10px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>x</button>
          </div>
        </div>
      )}
    </div>
  );
};


const PlannerScreen = ({ pantry, setPantry, profile, setShoppingList, setTab, onPlanGenerated, savedPlan }) => {
  const [showShare, setShowShare] = useState(false);
  const { imgs, idx } = useBG(profile.cuisines);
  const [plan, setPlan] = useState(savedPlan || {});
  const [loading, setLoading] = useState(false);
  const [prepTasks, setPrepTasks] = useState((savedPlan && savedPlan._prepTasks) || []);
  const [prepOpen, setPrepOpen] = useState(true);
  const [prepChecked, setPrepChecked] = useState([]);
  const [cookedDays, setCookedDays] = useState([]);
  const [mealRatings, setMealRatings] = useState({});
  const weekStr = new Date().toISOString().split("T")[0];

  const updateMeal = (day, mealKey, value) => {
    const updated = { ...plan, [day]: { ...plan[day], [mealKey]: value } };
    setPlan(updated);
    if (onPlanGenerated) onPlanGenerated({ ...updated, _prepTasks: prepTasks });
  };

  const addCustomMeal = (day, mealKey, value) => {
    if (!value.trim()) return;
    updateMeal(day, mealKey, value.trim());
  };

  // Restore prepTasks from persisted plan when screen mounts
  useEffect(() => {
    if (savedPlan && Object.keys(savedPlan).length > 0) {
      const cleanPlan = {};
      DAYS.forEach((d) => { if (savedPlan[d]) cleanPlan[d] = savedPlan[d]; });
      if (Object.keys(cleanPlan).length > 0) setPlan(cleanPlan);
      if (savedPlan._prepTasks) setPrepTasks(savedPlan._prepTasks);
    }
  }, []);

  const markCooked = async (day) => {
    if (cookedDays.includes(day)) return;
    setCookedDays((d) => [...d, day]);
    // Smart pantry deduction - ask Claude which pantry items were likely used
    if (pantry.length === 0) return;
    try {
      const meals = [plan[day]?.breakfast, plan[day]?.lunch, plan[day]?.dinner].filter(Boolean).join(", ");
      const have = pantry.map((i) => i.name).join(", ");
      const t = await callClaude('I cooked these meals: ' + meals + '. From my pantry I had: ' + have + '. Which pantry items were likely used up? Return ONLY a JSON array of ingredient names: ["item1","item2"]');
      const used = pJSON(t);
      if (used && used.length > 0) {
        setPantry((p) => p.filter((item) => !used.includes(item.name)));
      }
    } catch (e) { console.error("Pantry deduction error:", e); }
  };

  const genPlan = async () => {
    if (!pantry.length) return alert("Add ingredients to your pantry first!");
    setLoading(true);
    try {
      const prompt = "Pantry: " + pantry.map((i) => i.name).join(", ") + ". Dietary: " + (profile.dietary.join(",") || "none") + ". Servings: " + profile.servings + ". Create 7-day meal plan with 6 prep tasks. JSON only, no markdown: {\"plan\":{\"Monday\":{\"breakfast\":\"x\",\"lunch\":\"x\",\"dinner\":\"x\"},\"Tuesday\":{\"breakfast\":\"x\",\"lunch\":\"x\",\"dinner\":\"x\"},\"Wednesday\":{\"breakfast\":\"x\",\"lunch\":\"x\",\"dinner\":\"x\"},\"Thursday\":{\"breakfast\":\"x\",\"lunch\":\"x\",\"dinner\":\"x\"},\"Friday\":{\"breakfast\":\"x\",\"lunch\":\"x\",\"dinner\":\"x\"},\"Saturday\":{\"breakfast\":\"x\",\"lunch\":\"x\",\"dinner\":\"x\"},\"Sunday\":{\"breakfast\":\"x\",\"lunch\":\"x\",\"dinner\":\"x\"}},\"prepTasks\":[{\"name\":\"x\",\"desc\":\"x\",\"time\":\"x\",\"tip\":\"x\",\"emoji\":\"x\"}]}";
      const t = await callClaude(prompt);
      const r = pJSON(t);
      if (r) { const p = r.plan || {}; const tasks = r.prepTasks || []; setPlan(p); setPrepTasks(tasks); setPrepChecked([]); if (onPlanGenerated) onPlanGenerated({ ...p, _prepTasks: tasks }); }
    } catch { alert("Could not generate plan."); }
    setLoading(false);
  };

  const genShopping = async () => {
    if (!Object.keys(plan).length) return alert("Generate a meal plan first!");
    setLoading(true);
    try {
      const meals = DAYS.map((d) => {
        const day = plan[d];
        if (!day) return d + ": none";
        return d + " - breakfast: " + day.breakfast + ", lunch: " + day.lunch + ", dinner: " + day.dinner;
      }).join(". ");
      const have = pantry.length > 0 ? pantry.map((i) => i.name).join(", ") : "nothing";
      const prompt = 'I have this 7-day meal plan: ' + meals + '. Ingredients I already have: ' + have + '. List all additional ingredients I need to buy. Be thorough. Return ONLY a valid JSON array of strings with no extra text, no markdown, no explanation. Example: ["tomatoes","olive oil","garlic"]. Now return the array:';
      const t = await callClaude(prompt);
      // Try to extract JSON array even if wrapped in text
      let r = pJSON(t);
      if (!r) {
        const match = t.match(/\[[\s\S]*\]/);
        if (match) r = pJSON(match[0]);
      }
      if (r && Array.isArray(r) && r.length > 0) {
        const items = r.filter((x) => typeof x === "string" && x.trim().length > 0)
                       .map((name) => ({ name: name.toLowerCase().trim(), checked: false }));
        setShoppingList(items);
        if (setTab) setTab("shopping");
      } else {
        alert("Could not generate list. The response was: " + t.slice(0, 100));
      }
    } catch (e) {
      alert("Error: " + (e.message || "Please try again."));
    }
    setLoading(false);
  };

  const members = profile.familyMembers || [];

  const ShareModal = () => {
    const [sent, setSent] = useState([]);
    const planText = Object.keys(plan).length > 0
      ? DAYS.map((d) => d + ": Breakfast: " + (plan[d]?.breakfast || "-") + ", Lunch: " + (plan[d]?.lunch || "-") + ", Dinner: " + (plan[d]?.dinner || "-")).join("\n")
      : "No meal plan generated yet.";

    const shareTo = (member) => {
      // In real app this would send email/notification
      // For preview, we simulate it
      setSent((s) => [...s, member.id]);
      setTimeout(() => setSent((s) => s.filter((x) => x !== member.id)), 3000);
    };

    return (
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "flex-end" }} onClick={() => setShowShare(false)}>
        <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "80%", overflowY: "auto", padding: 24 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Share Meal Plan</h3>
            <button onClick={() => setShowShare(false)} style={{ background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", fontSize: 18, cursor: "pointer" }}>x</button>
          </div>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>Send this week plan to your family members</p>

          {/* Plan preview */}
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, marginBottom: 20, border: "1px solid #e2e8f0" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 14, color: "#1e293b" }}>This week plan:</p>
            {Object.keys(plan).length > 0 ? DAYS.slice(0,3).map((d) => (
              <div key={d} style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                <strong style={{ color: "#1e293b" }}>{d}:</strong> {plan[d]?.dinner || "-"}
              </div>
            )) : <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>No plan yet</p>}
            {Object.keys(plan).length > 3 && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>+ {Object.keys(plan).length - 3} more days...</p>}
          </div>

          {/* Family members */}
          {members.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: 36, margin: "0 0 8px" }}>👥</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>No family members yet</p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Add family members in your Profile to share plans</p>
            </div>
          ) : (
            <div>
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Send to:</p>
              {members.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: sent.includes(m.id) ? "#f0fdf4" : "#f8fafc", borderRadius: 12, marginBottom: 8, border: "1.5px solid " + (sent.includes(m.id) ? "#22c55e" : "#e2e8f0") }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>{m.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{m.name}</div>
                    {m.email && <div style={{ fontSize: 12, color: "#64748b" }}>{m.email}</div>}
                  </div>
                  <button onClick={() => shareTo(m)} style={{ padding: "8px 16px", background: sent.includes(m.id) ? "#dcfce7" : "#3b82f6", color: sent.includes(m.id) ? "#16a34a" : "white", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer", minWidth: 70 }}>
                    {sent.includes(m.id) ? "Sent!" : "Send"}
                  </button>
                </div>
              ))}
              <button onClick={() => { members.forEach((m) => shareTo(m)); }} style={{ width: "100%", padding: 14, background: "#3b82f6", color: "white", border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer", marginTop: 8 }}>
                Send to All Family Members
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "white" }}>
    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 90 }}>
      {showShare && <ShareModal />}
      <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
        {imgs.map((src, i) => <div key={src} style={{ position: "absolute", inset: 0, backgroundImage: "url(" + src + ")", backgroundSize: "cover", backgroundPosition: "center top", opacity: i === idx ? 1 : 0, transition: "opacity 1.5s ease-in-out" }} />)}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.15) 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, padding: "16px 20px", color: "white" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>Meal Planner</h2>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>AI-powered weekly meal plans</p>
        </div>
      </div>
      <div style={{ padding: "0 16px", margin: "16px 0 8px" }}>
        {pantry.length === 0 ? (
          <div style={{ background: "#fff7ed", border: "2px solid #fed7aa", borderRadius: 14, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🧺</div>
            <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 16, color: "#c2410c" }}>Your pantry is empty</p>
            <p style={{ margin: "0 0 14px", fontSize: 14, color: "#9a3412", lineHeight: 1.5 }}>Add ingredients to your pantry first so we can build a meal plan around what you have</p>
            <button onClick={() => setTab("pantry")} style={{ padding: "12px 24px", background: "#f97316", color: "white", border: "none", borderRadius: 20, fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Go to Pantry</button>
          </div>
        ) : (
          <>
            <button onClick={genPlan} disabled={loading} style={{ width: "100%", padding: "18px 0", background: loading ? "#86efac" : "#22c55e", color: "white", border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 17, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {loading ? <><Spin color="white" size={20} /> Generating...</> : "Generate Weekly Meal Plan"}
            </button>
            <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", margin: "8px 0 0" }}>Based on your pantry ({pantry.length} items)</p>
          </>
        )}
      </div>
      {Object.keys(plan).length > 0 && (
        <div style={{ padding: "0 16px 12px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📅</div>
            <div><div style={{ fontWeight: 800, fontSize: 16 }}>Week of {weekStr}</div><div style={{ fontSize: 13, color: "#64748b" }}>{Object.keys(plan).length * 3} meals planned</div></div>
          </div>
        </div>
      )}
      {prepTasks.length > 0 && (
        <div style={{ margin: "12px 16px 0", background: "#fffbeb", borderRadius: 16, overflow: "hidden", border: "1px solid #fef3c7" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer" }} onClick={() => setPrepOpen((o) => !o)}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🧩</div>
              <div><div style={{ fontWeight: 800, fontSize: 15 }}>Weekly Prep Tasks</div><div style={{ fontSize: 13, color: "#64748b" }}>{prepChecked.length}/{prepTasks.length} completed - Do these ahead of time</div></div>
            </div>
            <span style={{ fontSize: 18, color: "#64748b" }}>{prepOpen ? "^" : "v"}</span>
          </div>
          {prepOpen && prepTasks.map((task, i) => (
            <div key={i} style={{ background: "white", margin: "0 12px 8px", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12, border: "1px solid #f1f5f9" }}>
              <div onClick={() => setPrepChecked((c) => c.includes(i) ? c.filter((x) => x !== i) : [...c, i])} style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid " + (prepChecked.includes(i) ? "#22c55e" : "#cbd5e1"), background: prepChecked.includes(i) ? "#22c55e" : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 2, color: "white", fontSize: 13, fontWeight: 900 }}>{prepChecked.includes(i) ? "v" : ""}</div>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{task.emoji || "🍳"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2, textDecoration: prepChecked.includes(i) ? "line-through" : "none", color: prepChecked.includes(i) ? "#94a3b8" : "#1e293b" }}>{task.name}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, lineHeight: 1.4 }}>{task.desc}</div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{task.time}</span>
                  {task.tip && <span style={{ fontSize: 12, color: "#f97316" }}>Tip: {task.tip}</span>}
                </div>
              </div>
            </div>
          ))}
          {prepOpen && <div style={{ height: 8 }} />}
        </div>
      )}
      {Object.keys(plan).length > 0 && (
        <div style={{ padding: "12px 16px 0" }}>
          {DAYS.map((day) => (
            <div key={day} style={{ background: "white", borderRadius: 12, marginBottom: 10, overflow: "hidden", border: "1px solid " + (cookedDays.includes(day) ? "#22c55e" : "#f1f5f9") }}>
              <div style={{ background: cookedDays.includes(day) ? "#16a34a" : "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", fontSize: 14, fontWeight: 800, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{day}</span>
                {!cookedDays.includes(day) ? (
                  <button onClick={() => markCooked(day)}
                    style={{ fontSize: 11, fontWeight: 800, background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.5)", color: "white", padding: "3px 10px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>
                    Mark Cooked
                  </button>
                ) : mealRatings[day] ? (
                  <span style={{ fontSize: 13 }}>{"★".repeat(mealRatings[day])}{"☆".repeat(5 - mealRatings[day])}</span>
                ) : (
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} onClick={() => setMealRatings((r) => ({ ...r, [day]: s }))}
                        style={{ background: "none", border: "none", color: "white", fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1 }}>
                        ☆
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {[["Breakfast","breakfast"],["Lunch","lunch"],["Dinner","dinner"]].map(([label, key]) => (
                <MealRow key={key} label={label} value={plan[day]?.[key] || ""} onSave={(val) => updateMeal(day, key, val)} onDelete={() => updateMeal(day, key, "")} />
              ))}
              {/* Add extra meal button */}
              {plan[day]?.extra ? (
                <MealRow key="extra" label="Extra" value={plan[day].extra} onSave={(val) => updateMeal(day, "extra", val)} onDelete={() => updateMeal(day, "extra", "")} />
              ) : (
                <div style={{ padding: "8px 14px" }}>
                  <button onClick={() => updateMeal(day, "extra", "New meal")}
                    style={{ width: "100%", padding: "8px 0", background: "none", border: "1.5px dashed #e2e8f0", borderRadius: 8, fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "#94a3b8", cursor: "pointer" }}>
                    + Add meal to {day}
                  </button>
                </div>
              )}
            </div>
          ))}
          {/* Nutrition Summary */}
          {Object.keys(plan).some((d) => plan[d]?.calories) && (
            <div style={{ background: "white", borderRadius: 14, padding: 16, marginBottom: 12, border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Weekly Nutrition Avg / Day</h4>
              {(() => {
                const days = Object.values(plan).filter((d) => d?.calories);
                const avg = (key) => Math.round(days.reduce((s, d) => s + (d[key] || 0), 0) / (days.length || 1));
                const cals = avg("calories"); const protein = avg("protein"); const carbs = avg("carbs"); const fat = avg("fat");
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
                    {[["Calories", cals, "kcal", "#f97316", "#fff7ed"], ["Protein", protein, "g", "#3b82f6", "#eff6ff"], ["Carbs", carbs, "g", "#a855f7", "#f5f3ff"], ["Fat", fat, "g", "#22c55e", "#dcfce7"]].map(([label, val, unit, color, bg]) => (
                      <div key={label} style={{ background: bg, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
                        <div style={{ fontSize: 10, color, fontWeight: 700 }}>{unit}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
          <button onClick={genShopping} disabled={loading} style={{ width: "100%", padding: 16, background: "linear-gradient(135deg,#f97316,#f59e0b)", color: "white", border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer", marginTop: 4, marginBottom: 8, opacity: loading ? 0.6 : 1 }}>Generate Shopping List</button>
          <button onClick={() => setShowShare(true)} style={{ width: "100%", padding: 16, background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "white", border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 16 }}>Share Meal Plan</button>
        </div>
      )}
      {!Object.keys(plan).length && !loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 20px", textAlign: "center" }}>
          <span style={{ fontSize: 52 }}>📅</span>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>No plan yet</p>
          <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>Click above to generate a personalised 7-day meal plan</p>
        </div>
      )}
      </div>
    </div>
  );
};

const CUISINE_INGREDIENTS = {
  "Italian": { emoji: "pasta", color: "#dc2626", bg: "#fef2f2", items: ["pasta","san marzano tomatoes","parmesan","mozzarella","olive oil","garlic","basil","pancetta","ricotta","prosciutto"] },
  "Asian": { emoji: "noodle", color: "#7c3aed", bg: "#f5f3ff", items: ["soy sauce","rice","sesame oil","ginger","spring onions","mirin","rice vinegar","oyster sauce","tofu","bok choy"] },
  "Mexican": { emoji: "taco", color: "#d97706", bg: "#fffbeb", items: ["corn tortillas","black beans","cumin","chili powder","avocado","lime","coriander","jalapeno","sour cream","queso fresco"] },
  "Mediterranean": { emoji: "salad", color: "#059669", bg: "#ecfdf5", items: ["olive oil","feta","chickpeas","lemon","hummus","tahini","cucumber","red onion","kalamata olives","flatbread"] },
  "American": { emoji: "burger", color: "#2563eb", bg: "#eff6ff", items: ["beef mince","cheddar","brioche buns","bacon","lettuce","tomato","bbq sauce","sweet potato","corn","ranch dressing"] },
  "Indian": { emoji: "curry", color: "#ea580c", bg: "#fff7ed", items: ["basmati rice","garam masala","turmeric","cumin","coriander","ghee","yogurt","onion","tomato","paneer"] },
  "French": { emoji: "croissant", color: "#9333ea", bg: "#fdf4ff", items: ["butter","heavy cream","shallots","thyme","dijon mustard","gruyere","baguette","tarragon","white wine","lardons"] },
  "Japanese": { emoji: "sushi", color: "#be123c", bg: "#fff1f2", items: ["sushi rice","nori","miso paste","dashi","mirin","wasabi","soy sauce","sake","edamame","panko breadcrumbs"] },
  "Middle Eastern": { emoji: "falafel", color: "#15803d", bg: "#f0fdf4", items: ["chickpeas","tahini","zaatar","sumac","flatbread","pomegranate molasses","preserved lemon","baharat","bulgur","halloumi"] },
};

const ShoppingScreen = ({ shoppingList, setShoppingList }) => {
  const [inp, setInp] = useState("");
  const [activeShopTab, setActiveShopTab] = useState("list");
  const [expandedCuisine, setExpandedCuisine] = useState(null);
  const [copyMsg, setCopyMsg] = useState("");
  const add = () => { const t = inp.trim().toLowerCase(); if (t && !shoppingList.find((i) => i.name === t)) { setShoppingList((l) => [...l, { name: t, checked: false }]); setInp(""); } };
  const addItem = (name) => { if (!shoppingList.find((i) => i.name === name)) { setShoppingList((l) => [...l, { name, checked: false }]); } };
  const addAllFromCuisine = (items) => { const newItems = items.filter((n) => !shoppingList.find((i) => i.name === n)).map((name) => ({ name, checked: false })); setShoppingList((l) => [...l, ...newItems]); };
  const toggle = (n) => setShoppingList((l) => l.map((i) => i.name === n ? { ...i, checked: !i.checked } : i));
  const clear = () => setShoppingList((l) => l.filter((i) => !i.checked));

  const getListText = () => {
    const unchecked = shoppingList.filter((i) => !i.checked);
    const checked = shoppingList.filter((i) => i.checked);
    const nl = "\n";
    let text = "Shopping List" + nl + "=============" + nl + nl;
    if (unchecked.length > 0) {
      text += "To Buy (" + unchecked.length + " items):" + nl;
      unchecked.forEach((i) => { text += "- " + i.name.charAt(0).toUpperCase() + i.name.slice(1) + nl; });
    }
    if (checked.length > 0) {
      text += nl + "Already have (" + checked.length + " items):" + nl;
      checked.forEach((i) => { text += "v " + i.name.charAt(0).toUpperCase() + i.name.slice(1) + nl; });
    }
    return text;
  };

  const copyList = () => {
    const text = getListText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopyMsg("Copied!");
        setTimeout(() => setCopyMsg(""), 2000);
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text) => {
    setCopyMsg("Copied!");
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const printList = () => {
    const text = getListText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "shopping-list.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "white", paddingTop: 54, paddingLeft: 16, paddingRight: 16, paddingBottom: 0, borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingTop: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Shopping</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{shoppingList.filter((i) => !i.checked).length} items left</p>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {shoppingList.some((i) => i.checked) && (
              <button onClick={clear} style={{ padding: "8px 12px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Clear checked</button>
            )}
            {shoppingList.length > 0 && (
              <>
                <button onClick={copyList}
                  style={{ padding: "8px 12px", background: copyMsg ? "#dcfce7" : "#f1f5f9", color: copyMsg ? "#16a34a" : "#1e293b", border: "none", borderRadius: 8, fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", minWidth: 60 }}>
                  {copyMsg || "Copy"}
                </button>
                <button onClick={printList}
                  style={{ padding: "8px 12px", background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: 8, fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Print
                </button>
              </>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex" }}>
          {[["list","My List"],["cuisine","By Cuisine"]].map(([v, label]) => (
            <button key={v} onClick={() => setActiveShopTab(v)}
              style={{ flex: 1, padding: "10px 4px", border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer", color: activeShopTab === v ? "#22c55e" : "#94a3b8", borderBottom: "3px solid " + (activeShopTab === v ? "#22c55e" : "transparent") }}>
              {label}{v === "list" && shoppingList.length > 0 ? " (" + shoppingList.length + ")" : ""}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 90 }}>
      {/* My List tab */}
      {activeShopTab === "list" && (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input style={{ flex: 1, padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: 12, fontFamily: "inherit", fontSize: 15, fontWeight: 600, outline: "none", background: "white" }}
              placeholder="Add item..." value={inp} onChange={(e) => setInp(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            <button onClick={add} style={{ padding: "12px 18px", background: "#22c55e", color: "white", border: "none", borderRadius: 12, fontSize: 22, fontWeight: 700, cursor: "pointer" }}>+</button>
          </div>
          {!shoppingList.length ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 20px", textAlign: "center" }}>
              <span style={{ fontSize: 52 }}>🛒</span>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>List is empty</p>
              <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>Generate a meal plan or browse by cuisine</p>
              <button onClick={() => setActiveShopTab("cuisine")} style={{ padding: "12px 24px", background: "#22c55e", color: "white", border: "none", borderRadius: 20, fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Browse by Cuisine</button>
            </div>
          ) : shoppingList.map((item) => (
            <div key={item.name} onClick={() => toggle(item.name)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: item.checked ? "#dcfce7" : "white", border: "2px solid " + (item.checked ? "#22c55e" : "#e2e8f0"), borderRadius: 12, cursor: "pointer", marginBottom: 8, opacity: item.checked ? 0.7 : 1 }}>
              <div style={{ width: 24, height: 24, border: "2.5px solid " + (item.checked ? "#22c55e" : "#e2e8f0"), borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "white", background: item.checked ? "#22c55e" : "white", flexShrink: 0 }}>{item.checked ? "v" : ""}</div>
              <span style={{ fontSize: 15, fontWeight: 700, flex: 1, textDecoration: item.checked ? "line-through" : "none", color: item.checked ? "#64748b" : "#1e293b", textTransform: "capitalize" }}>{item.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* By Cuisine tab */}
      {activeShopTab === "cuisine" && (
        <div style={{ padding: "16px 16px 0" }}>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#64748b" }}>Tap a cuisine to see its top 10 essential ingredients. Add them straight to your list!</p>
          {Object.entries(CUISINE_INGREDIENTS).map(([name, data]) => (
            <div key={name} style={{ background: "white", borderRadius: 16, marginBottom: 10, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", border: "1.5px solid " + (expandedCuisine === name ? data.color : "#f1f5f9") }}>
              {/* Cuisine header */}
              <div onClick={() => setExpandedCuisine(expandedCuisine === name ? null : name)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", background: expandedCuisine === name ? data.bg : "white" }}>
                <span style={{ fontSize: 28 }}>{data.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#1e293b" }}>{name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Top 10 essential ingredients</div>
                </div>
                <span style={{ fontSize: 18, color: data.color, fontWeight: 800 }}>{expandedCuisine === name ? "^" : "v"}</span>
              </div>
              {/* Expanded ingredient list */}
              {expandedCuisine === name && (
                <div style={{ padding: "0 16px 16px", background: data.bg }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    {data.items.map((item, idx) => {
                      const inList = shoppingList.some((s) => s.name === item);
                      return (
                        <button key={idx} onClick={() => addItem(item)}
                          style={{ padding: "7px 14px", background: inList ? data.color : "white", color: inList ? "white" : "#1e293b", border: "1.5px solid " + (inList ? data.color : "#e2e8f0"), borderRadius: 20, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: inList ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                          {inList ? "v " : "+ "}{item}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => addAllFromCuisine(data.items)}
                    style={{ width: "100%", padding: "11px 0", background: data.color, color: "white", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                    Add all to My List
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

const ProfileScreen = ({ profile, setProfile, setPantry, setShoppingList, onSignOut, userEmail, weeklyPlan }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [members, setMembers] = useState(profile.familyMembers || []);
  const [showSharePlan, setShowSharePlan] = useState(false);
  useEffect(() => { setMembers(profile.familyMembers || []); }, [JSON.stringify(profile.familyMembers)]);
  const [sentTo, setSentTo] = useState([]);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const tog = (key, val) => { const a = draft[key]; setDraft({ ...draft, [key]: a.includes(val) ? a.filter((x) => x !== val) : [...a, val] }); };
  const save = () => { setProfile({ ...draft, familyMembers: members }); setEditing(false); };
  const addMember = () => {
    if (!newName.trim()) return;
    const m = { id: Date.now(), name: newName.trim(), email: newEmail.trim(), avatar: newName.trim()[0].toUpperCase() };
    const updated = [...members, m];
    setMembers(updated);
    setProfile({ ...profile, familyMembers: updated });
    setNewName(""); setNewEmail("");
  };
  const removeMember = (id) => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    setProfile({ ...profile, familyMembers: updated });
  };
  const chip = (active) => ({ margin: 3, padding: "8px 14px", borderRadius: 20, border: "2px solid " + (active ? "#22c55e" : "#e2e8f0"), background: active ? "#dcfce7" : "white", color: active ? "#16a34a" : "#64748b", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" });
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc" }}>
    <div style={{ flex: 1, overflowY: "auto", paddingTop: 54, paddingLeft: 16, paddingRight: 16, paddingBottom: 160 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Profile</h2>
        {!editing
          ? <button onClick={() => { setDraft(profile); setEditing(true); }} style={{ padding: "8px 18px", background: "#22c55e", color: "white", border: "none", borderRadius: 20, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Edit</button>
          : <button onClick={save} style={{ padding: "8px 18px", background: "#16a34a", color: "white", border: "none", borderRadius: 20, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Save</button>}
      </div>

      {/* Profile Card */}
      <div style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", borderRadius: 20, padding: 20, color: "white", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, flexShrink: 0 }}>
          {profile.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing
            ? <input style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.5)", borderRadius: 10, padding: "8px 12px", fontFamily: "inherit", fontSize: 17, fontWeight: 700, color: "white", width: "100%", outline: "none", boxSizing: "border-box" }} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            : <div style={{ fontSize: 20, fontWeight: 800 }}>{profile.name || "My Profile"}</div>}
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Cooking for {profile.servings} {profile.servings === 1 ? "person" : "people"}</div>
          {userEmail && <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{userEmail}</div>}
        </div>
      </div>

      {/* Quick stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          ["🧺", "Pantry", "items"],
          ["💰", profile.weeklyBudget > 0 ? "$" + profile.weeklyBudget : "No budget", "per week"],
          ["👨‍👩‍👧", members.length, "family"]
        ].map(([icon, val, label], i) => (
          <div key={i} style={{ background: "white", borderRadius: 14, padding: "12px 8px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b" }}>{val}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Preferences Section */}
      <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 12 }}>
        <button onClick={() => setOpenSection(openSection === "prefs" ? null : "prefs")}
          style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontFamily: "inherit" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🥗</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Dietary & Preferences</span>
          </div>
          <span style={{ fontSize: 18, color: "#94a3b8", transform: openSection === "prefs" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>›</span>
        </button>
        {openSection === "prefs" && (
          <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f1f5f9" }}>
            {[["Dietary Preferences","dietary",DIETARY],["Favourite Cuisines","cuisines",CUISINES],["Allergens","allergens",ALLERGENS]].map(([title, key, opts]) => (
              <div key={key} style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {opts.map((opt) => <button key={opt} style={chip(editing ? draft[key].includes(opt) : profile[key].includes(opt))} onClick={() => editing && tog(key, opt)}>{opt}</button>)}
                </div>
              </div>
            ))}
            {!editing && <p style={{ margin: "12px 0 0", fontSize: 12, color: "#94a3b8" }}>Tap Edit to change your preferences</p>}
          </div>
        )}
      </div>

      {/* Budget Section */}
      <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 12 }}>
        <button onClick={() => setOpenSection(openSection === "budget" ? null : "budget")}
          style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontFamily: "inherit" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>💰</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Weekly Budget</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{profile.weeklyBudget > 0 ? "$" + profile.weeklyBudget + "/week" : "Not set"}</div>
            </div>
          </div>
          <span style={{ fontSize: 18, color: "#94a3b8", transform: openSection === "budget" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>›</span>
        </button>
        {openSection === "budget" && (
          <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>$</span>
              <input type="number" min="0" step="10"
                value={editing ? draft.weeklyBudget || "" : profile.weeklyBudget || ""}
                onChange={(e) => editing && setDraft({ ...draft, weeklyBudget: Number(e.target.value) })}
                placeholder="e.g. 150" disabled={!editing}
                style={{ flex: 1, padding: "11px 14px", border: "2px solid " + (editing ? "#22c55e" : "#e2e8f0"), borderRadius: 12, fontFamily: "inherit", fontSize: 16, fontWeight: 700, outline: "none", background: editing ? "white" : "#f8fafc", color: "#1e293b" }} />
              <span style={{ fontSize: 13, color: "#64748b" }}>per week</span>
            </div>
          </div>
        )}
      </div>

      {/* Family Members Section */}
      <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 12 }}>
        <button onClick={() => setOpenSection(openSection === "family" ? null : "family")}
          style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontFamily: "inherit" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>👨‍👩‍👧</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Family Members</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{members.length === 0 ? "No members added" : members.length + " member" + (members.length > 1 ? "s" : "")}</div>
            </div>
          </div>
          <span style={{ fontSize: 18, color: "#94a3b8", transform: openSection === "family" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>›</span>
        </button>
        {openSection === "family" && (
          <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f1f5f9" }}>
            {members.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f8fafc" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>{m.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                  {m.email && <div style={{ fontSize: 12, color: "#64748b" }}>{m.email}</div>}
                </div>
                <button onClick={() => removeMember(m.id)} style={{ background: "#fee2e2", border: "none", color: "#ef4444", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14, fontWeight: 800 }}>x</button>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <input style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontFamily: "inherit", fontSize: 14, outline: "none", marginBottom: 8, boxSizing: "border-box" }} placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <input style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontFamily: "inherit", fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" }} placeholder="Email (optional)" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <button onClick={addMember} style={{ width: "100%", padding: "11px 0", background: "#22c55e", color: "white", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>+ Add Member</button>
            </div>
          </div>
        )}
      </div>

      {/* Share Plan Section */}
      <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 12 }}>
        <button onClick={() => setOpenSection(openSection === "share" ? null : "share")}
          style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontFamily: "inherit" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📅</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Share Meal Plan</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Send this week to family</div>
            </div>
          </div>
          <span style={{ fontSize: 18, color: "#94a3b8", transform: openSection === "share" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>›</span>
        </button>
        {openSection === "share" && (
          <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f1f5f9" }}>
            {!weeklyPlan || Object.keys(weeklyPlan).filter(d => d !== "_prepTasks").length === 0 ? (
              <p style={{ margin: "14px 0 0", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>No meal plan yet. Go to Plan tab to generate one.</p>
            ) : members.length === 0 ? (
              <p style={{ margin: "14px 0 0", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>Add family members above first.</p>
            ) : (
              <div style={{ marginTop: 14 }}>
                {members.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f8fafc" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{m.avatar}</div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div></div>
                    <button onClick={() => setSentTo((s) => s.includes(m.id) ? s : [...s, m.id])}
                      style={{ padding: "7px 14px", background: sentTo.includes(m.id) ? "#dcfce7" : "#3b82f6", color: sentTo.includes(m.id) ? "#16a34a" : "white", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                      {sentTo.includes(m.id) ? "Sent!" : "Send"}
                    </button>
                  </div>
                ))}
                <button onClick={() => setSentTo(members.map((m) => m.id))}
                  style={{ width: "100%", marginTop: 12, padding: 12, background: "#3b82f6", color: "white", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                  Send to All
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data & Account */}
      <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 16 }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🗑️</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Clear Pantry</span>
          <button onClick={() => setPantry([])} style={{ padding: "6px 14px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Clear</button>
        </div>
        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🛒</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Clear Shopping List</span>
          <button onClick={() => setShoppingList([])} style={{ padding: "6px 14px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Clear</button>
        </div>
      </div>

      {/* Account buttons */}
      <button onClick={() => { onSignOut?.(); }}
        style={{ width: "100%", padding: 14, background: "#1e293b", color: "white", border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>
        Sign Out
      </button>
      <button onClick={() => setShowDeleteConfirm(true)}
        style={{ width: "100%", padding: 14, background: "white", color: "#ef4444", border: "2px solid #fee2e2", borderRadius: 14, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
        Delete Account
      </button>

      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 340 }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#1e293b" }}>Delete Account?</h3>
              <p style={{ margin: 0, fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>This will permanently delete your account and all data. This cannot be undone.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: 14, background: "#f1f5f9", color: "#1e293b", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { setShowDeleteConfirm(false); onSignOut?.(); }} style={{ flex: 1, padding: 14, background: "#ef4444", color: "white", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Delete</button>
            </div>
            <p style={{ margin: "14px 0 0", fontSize: 12, color: "#94a3b8", textAlign: "center" }}>Contact Stock2Table@gmail.com for help</p>
          </div>
        </div>
      )}

    </div>
    </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState("auth");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: "", dietary: [], cuisines: [], servings: 2, weeklyBudget: 0, allergens: [] });
  const [tab, setTab] = useState("home");
  const [pantry, setPantry] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState({});

  useEffect(() => { const saved = loadUser(); if (saved) { setUser(saved); setProfile({ name: saved.name || "", dietary: saved.dietary || [], cuisines: saved.cuisines || [], servings: saved.servings || 2, weeklyBudget: saved.weeklyBudget || 0, allergens: saved.allergens || [] }); setPantry(saved.pantry || []); setShopping(saved.shopping || []); setBookmarks(saved.bookmarks || []); setWeeklyPlan(saved.weeklyPlan || {}); setScreen(saved.onboarded ? "app" : "onboard"); } }, []);
  useEffect(() => { if (user && screen === "app") saveUser({ ...user, ...profile, pantry, shopping, bookmarks, weeklyPlan, onboarded: true }); }, [profile, pantry, shopping, bookmarks, weeklyPlan]);

  const handleAuth = (u) => { setUser(u); setProfile({ name: u.name || "", dietary: u.dietary || [], cuisines: u.cuisines || [], servings: u.servings || 2, weeklyBudget: u.weeklyBudget || 0, allergens: u.allergens || [] }); setPantry(u.pantry || []); setShopping(u.shopping || []); setBookmarks(u.bookmarks || []); setWeeklyPlan(u.weeklyPlan || {}); setScreen(u.onboarded ? "app" : "onboard"); };
  const handleOnboarded = (p) => { const up = { ...user, ...p, onboarded: true }; setUser(up); setProfile(p); saveUser({ ...up, pantry, shopping, bookmarks, weeklyPlan }); setScreen("app"); };
  const handleSignOut = () => { clearUser(); setUser(null); setPantry([]); setShopping([]); setBookmarks([]); setWeeklyPlan({}); setProfile({ name: "", dietary: [], cuisines: [], servings: 2 }); setScreen("auth"); };
  const updateProfile = (p) => { setProfile(p); if (user) saveUser({ ...user, ...p, pantry, shopping, bookmarks, weeklyPlan, onboarded: true }); };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI',sans-serif", overflow: "hidden", width: "100%", maxWidth: "100vw" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        html, body { margin: 0; padding: 0; height: 100%; width: 100%; overscroll-behavior: none; overflow-x: hidden; }
        input, button, select, textarea { -webkit-appearance: none; font-family: inherit; max-width: 100%; }
        img { max-width: 100%; }
        div { min-width: 0; }
      `}</style>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", background: screen === "auth" ? "#0f172a" : "#f8fafc", position: "relative", overflow: "hidden", width: "100%" }}>
        {screen === "lucky"   && <LuckyScreen onContinue={() => setScreen("auth")} />}
        {screen === "auth"    && <AuthScreen onAuth={handleAuth} />}
        {screen === "onboard" && <Onboarding onDone={handleOnboarded} initialName={user?.name || ""} />}
        {screen === "app" && (
          <>
            {tab === "home"     && <HomeScreen pantry={pantry} setPantry={setPantry} setTab={setTab} profile={profile} />}
            {tab === "pantry"   && <PantryScreen pantry={pantry} setPantry={setPantry} setTab={setTab} />}
            {tab === "recipes"  && <RecipesScreen pantry={pantry} profile={profile} bookmarks={bookmarks} setBookmarks={setBookmarks} />}
            {tab === "planner"  && <PlannerScreen pantry={pantry} setPantry={setPantry} profile={profile} setShoppingList={setShopping} setTab={setTab} onPlanGenerated={setWeeklyPlan} savedPlan={weeklyPlan} />}
            {tab === "shopping" && <ShoppingScreen shoppingList={shopping} setShoppingList={setShopping} />}
            {tab === "profile"  && <ProfileScreen profile={profile} setProfile={updateProfile} setPantry={setPantry} setShoppingList={setShopping} onSignOut={handleSignOut} userEmail={user?.email} weeklyPlan={weeklyPlan} />}
            <BottomNav tab={tab} setTab={setTab} />
          </>
        )}
      </div>
    </div>
  );
}
