let position_pc;

navigator.geolocation.getCurrentPosition(
    (position) => {
        position_pc = position;

        const lat = position_pc.coords.latitude.toFixed(2);
        const lon = position_pc.coords.longitude.toFixed(2);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        console.log(url);

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Данные от API:', data);
            })
            .catch(error => {
                console.error('Ошибка при запросе:', error);
            });

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
