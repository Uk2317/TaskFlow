import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export type WeatherPayload = {
  temp: number;
  description: string;
  icon: string | null;
  cityName: string;
};

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly cache = new Map<string, { at: number; data: WeatherPayload }>();
  private readonly ttl = 10 * 60 * 1000;

  constructor(private readonly config: ConfigService) {}

  async getByCity(city?: string): Promise<WeatherPayload | null> {
    if (!city) return null;
    const key = city.toLowerCase();
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < this.ttl) return hit.data;

    try {
      const data = await this.fromOpenWeather(city);
      if (data) this.cache.set(key, { at: Date.now(), data });
      return data;
    } catch (err) {
      this.logger.warn(`Weather failed for ${city}: ${(err as Error).message}`);
      return null;
    }
  }

  cached(city?: string): WeatherPayload | null {
    if (!city) return null;
    return this.cache.get(city.toLowerCase())?.data || null;
  }

  private async fromOpenWeather(city: string): Promise<WeatherPayload | null> {
    const apiKey = this.config.get<string>('OPENWEATHER_API_KEY');
    if (!apiKey) return null;
    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { q: city, appid: apiKey, units: 'metric' },
      timeout: 5000,
    });
    return {
      temp: Math.round(data.main.temp),
      description: (data.weather[0]?.description || '').trim(),
      icon: data.weather[0]?.icon || null,
      cityName: data.name,
    };
  }
}
