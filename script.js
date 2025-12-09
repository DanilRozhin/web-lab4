let position_pc;

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
    const lat = position_pc.coords.latitude.toFixed(2);
    const lon = position_pc.coords.longitude.toFixed(2);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Данные от API:', data);
            const empty = document.querySelector('.empty-state');
            if (empty) {
                empty.style.display = 'none';
            }
            const curLoc = document.querySelector('.sidebar-list li');
            if (curLoc && curLoc.textContent.includes('Current location')) {
                curLoc.classList.add('chosed');
            }
        })
        .catch(error => {
            console.error('Ошибка получения данных: ', error);
        });
}

document.addEventListener('DOMContentLoaded', getPosition);
