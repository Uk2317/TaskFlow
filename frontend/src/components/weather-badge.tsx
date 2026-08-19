'use client';

import { useEffect, useState } from 'react';
import { CloudSun } from 'lucide-react';
import { taskAPI, Weather } from '@/lib/api';

export function WeatherBadge({ weather: initial, location }: { weather?: Weather | null; location?: string }) {
  const [weather, setWeather] = useState<Weather | null>(initial || null);

  useEffect(() => {
    setWeather(initial || null);
  }, [initial]);

  useEffect(() => {
    if (initial || !location) return;
    let cancelled = false;
    taskAPI
      .weather(location)
      .then((res) => {
        if (!cancelled) setWeather(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initial, location]);

  if (!weather) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
      {weather.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`https://openweathermap.org/img/wn/${weather.icon}.png`} alt="" className="h-4 w-4" />
      ) : (
        <CloudSun className="h-3.5 w-3.5" />
      )}
      <span className="capitalize">
        {weather.temp}°C, {weather.description}
      </span>
    </span>
  );
}
