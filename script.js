let position_pc;
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

function main() {
    addListeners();
    getPosition();
}

function addListeners() {
    document.querySelector('.sidebar-list').addEventListener('click', function(event) {
        if (event.target.tagName === 'LI') {
            const cityName = event.target.textContent;
            
            const allItems = this.querySelectorAll('li');
            allItems.forEach(li => li.classList.remove('chosed'));
            
            event.target.classList.add('chosed');
            
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
                loadWeatherForCity(cityName);
            }
        }
    });
}

function givePermissionMsg() {
    const weatherContent = document.querySelector('.weather-content');
    weatherContent.innerHTML = '';

    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    const textArea = document.createElement('p');
    textArea.textContent = 'Please, give the permission to see current location forecast';
    weatherContent.appendChild(textArea);
}

function loadWeatherForCity(cityName) {
    if (cities[cityName]) {
        const { lat, lon } = cities[cityName];
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        getWeather(url, cityName);
    }
}

function getPosition() {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            position_pc = position;
            geoWeather();
        },

        (error) => {
            console.error("Ошибка получения местоположения:", error.message);

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    console.error("Отказано в доступе к геолокации");
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

function geoWeather() {
    if (!position_pc) {
        console.error('Нет данных о местоположении');
        return;
    }

    const lat = position_pc.coords.latitude.toFixed(2);
    const lon = position_pc.coords.longitude.toFixed(2);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    
    const allItems = document.querySelectorAll('li');
    allItems.forEach(li => {
        li.classList.remove('chosed');
        
        if (li.textContent === 'Current location') {
            li.classList.add('chosed');
        }
    });

    getWeather(url, 'Current location');
}

function getWeather(url, cityName = 'Current location') {
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
            
            showWeather();
        })
        .catch(error => {
            console.error('Ошибка получения данных: ', error);
        });
}

function showWeather() {
    const weatherContent = document.querySelector('.weather-content');
    weatherContent.innerHTML = '';

    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    const textArea = document.createElement('p');
    textArea.textContent = `${data_weather.current_weather.temperature}
        ${data_weather.current_weather_units.temperature}, 
        ${data_weather.latitude}, ${data_weather.longitude}`;
    weatherContent.appendChild(textArea);
}

document.addEventListener('DOMContentLoaded', main);
