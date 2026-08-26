import { NextResponse } from 'next/server';
import axios from 'axios';

// Hàm chia nhỏ mảng để gửi AI phân tích theo lô (tránh quá tải token)
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Từ khóa không được để trống' }, { status: 400 });
    }

    if (!process.env.SERPER_API_KEY || !process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Thiếu SERPER_API_KEY hoặc GROQ_API_KEY trong file .env.local' },
        { status: 500 }
      );
    }

    const mainKeyword = query.split(/[\n;,]/)[0].trim() || 'PennSchool';
    const headers = {
      'X-API-KEY': process.env.SERPER_API_KEY,
      'Content-Type': 'application/json',
    };

    // 1. TẠO HỆ THỐNG TRUY VẤN ĐA TRANG & ĐA KÊNH (Tối đa bài viết)
    const requests: Promise<any>[] = [];

    // Quét Google News (Trang 1 & 2)
    [1, 2].forEach((page) => {
      requests.push(
        axios.post('https://google.serper.dev/news', { q: mainKeyword, gl: 'vn', hl: 'vi', num: 40, page }, { headers }).catch(() => null)
      );
    });

    // Quét Google Search Organic (Trang 1 đến Trang 5)
    [1, 2, 3, 4, 5].forEach((page) => {
      requests.push(
        axios.post('https://google.serper.dev/search', { q: mainKeyword, gl: 'vn', hl: 'vi', num: 40, page }, { headers }).catch(() => null)
      );
    });

    // Quét Từ khóa sự kiện mở rộng (Trang 1 đến Trang 3)
    [1, 2, 3].forEach((page) => {
      requests.push(
        axios.post('https://google.serper.dev/search', { q: `${mainKeyword} "thu hồi mặt bằng" OR "đóng cửa" OR "Sông Dương"`, gl: 'vn', hl: 'vi', num: 40, page }, { headers }).catch(() => null)
      );
      requests.push(
        axios.post('https://google.serper.dev/search', { q: `${mainKeyword} (site:facebook.com OR site:youtube.com OR site:tiktok.com)`, gl: 'vn', hl: 'vi', num: 40, page }, { headers }).catch(() => null)
      );
    });

    // Bật tất cả luồng cào dữ liệu đồng thời
    const responses = await Promise.all(requests);

    // 2. GOM DỮ LIỆU & LỌC TRÙNG THEO URL
    const articleMap = new Map();

    responses.forEach((res) => {
      if (res?.data) {
        const items = [...(res.data.organic || []), ...(res.data.news || [])];
        items.forEach((item: any) => {
          if (item.link && !articleMap.has(item.link)) {
            let source = item.domain || item.source || item.link;
            if (item.link.includes('facebook.com')) source = 'Facebook';
            else if (item.link.includes('tiktok.com')) source = 'TikTok';
            else if (item.link.includes('youtube.com')) source = 'YouTube';

            articleMap.set(item.link, {
              title: item.title,
              snippet: item.snippet || item.snippetRaw || '',
              link: item.link,
              source: source,
            });
          }
        });
      }
    });

    const uniqueArticles = Array.from(articleMap.values());

    if (uniqueArticles.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết nào.' }, { status: 404 });
    }

    // 3. CHỌN MÔ HÌNH TEXT CHAT TRÊN GROQ
    const modelsRes = await axios.get('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    });

    const allModels = modelsRes.data?.data || [];
    const chatModels = allModels.filter((m: any) => {
      const id = m.id.toLowerCase();
      return !id.includes('whisper') && !id.includes('guard') && !id.includes('vision');
    });

    const selectedModel =
      chatModels.find((m: any) => m.id.includes('llama-3.3'))?.id ||
      chatModels.find((m: any) => m.id.includes('llama'))?.id ||
      chatModels[0]?.id;

    // 4. BATCHING AI PROCESSING: Đánh giá song song các mảng dữ liệu lớn
    const chunks = chunkArray(uniqueArticles, 30); // Cứ 30 bài 1 gói AI
    const aiPromises = chunks.map(async (chunkArticles, chunkIndex) => {
      const simplified = chunkArticles.map((art, idx) => ({
        id: chunkIndex * 30 + idx,
        title: art.title,
        snippet: art.snippet,
      }));

      const prompt = `
        Phân tích sắc thái ${simplified.length} bài viết về "${mainKeyword}":
        ${JSON.stringify(simplified)}

        Trả về DUY NHẤT chuỗi JSON:
        {
          "analysis": [
            { "id": ${chunkIndex * 30}, "sentiment": "negative", "summary": "Tóm tắt ngắn 1 câu" }
          ]
        }
        Lưu ý: "sentiment" chỉ chọn 1 trong 3 giá trị: "positive", "neutral", "negative".
      `;

      try {
        const groqRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: selectedModel,
            messages: [{ role: 'user', content: prompt }],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        let rawText = groqRes.data.choices[0].message.content.trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) rawText = jsonMatch[0];
        return JSON.parse(rawText)?.analysis || [];
      } catch (err) {
        console.warn(`Lỗi phân tích gói ${chunkIndex}:`, err);
        return [];
      }
    });

    const aiResultsArrays = await Promise.all(aiPromises);
    const allAnalysis = aiResultsArrays.flat();
    const analysisMap = new Map(allAnalysis.map((a: any) => [a.id, a]));

    // 5. TỔNG HỢP KPI & KẾT QUẢ CUỐI CÙNG
    let posCount = 0, neuCount = 0, negCount = 0;

    const enrichedArticles = uniqueArticles.map((art, idx) => {
      const aiItem: any = analysisMap.get(idx) || {};
      const sentiment = ['positive', 'neutral', 'negative'].includes(aiItem.sentiment)
        ? aiItem.sentiment
        : 'negative';

      if (sentiment === 'positive') posCount++;
      else if (sentiment === 'negative') negCount++;
      else neuCount++;

      return {
        ...art,
        sentiment,
        summary: aiItem.summary || art.snippet,
      };
    });

    const total = enrichedArticles.length;

    return NextResponse.json({
      kpi_summary: {
        total_articles: total,
        sentiment_ratio: {
          positive: Math.round((posCount / total) * 100) || 0,
          neutral: Math.round((neuCount / total) * 100) || 0,
          negative: Math.round((negCount / total) * 100) || 0,
        },
        top_keywords: ['#PennSchool', '#ThuHoiMatBang', '#DongCuaTruong', '#SongDuong'],
      },
      articles: enrichedArticles,
    });
  } catch (error: any) {
    console.error('--- LỖI BACKEND ---:', error?.response?.data || error?.message);
    return NextResponse.json(
      { error: error?.response?.data?.error?.message || error?.message || 'Lỗi xử lý dữ liệu ở Backend.' },
      { status: 500 }
    );
  }
}