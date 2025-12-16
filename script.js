let position_pc;
let loadedForecasts = {};
let isFirst = true;
let data_weather;
const cities = {
    'Antananarivo': { lat: -18.91, lon: 47.54 },
    'Astana': { lat: 51.18, lon: 71.45 },
    'Brazilia': { lat: -15.47, lon: 47.52 },
    'Copenhagen': { lat: 55.68, lon: 12.57 },
    'Elabuga': { lat: 55.76, lon: 52.06 },
    'Gus-Khrustalny': { lat: 55.61, lon: 40.65 },
    'Kazan': { lat: 55.47, lon: 49.06 },
    'Lisbon': { lat: 38.72, lon: -9.13 },
    'London': { lat: 51.30, lon: -0.07 },
    'Madrid': { lat: 40.42, lon: -3.70 },
    'Minsk': { lat: 53.90, lon: 27.57 },
    'Moscow': { lat: 55.45, lon: 37.37 },
    'New-York': { lat: 40.43, lon: -73.59 },
    'Saint-Petersburg': { lat: 59.57, lon: 30.19 },
}
let user_cities = [];
let currentSelectedCity = null;

function main() {
    loadFromLocalStorage();
    initModalListeners();
    addListeners();
    
    if (currentSelectedCity === 'Current location' && position_pc) {
        setTimeout(() => geoWeather(), 100);
    }
    else if (currentSelectedCity && cities[currentSelectedCity]) {
        setTimeout(() => loadWeatherForCity(currentSelectedCity), 100);
    }
    else if (!currentSelectedCity) {
        getPosition();
    }
}

function initModalListeners() {
    const modal = document.querySelector('.city-modal');
    const input = modal.querySelector('.input-city');
    
    document.querySelector('.add-city-btn').addEventListener('click', function(event) {
        modal.style.display = 'flex';
        input.placeholder = 'Enter city...';
        input.focus();
        clearMessage();
        hideSuggestions();
        saveToLocalStorage();
    });

    input.addEventListener('input', function() {
        showSuggestions(this.value);
    });

    document.addEventListener('click', function(event) {
        if (!event.target.closest('.input-city') && 
            !event.target.closest('.suggestions-list')) {
            hideSuggestions();
        }
    });

    document.querySelector('.add-modal-btn').addEventListener('click', function(event) {
        const cityName = input.value.trim().toLowerCase();
        const cleanCity = cityName
            .toLowerCase()
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('-');

        const isAdded = addCityToList(cleanCity);
        if (isAdded === 'added') {
            user_cities.push(cleanCity);
            console.log(`Added ${cleanCity}`);
            input.value = '';
            showMessage('success', `City ${cleanCity} added successfully!`);
            addCityAside(cleanCity);
            hideSuggestions();
            saveToLocalStorage();
        }
        else if (isAdded === 'exists') {
            showMessage('exists', `City "${cleanCity}" is already in your list.`);
            console.log(`${cleanCity} already exists`);
        }
        else if (isAdded === 'not found') {
            showMessage('error', `City "${cleanCity}" not found.`);
            console.log(`${cleanCity} did not found`);
        }
    });

    document.querySelector('.cancel-modal-btn').addEventListener('click', function(event) {
        modal.style.display = 'none';
        input.value = '';
        clearMessage();
        hideSuggestions();
        saveToLocalStorage();
    });

    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            input.value = '';
            clearMessage();
            hideSuggestions();
            saveToLocalStorage();
        }
    });
}

function addCityToList(cityName) {
    const allKeys = Object.keys(cities);
    const cleanCityName = cityName.trim();
    
    if (user_cities.indexOf(cleanCityName) >= 0) {
        console.log(user_cities.indexOf(cleanCityName));
        return 'exists';
    }
    else if (allKeys.indexOf(cleanCityName) >= 0) {
        saveToLocalStorage();
        return 'added';
    }
    else {
        return 'not found';
    }
}

