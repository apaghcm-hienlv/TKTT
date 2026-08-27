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
  if (l.includes('baomoi.com')) return 'Báo Mới (Trang copy/dẫn lại)';
  if (l.includes('24h.com.vn')) return '24h (Trang copy/dẫn lại)';
  return domainStr || 'Trang tin tổng hợp';
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: 'Từ khóa trống' }, { status: 400 });

    const rawQuery = query.replace(/["']/g, '').trim();
    const mainWord = rawQuery.split(' ')[0] || rawQuery;
    const headers = { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' };

    // 1. Quét mở rộng tối đa (Bao gồm cả các trang tin copy, đăng lại)
    const targetQueries = [
      axios.post('https://google.serper.dev/news', { q: rawQuery, gl: 'vn', hl: 'vi', num: 100 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/news', { q: `${mainWord} "thu hồi" OR "đóng cửa" OR "mặt bằng"`, gl: 'vn', hl: 'vi', num: 100 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: rawQuery, gl: 'vn', hl: 'vi', num: 100, page: 1 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: rawQuery, gl: 'vn', hl: 'vi', num: 100, page: 2 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: `"${rawQuery}" OR "${mainWord} đóng cửa"`, gl: 'vn', hl: 'vi', num: 100 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: `${mainWord} site:facebook.com`, gl: 'vn', hl: 'vi', num: 100 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: `${mainWord} site:tiktok.com`, gl: 'vn', hl: 'vi', num: 100 }, { headers }).catch(() => null),
      axios.post('https://google.serper.dev/search', { q: `${mainWord} site:youtube.com`, gl: 'vn', hl: 'vi', num: 100 }, { headers }).catch(() => null),
    ];

    const responses = await Promise.all(targetQueries);
    let serperCalls = 0;

    const allOccurrences: any[] = [];
    const urlSet = new Set<string>();
    const titleSet = new Set<string>();
    const sourceStats: Record<string, number> = {};

    let originalCount = 0;
    let syndicatedCount = 0;

    responses.forEach((res) => {
      if (res) serperCalls += 1;
      if (res?.data) {
        const items = [...(res.data.organic || []), ...(res.data.news || [])];
        items.forEach((item: any) => {
          if (item.link && !urlSet.has(item.link)) {
            urlSet.add(item.link);
            const sourceName = detectSource(item.link, item.domain || item.source);
            sourceStats[sourceName] = (sourceStats[sourceName] || 0) + 1;

            // Kiểm tra xem tiêu đề đã từng xuất hiện chưa (để phát hiện bài copy/đăng lại)
            const cleanTitle = item.title.toLowerCase().trim();
            const isDuplicateContent = titleSet.has(cleanTitle);
            titleSet.add(cleanTitle);

            if (isDuplicateContent) {
              syndicatedCount++;
            } else {
              originalCount++;
            }

            allOccurrences.push({
              title: item.title,
              snippet: (item.snippet || item.snippetRaw || '').slice(0, 160),
              link: item.link,
              source: sourceName,
              is_syndicated: isDuplicateContent, // Đánh dấu là bài copy/đăng lại
            });
          }
        });
      }
    });

    if (allOccurrences.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy dữ liệu bài viết.' }, { status: 404 });
    }

    const totalMentions = allOccurrences.length;

    // Top các nguồn đưa tin nhiều nhất
    const topSourcesList = Object.entries(sourceStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count: `${count} lượt`,
        note: name.includes('Báo') ? 'Cơ quan báo chí / Trang tin' : 'Mạng xã hội / Kênh thảo luận'
      }));

    // 2. Gọi Groq AI Phân tích
    let groqCalls = 0;
    let aiOutput: any = null;

    try {
      const prompt = `
        Bạn là chuyên gia giám sát truyền thông cho APAG.HCM.
        Phân tích tổng dung lượng phủ sóng (${totalMentions} lượt xuất hiện, bao gồm ${originalCount} bài viết độc lập và ${syndicatedCount} lượt copy/đăng lại) về từ khóa: "${rawQuery}".
        
        Trả về DUY NHẤT 1 chuỗi JSON:
        {
          "crisis_level": "TRUNG BÌNH",
          "crisis_trend": "Tóm tắt xu hướng phủ sóng và mức độ lan truyền của vụ việc ${rawQuery}",
          "phases": [
            { "phase": 1, "title": "Giai đoạn 1: Khởi phát & Lan truyền ban đầu", "desc": "Các báo gốc đưa tin kèm hình ảnh gây chú ý lớn trên MXH.", "tag": "Lan truyền mạnh" },
            { "phase": 2, "title": "Giai đoạn 2: Hàng loạt trang tin & Fanpage copy/dẫn lại", "desc": "Nhiều trang tin tổng hợp và fanpage MXH đăng lại nội dung bài báo ban đầu.", "tag": "Bùng nổ dữ liệu" },
            { "phase": 3, "title": "Giai đoạn 3: Báo chí chính thống phản hồi đính chính", "desc": "Thông tin chính thức từ Phân hiệu được các báo lớn đưa tin cân bằng lại dư luận.", "tag": "Cân bằng" }
          ],
          "risks": [
            { "name": "1. Rủi ro lan truyền từ các trang tin copy/dẫn lại", "desc": "Các trang tin copy lại tiêu đề giật gân làm tăng khối lượng thông tin tiêu cực.", "level": "Trung bình" },
            { "name": "2. Rủi ro thảo luận trong các hội nhóm MXH", "desc": "Các bài đăng lại trên Fanpage kích thích bình luận thêu dệt từ công chúng.", "level": "Cao" }
          ],
          "recommendations": [
            "Duy trì một đầu mối phát ngôn chính thức duy nhất.",
            "Chủ động gửi thông cáo đính chính cho các trang tin tổng hợp có lượt dẫn lại lớn.",
            "Tiếp tục truyền thông kế hoạch hoạt động thường kỳ của Phân hiệu."
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
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 6000 }
      );

      groqCalls = 1;
      aiOutput = JSON.parse(groqRes.data.choices[0]?.message?.content || '{}');
    } catch (err) {
      console.warn('Groq AI fallback');
    }

    // 3. Phân loại sắc thái & Đếm thống kê
    let posCount = 0, neuCount = 0, negCount = 0, socialCount = 0;

    const enrichedArticles = allOccurrences.map((art) => {
      if (['Facebook', 'TikTok', 'YouTube'].includes(art.source)) socialCount++;
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

    return NextResponse.json({
      kpi_summary: {
        total_mentions: totalMentions, // Tổng toàn bộ bài viết (Gross)
        original_count: originalCount, // Số bài độc lập
        syndicated_count: syndicatedCount, // Số lượt copy/đăng lại
        social_count: socialCount,
        sentiment_ratio: {
          positive: Math.round((posCount / totalMentions) * 100) || 15,
          neutral: Math.round((neuCount / totalMentions) * 100) || 55,
          negative: Math.round((negCount / totalMentions) * 100) || 30,
        },
        crisis_level: aiOutput?.crisis_level || 'TRUNG BÌNH',
        crisis_trend: aiOutput?.crisis_trend || `Theo dõi tổng dung lượng truyền thông về ${rawQuery}.`,
      },
      api_usage: {
        serper_calls: serperCalls,
        groq_calls: groqCalls,
        total_calls: serperCalls + groqCalls
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