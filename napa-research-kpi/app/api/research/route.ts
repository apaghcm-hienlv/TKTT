import { NextResponse } from 'next/server';
import axios from 'axios';

export const maxDuration = 30; // Mở rộng thời gian xử lý cho Vercel

function cleanUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`.toLowerCase().replace(/\/$/, '');
  } catch {
    return url.split('?')[0].toLowerCase().replace(/\/$/, '');
  }
}

function detectSource(link: string, domainStr: string): string {
  const l = link.toLowerCase();
  if (l.includes('facebook.com')) return 'Facebook';
  if (l.includes('tiktok.com')) return 'TikTok';
  if (l.includes('youtube.com')) return 'YouTube';
  if (l.includes('tuoitre.vn')) return 'Báo Tuổi Trẻ';
  if (l.includes('vnexpress.net')) return 'Báo VnExpress';
  if (l.includes('thanhnien.vn')) return 'Báo Thanh Niên';
  if (l.includes('laodong.vn')) return 'Báo Lao Động';
  if (l.includes('vietnamnet.vn')) return 'Báo VietNamNet';
  if (l.includes('dantri.com.vn')) return 'Báo Dân Trí';
  if (l.includes('sggp.org.vn')) return 'Báo Sài Gòn Giải Phóng';
  if (l.includes('vtv.vn')) return 'Báo VTV';
  if (l.includes('chinhphu.vn')) return 'Cổng TTĐTV Chính Phủ';
  return domainStr || 'Trang tin';
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

    const mainKeyword = query.trim();
    const headers = {
      'X-API-KEY': process.env.SERPER_API_KEY,
      'Content-Type': 'application/json',
    };

    // 1. TÁCH BIỆT BỘ TRUY VẤN TÌM KIẾM ĐỂ LẤY TỐI ĐA BÀI VIẾT
    const targetQueries = [
      // Quét tin tức Google News
      axios.post('https://google.serper.dev/news', { q: mainKeyword, gl: 'vn', hl: 'vi', num: 40 }, { headers }),
      axios.post('https://google.serper.dev/news', { q: `${mainKeyword} tin tức`, gl: 'vn', hl: 'vi', num: 40 }, { headers }),
      // Quét Báo chí chính thống Việt Nam
      axios.post('https://google.serper.dev/search', { q: `"${mainKeyword}" (site:tuoitre.vn OR site:vnexpress.net OR site:thanhnien.vn OR site:laodong.vn)`, gl: 'vn', hl: 'vi', num: 40 }, { headers }),
      axios.post('https://google.serper.dev/search', { q: `"${mainKeyword}" (site:vietnamnet.vn OR site:dantri.com.vn OR site:sggp.org.vn OR site:vtv.vn)`, gl: 'vn', hl: 'vi', num: 40 }, { headers }),
      // Quét riêng từng Mạng xã hội
      axios.post('https://google.serper.dev/search', { q: `"${mainKeyword}" site:facebook.com`, gl: 'vn', hl: 'vi', num: 40 }, { headers }),
      axios.post('https://google.serper.dev/search', { q: `"${mainKeyword}" site:tiktok.com`, gl: 'vn', hl: 'vi', num: 40 }, { headers }),
      axios.post('https://google.serper.dev/search', { q: `"${mainKeyword}" site:youtube.com`, gl: 'vn', hl: 'vi', num: 40 }, { headers }),
      // Quét tìm kiếm rộng
      axios.post('https://google.serper.dev/search', { q: mainKeyword, gl: 'vn', hl: 'vi', num: 40, page: 1 }, { headers }),
      axios.post('https://google.serper.dev/search', { q: mainKeyword, gl: 'vn', hl: 'vi', num: 40, page: 2 }, { headers }),
    ];

    const responses = await Promise.allSettled(targetQueries);

    // 2. GOM DỮ LIỆU VÀ LỌC TRÙNG LẶP
    const articleMap = new Map();
    const sourceStats: Record<string, number> = {};

    responses.forEach((res) => {
      if (res.status === 'fulfilled' && res.value?.data) {
        const data = res.value.data;
        const items = [...(data.organic || []), ...(data.news || [])];

        items.forEach((item: any) => {
          if (item.link) {
            const cleanedLink = cleanUrl(item.link);
            if (!articleMap.has(cleanedLink)) {
              const sourceName = detectSource(item.link, item.domain || item.source);
              sourceStats[sourceName] = (sourceStats[sourceName] || 0) + 1;

              articleMap.set(cleanedLink, {
                title: item.title,
                snippet: (item.snippet || item.snippetRaw || '').slice(0, 150),
                link: item.link,
                source: sourceName,
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

    // Top các nguồn tin thu thập được nhiều nhất
    const topSourcesList = Object.entries(sourceStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count: `${count} bài viết`,
        note: name.includes('Báo') ? 'Cơ quan báo chí chính thống' : 'Kênh mạng xã hội / thảo luận'
      }));

    // 3. GỌI GROQ AI MODEL SIÊU TỐC (LLAMA-3.1-8B-INSTANT)
    const sampleArticles = uniqueArticles.slice(0, 25).map((art, idx) => ({
      id: idx,
      title: art.title,
      source: art.source,
    }));

    const prompt = `
      Bạn là chuyên gia giám sát truyền thông của APAG.HCM. Hãy phân tích danh sách bài viết dưới đây về chủ đề: "${mainKeyword}".
      Danh sách bài viết mẫu:
      ${JSON.stringify(sampleArticles)}

      BẮT BUỘC trả về duy nhất 1 chuỗi JSON hợp lệ theo đúng cấu trúc sau (không thêm bất kỳ văn bản nào ngoài JSON):
      {
        "crisis_level": "THẤP" hoặc "TRUNG BÌNH" hoặc "CAO",
        "crisis_trend": "Tóm tắt ngắn 1 câu về bản chất và xu hướng dư luận của chủ đề '${mainKeyword}'",
        "phases": [
          { "phase": 1, "title": "Giai đoạn 1: Khởi phát thông tin", "desc": "Mô tả diễn biến cụ thể liên quan đến ${mainKeyword}", "tag": "Khởi phát" },
          { "phase": 2, "title": "Giai đoạn 2: Lan truyền dư luận", "desc": "Mô tả phản ứng dư luận hoặc báo chí đối với ${mainKeyword}", "tag": "Lan truyền" },
          { "phase": 3, "title": "Giai đoạn 3: Phản hồi & Xử lý", "desc": "Mô tả tình hình hiện tại đối với ${mainKeyword}", "tag": "Hiện tại" }
        ],
        "risks": [
          { "name": "1. Rủi ro tác động uy tín đơn vị", "desc": "Đánh giá tác động từ thông tin về ${mainKeyword}", "level": "Trung bình" },
          { "name": "2. Rủi ro lan truyền thông tin sai lệch", "desc": "Đánh giá nguy cơ từ các bài viết về ${mainKeyword}", "level": "Cao" }
        ],
        "recommendations": [
          "Khuyến nghị 1 cụ thể cho việc xử lý truyền thông về ${mainKeyword}",
          "Khuyến nghị 2 cụ thể cho việc theo dõi dư luận về ${mainKeyword}",
          "Khuyến nghị 3 cụ thể cho phát ngôn chính thức"
        ],
        "articles_analysis": [
          { "id": 0, "sentiment": "positive" hoặc "neutral" hoặc "negative", "summary": "Tóm tắt ngắn 1 câu về nội dung bài viết" }
        ]
      }
    `;

    let aiOutput: any = {};

    try {
      const groqRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant', // Model phản hồi siêu tốc (~1 giây)
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000, // Timeout 8 giây
        }
      );

      const rawText = groqRes.data.choices[0]?.message?.content?.trim() || '{}';
      aiOutput = JSON.parse(rawText);
    } catch (aiErr: any) {
      console.warn('Groq AI error:', aiErr?.message);
    }

    // 4. ĐỒNG BỘ SẮC THÁI BÀI VIẾT VÀ TỔNG HỢP KPI
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
        crisis_trend: aiOutput.crisis_trend || `Đang theo dõi thông tin liên quan đến ${mainKeyword}.`,
      },
      phases: aiOutput.phases || [
        { phase: 1, title: 'Thông tin báo chí ghi nhận', desc: `Ghi nhận các thông tin ban đầu về ${mainKeyword}.`, tag: 'Ghi nhận' },
        { phase: 2, title: 'Thảo luận công khai', desc: `Các diễn đàn và mạng xã hội chia sẻ ý kiến về ${mainKeyword}.`, tag: 'Thảo luận' },
        { phase: 3, title: 'Theo dõi diễn biến', desc: `Cơ quan báo chí theo dõi kết quả xử lý liên quan đến ${mainKeyword}.`, tag: 'Theo dõi' }
      ],
      top_sources: topSourcesList,
      risks: aiOutput.risks || [
        { name: '1. Rủi ro tiêu đề giật gân', desc: `Các trang tin có thể giật tiêu đề gây chú ý về ${mainKeyword}.`, level: 'Trung bình' },
        { name: '2. Bình luận thiếu kiểm chứng trên MXH', desc: `Nguy cơ bùng phát thông tin thêu dệt liên quan ${mainKeyword}.`, level: 'Cao' }
      ],
      recommendations: aiOutput.recommendations || [
        `Duy trì theo dõi sát thông tin báo chí đưa về ${mainKeyword}.`,
        `Chuẩn bị thông điệp chính thức nếu xuất hiện thông tin sai lệch về ${mainKeyword}.`
      ],
      articles: enrichedArticles,
    });
  } catch (error: any) {
    console.error('--- LỖI BACKEND ---:', error?.response?.data || error?.message);
    return NextResponse.json(
      { error: 'Lỗi khi kết nối hệ thống cào dữ liệu.' },
      { status: 500 }
    );
  }
}