function addCityAside(cityName) {
    const lst = document.querySelector('.sidebar-list');
    
    const hasCurrentLocation = Array.from(lst.children).some(
        li => li.textContent === 'Current location'
    );
    
    if (!hasCurrentLocation) {
        const currentLocationItem = document.createElement('li');
        currentLocationItem.textContent = 'Current location';
        lst.insertBefore(currentLocationItem, lst.firstChild);
    }
    
    const cityExists = Array.from(lst.children).some(
        li => li.textContent === cityName
    );
    
    if (!cityExists) {
        const newCity = document.createElement('li');
        const cityContainer = document.createElement('div');
        cityContainer.className = 'city-container';
        const cityLabel = document.createElement('p');
        cityLabel.textContent = cityName;
        const cityDel = document.createElement('button');
        cityDel.className = 'city-del-btn';
        cityDel.textContent = 'x';
        cityContainer.appendChild(cityLabel);
        cityContainer.appendChild(cityDel);
        newCity.appendChild(cityContainer);
        lst.appendChild(newCity);
    }
}

function showMessage(type, text) {
    let message = document.querySelector('.modal-message');
    
    if (!message) {
        message = document.createElement('div');
        message.className = 'modal-message';
        modal.querySelector('.modal-content').appendChild(message);
    }
    
    message.textContent = text;
    message.className = `modal-message ${type}`;
    message.style.display = 'block';
}

function clearMessage() {
    const message = document.querySelector('.modal-message');
    if (message) {
        message.textContent = '';
        message.style.display = 'none';
        message.className = 'modal-message';
    }
}

function addListeners() {
    document.querySelector('.sidebar-list').addEventListener('click', function(event) {
        const li = event.target.closest('li');
        if (!li) return;
        
        if (event.target.classList.contains('city-del-btn') || event.target.closest('.city-del-btn')) {
            const cityLabel = li.querySelector('p');
            const cityName = cityLabel ? cityLabel.textContent : li.textContent;
            
            if (li.classList.contains('chosed')) {
                return;
            }
            
            if (cityName === 'Current location') return;
            
            const cityIndex = user_cities.indexOf(cityName);
            if (cityIndex !== -1) {
                user_cities.splice(cityIndex, 1);
            }
            
            li.remove();
            
            delete loadedForecasts[cityName];
            
            saveToLocalStorage();
            
            console.log(`Removed ${cityName}`);
            return;
        }
        
        const cityLabel = li.querySelector('p');
        const cityName = cityLabel ? cityLabel.textContent : li.textContent;
        
        const allItems = this.querySelectorAll('li');
        allItems.forEach(item => {
            item.classList.remove('chosed');
            const delBtn = item.querySelector('.city-del-btn');
            if (delBtn) {
                delBtn.style.display = 'inline-flex';
            }
        });
        
        li.classList.add('chosed');

        const btn = li.querySelector('.city-del-btn');
        if (btn) {
            btn.style.display = 'none';
        }
        
        currentSelectedCity = cityName;
        saveToLocalStorage();
        
        if (cityName === 'Current location') {
            if (position_pc) {
                geoWeather();
            }
            else {
                givePermissionMsg();
                getPosition();
            }
        }
        else {
            if (loadedForecasts[cityName]) {
                console.log(`Используем кэшированный прогноз для ${cityName}`);
                data_weather = loadedForecasts[cityName];
                showWeather();
            }
            else {
                loadWeatherForCity(cityName);
            }
        }
    });

    document.querySelector('.refresh-btn').addEventListener('click', function(event) {
        const city = document.querySelector('.sidebar-list .chosed');
        if (!city) return;
        
        const cityLabel = city.querySelector('p');
        const cityName = cityLabel ? cityLabel.textContent : city.textContent;
        if (cityName === 'Current location') {
            if (position_pc) {
                geoWeather('refresh');
            }
            else {
                givePermissionMsg();
                getPosition();
            }
        }
        else {
            loadWeatherForCity(cityName, 'refresh');
        }
    });
}

