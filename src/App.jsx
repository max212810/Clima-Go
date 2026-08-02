import React, { useState, useEffect } from 'react';
import './App.css';

// MAPEO DE ÍCONOS VECTORIALES FA Y CONDICIONES EN ESPAÑOL
const getWeatherCondition = (code) => {
  if (code === 0) return { label: 'Soleado', icon: 'fa-solid fa-sun', color: '#ffcc00' };
  if (code === 1 || code === 2) return { label: 'Parcialmente Nublado', icon: 'fa-solid fa-cloud-sun', color: '#f6ad55' };
  if (code === 3) return { label: 'Nublado', icon: 'fa-solid fa-cloud', color: '#a0aec0' };
  if (code === 45 || code === 48) return { label: 'Niebla', icon: 'fa-solid fa-smog', color: '#cbd5e0' };
  if (code >= 51 && code <= 57) return { label: 'Llovizna', icon: 'fa-solid fa-cloud-rain', color: '#63b3ed' };
  if (code >= 61 && code <= 67) return { label: 'Lluvia', icon: 'fa-solid fa-cloud-showers-heavy', color: '#4299e1' };
  if (code >= 71 && code <= 77) return { label: 'Nieve', icon: 'fa-solid fa-snowflake', color: '#90cdf4' };
  if (code >= 80 && code <= 82) return { label: 'Chubascos', icon: 'fa-solid fa-cloud-sun-rain', color: '#4299e1' };
  if (code >= 95 && code <= 99) return { label: 'Tormenta Eléctrica', icon: 'fa-solid fa-bolt', color: '#ecc94b' };
  return { label: 'Despejado', icon: 'fa-solid fa-sun', color: '#ffcc00' };
};

