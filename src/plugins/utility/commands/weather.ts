import { Command, CommandContext } from '../../../core/context.js';
import { WeatherService } from '../../../services/weather/weather.service.js';

export const weatherCommand: Command = {
  name: 'weather',
  aliases: ['thoitiet'],
  description: 'Tra cứu thông tin thời tiết các tỉnh thành',
  usage: '!weather <tên thành phố> (Ví dụ: !weather Hanoi)',
  category: 'utility',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const city = ctx.rawArgs.trim() || 'Hanoi';
    const weatherService: WeatherService = ctx.services?.weatherService || new WeatherService();

    try {
      const info = await weatherService.getWeather(city);
      const msg = [
        `🌤️ THỜI TIẾT TẠI: ${info.city.toUpperCase()}`,
        `───────────────────────`,
        `🌡️ Nhiệt độ: ${info.temperature}°C (Cảm giác: ${info.feelsLike}°C)`,
        `💧 Độ ẩm: ${info.humidity}%`,
        `🍃 Gió: ${info.windSpeed} m/s`,
        `☁️ Trạng thái: ${info.description}`,
      ].join('\n');

      await ctx.reply(msg);
    } catch (err: any) {
      await ctx.reply(`⚠️ ${err.message || 'Lỗi tra cứu thời tiết'}`);
    }
  },
};