function givePermissionMsg() {
    const weatherContent = document.querySelector('.weather-content');
    const elementsToRemove = Array.from(weatherContent.children).filter(
        child => !child.classList.contains('refresh-btn') && !child.classList.contains('empty-state')
    );
    elementsToRemove.forEach(el => el.remove());
    
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    const textArea = document.createElement('p');
    textArea.textContent = 'Please, give the permission to see current location forecast';
    textArea.style.textAlign = 'center';
    weatherContent.appendChild(textArea);
}

function loadWeatherForCity(cityName, flag='no') {
    if (cities[cityName]) {
        const { lat, lon } = cities[cityName];
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=3`;
        getWeather(url, cityName, flag);
    }
}

function getPosition() {
    if (position_pc) {
        console.log('Координаты уже есть, используем их');
        geoWeather();
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            position_pc = position;
            saveToLocalStorage();
            geoWeather();
        },

        (error) => {
            console.error("Ошибка получения местоположения:", error.message);
            if (isFirst) {
                const modal = document.querySelector('.city-modal');
                const input = document.querySelector('.input-city');
                modal.style.display = 'flex';
                input.placeholder = 'Enter city...';
                input.focus();
                clearMessage();
                isFirst = false;
                saveToLocalStorage();
            }

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    console.error("Отказано в доступе к геолокации");
                    saveToLocalStorage();
                    break;
                case error.POSITION_UNAVAILABLE:
                    console.error("Информация о местоположении недоступна");
                    break;
                case error.TIMEOUT:
                    console.error("Время запроса истекло");
                    break;
                default:
                    console.error("Неизвестная ошибка");
            }
        }
    );
}

function geoWeather(flag='no') {
    if (!position_pc) {
        console.error('Нет данных о местоположении');
        givePermissionMsg();
        return;
    }

    const lat = position_pc.coords.latitude.toFixed(2);
    const lon = position_pc.coords.longitude.toFixed(2);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=3`;
    
    if (!currentSelectedCity || flag === 'refresh') {
        const allItems = document.querySelectorAll('li');
        allItems.forEach(li => {
            li.classList.remove('chosed');
            
            const delBtn = li.querySelector('.city-del-btn');
            if (delBtn) {
                delBtn.style.display = 'inline-flex';
            }
            
            const cityLabel = li.querySelector('p');
            const cityName = cityLabel ? cityLabel.textContent : li.textContent;
            
            if (cityName === 'Current location') {
                li.classList.add('chosed');
            }
        });
    }

    if (loadedForecasts['Current location'] && flag === 'no') {
        console.log('Используем кэшированный прогноз для Current location');
        data_weather = loadedForecasts['Current location'];
        showWeather();
    }
    else {
        getWeather(url, 'Current location', flag);
    }
    
    currentSelectedCity = 'Current location';
    saveToLocalStorage();
}

function getWeather(url, cityName = 'Current location', flag='no') {
    const weatherContent = document.querySelector('.weather-content');
    const elementsToRemove = Array.from(weatherContent.children).filter(
        child => !child.classList.contains('refresh-btn') && !child.classList.contains('empty-state')
    );
    elementsToRemove.forEach(el => el.remove());

    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    if (loadedForecasts[cityName] && flag === 'no') {
        console.log(`Используем сохраненный прогноз для ${cityName}`);
        data_weather = loadedForecasts[cityName];
        showWeather();
        return;
    }

    const textArea = document.createElement('p');
    textArea.textContent = `${cityName}'s forecast will be here right now...`;
    textArea.style.textAlign = 'center';
    weatherContent.appendChild(textArea);

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Данные для ${cityName}:`, data);
            
            data_weather = {
                ...data,
                cityName: cityName
            };

            loadedForecasts[cityName] = data_weather;
            console.log(`Сохранен прогноз для ${cityName} в loadedForecasts`);
            
            showWeather();
        })
        .catch(error => {
            console.error('Ошибка получения данных: ', error);
            showError();
        });
}

function showWeather() {
    if (!data_weather) return;
    
    const weatherContent = document.querySelector('.weather-content');    
    const elementsToRemove = Array.from(weatherContent.children).filter(
        child => !child.classList.contains('refresh-btn') && !child.classList.contains('empty-state')
    );
    elementsToRemove.forEach(el => el.remove());

    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    const hourlyForecast = data_weather.hourly.temperature_2m;
    const todayDegrees = hourlyForecast.slice(0, 24);
    const tomorrowDegrees = hourlyForecast.slice(24, 48);
    const afterTomorrowDegrees = hourlyForecast.slice(48, 72);

    const hourlyCodes = data_weather.hourly.weathercode;
    const todayCodes = hourlyCodes.slice(0, 24);
    const tomorrowCodes = hourlyCodes.slice(24, 48);
    const afterTomorrowCodes = hourlyCodes.slice(48, 72);

    const [todayMorningWeather, todayAfternoonWeather, todayEveningWeather] = threePartsDegrees(todayDegrees);
    const [tomorrowMorningWeather, tomorrowAfternoonWeather, tomorrowEveningWeather] = threePartsDegrees(tomorrowDegrees);
    const [afterTomorrowMorningWeather, afterTomorrowAfternoonWeather, afterTomorrowEveningWeather] = threePartsDegrees(afterTomorrowDegrees);

    const [todayMorningCode, todayAfternoonCode, todayEveningCode] = mostFrequent(todayCodes);
    const [tomorrowMorningCode, tomorrowAfternoonCode, tomorrowEveningCode] = mostFrequent(tomorrowCodes);
    const [afterTomorrowMorningCode, afterTomorrowAfternoonCode, afterTomorrowEveningCode] = mostFrequent(afterTomorrowCodes);

    const sunriseTimes = data_weather.daily.sunrise;
    const sunsetTimes = data_weather.daily.sunset;
    
    const cityHeader = document.createElement('h1');
    cityHeader.className = 'weather-city-name';
    cityHeader.textContent = data_weather.cityName;
    
    weatherContent.appendChild(cityHeader);

    const celsium = data_weather.hourly_units.temperature_2m;

    const days = [
        {
            date: 'Today',
            morningTemp: todayMorningWeather,
            afternoonTemp: todayAfternoonWeather,
            eveningTemp: todayEveningWeather,
            morningCode: todayMorningCode,
            afternoonCode: todayAfternoonCode,
            eveningCode: todayEveningCode,
            sunrise: sunriseTimes[0],
            sunset: sunsetTimes[0],
            celsium,
        },
        {
            date: 'Tomorrow',
            morningTemp: tomorrowMorningWeather,
            afternoonTemp: tomorrowAfternoonWeather,
            eveningTemp: tomorrowEveningWeather,
            morningCode: tomorrowMorningCode,
            afternoonCode: tomorrowAfternoonCode,
            eveningCode: tomorrowEveningCode,
            sunrise: sunriseTimes[1],
            sunset: sunsetTimes[1],
            celsium,
        },
        {
            date: 'Day after tomorrow',
            morningTemp: afterTomorrowMorningWeather,
            afternoonTemp: afterTomorrowAfternoonWeather,
            eveningTemp: afterTomorrowEveningWeather,
            morningCode: afterTomorrowMorningCode,
            afternoonCode: afterTomorrowAfternoonCode,
            eveningCode: afterTomorrowEveningCode,
            sunrise: sunriseTimes[2],
            sunset: sunsetTimes[2],
            celsium,
        }
    ];

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'weather-cards';

    days.forEach(dayData => {
        const dayCard = document.createElement('article');
        dayCard.className = 'weather-card';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'weather-card-header';

        const cardDate = document.createElement('h2');
        cardDate.className = 'weather-card-date';
        cardDate.textContent = dayData.date;

        cardHeader.appendChild(cardDate);

        const infoContainer = document.createElement('div');
        infoContainer.className = 'weather-card-content';

        const hourlyInfo = document.createElement('div');
        hourlyInfo.className = 'weather-hourly';

        const morningSection = document.createElement('div');
        morningSection.className = 'weather-time-section';

        const morningLabel = document.createElement('p');
        morningLabel.className = 'weather-time-label';
        morningLabel.textContent = 'Morning';

        const morningIcon = document.createElement('p');
        morningIcon.className = 'weather-time-icon';
        morningIcon.textContent = getWeatherIcon(dayData.morningCode);
        morningIcon.title = getWeatherDescription(dayData.morningCode);

        const morningTemp = document.createElement('p');
        morningTemp.className = 'weather-time-temp';
        morningTemp.textContent = `${dayData.morningTemp}${dayData.celsium}`;

        morningSection.appendChild(morningLabel);
        morningSection.appendChild(morningIcon);
        morningSection.appendChild(morningTemp);

        const afternoonSection = document.createElement('div');
        afternoonSection.className = 'weather-time-section';

        const afternoonLabel = document.createElement('p');
        afternoonLabel.className = 'weather-time-label';
        afternoonLabel.textContent = 'Afternoon';

        const afternoonIcon = document.createElement('p');
        afternoonIcon.className = 'weather-time-icon';
        afternoonIcon.textContent = getWeatherIcon(dayData.afternoonCode);
        afternoonIcon.title = getWeatherDescription(dayData.afternoonCode);

        const afternoonTemp = document.createElement('p');
        afternoonTemp.className = 'weather-time-temp';
        afternoonTemp.textContent = `${dayData.afternoonTemp}${dayData.celsium}`;

        afternoonSection.appendChild(afternoonLabel);
        afternoonSection.appendChild(afternoonIcon);
        afternoonSection.appendChild(afternoonTemp);

        const eveningSection = document.createElement('div');
        eveningSection.className = 'weather-time-section';

        const eveningLabel = document.createElement('p');
        eveningLabel.className = 'weather-time-label';
        eveningLabel.textContent = 'Evening';

        const eveningIcon = document.createElement('p');
        eveningIcon.className = 'weather-time-icon';
        eveningIcon.textContent = getWeatherIcon(dayData.eveningCode);
        eveningIcon.title = getWeatherDescription(dayData.eveningCode);

        const eveningTemp = document.createElement('p');
        eveningTemp.className = 'weather-time-temp';
        eveningTemp.textContent = `${dayData.eveningTemp}${dayData.celsium}`;

        eveningSection.appendChild(eveningLabel);
        eveningSection.appendChild(eveningIcon);
        eveningSection.appendChild(eveningTemp);

        hourlyInfo.appendChild(morningSection);
        hourlyInfo.appendChild(afternoonSection);
        hourlyInfo.appendChild(eveningSection);

        const sunInfo = document.createElement('div');
        sunInfo.className = 'weather-sun-info';

        const sunTimes = document.createElement('div');
        sunTimes.className = 'weather-sun-times';

        const sunriseDiv = document.createElement('div');
        sunriseDiv.className = 'weather-sun-time';

        const sunriseLabel = document.createElement('p');
        sunriseLabel.className = 'weather-sun-label';
        sunriseLabel.textContent = 'Sunrise';

        const sunriseValue = document.createElement('p');
        sunriseValue.className = 'weather-sun-value';
        sunriseValue.textContent = getTimeFromDateString(dayData.sunrise);

        sunriseDiv.appendChild(sunriseLabel);
        sunriseDiv.appendChild(sunriseValue);

        const sunsetDiv = document.createElement('div');
        sunsetDiv.className = 'weather-sun-time';

        const sunsetLabel = document.createElement('p');
        sunsetLabel.className = 'weather-sun-label';
        sunsetLabel.textContent = 'Sunset';

        const sunsetValue = document.createElement('p');
        sunsetValue.className = 'weather-sun-value';
        sunsetValue.textContent = getTimeFromDateString(dayData.sunset);

        sunsetDiv.appendChild(sunsetLabel);
        sunsetDiv.appendChild(sunsetValue);

        sunTimes.appendChild(sunriseDiv);
        sunTimes.appendChild(sunsetDiv);

        const daylightDiv = document.createElement('div');
        daylightDiv.className = 'weather-daylight';
        daylightDiv.textContent = `Daylight: ${calculateDaylight(dayData.sunrise, dayData.sunset)}`;

        sunInfo.appendChild(sunTimes);
        sunInfo.appendChild(daylightDiv);

        infoContainer.appendChild(hourlyInfo);
        infoContainer.appendChild(sunInfo);

        dayCard.appendChild(cardHeader);
        dayCard.appendChild(infoContainer);

        cardsContainer.appendChild(dayCard);
    });

    weatherContent.appendChild(cardsContainer);
}

function getTimeFromDateString(dateString) {
    return dateString.slice(-5);
}

// 0	Clear sky
// 1, 2, 3	Mainly clear, partly cloudy, and overcast
// 45, 48	Fog and depositing rime fog
// 51, 53, 55	Drizzle: Light, moderate, and dense intensity
// 56, 57	Freezing Drizzle: Light and dense intensity
// 61, 63, 65	Rain: Slight, moderate and heavy intensity
// 66, 67	Freezing Rain: Light and heavy intensity
// 71, 73, 75	Snow fall: Slight, moderate, and heavy intensity
// 77	Snow grains
// 80, 81, 82	Rain showers: Slight, moderate, and violent
// 85, 86	Snow showers slight and heavy
// 95 *	Thunderstorm: Slight or moderate
// 96, 99 *	Thunderstorm with slight and heavy hail

function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code >= 1 && code <= 3) return '⛅';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 99) return '⛈️';
}

function getWeatherDescription(code) {
    if (code === 0) return 'Clear sky';
    if (code >= 1 && code <= 3) return 'Partly cloudy';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 77) return 'Snowy';
    if (code >= 80 && code <= 99) return 'Stormy';
};

function calculateDaylight(sunrise, sunset) {
    const sunriseTime = new Date(sunrise);
    const sunsetTime = new Date(sunset);
    const dayLengthMs = sunsetTime - sunriseTime;
    const dayLengthHours = Math.floor(dayLengthMs / (1000 * 60 * 60));
    const dayLengthMinutes = Math.floor((dayLengthMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${dayLengthHours}h ${dayLengthMinutes}min`;
}

function threePartsDegrees(degrees) {
    const morning = degrees.slice(0, 8);
    const afternoon = degrees.slice(8, 16);
    const evening = degrees.slice(16, 24);

    let morningMean = 0;
    morning.forEach(num => { morningMean += num });
    morningMean = Math.round(morningMean / 8);

    let afternoonMean = 0;
    afternoon.forEach(num => { afternoonMean += num });
    afternoonMean = Math.round(afternoonMean / 8);

    let eveningMean = 0;
    evening.forEach(num => { eveningMean += num });
    eveningMean = Math.round(eveningMean / 8);

    return [morningMean, afternoonMean, eveningMean];
}

function mostFrequent(arr) {
    const morning = arr.slice(0, 8);
    const afternoon = arr.slice(8, 16);
    const evening = arr.slice(16, 24);

    let m1 = {};
    let maxCount1 = 0;
    let morningCode = null;

    for (let x of morning) {
        m1[x] = (m1[x] || 0) + 1;

        if (m1[x] > maxCount1) {
            maxCount1 = m1[x];
            morningCode = x;
        }
    }

    let m2 = {};
    let maxCount2 = 0;
    let afternoonCode = null;

    for (let x of afternoon) {
        m2[x] = (m2[x] || 0) + 1;

        if (m2[x] > maxCount2) {
            maxCount2 = m2[x];
            afternoonCode = x;
        }
    }

    let m3 = {};
    let maxCount3 = 0;
    let eveningCode = null;

    for (let x of evening) {
        m3[x] = (m3[x] || 0) + 1;

        if (m3[x] > maxCount3) {
            maxCount3 = m3[x];
            eveningCode = x;
        }
    }

    return [morningCode, afternoonCode, eveningCode];
}

function showSuggestions(searchText) {
    const suggestionsList = document.querySelector('.suggestions-list');
    
    suggestionsList.innerHTML = '';
    
    if (!searchText || searchText.length < 1) {
        suggestionsList.style.display = 'none';
        return;
    }
    
    const lowerSearch = searchText.toLowerCase();
    const allCities = Object.keys(cities);
    
    const matchingCities = allCities.filter(city => 
        city.toLowerCase().includes(lowerSearch)
    );
    
    if (matchingCities.length === 0) {
        suggestionsList.style.display = 'none';
        return;
    }
    
    matchingCities.slice(0, 5).forEach(city => {
        const suggestionItem = document.createElement('div');
        suggestionItem.textContent = city;
        suggestionItem.style.padding = '5px 10px';
        suggestionItem.style.cursor = 'pointer';
        suggestionItem.style.borderBottom = '1px solid #eee';
        
        suggestionItem.addEventListener('click', function() {
            document.querySelector('.input-city').value = city;
            suggestionsList.style.display = 'none';
        });
        
        suggestionItem.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#f0f0f0';
        });
        
        suggestionItem.addEventListener('mouseout', function() {
            this.style.backgroundColor = '';
        });
        
        suggestionsList.appendChild(suggestionItem);
    });
    
    suggestionsList.style.display = 'block';
}

