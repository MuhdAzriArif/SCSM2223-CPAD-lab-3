const weatherCodes = {
    0: { desc: 'Clear sky', icon: '☀️' },
    1: { desc: 'Mainly clear', icon: '🌤️' },
    2: { desc: 'Partly cloudy', icon: '⛅' },
    3: { desc: 'Overcast', icon: '☁️' },
    45: { desc: 'Fog', icon: '🌫️' },
    48: { desc: 'Depositing rime fog', icon: '🌫️' },
    51: { desc: 'Light drizzle', icon: '🌧️' },
    53: { desc: 'Moderate drizzle', icon: '🌧️' },
    55: { desc: 'Dense drizzle', icon: '🌧️' },
    56: { desc: 'Light freezing drizzle', icon: '🌧️❄️' },
    57: { desc: 'Dense freezing drizzle', icon: '🌧️❄️' },
    61: { desc: 'Slight rain', icon: '🌦️' },
    63: { desc: 'Moderate rain', icon: '🌧️' },
    65: { desc: 'Heavy rain', icon: '🌧️' },
    66: { desc: 'Light freezing rain', icon: '🌧️❄️' },
    67: { desc: 'Heavy freezing rain', icon: '🌧️❄️' },
    71: { desc: 'Slight snow', icon: '🌨️' },
    73: { desc: 'Moderate snow', icon: '❄️' },
    75: { desc: 'Heavy snow', icon: '❄️' },
    77: { desc: 'Snow grains', icon: '❄️' },
    80: { desc: 'Slight rain showers', icon: '🌦️' },
    81: { desc: 'Moderate rain showers', icon: '🌧️' },
    82: { desc: 'Violent rain showers', icon: '⛈️' },
    85: { desc: 'Slight snow showers', icon: '🌨️' },
    86: { desc: 'Heavy snow showers', icon: '❄️' },
    95: { desc: 'Thunderstorm', icon: '⛈️' },
    96: { desc: 'Thunderstorm with slight hail', icon: '⛈️🧊' },
    99: { desc: 'Thunderstorm with heavy hail', icon: '⛈️🧊' }
};

// Event listener for the Search button
document.getElementById('search-btn').addEventListener('click', () => {
    const city = document.getElementById('city-input').value.trim();
    if (city) {
        hideError();
        fetchWeatherData(city);
    }
});

async function fetchWeatherData(city) {
    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            showError(`City "${city}" not found.`);
            return; 
        }

        const location = geoData.results[0];

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
        
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        updateUI(location.name, weatherData);

        fetchLocalTime(location.timezone);

    } catch (error) {
        showError("Network error: Unable to fetch data. Please check your connection.");
    }
}

function updateUI(cityName, data) {
    const currentElements = ['city-name', 'current-temp', 'current-desc', 'current-humidity', 'current-wind'];
    currentElements.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.classList.remove('skeleton', 'skeleton-text');
            el.style.width = '';
            el.style.height = '';
        }
    });

    const currentCode = data.current_weather.weathercode;
    const weatherInfo = weatherCodes[currentCode] || { desc: 'Unknown', icon: '❓' };

    document.getElementById('city-name').textContent = cityName;
    document.getElementById('current-temp').textContent = `${data.current_weather.temperature}°C`;
    document.getElementById('current-desc').textContent = `${weatherInfo.icon} ${weatherInfo.desc}`;
    document.getElementById('current-humidity').textContent = `${data.hourly.relativehumidity_2m[0]}%`;
    document.getElementById('current-wind').textContent = `${data.current_weather.windspeed} km/h`;

    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = ''; 

    for (let i = 0; i < 7; i++) {
        const date = new Date(data.daily.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const code = data.daily.weathercode[i];
        const icon = weatherCodes[code] ? weatherCodes[code].icon : '❓';
        const maxTemp = data.daily.temperature_2m_max[i];
        const minTemp = data.daily.temperature_2m_min[i];

        forecastContainer.innerHTML += `
            <div class="forecast-card">
                <h3>${dayName}</h3>
                <div style="font-size: 2rem; margin: 10px 0;">${icon}</div>
                <p style="margin: 5px 0;">H: ${maxTemp}°C</p>
                <p style="margin: 5px 0; color: #666;">L: ${minTemp}°C</p>
            </div>
        `;
    }
}

function showError(message) {
    let errorBanner = document.getElementById('error-banner');
    
    if (!errorBanner) {
        errorBanner = document.createElement('div');
        errorBanner.id = 'error-banner';
        
        Object.assign(errorBanner.style, {
            backgroundColor: '#ffdddd',
            color: '#d8000c',
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #f5c6cb'
        });
        
        const msgSpan = document.createElement('span');
        msgSpan.id = 'error-message';
        
        const retryBtn = document.createElement('button');
        retryBtn.id = 'retry-btn';
        retryBtn.textContent = 'Retry';
        Object.assign(retryBtn.style, {
            padding: '8px 16px',
            backgroundColor: '#d8000c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        });
        
        // Retry logic
        retryBtn.onclick = () => {
            const city = document.getElementById('city-input').value.trim();
            if(city) {
                hideError();
                fetchWeatherData(city);
            }
        };
        
        errorBanner.appendChild(msgSpan);
        errorBanner.appendChild(retryBtn);
        
        const container = document.querySelector('.container');
        container.insertBefore(errorBanner, container.firstChild);
    }
    
    document.getElementById('error-message').textContent = message;
    errorBanner.style.display = 'flex';
}

function hideError() {
    const errorBanner = document.getElementById('error-banner');
    if (errorBanner) {
        errorBanner.style.display = 'none';
    }
}

function fetchLocalTime(timezoneString) {
    if (!timezoneString) {
        displayFallbackTime();
        return;
    }

    $.getJSON(`https://worldtimeapi.org/api/timezone/${timezoneString}`)
        .done(function(data) {

            const localTime = new Date(data.datetime).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const timeEl = $('#local-time');
            timeEl.text(`Local Time: ${localTime}`);
            
            // Remove skeleton loading states
            timeEl.removeClass('skeleton skeleton-text');
            timeEl.css('width', ''); 
        })
        .fail(function() {
            displayFallbackTime();
        })
        .always(function() {
            console.log(`WorldTimeAPI request completed at: ${new Date().toISOString()}`);
        });
}

function displayFallbackTime() {
    const browserTime = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const timeEl = $('#local-time');
    timeEl.text(`Local Time: ${browserTime} (Browser fallback)`);
    
    timeEl.removeClass('skeleton skeleton-text');
    timeEl.css('width', '');
}