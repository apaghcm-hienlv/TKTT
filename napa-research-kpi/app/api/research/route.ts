import { NextResponse } from 'next/server';
import axios from 'axios';

// Hàm chuẩn hóa URL để lọc trùng lặp chính xác
function cleanUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`.toLowerCase().replace(/\/$/, '');
  } catch {
    return url.split('?')[0].toLowerCase().replace(/\/$/, '');
  }
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

    const mainKeyword = query.split(/[\n;,]/)[0].trim();
    const headers = {
      'X-API-KEY': process.env.SERPER_API_KEY,
      'Content-Type': 'application/json',
    };

    // 1. TẠO HỆ THỐNG MANG LƯỚI QUÉT DỮ LIỆU RỘNG NHẤT (TỐI ĐA BÀI VIẾT)
    const requests: Promise<any>[] = [
      // Quét tin tức Google News (Trang 1 & 2 - tối đa 100 tin/trang)
      axios.post('https://google.serper.dev/news', { q: mainKeyword, gl: 'vn', hl: 'vi', num: 100, page: 1 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/news', { q: mainKeyword, gl: 'vn', hl: 'vi', num: 100, page: 2 }, { headers }).catch(() => null),

      // Quét Google Search Organic (Trang 1, 2, 3 - tối đa 100 kết quả/trang)
      axios.post('https://google.serper.dev/search', { q: mainKeyword, gl: 'vn', hl: 'vi', num: 100, page: 1 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: mainKeyword, gl: 'vn', hl: 'vi', num: 100, page: 2 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: mainKeyword, gl: 'vn', hl: 'vi', num: 100, page: 3 }, { headers }).catch(() => null),

      // Quét biến thể từ khóa liên quan
      axios.post('https://google.serper.dev/search', { q: `"${mainKeyword}" "vụ việc" OR "mới nhất" OR "diễn biến" OR "báo cáo"`, gl: 'vn', hl: 'vi', num: 100 }, { headers }).catch(() => null),

      // Quét Mạng xã hội & Diễn đàn thảo luận
      axios.post('https://google.serper.dev/search', { q: `"${mainKeyword}" (site:facebook.com OR site:youtube.com OR site:tiktok.com OR site:threads.net)`, gl: 'vn', hl: 'vi', num: 100, page: 1 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: `"${mainKeyword}" (site:facebook.com OR site:youtube.com OR site:tiktok.com OR site:threads.net)`, gl: 'vn', hl: 'vi', num: 100, page: 2 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: `"${mainKeyword}" (site:voz.vn OR site:tinhte.vn OR site:webtretho.com)`, gl: 'vn', hl: 'vi', num: 100 }, { headers }).catch(() => null),
    ];

    const responses = await Promise.all(requests);

    // 2. TỔNG HỢP & LỌC TRÙNG LẶP THEO CANONICAL URL
    const articleMap = new Map();

    responses.forEach((res) => {
      if (res?.data) {
        const items = [...(res.data.organic || []), ...(res.data.news || [])];
        items.forEach((item: any) => {
          if (item.link) {
            const cleanedLink = cleanUrl(item.link);
            if (!articleMap.has(cleanedLink)) {
              let source = item.domain || item.source || 'Trang tin';
              const lowerLink = item.link.toLowerCase();

              if (lowerLink.includes('facebook.com')) source = 'Facebook';
              else if (lowerLink.includes('tiktok.com')) source = 'TikTok';
              else if (lowerLink.includes('youtube.com')) source = 'YouTube';
              else if (lowerLink.includes('threads.net')) source = 'Threads';
              else if (lowerLink.includes('voz.vn')) source = 'Diễn đàn VOZ';
              else if (lowerLink.includes('tinhte.vn')) source = 'Tinh tế';

              articleMap.set(cleanedLink, {
                title: item.title,
                snippet: (item.snippet || item.snippetRaw || '').slice(0, 180),
                link: item.link,
                source: source,
              });
            }
          }
        });
      }
    });

    const uniqueArticles = Array.from(articleMap.values());

    if (uniqueArticles.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết nào liên quan trên các kênh.' }, { status: 404 });
    }

    // 3. GỌI GROQ AI PHÂN TÍCH CHUYÊN SÂU
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

      // Trích xuất mẫu 35 bài viết tiêu biểu để gửi AI (tránh vượt giới hạn token)
      const sampleArticles = uniqueArticles.slice(0, 35).map((art, idx) => ({
        id: idx,
        title: art.title,
        source: art.source,
      }));

      const prompt = `
        Bạn là chuyên gia giám sát truyền thông cho APAG.HCM. Hãy phân tích tổng quan ${uniqueArticles.length} bài viết thu thập được (dưới đây là mẫu đại diện 35 bài) về từ khóa "${mainKeyword}":
        ${JSON.stringify(sampleArticles)}

        Trả về DUY NHẤT một chuỗi JSON hợp lệ theo đúng cấu trúc:
        {
          "crisis_level": "THẤP" hoặc "TRUNG BÌNH" hoặc "CAO",
          "crisis_trend": "Mô tả 1 câu về xu hướng dư luận nổi bật nhất",
          "phases": [
            { "phase": 1, "title": "Tên giai đoạn 1", "desc": "Mô tả diễn biến ngắn", "tag": "Khởi phát" },
            { "phase": 2, "title": "Tên giai đoạn 2", "desc": "Mô tả diễn biến ngắn", "tag": "Lan truyền" },
            { "phase": 3, "title": "Tên giai đoạn 3", "desc": "Mô tả diễn biến ngắn", "tag": "Hiện tại" }
          ],
          "top_sources": [
            { "name": "Báo chí chính thống", "count": "Chiếm ưu thế", "note": "Hầu hết đưa tin theo thông cáo chính thức" },
            { "name": "Facebook & Mạng xã hội", "count": "Nhiều thảo luận", "note": "Ghi nhận nhiều ý kiến và chia sẻ từ phụ huynh/công chúng" }
          ],
          "risks": [
            { "name": "1. Rủi ro về dư luận tiêu cực", "desc": "Mô tả chi tiết tác động uy tín", "level": "Trung bình" },
            { "name": "2. Rủi ro giật gân từ tiêu đề báo chí", "desc": "Mô tả chi tiết tác động uy tín", "level": "Cao" }
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
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        }
      );

      let rawText = groqRes.data.choices[0]?.message?.content?.trim() || '{}';
      aiOutput = JSON.parse(rawText);
    } catch (aiErr: any) {
      console.warn('AI gặp sự cố, kích hoạt chế độ phân tích mặc định:', aiErr?.message);
      aiOutput = {
        crisis_level: 'TRUNG BÌNH',
        crisis_trend: 'Dư luận đang theo dõi thông tin từ các cơ quan chức năng.',
        phases: [
          { phase: 1, title: 'Thông tin đăng tải ban đầu', desc: 'Các trang tin báo chí ghi nhận sự việc.', tag: 'Bắt đầu' },
          { phase: 2, title: 'Phản hồi chính thức', desc: 'Cung cấp dữ kiện đính chính và giải thích pháp lý.', tag: 'Làm rõ' },
          { phase: 3, title: 'Dư luận dịch chuyển', desc: 'Trọng tâm chuyển sang trách nhiệm của các bên liên quan.', tag: 'Ổn định' }
        ],
        top_sources: [
          { name: 'Báo chí chính thống', count: 'Tập trung lớn', note: 'Đưa tin phản ánh diễn biến' },
          { name: 'Mạng xã hội', count: 'Tương tác cao', note: 'Nhiều bình luận chia sẻ' }
        ],
        risks: [
          { name: '1. Rủi ro truyền thông lướt', desc: 'Độc giả chỉ đọc tiêu đề giật gân dẫn đến hiểu sai bản chất.', level: 'Trung bình' },
          { name: '2. Tin đồn trên các nhóm kín', desc: 'Cần chủ động theo dõi thông tin chưa kiểm chứng.', level: 'Cao' }
        ],
        recommendations: [
          'Duy trì một đầu mối phát ngôn duy nhất.',
          'Gửi thông tin đính chính trực tiếp đến các cơ quan báo chí.',
          'Chủ động truyền thông thông điệp tích cực.'
        ],
        articles_analysis: []
      };
    }

    // 4. PHÂN LOẠI SẮC THÁI BÀI VIẾT & TỔNG HỢP KPI
    const analysisMap = new Map((aiOutput.articles_analysis || []).map((a: any) => [a.id, a]));

    let posCount = 0, neuCount = 0, negCount = 0;
    let socialCount = 0;

    const enrichedArticles = uniqueArticles.map((art, idx) => {
      if (['Facebook', 'TikTok', 'YouTube', 'Threads', 'Diễn đàn VOZ', 'Tinh tế'].includes(art.source)) {
        socialCount++;
      }

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
      { error: 'Lỗi khi kết nối hệ thống cào dữ liệu.' },
      { status: 500 }
    );
  }
}