function hideSuggestions() {
    document.querySelector('.suggestions-list').style.display = 'none';
}

function showError() {
    const weatherContent = document.querySelector('.weather-content');
    
    const elementsToRemove = Array.from(weatherContent.children).filter(
        child => !child.classList.contains('refresh-btn')
    );
    elementsToRemove.forEach(el => el.remove());
    
    const errorText = document.createElement('p');
    errorText.textContent = `Error: Failed to get weather in this place`;
    errorText.className = 'error-text';
    
    weatherContent.appendChild(errorText);
}

function saveToLocalStorage() {
    try {
        const modal = document.querySelector('.city-modal');
        const input = document.querySelector('.input-city');
        
        const dataToSave = {
            user_cities: user_cities,
            currentSelectedCity: currentSelectedCity,
            latitude: position_pc ? position_pc.coords.latitude : null,
            longitude: position_pc ? position_pc.coords.longitude : null,
            modalOpen: modal.style.display === 'flex',
            inputValue: input ? input.value : '',
        };
        localStorage.setItem('weatherAppData', JSON.stringify(dataToSave));
    }
    catch (e) {
        console.error('Ошибка сохранения в localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('weatherAppData');
        if (savedData) {
            const data = JSON.parse(savedData);

            if (data.user_cities && Array.isArray(data.user_cities)) {
                user_cities = data.user_cities;
                data.user_cities.forEach(city => addCityAside(city));
            }
            
            if (data.currentSelectedCity) {
                currentSelectedCity = data.currentSelectedCity;
            }
            
            if (data.latitude && data.longitude) {
                position_pc = {
                    coords: {
                        latitude: data.latitude,
                        longitude: data.longitude
                    }
                };
            }
            
            console.log('Данные загружены из localStorage');

            setTimeout(() => {
                if (currentSelectedCity) {
                    const allItems = document.querySelectorAll('.sidebar-list li');
                    allItems.forEach(li => {
                        const cityLabel = li.querySelector('p');
                        const cityName = cityLabel ? cityLabel.textContent : li.textContent;
                        
                        if (cityName === currentSelectedCity) {
                            li.classList.add('chosed');
                            const delBtn = li.querySelector('.city-del-btn');
                            if (delBtn) {
                                delBtn.style.display = 'none';
                            }
                        }
                        else {
                            const delBtn = li.querySelector('.city-del-btn');
                            if (delBtn) {
                                delBtn.style.display = 'inline-flex';
                            }
                        }
                    });
                }
                
                if (data.modalOpen) {
                    const modal = document.querySelector('.city-modal');
                    const input = document.querySelector('.input-city');
                    
                    if (modal && input) {
                        modal.style.display = 'flex';
                        if (data.inputValue) {
                            input.value = data.inputValue;
                            showSuggestions(data.inputValue);
                        }
                        input.focus();
                    }
                }
            }, 100);
        }
        else {
            console.log('Нет сохраненных данных в localStorage');
        }
    }
    catch (e) {
        console.error('Ошибка загрузки из localStorage:', e);
    }
}

document.addEventListener('DOMContentLoaded', main);
