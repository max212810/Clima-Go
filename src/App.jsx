import React, { useState, useEffect, useCallback } from 'react'
import './App.css'

// ─── CONDICIONES CLIMÁTICAS ───────────────────────────────────────────────────
const getCondition = (code) => {
  if (code === 0)                 return { label: 'Soleado',             fa: 'fa-sun',                  color: '#fbbf24' }
  if (code === 1 || code === 2)   return { label: 'Parcialmente Nublado',fa: 'fa-cloud-sun',            color: '#f97316' }
  if (code === 3)                 return { label: 'Nublado',             fa: 'fa-cloud',                color: '#94a3b8' }
  if (code === 45 || code === 48) return { label: 'Niebla',              fa: 'fa-smog',                 color: '#cbd5e1' }
  if (code >= 51 && code <= 57)   return { label: 'Llovizna',            fa: 'fa-cloud-rain',           color: '#60a5fa' }
  if (code >= 61 && code <= 67)   return { label: 'Lluvia',              fa: 'fa-cloud-showers-heavy',  color: '#3b82f6' }
  if (code >= 71 && code <= 77)   return { label: 'Nieve',               fa: 'fa-snowflake',            color: '#bae6fd' }
  if (code >= 80 && code <= 82)   return { label: 'Chubascos',           fa: 'fa-cloud-sun-rain',       color: '#38bdf8' }
  if (code >= 95 && code <= 99)   return { label: 'Tormenta Eléctrica',  fa: 'fa-bolt',                 color: '#facc15' }
  return                                 { label: 'Despejado',           fa: 'fa-sun',                  color: '#fbbf24' }
}

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '--:--'
const fmtHour = (iso) => new Date(iso).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})
const fmtDay  = (iso) => {
  const today = new Date(); today.setHours(0,0,0,0)
  const t = new Date(iso); t.setHours(0,0,0,0)
  const tom = new Date(today); tom.setDate(today.getDate()+1)
  if (t.getTime()===today.getTime()) return 'Hoy'
  if (t.getTime()===tom.getTime())   return 'Mañana'
  return new Date(iso).toLocaleDateString('es-ES',{weekday:'short'}).replace(/^\w/,c=>c.toUpperCase())
}

// ─── RELOJ VIVO ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t) },[])
  return (
    <div className="clock-block">
      <div className="clock-time">{now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</div>
      <div className="clock-date">{now.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'short'}).replace(/^\w/,c=>c.toUpperCase())}</div>
    </div>
  )
}

