import axios from "axios";

export default class WeatherTool {

    getDefinition() {
        return {
            name: "weather",
            description: "Get current weather of a city.",
            parameters: {
                type: "OBJECT",
                properties: {
                    city: {
                        type: "STRING"
                    }
                },
                required: ["city"]
            }
        };
    }

    async execute(city) {

        const apiKey = process.env.OPENWEATHER_API_KEY;

        const url =
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        const response = await axios.get(url);

        return {
            city: response.data.name,
            temperature: response.data.main.temp,
            humidity: response.data.main.humidity,
            description: response.data.weather[0].description
        };

    }

}