import { AIProvider, ChatRequest, ChatResponse } from './ai.interface.js';

export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const lastUserMessage = request.messages.filter((m) => m.role === 'user').pop();
    const prompt = lastUserMessage ? lastUserMessage.content : '';

    return {
      content: `[AI Bot]: Tôi đã nhận được tin nhắn của bạn: "${prompt}". Đây là câu trả lời thông minh từ mô hình AI!`,
      provider: 'mock',
      model: 'mock-gpt',
    };
  }
}

export class GeminiAIProvider implements AIProvider {
  readonly name = 'gemini';

  constructor(
    private apiKey: string,
    private model: string = 'gemini-1.5-flash'
  ) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const contents = request.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (HTTP ${res.status}): ${errText}`);
    }

    const data = (await res.json()) as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi';

    return {
      content: text,
      provider: 'gemini',
      model: this.model,
    };
  }
}
