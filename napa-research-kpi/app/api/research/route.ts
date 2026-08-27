import { NextResponse } from 'next/server';
import axios from 'axios';

export const maxDuration = 30;

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
  if (l.includes('sggp.org.vn')) return 'Báo SGGP';
  return domainStr || 'Trang tin';
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: 'Từ khóa trống' }, { status: 400 });

    const mainKeyword = query.trim();
    const headers = { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' };

    // Tối ưu bộ truy vấn đa kênh
    const targetQueries = [
      axios.post('https://google.serper.dev/news', { q: `"${mainKeyword}"`, gl: 'vn', hl: 'vi', num: 40 }, { headers }),
      axios.post('https://google.serper.dev/search', { q: `"${mainKeyword}" "Phân hiệu" OR "Học viện" OR "Sông Dương"`, gl: 'vn', hl: 'vi', num: 40 }, { headers }),
      axios.post('https://google.serper.dev/search', { q: `"${mainKeyword}" site:facebook.com`, gl: 'vn', hl: 'vi', num: 40 }, { headers }),
      axios.post('https://google.serper.dev/search', { q: `"${mainKeyword}" site:tiktok.com`, gl: 'vn', hl: 'vi', num: 40 }, { headers }),
      axios.post('https://google.serper.dev/search', { q: `"${mainKeyword}" site:youtube.com`, gl: 'vn', hl: 'vi', num: 40 }, { headers }),
    ];

    const responses = await Promise.allSettled(targetQueries);
    const articleMap = new Map();
    const sourceStats: Record<string, number> = {};

    responses.forEach((res) => {
      if (res.status === 'fulfilled' && res.value?.data) {
        const items = [...(res.value.data.organic || []), ...(res.value.data.news || [])];
        items.forEach((item: any) => {
          if (item.link && !articleMap.has(item.link)) {
            const sourceName = detectSource(item.link, item.domain || item.source);
            sourceStats[sourceName] = (sourceStats[sourceName] || 0) + 1;
            articleMap.set(item.link, {
              title: item.title,
              snippet: (item.snippet || '').slice(0, 160),
              link: item.link,
              source: sourceName,
            });
          }
        });
      }
    });

    const uniqueArticles = Array.from(articleMap.values());
    if (uniqueArticles.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy dữ liệu bài viết.' }, { status: 404 });
    }

    const topSourcesList = Object.entries(sourceStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count: `${count} bài viết`,
        note: name.includes('Báo') ? 'Cơ quan báo chí chính thống' : 'Mạng xã hội / Thảo luận'
      }));

    // Prompt phân tích chuyên sâu cho APAG.HCM
    const prompt = `
      Bạn là chuyên gia giám sát truyền thông của Phân hiệu Học viện Hành chính và Quản trị công tại TP.HCM (APAG.HCM).
      Hãy phân tích danh sách bài viết về chủ đề: "${mainKeyword}".
      Danh sách bài viết: ${JSON.stringify(uniqueArticles.slice(0, 25))}

      Trả về DUY NHẤT 1 chuỗi JSON:
      {
        "crisis_level": "THẤP" hoặc "TRUNG BÌNH" hoặc "CAO",
        "crisis_trend": "Đánh giá xu hướng dư luận đối với Phân hiệu APAG.HCM",
        "phases": [
          { "phase": 1, "title": "Giai đoạn 1: Khởi phát thông tin", "desc": "Mô tả ngắn diễn biến", "tag": "Khởi phát" },
          { "phase": 2, "title": "Giai đoạn 2: Lan truyền & Phản hồi", "desc": "Mô tả ngắn diễn biến", "tag": "Lan truyền" },
          { "phase": 3, "title": "Giai đoạn 3: Trọng tâm hiện tại", "desc": "Mô tả ngắn diễn biến", "tag": "Hiện tại" }
        ],
        "risks": [
          { "name": "1. Rủi ro về dư luận truyền thông", "desc": "Tác động tới uy tín Phân hiệu", "level": "Trung bình" },
          { "name": "2. Rủi ro quản lý tài sản công / pháp lý", "desc": "Các câu hỏi báo chí có thể đặt ra", "level": "Cao" }
        ],
        "recommendations": [
          "Khuyến nghị 1 cho Phân hiệu APAG.HCM",
          "Khuyến nghị 2 cho Phân hiệu APAG.HCM",
          "Khuyến nghị 3 cho Phân hiệu APAG.HCM"
        ],
        "articles_analysis": [
          { "id": 0, "sentiment": "positive" hoặc "neutral" hoặc "negative", "summary": "Tóm tắt ngắn bài viết" }
        ]
      }
    `;

    let aiOutput: any = {};
    try {
      const groqRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 9000 }
      );
      aiOutput = JSON.parse(groqRes.data.choices[0]?.message?.content || '{}');
    } catch (err) {
      console.warn('AI response error:', err);
    }

    const analysisMap = new Map((aiOutput.articles_analysis || []).map((a: any) => [a.id, a]));
    let posCount = 0, neuCount = 0, negCount = 0, socialCount = 0;

    const enrichedArticles = uniqueArticles.map((art, idx) => {
      if (['Facebook', 'TikTok', 'YouTube'].includes(art.source)) socialCount++;
      const aiItem: any = analysisMap.get(idx) || {};
      const sentiment = ['positive', 'neutral', 'negative'].includes(aiItem.sentiment) ? aiItem.sentiment : 'neutral';

      if (sentiment === 'positive') posCount++;
      else if (sentiment === 'negative') negCount++;
      else neuCount++;

      return { ...art, sentiment, summary: aiItem.summary || art.snippet };
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
        crisis_trend: aiOutput.crisis_trend || `Đang theo dõi thông tin truyền thông về ${mainKeyword}.`,
      },
      phases: aiOutput.phases || [],
      top_sources: topSourcesList,
      risks: aiOutput.risks || [],
      recommendations: aiOutput.recommendations || [],
      articles: enrichedArticles,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Lỗi cào dữ liệu hệ thống.' }, { status: 500 });
  }
}