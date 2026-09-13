export interface WeatherInfo {
  city: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  windSpeed: number;
}

export class WeatherService {
  constructor(private apiKey?: string) {}

  async getWeather(city: string): Promise<WeatherInfo> {
    if (!city || city.trim().length === 0) {
      throw new Error('Tên thành phố không được để trống');
    }

    // If no API key is provided, return realistic fallback demo data
    if (!this.apiKey) {
      return {
        city: city.trim(),
        temperature: 28,
        feelsLike: 31,
        humidity: 75,
        description: 'Mây rải rác, có nắng nhẹ (Demo)',
        windSpeed: 3.5,
      };
    }

    const encodedCity = encodeURIComponent(city.trim());
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&units=metric&lang=vi&appid=${this.apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Không tìm thấy thông tin thời tiết cho thành phố: '${city}'`);
        }
        throw new Error(`Lỗi kết nối thời tiết: HTTP ${res.status}`);
      }

      const data = (await res.json()) as any;
      return {
        city: data.name,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: data.weather[0]?.description || 'Bình thường',
        windSpeed: data.wind.speed,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