// ─── TARJETA MÉTRICA ─────────────────────────────────────────────────────────
function Metric({ fa, color, label, value }) {
  return (
    <div className="metric-card">
      <span className="metric-icon-wrap">
        <i className={`fa-solid ${fa}`} style={{color}}></i>
      </span>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  )
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [theme,      setTheme]      = useState('crystal')
  const [query,      setQuery]      = useState('')
  const [city,       setCity]       = useState('Caracas')
  const [weather,    setWeather]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [animKey,    setAnimKey]    = useState(0)   // fuerza re-animación al cambiar ciudad

  // aplicar tema al <html>
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])

  // ── fetch por coordenadas ──
  const fetchCoords = useCallback(async (lat, lon, name) => {
    setLoading(true); setError(null)
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,is_day,weather_code,` +
        `relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure` +
        `&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,uv_index` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`
      const res  = await fetch(url)
      const json = await res.json()

      const curTime = json.current.time
      const hIdx = Math.max(0, json.hourly.time.findIndex(t => t >= curTime))
      const uv   = json.hourly.uv_index?.[hIdx] ?? 0

      setCity(name)
      setWeather({
        city: name,
        current: {
          time:      curTime,
          temp:      json.current.temperature_2m,
          feelsLike: json.current.apparent_temperature,
          code:      json.current.weather_code,
          humidity:  json.current.relative_humidity_2m,
          windSpeed: json.current.wind_speed_10m,
          windDir:   json.current.wind_direction_10m,
          pressure:  Math.round(json.current.surface_pressure),
          uv:        Math.round(uv),
          isDay:     json.current.is_day === 1,
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
          time:      json.hourly.time,
          temp:      json.hourly.temperature_2m,
          code:      json.hourly.weather_code,
          windDir:   json.hourly.wind_direction_10m,
          windSpeed: json.hourly.wind_speed_10m,
        },
      })
      setAnimKey(k => k + 1) // reinicia animaciones de entrada
    } catch(e) {
      setError('Error cargando la información meteorológica.')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── buscar por nombre ──
  const searchCity = useCallback(async (name) => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=es&format=json`)
      const json = await res.json()
      if (!json.results?.length) throw new Error(`No se encontró "${name}"`)
      const { latitude, longitude, name: n, admin1, country } = json.results[0]
      await fetchCoords(latitude, longitude, admin1 ? `${n}, ${admin1}` : `${n}, ${country}`)
    } catch(e) {
      setError(e.message); setLoading(false)
    }
  }, [fetchCoords])

  // ── GPS ──
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) return setError('Geolocalización no disponible')
    setGpsLoading(true); setError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try { await fetchCoords(pos.coords.latitude, pos.coords.longitude, 'Mi Ubicación') }
        catch { setError('Error al obtener ubicación') }
        finally { setGpsLoading(false) }
      },
      () => { setError('Permiso de ubicación denegado'); setGpsLoading(false) }
    )
  }, [fetchCoords])

  const handleSearch = (e) => { e.preventDefault(); if (query.trim()) { searchCity(query.trim()); setQuery('') } }

  // carga inicial
  useEffect(() => { searchCity('Caracas') }, [])

  const cond = weather ? getCondition(weather.current.code) : null

  return (
    <div className="app-root">
      {/* fondos decorativos */}
      <div className="bg-layer" aria-hidden="true" />
      <div className="bg-orb bg-orb-1" aria-hidden="true" />
      <div className="bg-orb bg-orb-2" aria-hidden="true" />
      <div className="bg-orb bg-orb-3" aria-hidden="true" />

      <div className="page-wrap">

        {/* ─── NAVBAR ─────────────────────────────────────────────────── */}
        <header className="navbar">
          <div className="navbar-brand">
            <i className="fa-solid fa-cloud-bolt brand-icon"></i>
            <span className="brand-name">ClimaGo</span>
          </div>

          {/* selector de tema */}
          <div className="theme-picker" role="group" aria-label="Modo de visualización">
            <button className={`theme-pill ${theme==='dark'    ? 'active':''}`} onClick={()=>setTheme('dark')}>
              <i className="fa-solid fa-moon"></i>
              <span>Oscuro</span>
            </button>
            <button className={`theme-pill ${theme==='light'   ? 'active':''}`} onClick={()=>setTheme('light')}>
              <i className="fa-solid fa-sun"></i>
              <span>Claro</span>
            </button>
            <button className={`theme-pill ${theme==='crystal' ? 'active':''}`} onClick={()=>setTheme('crystal')}>
              <i className="fa-solid fa-gem"></i>
              <span>Cristal</span>
            </button>
          </div>

          {/* búsqueda + GPS */}
          <div className="navbar-actions">
            <form className="search-wrap" onSubmit={handleSearch}>
              <i className="fa-solid fa-magnifying-glass search-ico"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar ciudad..."
                value={query}
                onChange={e=>setQuery(e.target.value)}
              />
            </form>
            <button
              className={`gps-btn ${gpsLoading ? 'loading':''}`}
              onClick={handleGPS}
              disabled={gpsLoading}
              title="Usar mi ubicación"
            >
              <i className={`fa-solid ${gpsLoading ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'}`}></i>
            </button>
          </div>
        </header>

        {/* ─── ESTADOS ────────────────────────────────────────────────── */}
        {error && (
          <div className="error-card card-glass">
            <i className="fa-solid fa-circle-exclamation error-icon"></i>
            <p>{error}</p>
          </div>
        )}

        {loading && !weather && (
          <div className="loading-screen">
            <div className="loading-ring">
              <div></div><div></div><div></div><div></div>
            </div>
            <p className="loading-text">Consultando el cielo<span className="dot-1">.</span><span className="dot-2">.</span><span className="dot-3">.</span></p>
          </div>
        )}

        {/* ─── DASHBOARD ──────────────────────────────────────────────── */}
        {!loading && !error && weather && (
          <div className="dashboard" key={animKey}>

            {/* PANEL 1 — ciudad y reloj */}
            <div className="card card-glass panel-clock anim-card" style={{'--delay':'0.05s'}}>
              <div className="city-group">
                <h2 className="city-name">{weather.city}</h2>
                <span className="city-badge">
                  <i className="fa-solid fa-location-dot"></i> Ubicación actual
                </span>
              </div>
              <LiveClock />
            </div>

            {/* PANEL 2 — clima actual */}
            <div className="card card-glass panel-weather anim-card" style={{'--delay':'0.15s'}}>
              <div className="weather-hero">
                <div className="hero-left">
                  <div className="cond-icon-box">
                    <i className={`fa-solid ${cond.fa} cond-icon`} style={{color: cond.color}}></i>
                    <div className="cond-glow" style={{background: cond.color}}></div>
                  </div>
                  <div>
                    <div className="cond-label">{cond.label}</div>
                    <div className="feels-like">Sensación: {Math.round(weather.current.feelsLike)}°C</div>
                  </div>
                </div>
                <div className="hero-right">
                  <div className="sun-pill">
                    <span><i className="fa-solid fa-arrow-up"></i> {fmtTime(weather.daily.sunrise[0])}</span>
                    <span className="sun-sep"></span>
                    <span><i className="fa-solid fa-arrow-down"></i> {fmtTime(weather.daily.sunset[0])}</span>
                  </div>
                </div>
              </div>

              <div className="weather-body">
                <div className="temp-display">
                  <span className="temp-number">{Math.round(weather.current.temp)}</span>
                  <span className="temp-unit">°C</span>
                </div>
                <div className="metrics-grid">
                  <Metric fa="fa-droplet"    color="#60a5fa" label="Humedad"   value={`${weather.current.humidity}%`} />
                  <Metric fa="fa-wind"       color="#818cf8" label="Viento"    value={`${Math.round(weather.current.windSpeed)} km/h`} />
                  <Metric fa="fa-gauge-high" color="#a78bfa" label="Presión"   value={`${weather.current.pressure} hPa`} />
                  <Metric fa="fa-sun"        color="#fbbf24" label="Índice UV" value={`${weather.current.uv}`} />
                </div>
              </div>
            </div>

            {/* PANEL 3 — próximos días */}
            <div className="card card-glass panel-days anim-card" style={{'--delay':'0.25s'}}>
              <h3 className="panel-title"><i className="fa-solid fa-calendar-days"></i> Próximos Días</h3>
              <div className="days-list">
                {weather.daily.time.slice(1,4).map((t,i) => {
                  const idx  = i + 1
                  const dc   = getCondition(weather.daily.code[idx])
                  return (
                    <div key={t} className="day-row">
                      <span className="day-name">{fmtDay(t)}</span>
                      <i className={`fa-solid ${dc.fa} day-icon`} style={{color:dc.color}}></i>
                      <span className="day-temps">
                        <span className="day-max">{Math.round(weather.daily.maxTemp[idx])}°</span>
                        <span className="day-min">{Math.round(weather.daily.minTemp[idx])}°</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* PANEL 4 — pronóstico por hora */}
            <div className="card card-glass panel-hourly anim-card" style={{'--delay':'0.35s'}}>
              <h3 className="panel-title"><i className="fa-solid fa-clock"></i> Pronóstico por Hora</h3>
              <div className="hourly-row">
                {(() => {
                  const start = Math.max(0, weather.hourly.time.findIndex(t => t >= weather.current.time))
                  return weather.hourly.time.slice(start, start+6).map((t,i) => {
                    const ai = start + i
                    const hc = getCondition(weather.hourly.code[ai])
                    return (
                      <div key={t} className="hourly-card">
                        <span className="h-time">{i===0 ? 'Ahora' : fmtHour(t)}</span>
                        <i className={`fa-solid ${hc.fa} h-icon`} style={{color:hc.color}}></i>
                        <span className="h-temp">{Math.round(weather.hourly.temp[ai])}°</span>
                        <span className="h-wind">
                          <i className="fa-solid fa-location-arrow" style={{transform:`rotate(${weather.hourly.windDir[ai]}deg)`}}></i>
                          {Math.round(weather.hourly.windSpeed[ai])} km/h
                        </span>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

          </div>
        )}

        <footer className="footer">ClimaGo · Practicas — Marxel Rodríguez</footer>
      </div>
    </div>
  )
}