export default function App() {
  const [city, setCity] = useState("Caracas");
  const [searchInput, setSearchInput] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [hourlyList, setHourlyList] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Consultar clima con horas consecutivas exactas
  const fetchWeather = async (cityName) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Geocoding
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=es&format=json`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError(`No se encontró la ciudad "${cityName}".`);
        setLoading(false);
        return;
      }

      const { name, country, latitude, longitude } = geoData.results[0];

      // 2. Weather API
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,surface_pressure,windspeed_10m,winddirection_10m,weathercode,uv_index&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`
      );
      const data = await weatherRes.json();

      setCity(`${name}, ${country}`);
      setWeatherData(data);

      // Reloj Digital de la Ciudad
      const tz = data.timezone || 'UTC';
      const now = new Date();
      
      const timeStr = now.toLocaleTimeString('es-ES', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const dateStr = now.toLocaleDateString('es-ES', {
        timeZone: tz,
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      });

      setCurrentTime(timeStr);
      setCurrentDateStr(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));

      // 3. Pronóstico de las siguientes 5 horas consecutivas reales
      if (data.hourly && data.hourly.time) {
        const cityNowStr = new Date().toLocaleString("en-US", { timeZone: tz });
        const cityDate = new Date(cityNowStr);
        const year = cityDate.getFullYear();
        const month = String(cityDate.getMonth() + 1).padStart(2, '0');
        const day = String(cityDate.getDate()).padStart(2, '0');
        const hour = String(cityDate.getHours()).padStart(2, '0');

        const currentHourPrefix = `${year}-${month}-${day}T${hour}:00`;
        let startIndex = data.hourly.time.findIndex(t => t.startsWith(currentHourPrefix));
        if (startIndex === -1) startIndex = 0;

        const list = [];
        for (let i = 0; i < 5; i++) {
          const idx = startIndex + i;
          if (idx < data.hourly.time.length) {
            const timeIso = data.hourly.time[idx];
            const hDate = new Date(timeIso);
            const hourFormatted = `${String(hDate.getHours()).padStart(2, '0')}:00`;
            const temp = Math.round(data.hourly.temperature_2m[idx]);
            const code = data.hourly.weathercode[idx] || 0;
            const wind = Math.round(data.hourly.windspeed_10m[idx]);
            const windDir = data.hourly.winddirection_10m[idx] || 0;

            list.push({
              timeLabel: hourFormatted,
              temp,
              code,
              wind,
              windDir
            });
          }
        }
        setHourlyList(list);
      }

    } catch (err) {
      setError("Error cargando la información meteorológica.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(city);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchWeather(searchInput.trim());
    }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,surface_pressure,windspeed_10m,winddirection_10m,weathercode,uv_index&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`
      );
      const data = await res.json();
      setCity("Mi Ubicación");
      setWeatherData(data);
      setLoading(false);
    });
  };

  // Datos extraídos
  const currentCode = weatherData?.current_weather?.weathercode || 0;
  const condition = getWeatherCondition(currentCode);
  const currentHourIndex = new Date().getHours();

  const humidity = weatherData?.hourly?.relativehumidity_2m?.[currentHourIndex] || 41;
  const pressure = Math.round(weatherData?.hourly?.surface_pressure?.[currentHourIndex] || 997);
  const uvIndex = Math.round(weatherData?.hourly?.uv_index?.[currentHourIndex] || 8);
  const windSpeed = Math.round(weatherData?.current_weather?.windspeed || 2);

  const formatSunTime = (isoStr) => {
    if (!isoStr) return "06:37 AM";
    const d = new Date(isoStr);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const sunriseStr = formatSunTime(weatherData?.daily?.sunrise?.[0]);
  const sunsetStr = formatSunTime(weatherData?.daily?.sunset?.[0]);

  return (
    <div className={`weather-dashboard-viewport ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <div className="container-inner">
        
        {/* TOP NAVIGATION BAR CON CLIMAGO */}
        <div className="top-nav-bar">
          <div className="brand-header-group">
            <h1 className="app-title-logo"><i className="fa-solid fa-cloud-sun"></i> ClimaGo</h1>
            
            {/* SWITCH MODO CLARO / OSCURO */}
            <div className="dark-mode-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
              <div className={`switch-btn ${isDarkMode ? 'active' : ''}`}>
                <div className="switch-ball"></div>
              </div>
              <span>{isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}</span>
            </div>
          </div>

          <form className="search-box-bar" onSubmit={handleSearchSubmit}>
            <i className="fa-solid fa-magnifying-glass search-icon-inside"></i>
            <input
              type="text"
              className="search-input-field"
              placeholder="Buscar tu ciudad de preferencia..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>

          <button className="btn-gps-green" onClick={handleGPS}>
            <i className="fa-solid fa-location-crosshairs"></i> Ubicación Actual
          </button>
        </div>

        {error && <div style={{ color: '#ef4444', textAlign: 'center' }}>{error}</div>}
        {loading && <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando información meteorológica...</div>}

        {!loading && weatherData && (
          <>
            {/* GRID SUPERIOR */}
            <div className="top-dashboard-grid">
              
              {/* PANEL 1: CIUDAD Y RELOJ */}
              <div className="panel-clock">
                <h2 className="city-name-header">{city}</h2>
                <div className="clock-digital-big">{currentTime || "09:03"}</div>
                <div className="clock-date-text">{currentDateStr || "Jueves, 31 de Agosto"}</div>
              </div>

              {/* PANEL 2: CLIMA PRINCIPAL & MÉTRICAS 2x2 */}
              <div className="panel-weather-main">
                
                <div className="main-temp-block">
                  <div className="temp-number-huge">
                    {Math.round(weatherData.current_weather.temperature)}°C
                  </div>
                  <div className="feels-like-text">
                    Sensación: {Math.round(weatherData.current_weather.temperature - 1)}°C
                  </div>

                  <div className="sun-times-group">
                    <div className="sun-time-item">
                      <i className="fa-solid fa-arrow-up"></i>
                      <div>
                        <div className="sun-time-label">Amanecer</div>
                        <div className="sun-time-val">{sunriseStr}</div>
                      </div>
                    </div>
                    <div className="sun-time-item">
                      <i className="fa-solid fa-arrow-down"></i>
                      <div>
                        <div className="sun-time-label">Atardecer</div>
                        <div className="sun-time-val">{sunsetStr}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CENTRO: ÍCONO Y CONDICIÓN */}
                <div className="center-condition-block">
                  <i className={`${condition.icon} vector-weather-icon-lg`} style={{ color: condition.color }}></i>
                  <div className="condition-label-text">{condition.label}</div>
                </div>

                {/* DERECHA: 4 MÉTRICAS (2x2) */}
                <div className="metrics-quad-panel">
                  <div className="metric-quad-item">
                    <i className="fa-solid fa-water"></i>
                    <div className="metric-quad-val">{humidity}%</div>
                    <div className="metric-quad-lbl">Humedad</div>
                  </div>

                  <div className="metric-quad-item">
                    <i className="fa-solid fa-wind"></i>
                    <div className="metric-quad-val">{windSpeed}km/h</div>
                    <div className="metric-quad-lbl">Velocidad Viento</div>
                  </div>

                  <div className="metric-quad-item">
                    <i className="fa-solid fa-gauge-high"></i>
                    <div className="metric-quad-val">{pressure}hPa</div>
                    <div className="metric-quad-lbl">Presión</div>
                  </div>

                  <div className="metric-quad-item">
                    <i className="fa-solid fa-sun-plant-wilt"></i>
                    <div className="metric-quad-val">{uvIndex}</div>
                    <div className="metric-quad-lbl">Índice UV</div>
                  </div>
                </div>

              </div>
            </div>

            {/* GRID INFERIOR */}
            <div className="bottom-dashboard-grid">
              
              {/* PANEL 3: PRONÓSTICO DE 3 DÍAS */}
              <div className="panel-5days">
                <h3 className="panel-title">Pronóstico de 3 Días:</h3>
                <div className="days-list-5">
                  {weatherData.daily?.time?.slice(1, 4).map((dayStr, idx) => {
                    const dateObj = new Date(dayStr + "T00:00:00");
                    const dayDateFormatted = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
                    const code = weatherData.daily.weathercode[idx + 1];
                    const maxTemp = Math.round(weatherData.daily.temperature_2m_max[idx + 1]);
                    const dayCondition = getWeatherCondition(code);

                    return (
                      <div key={dayStr} className="day-row-item">
                        <div className="day-row-left">
                          <i className={dayCondition.icon} style={{ color: dayCondition.color }}></i>
                        </div>
                        <div className="day-row-temp">{maxTemp}°C</div>
                        <div className="day-row-date">{dayDateFormatted}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PANEL 4: PRONÓSTICO POR HORAS CONSECUTIVAS */}
              <div className="panel-hourly">
                <h3 className="panel-title">Pronóstico por Horas:</h3>
                <div className="hourly-cards-row">
                  {hourlyList.map((item, idx) => {
                    const hourCond = getWeatherCondition(item.code);

                    return (
                      <div key={idx} className="hourly-card-box">
                        <div className="hourly-time">{item.timeLabel}</div>
                        <div className="hourly-icon">
                          <i className={hourCond.icon} style={{ color: hourCond.color }}></i>
                        </div>
                        <div className="hourly-temp">{item.temp}°C</div>
                        <div className="hourly-wind-dir">
                          <i className="fa-solid fa-location-arrow" style={{ transform: `rotate(${item.windDir}deg)` }}></i>
                          <span>{item.wind}km/h</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </>
        )}

        <footer className="footer">
          ClimaGo - Practicas - Marxel Rodríguez
        </footer>
      </div>
    </div>
  );
}
