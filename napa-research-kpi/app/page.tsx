'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { 
  Newspaper, 
  Share2, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  TrendingDown, 
  MessageSquare, 
  CheckCircle2, 
  XCircle,
  Search,
  Loader2,
  ExternalLink
} from 'lucide-react';

export default function Home() {
  const [query, setQuery] = useState('PennSchool');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const handleResearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/research', { query });
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Có lỗi xảy ra khi quét dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Header & Thanh Tìm Kiếm Real-time */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-full uppercase tracking-wider">
              Khủng hoảng Truyền thông Real-time
            </span>
            <span className="text-slate-400 text-sm">Cập nhật: 19h15 - 25/08/2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-2 text-white">
            Darkboard KPI: Giám sát Truyền thông PennSchool
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Đơn vị theo dõi: Phân hiệu Học viện Hành chính và Quản trị công tại TP.HCM
          </p>
        </div>

        {/* Khung nhập từ khóa quét */}
        <div className="flex w-full md:w-auto gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập từ khóa nghiên cứu..."
            className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full md:w-64"
          />
          <button
            onClick={handleResearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition disabled:opacity-50 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Đang quét...' : 'Quét KPI'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Báo chí & Trang tin</span>
            <Newspaper className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {data?.kpi_summary?.total_articles || '47'} <span className="text-lg text-slate-400 font-normal">URLs</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Số lượng định danh công khai tối thiểu</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Facebook Công khai</span>
            <Share2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white">20 <span className="text-lg text-slate-400 font-normal">Bài</span></div>
          <p className="text-xs text-amber-400 mt-2">5–7 bài có lượng tương tác lớn</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Mức độ Khủng hoảng</span>
            <TrendingDown className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">TRUNG BÌNH</div>
          <p className="text-xs text-emerald-300/80 mt-2">Xu hướng giảm áp lực cho Phân hiệu</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Rủi ro Bùng phát (03/09)</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">CAO</div>
          <p className="text-xs text-red-300/80 mt-2">Cần chuẩn bị phương án dự phòng</p>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Diễn biến 3 giai đoạn */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Diễn biến Thông tin theo 3 Giai đoạn
          </h2>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
            {/* Giai đoạn 1 */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-1.5 w-7 h-7 bg-red-950 border-2 border-red-500 rounded-full flex items-center justify-center text-xs font-bold text-red-400">
                1
              </div>
              <div className="bg-slate-950/60 p-4 rounded-lg border border-red-900/30">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-red-400">Giai đoạn đầu: Phân hiệu ở thế bất lợi</h3>
                  <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">Lan truyền cao</span>
                </div>
                <p className="text-sm text-slate-300 mt-2">
                  Bài viết tập trung hình ảnh trường đóng cửa ngày tựu trường, ~500 học sinh không có địa điểm học. Công chúng hiểu nhầm Phân hiệu bất ngờ thu hồi địa điểm.
                </p>
              </div>
            </div>

            {/* Giai đoạn 2 */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-1.5 w-7 h-7 bg-amber-950 border-2 border-amber-500 rounded-full flex items-center justify-center text-xs font-bold text-amber-400">
                2
              </div>
              <div className="bg-slate-950/60 p-4 rounded-lg border border-amber-900/30">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-amber-400">Giai đoạn phản hồi: Báo chí tiếp nhận dữ kiện Phân hiệu</h3>
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">Cân bằng dư luận</span>
                </div>
                <p className="text-sm text-slate-300 mt-2">
                  Báo chí (Tuổi Trẻ, Thanh Niên, Lao Động, VietnamNet...) đăng tải: Hợp đồng hết hạn 26/09/2025; Phân hiệu hỗ trợ hơn 9 tháng (đến 03/07/2026) và tạm tầng trệt đến 10/08/2026. Phân hiệu không ký hợp đồng với PennSchool hay phụ huynh.
                </p>
              </div>
            </div>

            {/* Giai đoạn 3 */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-1.5 w-7 h-7 bg-emerald-950 border-2 border-emerald-500 rounded-full flex items-center justify-center text-xs font-bold text-emerald-400">
                3
              </div>
              <div className="bg-slate-950/60 p-4 rounded-lg border border-emerald-900/30">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-emerald-400">Giai đoạn hiện tại: Áp lực chuyển sang PennSchool & Sông Dương</h3>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Có lợi cho Phân hiệu</span>
                </div>
                <p className="text-sm text-slate-300 mt-2">
                  Dư luận chuyển sang hỏi: Vì sao hết hợp đồng từ 2025 vẫn thu học phí? Trách nhiệm thuộc về ai? Sở GD&ĐT yêu cầu báo cáo. Dư luận không còn công kích Phân hiệu.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tương tác mạng xã hội */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            Tương tác MXH Đáng Chú Ý
          </h2>

          <div className="space-y-4">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>Beatvn</span>
                <span className="text-indigo-400">~2.900 cảm xúc</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">125 bình luận - Phê phán học phí cao nhưng thiếu ổn định</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>Tuổi Trẻ (Bài ban đầu)</span>
                <span className="text-indigo-400">~2.700 cảm xúc</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">86 lượt chia sẻ - Tác động tiếp cận gây bất ngờ ban đầu lớn</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>VnExpress</span>
                <span className="text-indigo-400">~1.800 cảm xúc</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">28 bình luận, 42 chia sẻ - Đặt câu hỏi năng lực quản trị</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>Tuổi Trẻ (Bài Phân hiệu lên tiếng)</span>
                <span className="text-emerald-400">~92 cảm xúc</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">2 chia sẻ - Lượng tiếp cận bài giải thích thấp hơn bài ban đầu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách bài viết vừa quét được từ API */}
      {data?.articles && data.articles.length > 0 && (
        <div className="mb-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <span>Bài Viết Mới Quét Được ({data.articles.length} bài)</span>
            <span className="text-xs font-normal text-slate-400">Sắp xếp theo độ liên quan</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
            {data.articles.map((art: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {art.source}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      art.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                      art.sentiment === 'negative' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {art.sentiment === 'positive' ? 'Tích cực' : art.sentiment === 'negative' ? 'Tiêu cực' : 'Trung tính'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white line-clamp-2">{art.title}</h4>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{art.summary}</p>
                </div>
                <a
                  href={art.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  Xem bài gốc <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rủi ro & Kiến nghị xử lý */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Đánh giá Rủi ro đối với Phân hiệu
          </h2>
          <div className="space-y-3">
            <div className="flex items-start justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="text-sm font-semibold text-slate-200">1. Uy tín trực tiếp</span>
                <p className="text-xs text-slate-400">Dữ kiện hỗ trợ 9 tháng giúp bác bỏ thu hồi đột ngột.</p>
              </div>
              <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs rounded font-medium">Trung bình</span>
            </div>
            <div className="flex items-start justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="text-sm font-semibold text-slate-200">2. Cáo buộc nguyên nhân</span>
                <p className="text-xs text-slate-400">Tiêu đề giật gân vẫn gây hiểu nhầm đối với độc giả đọc lướt.</p>
              </div>
              <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs rounded font-medium">Trung bình</span>
            </div>
            <div className="flex items-start justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="text-sm font-semibold text-slate-200">3. Quản lý tài sản công</span>
                <p className="text-xs text-slate-400">Báo chí có thể hỏi về việc hợp tác bên thứ 3 & cải tạo 4 thành 6 tầng.</p>
              </div>
              <span className="px-2 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs rounded font-medium">TB - Cao</span>
            </div>
            <div className="flex items-start justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="text-sm font-semibold text-slate-200">4. Rủi ro bùng phát 03/09</span>
                <p className="text-xs text-slate-400">Nếu PennSchool không thể tổ chức cho học sinh đi học lại.</p>
              </div>
              <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs rounded font-medium">Cao</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Kiến nghị Xử lý Tức thì
          </h2>
          <ul className="space-y-2.5 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>Duy trì một đầu mối phát ngôn duy nhất; không phát hành liên tiếp nhiều thông cáo dài.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>Gửi thông tin đính chính trực tiếp cho các báo còn dùng từ "đang gia hạn hợp đồng".</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <span>Khẳng định rõ: Không xác nhận và không chịu trách nhiệm với mốc thời gian 03/09 do PennSchool đưa ra.</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <span>Không tranh luận dưới các bài giễu nhại MXH; không bình luận về học phí/chuyển trường.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>Tiếp tục truyền thông kế hoạch đón tân sinh viên K26 bình thường, tự nhiên và chuyên nghiệp.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}