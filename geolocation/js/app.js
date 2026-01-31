// ================================
// LocalizaciónSH - JS principal
// ================================

// Año en footer
document.getElementById("year").textContent = new Date().getFullYear();

// Menú móvil
const btnMenu = document.getElementById("btnMenu");
const mobileMenu = document.getElementById("mobileMenu");

btnMenu.addEventListener("click", () => {
  const expanded = btnMenu.getAttribute("aria-expanded") === "true";
  btnMenu.setAttribute("aria-expanded", String(!expanded));
  mobileMenu.classList.toggle("show");
  mobileMenu.setAttribute("aria-hidden", String(expanded));
});

// Cerrar menú al hacer click en un link
mobileMenu.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;
  btnMenu.setAttribute("aria-expanded", "false");
  mobileMenu.classList.remove("show");
  mobileMenu.setAttribute("aria-hidden", "true");
});

// Animaciones al hacer scroll
const revealEls = document.querySelectorAll(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("in-view");
  });
}, { threshold: 0.14 });

revealEls.forEach(el => io.observe(el));

// ================================
// MAPA (Leaflet + OSM)
// ================================
const FIXED = {
    label: "Celaya, Gto — Col. Paseos del Campestre, Calle Cedro #106 B",
    lat: 20.526708,
    lng: -100.793625,
    zoom: 16
  };
  

const fixedLabel = document.getElementById("fixedLabel");
const fixedCoords = document.getElementById("fixedCoords");
fixedLabel.textContent = FIXED.label;
fixedCoords.textContent = `${FIXED.lat.toFixed(4)}, ${FIXED.lng.toFixed(4)}`;

// UI status
const statusText = document.getElementById("statusText");
const dot = document.querySelector(".dot");

function setStatus(message, mode = "idle") {
  statusText.textContent = message;

  // modos: idle | loading | ok | warn | err
  const styles = {
    idle: { bg: "rgba(255,255,255,.55)", glow: "rgba(255,255,255,.08)" },
    loading: { bg: "rgba(26,167,255,.95)", glow: "rgba(26,167,255,.16)" },
    ok: { bg: "rgba(47,107,255,.95)", glow: "rgba(47,107,255,.16)" },
    warn: { bg: "rgba(255,190,80,.95)", glow: "rgba(255,190,80,.15)" },
    err: { bg: "rgba(255,90,90,.95)", glow: "rgba(255,90,90,.14)" },
  };

  const s = styles[mode] || styles.idle;
  dot.style.background = s.bg;
  dot.style.boxShadow = `0 0 0 6px ${s.glow}`;
}

// Crear mapa
const map = L.map("map", {
  zoomControl: true,
  scrollWheelZoom: true
}).setView([FIXED.lat, FIXED.lng], FIXED.zoom);

// Tiles OSM
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Marcador fijo
const fixedMarker = L.marker([FIXED.lat, FIXED.lng]).addTo(map);
fixedMarker.bindPopup(`<b>Ubicación fija</b><br>${FIXED.label}<br>${FIXED.lat.toFixed(4)}, ${FIXED.lng.toFixed(4)}`);

// Marcador del usuario (se crea cuando se obtiene ubicación)
let myMarker = null;
let myCircle = null;

const myLat = document.getElementById("myLat");
const myLng = document.getElementById("myLng");
const myAcc = document.getElementById("myAcc");
const mySource = document.getElementById("mySource");

function setMyData({ lat, lng, accuracy, source }) {
  myLat.textContent = lat != null ? lat.toFixed(6) : "—";
  myLng.textContent = lng != null ? lng.toFixed(6) : "—";
  myAcc.textContent = accuracy != null ? `${Math.round(accuracy)} m` : "—";
  mySource.textContent = source || "—";
}

function placeMyMarker(lat, lng, accuracy) {
  if (myMarker) {
    myMarker.setLatLng([lat, lng]);
  } else {
    myMarker = L.marker([lat, lng], { title: "Tu ubicación" }).addTo(map);
    myMarker.bindPopup("<b>Tu ubicación</b><br>Detectada por el navegador.");
  }

  if (myCircle) {
    myCircle.setLatLng([lat, lng]);
    myCircle.setRadius(accuracy || 30);
  } else {
    myCircle = L.circle([lat, lng], {
      radius: accuracy || 30
    }).addTo(map);
  }
}

// Botones
const btnMyLocation = document.getElementById("btnMyLocation");
const btnGoFixed = document.getElementById("btnGoFixed");

btnGoFixed.addEventListener("click", () => {
  map.setView([FIXED.lat, FIXED.lng], FIXED.zoom, { animate: true });
  fixedMarker.openPopup();
  setStatus("Centrado en ubicación fija.", "ok");
});

btnMyLocation.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Tu navegador no soporta geolocalización.", "err");
    setMyData({ lat: null, lng: null, accuracy: null, source: "No disponible" });
    return;
  }

  setStatus("Solicitando permiso de ubicación…", "loading");

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;

      setMyData({ lat: latitude, lng: longitude, accuracy, source: "navigator.geolocation" });
      placeMyMarker(latitude, longitude, accuracy);

      map.setView([latitude, longitude], 15, { animate: true });
      if (myMarker) myMarker.openPopup();

      setStatus("Ubicación obtenida correctamente.", "ok");
    },
    (err) => {
      // Errores típicos: PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT
      const codeMap = {
        1: "Permiso denegado.",
        2: "Ubicación no disponible.",
        3: "Tiempo de espera agotado."
      };

      setStatus(`No se pudo obtener tu ubicación: ${codeMap[err.code] || err.message}`, "warn");
      setMyData({ lat: null, lng: null, accuracy: null, source: "Sin permiso / error" });
    },
    {
      enableHighAccuracy: true,
      timeout: 9000,
      maximumAge: 0
    }
  );
});

// Estado inicial
setStatus("Listo para localizar.", "idle");
