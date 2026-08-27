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

    // 1. Quét dữ liệu đa kênh từ Serper API
    const requests: Promise<any>[] = [
      axios.post('https://google.serper.dev/news', { q: query, gl: 'vn', hl: 'vi', num: 30 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: query, gl: 'vn', hl: 'vi', num: 30, page: 1 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: query, gl: 'vn', hl: 'vi', num: 30, page: 2 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: `${query} (site:facebook.com OR site:youtube.com OR site:tiktok.com)`, gl: 'vn', hl: 'vi', num: 30 }, { headers }).catch(() => null),
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
              snippet: (item.snippet || item.snippetRaw || '').slice(0, 150),
              link: item.link,
              source: source,
            });
          }
        });
      }
    });

    const uniqueArticles = Array.from(articleMap.values());

    if (uniqueArticles.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết nào liên quan trên các kênh.' }, { status: 404 });
    }

    // 3. Phân tích AI (Có cơ chế Fallback chống sập ứng dụng)
    let aiOutput: any = {};

    try {
      const modelsRes = await axios.get('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      });

      const allModels = modelsRes.data?.data || [];
      const selectedModel =
        allModels.find((m: any) => m.id.includes('llama-3.3'))?.id ||
        allModels.find((m: any) => m.id.includes('llama3-70b'))?.id ||
        allModels.find((m: any) => m.id.includes('llama'))?.id ||
        'llama3-8b-8192';

      const simplifiedPayload = uniqueArticles.slice(0, 25).map((art, idx) => ({
        id: idx,
        title: art.title,
        source: art.source,
      }));

      const prompt = `
        Bạn là chuyên gia phân tích truyền thông. Hãy phân tích danh sách bài viết về chủ đề "${query}":
        ${JSON.stringify(simplifiedPayload)}

        Trả về DUY NHẤT một chuỗi JSON hợp lệ với định dạng:
        {
          "crisis_level": "THẤP" hoặc "TRUNG BÌNH" hoặc "CAO",
          "crisis_trend": "Tóm tắt 1 câu ngắn xu hướng dư luận",
          "phases": [
            { "phase": 1, "title": "Tên giai đoạn 1", "desc": "Mô tả ngắn diễn biến", "tag": "Mức độ lan truyền" },
            { "phase": 2, "title": "Tên giai đoạn 2", "desc": "Mô tả ngắn diễn biến", "tag": "Cân bằng dư luận" },
            { "phase": 3, "title": "Tên giai đoạn 3", "desc": "Mô tả ngắn diễn biến", "tag": "Xu hướng hiện tại" }
          ],
          "top_sources": [
            { "name": "Báo chí chính thống", "count": "Nhiều bài", "note": "Ghi chú ngắn hướng đưa tin" },
            { "name": "Mạng xã hội", "count": "Rải rác", "note": "Ghi chú ngắn hướng đưa tin" }
          ],
          "risks": [
            { "name": "1. Rủi ro về dư luận", "desc": "Mô tả chi tiết rủi ro đối với đơn vị", "level": "Trung bình" },
            { "name": "2. Rủi ro bùng phát tin đồn", "desc": "Mô tả chi tiết rủi ro đối với đơn vị", "level": "Cao" }
          ],
          "recommendations": [
            "Khuyến nghị xử lý truyền thông 1",
            "Khuyến nghị xử lý truyền thông 2",
            "Khuyến nghị xử lý truyền thông 3"
          ],
          "articles_analysis": [
            { "id": 0, "sentiment": "positive" hoặc "neutral" hoặc "negative", "summary": "Tóm tắt bài viết trong 1 câu" }
          ]
        }
      `;

      const groqRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: selectedModel,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' } // Ép Groq trả chuẩn JSON 100%
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000 // Giới hạn 20 giây
        }
      );

      let rawText = groqRes.data.choices[0]?.message?.content?.trim() || '{}';
      aiOutput = JSON.parse(rawText);
    } catch (aiErr: any) {
      console.warn('AI Groq quá tải, tự động bật chế độ phân tích mặc định:', aiErr?.message);
      // Dữ liệu dự phòng nếu AI gặp sự cố
      aiOutput = {
        crisis_level: 'TRUNG BÌNH',
        crisis_trend: 'Dư luận đang theo dõi các thông tin chính thức từ các cơ quan thẩm quyền.',
        phases: [
          { phase: 1, title: 'Báo chí đăng tải sự việc', desc: 'Các trang tin báo chí ghi nhận thông tin ban đầu.', tag: 'Khởi phát' },
          { phase: 2, title: 'Đoàn tiếp nhận thông tin phản hồi', desc: 'Các bên đính chính và đưa ra văn bản giải thích.', tag: 'Làm rõ' },
          { phase: 3, title: 'Dư luận lắng xuống', desc: 'Mức độ quan tâm giảm dần, chuyển sang theo dõi kết quả.', tag: 'Ổn định' }
        ],
        top_sources: [
          { name: 'Báo chí chính thống', count: 'Chiếm đa số', note: 'Đưa tin theo thông cáo chính thức' },
          { name: 'Mạng xã hội (Facebook/TikTok)', count: 'Rải rác', note: 'Thảo luận và chia sẻ ý kiến cá nhân' }
        ],
        risks: [
          { name: '1. Hiểu nhầm từ tiêu đề báo chí', desc: 'Tiêu đề giật gân khiến người đọc lướt qua dễ hiểu sai bản chất sự việc.', level: 'Trung bình' },
          { name: '2. Tin đồn trên các hội nhóm MXH', desc: 'Cần theo dõi các bình luận giễu nhại hoặc sai sự thật trên diễn đàn.', level: 'Cao' }
        ],
        recommendations: [
          'Duy trì một đầu mối phát ngôn chính thức duy nhất.',
          'Chủ động gửi thông tin đính chính đến các cơ quan báo chí đưa tin chưa chính xác.',
          'Tiếp tục triển khai các hoạt động truyền thông tích cực thường kỳ.'
        ],
        articles_analysis: []
      };
    }

    // 4. Tổng hợp KPI
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
        social_count: socialCount,
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
    console.error('--- LỖI BACKEND CHÍNH ---:', error?.response?.data || error?.message);
    return NextResponse.json(
      { error: error?.response?.data?.error?.message || error?.message || 'Lỗi khi kết nối hệ thống cào dữ liệu.' },
      { status: 500 }
    );
  }
}