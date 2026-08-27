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
  if (l.includes('vtv.vn')) return 'Báo VTV';
  return domainStr || 'Trang tin';
}

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
    if (!query) return NextResponse.json({ error: 'Từ khóa không được để trống' }, { status: 400 });

    const rawQuery = query.replace(/["']/g, '').trim();
    const mainWord = rawQuery.split(' ')[0] || rawQuery;
    const headers = { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' };

    // 1. Quét dữ liệu đa kênh
    const targetQueries = [
      axios.post('https://google.serper.dev/news', { q: rawQuery, gl: 'vn', hl: 'vi', num: 40 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/news', { q: mainWord, gl: 'vn', hl: 'vi', num: 40 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: rawQuery, gl: 'vn', hl: 'vi', num: 40, page: 1 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: `${mainWord} "thu hồi" OR "mặt bằng" OR "đóng cửa" OR "Sông Dương"`, gl: 'vn', hl: 'vi', num: 40 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: `${mainWord} site:facebook.com`, gl: 'vn', hl: 'vi', num: 40 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: `${mainWord} site:tiktok.com`, gl: 'vn', hl: 'vi', num: 40 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: `${mainWord} site:youtube.com`, gl: 'vn', hl: 'vi', num: 40 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: mainWord, gl: 'vn', hl: 'vi', num: 40, page: 2 }, { headers }).catch(() => null),
    ];

    const responses = await Promise.all(targetQueries);
    const articleMap = new Map();
    const sourceStats: Record<string, number> = {};

    responses.forEach((res) => {
      if (res?.data) {
        const items = [...(res.data.organic || []), ...(res.data.news || [])];
        items.forEach((item: any) => {
          if (item.link) {
            const cleanedLink = cleanUrl(item.link);
            if (!articleMap.has(cleanedLink)) {
              const sourceName = detectSource(item.link, item.domain || item.source);
              sourceStats[sourceName] = (sourceStats[sourceName] || 0) + 1;
              articleMap.set(cleanedLink, {
                title: item.title,
                snippet: (item.snippet || item.snippetRaw || '').slice(0, 160),
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
      return NextResponse.json({ error: 'Không tìm thấy dữ liệu bài viết.' }, { status: 404 });
    }

    const topSourcesList = Object.entries(sourceStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count: `${count} bài viết`,
        note: name.includes('Báo') ? 'Cơ quan báo chí chính thống' : 'Mạng xã hội / Kênh thảo luận'
      }));

    // 2. Groq AI Phân tích
    let aiOutput: any = null;
    try {
      const prompt = `
        Bạn là chuyên gia giám sát truyền thông của APAG.HCM.
        Hãy phân tích dữ liệu về chủ đề: "${rawQuery}".
        Danh sách bài viết mẫu: ${JSON.stringify(uniqueArticles.slice(0, 20))}

        Trả về DUY NHẤT 1 chuỗi JSON theo cấu trúc:
        {
          "crisis_level": "TRUNG BÌNH",
          "crisis_trend": "Tóm tắt xu hướng dư luận về ${rawQuery}",
          "phases": [
            { "phase": 1, "title": "Giai đoạn 1: Bất lợi ban đầu", "desc": "Các bài báo tập trung hình ảnh trường đóng cửa ngày tựu trường, gây bất ngờ cho phụ huynh.", "tag": "Khởi phát" },
            { "phase": 2, "title": "Giai đoạn 2: Báo chí tiếp nhận dữ kiện đính chính", "desc": "Nhiều báo lớn đăng tải thông tin hợp đồng đã hết hạn từ 2025 và đơn vị đã hỗ trợ gia hạn di dời.", "tag": "Làm rõ" },
            { "phase": 3, "title": "Giai đoạn 3: Trọng tâm chuyển dịch", "desc": "Dư luận tập trung chất vấn trách nhiệm của đơn vị thuê mặt bằng và phương án xử lý.", "tag": "Hiện tại" }
          ],
          "risks": [
            { "name": "1. Rủi ro giật gân từ tiêu đề báo chí", "desc": "Tiêu đề tin tức dễ khiến độc giả hiểu nhầm đơn vị thu hồi đột ngột.", "level": "Trung bình" },
            { "name": "2. Rủi ro câu hỏi về quản lý tài sản công", "desc": "Cơ quan báo chí có thể tiếp tục truy vấn về hồ sơ pháp lý và hợp đồng thuê.", "level": "Cao" }
          ],
          "recommendations": [
            "Duy trì một đầu mối phát ngôn duy nhất, không phát hành thông cáo kéo dài.",
            "Gửi thông tin đính chính trực tiếp đến các báo còn dùng cụm từ sai lệch.",
            "Tiếp tục truyền thông các hoạt động thường kỳ chuyên nghiệp của Phân hiệu."
          ]
        }
      `;

      const groqRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 7000 }
      );

      aiOutput = JSON.parse(groqRes.data.choices[0]?.message?.content || '{}');
    } catch (err) {
      console.warn('Groq AI fallback');
    }

    // 3. Đếm chi tiết từng loại KPI
    let posCount = 0, neuCount = 0, negCount = 0;
    let fbCount = 0, tiktokCount = 0, ytCount = 0, newsCount = 0;

    const enrichedArticles = uniqueArticles.map((art) => {
      const src = art.source;
      if (src === 'Facebook') fbCount++;
      else if (src === 'TikTok') tiktokCount++;
      else if (src === 'YouTube') ytCount++;
      else newsCount++;

      const titleLower = art.title.toLowerCase();
      let sentiment = 'neutral';

      if (titleLower.includes('đóng cửa') || titleLower.includes('bức xúc') || titleLower.includes('mất chỗ') || titleLower.includes('thu hồi')) {
        sentiment = 'negative';
        negCount++;
      } else if (titleLower.includes('lên tiếng') || titleLower.includes('tạo điều kiện') || titleLower.includes('đúng pháp luật') || titleLower.includes('đính chính')) {
        sentiment = 'positive';
        posCount++;
      } else {
        neuCount++;
      }

      return { ...art, sentiment, summary: art.snippet };
    });

    const total = enrichedArticles.length;

    return NextResponse.json({
      kpi_summary: {
        total_articles: total,
        news_count: newsCount,
        social_count: fbCount + tiktokCount + ytCount,
        facebook_count: fbCount,
        tiktok_count: tiktokCount,
        youtube_count: ytCount,
        positive_count: posCount,
        neutral_count: neuCount,
        negative_count: negCount,
        sentiment_ratio: {
          positive: Math.round((posCount / total) * 100) || 0,
          neutral: Math.round((neuCount / total) * 100) || 0,
          negative: Math.round((negCount / total) * 100) || 0,
        },
        crisis_level: aiOutput?.crisis_level || 'TRUNG BÌNH',
        crisis_trend: aiOutput?.crisis_trend || `Theo dõi diễn biến thông tin truyền thông liên quan đến ${rawQuery}.`,
      },
      phases: aiOutput?.phases || [],
      top_sources: topSourcesList,
      risks: aiOutput?.risks || [],
      recommendations: aiOutput?.recommendations || [],
      articles: enrichedArticles,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Lỗi cào dữ liệu hệ thống.' }, { status: 500 });
  }
}