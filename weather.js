// weather.js — Fetches weather via Open-Meteo geocoding + forecast APIs
// Uses async/await and robust error handling, no API key required.

const form = document.getElementById('weather-form');
const input = document.getElementById('city-input');
const output = document.getElementById('weather-output');

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Network error: ${res.status} ${res.statusText}`);
  return res.json();
}

function renderError(message) {
  output.innerHTML = `<div class="weather-error">${message}</div>`;
}

function renderLoading() {
  output.innerHTML = `<div class="loading">Loading weather…</div>`;
}

function renderWeather(cityName, geo, forecast) {
  const cw = forecast.current_weather;
  // humidity is in hourly.relativehumidity_2m matched by time
  let humidity = 'N/A';
  if (forecast.hourly && forecast.hourly.time && forecast.hourly.relativehumidity_2m) {
    const idx = forecast.hourly.time.indexOf(cw.time);
    if (idx !== -1) humidity = `${forecast.hourly.relativehumidity_2m[idx]}%`;
  }

  output.innerHTML = `
    <div class="weather-card" role="region" aria-labelledby="weather-title">
      <div class="weather-meta">Weather for <strong>${cityName}</strong> — ${geo.country || ''} • Local time: ${cw.time}</div>
      <div class="weather-item">Temperature: <strong>${cw.temperature} °C</strong></div>
      <div class="weather-item">Wind Speed: <strong>${cw.windspeed} m/s</strong></div>
      <div class="weather-item">Wind Direction: <strong>${cw.winddirection}°</strong></div>
      <div class="weather-item">Humidity: <strong>${humidity}</strong></div>
    </div>
  `;
}

async function lookupCity(city) {
  const q = encodeURIComponent(city.trim());
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=en&format=json`;
  const data = await fetchJSON(url);
  if (!data || !data.results || data.results.length === 0) return null;
  return data.results[0];
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
  return fetchJSON(url);
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const city = input.value.trim();
  if (!city) return;

  renderLoading();

  try {
    const geo = await lookupCity(city);
    if (!geo) {
      renderError('City not found. Try a different name or include country (e.g. "Paris, FR").');
      return;
    }

    const forecast = await fetchWeather(geo.latitude, geo.longitude);
    renderWeather(geo.name + (geo.admin1 ? `, ${geo.admin1}` : ''), geo, forecast);
  } catch (err) {
    renderError(err.message || 'Failed to fetch weather.');
    console.error(err);
  }
});

// Optional: allow Enter search from the input when not using submit
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') form.requestSubmit();
});
