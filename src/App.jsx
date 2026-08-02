import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// ============================================================
// ÍCONOS SVG INLINE (sin dependencias externas)
// ============================================================
const Icon = ({ d, color, size = 24, stroke = 2, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={color || 'currentColor'} strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const Icons = {
  sun:       "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  cloudSun:  ["M12 2v2","M4.93 4.93l1.41 1.41","M20 12h2","M17.66 6.34l1.41-1.41","M3 12a5 5 0 0 1 9.33-2.5A4 4 0 1 1 17 19H8A5 5 0 0 1 3 12z"],
  cloud:     "M17 19H8A5 5 0 0 1 8 9a5 5 0 0 1 9.33 2.5A4 4 0 1 1 17 19z",
  fog:       ["M3 6h18","M3 10h18","M3 14h18","M3 18h18"],
  drizzle:   ["M8 19v1M8 14v2","M16 19v1M16 14v2","M12 21v1M12 16v2","M17 19H8A5 5 0 0 1 8 9a5 5 0 0 1 9.33 2.5A4 4 0 1 1 17 19z"],
  rain:      ["M7 19v2","M12 19v2","M17 19v2","M17 19H8A5 5 0 0 1 8 9a5 5 0 0 1 9.33 2.5A4 4 0 1 1 17 19z"],
  snow:      ["M12 2v20","M4.93 4.93l14.14 14.14","M19.07 4.93 4.93 19.07","M2 12h20","M7 4.54l10 14.92","M17 4.54 7 19.46"],
  bolt:      "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  wind:      ["M9.59 4.59A2 2 0 0 1 13 6v3H2","M9.59 19.41A2 2 0 0 0 13 18v-3H2","M17 8h2a3 3 0 0 1 0 6h-2"],
  droplets:  "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z",
  gauge:     ["M12 2a10 10 0 1 0 0 20","M12 12l4.5-4.5","M12 2v2","M2 12h2","M19.07 4.93l-1.41 1.41"],
  sunrise:   ["M12 2v8","M4.93 10.93l1.41 1.41","M2 18h2","M20 18h2","M19.07 10.93l-1.41 1.41","M22 22H2","M8 6l4-4 4 4","M12 18a6 6 0 0 0 0-12"],
  sunset:    ["M12 10v8","M4.93 13.07l1.41-1.41","M2 18h2","M20 18h2","M19.07 13.07l-1.41-1.41","M22 22H2","M8 18l4 4 4-4","M12 10a6 6 0 0 1 0-12"],
  search:    ["M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12z","M21 21l-4.35-4.35"],
  navigate:  "M3 11 22 2l-9 19-2-9-9-2z",
  moon:      "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  gem:       ["M2 12l10-10 10 10-10 10-10-10z","M2 12l10 4 10-4","M12 2v20","M2 12h20"],
  loader:    ["M12 2v4","M12 18v4","M4.93 4.93l2.83 2.83","M16.24 16.24l2.83 2.83","M2 12h4","M18 12h4","M4.93 19.07l2.83-2.83","M16.24 7.76l2.83-2.83"],
  alert:     ["M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z","M12 8v4","M12 16h.01"],
  lightning: ["M13 2 3 14h9l-1 8 10-12h-9l1-8z"],
};

// ============================================================
// CONDICIONES CLIMÁTICAS
// ============================================================
const getCondition = (code) => {
  if (code === 0)                       return { label: 'Soleado',            icon: 'sun',      color: '#ffb300' };
  if (code === 1 || code === 2)         return { label: 'Parcialmente Nublado', icon: 'cloudSun', color: '#f6ad55' };
  if (code === 3)                       return { label: 'Nublado',             icon: 'cloud',    color: '#a0aec0' };
  if (code === 45 || code === 48)       return { label: 'Niebla',              icon: 'fog',      color: '#cbd5e0' };
  if (code >= 51 && code <= 57)         return { label: 'Llovizna',            icon: 'drizzle',  color: '#63b3ed' };
  if (code >= 61 && code <= 67)         return { label: 'Lluvia',              icon: 'rain',     color: '#4299e1' };
  if (code >= 71 && code <= 77)         return { label: 'Nieve',               icon: 'snow',     color: '#90cdf4' };
  if (code >= 80 && code <= 82)         return { label: 'Chubascos',           icon: 'rain',     color: '#4299e1' };
  if (code >= 95 && code <= 99)         return { label: 'Tormenta Eléctrica',  icon: 'bolt',     color: '#ecc94b' };
  return                                       { label: 'Despejado',           icon: 'sun',      color: '#ffb300' };
};

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

const formatHour = (iso) =>
  new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

const getDayLabel = (iso) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(iso); target.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (target.getTime() === today.getTime()) return 'Hoy';
  if (target.getTime() === tomorrow.getTime()) return 'Mañana';
  const txt = new Date(iso).toLocaleDateString('es-ES', { weekday: 'short' });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
};

// ============================================================
// HOOK DE CLIMA
// ============================================================
const useWeather = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const fetchByCoords = async (lat, lon, cityName) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,is_day,weather_code,relative_humidity_2m,` +
        `wind_speed_10m,wind_direction_10m,surface_pressure` +
        `&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,uv_index` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al obtener datos del clima');
      const json = await res.json();

      const curTime = json.current.time;
      const hIdx = Math.max(0, json.hourly.time.findIndex(t => t >= curTime));
      const uv = json.hourly.uv_index?.[hIdx] ?? 0;

      setData({
        city: cityName,
        current: {
          time: curTime,
          temp: json.current.temperature_2m,
          feelsLike: json.current.apparent_temperature,
          code: json.current.weather_code,
          humidity: json.current.relative_humidity_2m,
          windSpeed: json.current.wind_speed_10m,
          windDir: json.current.wind_direction_10m,
          pressure: Math.round(json.current.surface_pressure),
          uv: Math.round(uv),
          isDay: json.current.is_day === 1,
        },
        daily: {
          time:    json.daily.time,
          maxTemp: json.daily.temperature_2m_max,
          minTemp: json.daily.temperature_2m_min,
          code:    json.daily.weather_code,
          sunrise: json.daily.sunrise,
          sunset:  json.daily.sunset,
        },
        hourly: {
          time:     json.hourly.time,
          temp:     json.hourly.temperature_2m,
          code:     json.hourly.weather_code,
          windDir:  json.hourly.wind_direction_10m,
          windSpeed:json.hourly.wind_speed_10m,
        },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const searchCity = async (city) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`);
      const json = await res.json();
      if (!json.results?.length) throw new Error(`No se encontró la ciudad "${city}"`);
      const { latitude, longitude, name, admin1, country } = json.results[0];
      await fetchByCoords(latitude, longitude, admin1 ? `${name}, ${admin1}` : `${name}, ${country}`);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const useGPS = useCallback(() => {
    if (!navigator.geolocation) return setError('Geolocalización no soportada');
    setGpsLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try { await fetchByCoords(pos.coords.latitude, pos.coords.longitude, 'Mi Ubicación'); }
        catch { setError('Error al obtener ubicación'); }
        finally { setGpsLoading(false); }
      },
      () => { setError('Permiso de ubicación denegado'); setGpsLoading(false); }
    );
  }, []);

  useEffect(() => { searchCity('Caracas'); }, []);

  return { data, loading, error, searchCity, useGPS, gpsLoading };
};

