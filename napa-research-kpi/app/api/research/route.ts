import { NextResponse } from 'next/server';
import axios from 'axios';

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

    const headers = {
      'X-API-KEY': process.env.SERPER_API_KEY,
      'Content-Type': 'application/json',
    };

    // 1. Quét tin tức đa kênh
    const requests: Promise<any>[] = [
      axios.post('https://google.serper.dev/news', { q: query, gl: 'vn', hl: 'vi', num: 40 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: query, gl: 'vn', hl: 'vi', num: 40, page: 1 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: query, gl: 'vn', hl: 'vi', num: 40, page: 2 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: `${query} (site:facebook.com OR site:youtube.com OR site:tiktok.com)`, gl: 'vn', hl: 'vi', num: 40 }, { headers }).catch(() => null),
    ];

    const responses = await Promise.all(requests);

    // 2. Lọc trùng lặp bài viết
    const articleMap = new Map();
    responses.forEach((res) => {
      if (res?.data) {
        const items = [...(res.data.organic || []), ...(res.data.news || [])];
        items.forEach((item: any) => {
          if (item.link && !articleMap.has(item.link)) {
            let source = item.domain || item.source || 'Trang tin';
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
      return NextResponse.json({ error: 'Không tìm thấy bài viết nào liên quan.' }, { status: 404 });
    }

    // 3. Chọn model Groq AI
    const modelsRes = await axios.get('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    });

    const allModels = modelsRes.data?.data || [];
    const selectedModel =
      allModels.find((m: any) => m.id.includes('llama-3.3'))?.id ||
      allModels.find((m: any) => m.id.includes('llama'))?.id ||
      'llama3-8b-8192';

    const simplifiedPayload = uniqueArticles.slice(0, 35).map((art, idx) => ({
      id: idx,
      title: art.title,
      snippet: art.snippet,
      source: art.source,
    }));

    // 4. Prompt AI phân tích Báo cáo KPI toàn diện
    const prompt = `
      Bạn là chuyên gia phân tích truyền thông cho APAG.HCM. Hãy phân tích danh sách ${simplifiedPayload.length} bài viết thu thập được về từ khóa "${query}".

      Danh sách bài viết:
      ${JSON.stringify(simplifiedPayload)}

      Yêu cầu trả về DUY NHẤT một chuỗi JSON theo đúng định dạng:
      {
        "crisis_level": "THẤP" | "TRUNG BÌNH" | "CAO",
        "crisis_trend": "Tóm tắt 1 câu ngắn về xu hướng dư luận hiện tại",
        "social_count": 0,
        "phases": [
          { "phase": 1, "title": "Tên giai đoạn 1", "desc": "Mô tả ngắn diễn biến giai đoạn 1", "tag": "Mức độ lan truyền" },
          { "phase": 2, "title": "Tên giai đoạn 2", "desc": "Mô tả ngắn diễn biến giai đoạn 2", "tag": "Cân bằng dư luận" },
          { "phase": 3, "title": "Tên giai đoạn 3", "desc": "Mô tả ngắn diễn biến giai đoạn 3", "tag": "Xu hướng hiện tại" }
        ],
        "top_sources": [
          { "name": "Tên kênh/Báo nổi bật 1", "count": "3 bài", "note": "Ghi chú ngắn về hướng đưa tin" },
          { "name": "Tên kênh/Báo nổi bật 2", "count": "2 bài", "note": "Ghi chú ngắn về hướng đưa tin" },
          { "name": "Tên kênh/Báo nổi bật 3", "count": "1 bài", "note": "Ghi chú ngắn về hướng đưa tin" }
        ],
        "risks": [
          { "name": "1. Rủi ro / Thách thức 1", "desc": "Chi tiết rủi ro đối với đơn vị", "level": "Trung bình" },
          { "name": "2. Rủi ro / Thách thức 2", "desc": "Chi tiết rủi ro đối với đơn vị", "level": "Cao" },
          { "name": "3. Rủi ro / Thách thức 3", "desc": "Chi tiết rủi ro đối với đơn vị", "level": "Thấp" }
        ],
        "recommendations": [
          "Khuyến nghị xử lý truyền thông 1",
          "Khuyến nghị xử lý truyền thông 2",
          "Khuyến nghị xử lý truyền thông 3",
          "Khuyến nghị xử lý truyền thông 4"
        ],
        "articles_analysis": [
          { "id": 0, "sentiment": "positive" | "neutral" | "negative", "summary": "Tóm tắt bài viết trong 1 câu" }
        ]
      }
    `;

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

    const aiOutput = JSON.parse(rawText);
    const analysisMap = new Map((aiOutput.articles_analysis || []).map((a: any) => [a.id, a]));

    let posCount = 0, neuCount = 0, negCount = 0;
    let socialCount = 0;

    const enrichedArticles = uniqueArticles.map((art, idx) => {
      if (['Facebook', 'TikTok', 'YouTube'].includes(art.source)) socialCount++;

      const aiItem: any = analysisMap.get(idx) || {};
      const sentiment = ['positive', 'neutral', 'negative'].includes(aiItem.sentiment)
        ? aiItem.sentiment
        : 'neutral';

      if (sentiment === 'positive') posCount++;
      else if (sentiment === 'negative') negCount++;
      else neuCount++;

      return {
        ...art,
        sentiment,
        summary: aiItem.summary || art.snippet,
      };
    });

    return NextResponse.json({
      kpi_summary: {
        total_articles: enrichedArticles.length,
        social_count: socialCount || aiOutput.social_count || 0,
        sentiment_ratio: {
          positive: Math.round((posCount / enrichedArticles.length) * 100) || 0,
          neutral: Math.round((neuCount / enrichedArticles.length) * 100) || 0,
          negative: Math.round((negCount / enrichedArticles.length) * 100) || 0,
        },
        crisis_level: aiOutput.crisis_level || 'TRUNG BÌNH',
        crisis_trend: aiOutput.crisis_trend || 'Dư luận đang theo dõi các thông tin chính thức.',
      },
      phases: aiOutput.phases || [],
      top_sources: aiOutput.top_sources || [],
      risks: aiOutput.risks || [],
      recommendations: aiOutput.recommendations || [],
      articles: enrichedArticles,
    });
  } catch (error: any) {
    console.error('--- LỖI BACKEND ---:', error?.response?.data || error?.message);
    return NextResponse.json(
      { error: 'Lỗi khi AI phân tích dữ liệu. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}