// ============================================================
// RELOJ DIGITAL
// ============================================================
const Clock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="clock-block">
      <span className="clock-time">
        {now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className="clock-date">
        {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
      </span>
    </div>
  );
};

// ============================================================
// TARJETA MÉTRICA
// ============================================================
const MetricCard = ({ iconKey, iconColor, label, value }) => (
  <div className="metric-card">
    <div className="metric-icon">
      <Icon d={Icons[iconKey]} color={iconColor} size={20} />
    </div>
    <div className="metric-info">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  </div>
);

// ============================================================
// APP PRINCIPAL
// ============================================================
export default function App() {
  const [theme, setTheme] = useState('crystal');
  const [query, setQuery] = useState('');
  const { data, loading, error, searchCity, useGPS, gpsLoading } = useWeather();

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) { searchCity(query.trim()); setQuery(''); }
  };

  const cardIn = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };
  const grid   = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.09 } } };

  const themes = [
    { id: 'dark',    label: 'Oscuro',  icon: 'moon'  },
    { id: 'light',   label: 'Claro',   icon: 'sun'   },
    { id: 'crystal', label: 'Cristal', icon: 'gem'   },
  ];

  return (
    <div className="app-root">
      <div className="crystal-bg" />
      <div className="particles" />

      <div className="container-inner">

        {/* ── NAV ── */}
        <header className="top-nav">
          <div className="nav-brand-row">
            <h1 className="app-logo">
              <Icon d={Icons.lightning} color="var(--accent)" size={26} stroke={2.2} />
              ClimaGo
            </h1>

            {/* Selector móvil (solo íconos) */}
            <div className="theme-selector">
              {themes.map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)}
                  className={`theme-btn ${theme === t.id ? 'active' : ''}`} title={t.label}>
                  {theme === t.id && <motion.span layoutId="theme-bubble" className="theme-bubble" />}
                  <Icon d={Icons[t.icon]} size={17} />
                </button>
              ))}
            </div>
          </div>

          <div className="nav-controls-row">
            {/* Selector desktop (con texto) */}
            <div className="theme-selector-desktop">
              {themes.map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)}
                  className={`theme-btn-desk ${theme === t.id ? 'active' : ''}`}>
                  {theme === t.id && <motion.span layoutId="theme-bubble-desk" className="theme-bubble" />}
                  <Icon d={Icons[t.icon]} size={15} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="search-form">
              <span className="search-icon-wrap">
                <Icon d={Icons.search} size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar ciudad..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="search-input"
              />
            </form>

            <button onClick={useGPS} disabled={gpsLoading} className="gps-btn" title="Mi ubicación">
              {gpsLoading
                ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}>
                    <Icon d={Icons.loader} size={20} color="var(--accent)" />
                  </motion.span>
                : <Icon d={Icons.navigate} size={20} color="var(--accent)" />
              }
            </button>
          </div>
        </header>

        {/* ── CONTENIDO ── */}
        <AnimatePresence mode="wait">
          {loading && !data && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="loading-screen">
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Icon d={Icons.loader} size={48} color="var(--accent)" />
              </motion.span>
              <p className="loading-text">Consultando el cielo...</p>
            </motion.div>
          )}

          {!loading && error && (
            <motion.div key="error"
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1, x: [0, -10, 10, -8, 8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ x: { duration: 0.4 } }}
              className="error-panel glass-panel">
              <Icon d={Icons.alert} size={56} color="#ef4444" />
              <h2 className="error-title">Ciudad no encontrada</h2>
              <p className="error-msg">{error}</p>
            </motion.div>
          )}

          {!loading && !error && data && (
            <motion.div key="data" variants={grid} initial="hidden" animate="show" className="dashboard-grid">

              {/* PANEL RELOJ */}
              <motion.div variants={cardIn} className="glass-panel panel-clock">
                <div>
                  <h2 className="city-name">{data.city}</h2>
                  <p className="city-sub">
                    <Icon d={Icons.navigate} size={13} color="var(--accent)" /> Ubicación Actual
                  </p>
                </div>
                <Clock />
              </motion.div>

              {/* PANEL CLIMA ACTUAL */}
              <motion.div variants={cardIn} className="glass-panel panel-weather">
                {(() => {
                  const cond = getCondition(data.current.code);
                  return (
                    <>
                      <div className="weather-top">
                        <div className="cond-group">
                          <div className="cond-icon-wrap">
                            <Icon d={Icons[cond.icon]} size={44} color={cond.color} stroke={1.5} />
                          </div>
                          <div>
                            <h3 className="cond-label">{cond.label}</h3>
                            <p className="feels-like">Sensación: {Math.round(data.current.feelsLike)}°</p>
                          </div>
                        </div>
                        <div className="sun-row">
                          <div className="sun-item">
                            <Icon d={Icons.sunrise} size={18} color="var(--accent)" />
                            <span>{formatTime(data.daily.sunrise[0])}</span>
                          </div>
                          <div className="sun-div" />
                          <div className="sun-item">
                            <Icon d={Icons.sunset} size={18} color="#fb923c" />
                            <span>{formatTime(data.daily.sunset[0])}</span>
                          </div>
                        </div>
                      </div>

                      <div className="weather-bottom">
                        <motion.span key={data.current.temp} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="temp-huge">
                          {Math.round(data.current.temp)}°
                        </motion.span>
                        <div className="metrics-grid">
                          <MetricCard iconKey="droplets" iconColor="#60a5fa" label="Humedad"   value={`${data.current.humidity}%`} />
                          <MetricCard iconKey="wind"     iconColor="#9ca3af" label="Viento"    value={`${Math.round(data.current.windSpeed)} km/h`} />
                          <MetricCard iconKey="gauge"    iconColor="#a78bfa" label="Presión"   value={`${data.current.pressure} hPa`} />
                          <MetricCard iconKey="sun"      iconColor="#fbbf24" label="Índice UV" value={`${data.current.uv}`} />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </motion.div>

              {/* PANEL 3 DÍAS */}
              <motion.div variants={cardIn} className="glass-panel panel-days">
                <h3 className="panel-title">Próximos Días</h3>
                <div className="days-list">
                  {data.daily.time.slice(1, 4).map((t, i) => {
                    const idx = i + 1;
                    const cond = getCondition(data.daily.code[idx]);
                    return (
                      <div key={t} className="day-row">
                        <span className="day-name">{getDayLabel(t)}</span>
                        <Icon d={Icons[cond.icon]} size={22} color={cond.color} stroke={1.6} />
                        <div className="day-temps">
                          <span className="day-max">{Math.round(data.daily.maxTemp[idx])}°</span>
                          <span className="day-min">{Math.round(data.daily.minTemp[idx])}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* PANEL HORAS */}
              <motion.div variants={cardIn} className="glass-panel panel-hourly">
                <h3 className="panel-title">Pronóstico por Hora</h3>
                <div className="hourly-scroll">
                  {(() => {
                    const start = Math.max(0, data.hourly.time.findIndex(t => t >= data.current.time));
                    return data.hourly.time.slice(start, start + 6).map((t, i) => {
                      const ai = start + i;
                      const cond = getCondition(data.hourly.code[ai]);
                      return (
                        <motion.div key={t} whileHover={{ scale: 1.06, y: -4 }} className="hourly-card">
                          <span className="hourly-time">{i === 0 ? 'Ahora' : formatHour(t)}</span>
                          <Icon d={Icons[cond.icon]} size={30} color={cond.color} stroke={1.5} />
                          <span className="hourly-temp">{Math.round(data.hourly.temp[ai])}°</span>
                          <div className="hourly-wind">
                            <motion.span style={{ display: 'inline-flex', transform: `rotate(${data.hourly.windDir[ai]}deg)` }}>
                              <Icon d={Icons.navigate} size={11} color="var(--accent)" />
                            </motion.span>
                            <span>{Math.round(data.hourly.windSpeed[ai])} km/h</span>
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

        <footer className="footer">ClimaGo · Practicas - Marxel Rodríguez</footer>
      </div>
    </div>
  );
}
