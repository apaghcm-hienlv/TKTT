'use client';

import React from 'react';
import { 
  Newspaper, 
  Share2, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  TrendingDown, 
  MessageSquare, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

export default function PennSchoolDarkboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-full uppercase tracking-wider">
              Khủng hoảng Truyền thông
            </span>
            <span className="text-slate-400 text-sm">Cập nhật: 19h15 - 25/08/2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-2 text-white">
            Darkboard KPI: Vụ việc PennSchool (10 Ba Tháng Hai)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Đơn vị theo dõi: Phân hiệu Học viện Hành chính và Quản trị công tại TP.HCM
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg border border-slate-700 transition">
            Xuất file Báo cáo
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Báo chí & Trang tin</span>
            <Newspaper className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">47 <span className="text-lg text-slate-400 font-normal">URLs</span></div>
          <p className="text-xs text-slate-400 mt-2">Số lượng định danh tối thiểu</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Bài đăng Facebook</span>
            <Share2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white">20 <span className="text-lg text-slate-400 font-normal">Bài</span></div>
          <p className="text-xs text-amber-400 mt-2">5-7 bài có tương tác lớn</p>
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
            <span className="text-sm font-medium">Rủi ro Bùng phát 03/09</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">CAO</div>
          <p className="text-xs text-red-300/80 mt-2">Mốc thời gian PennSchool cam kết</p>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Timeline (Diễn biến 3 giai đoạn) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Diễn biến Truyền thông theo 3 Giai đoạn
          </h2>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
            {/* Giai đoạn 1 */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-1.5 w-7 h-7 bg-red-950 border-2 border-red-500 rounded-full flex items-center justify-center text-xs font-bold text-red-400">
                1
              </div>
              <div className="bg-slate-950/60 p-4 rounded-lg border border-red-900/30">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-red-400">Giai đoạn Đầu: Phân hiệu ở thế bất lợi</h3>
                  <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">Lan truyền cao</span>
                </div>
                <p className="text-sm text-slate-300 mt-2">
                  Tập trung hình ảnh trường đóng cửa ngày tựu trường, ~500 học sinh mất chỗ học. Công chúng hiểu nhầm Phân hiệu thu hồi đột ngột.
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
                  <h3 className="font-semibold text-amber-400">Giai đoạn Phản hồi: Báo chí tiếp nhận dữ kiện Phân hiệu</h3>
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">Cân bằng thông tin</span>
                </div>
                <p className="text-sm text-slate-300 mt-2">
                  Báo chí đăng tải: Hợp đồng hết hạn 26/09/2025; Phân hiệu hỗ trợ hơn 9 tháng (đến 03/07/2026) và cho mượn tầng trệt đến 10/08/2026. Phân hiệu không ký hợp đồng với PennSchool hay phụ huynh.
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
                  <h3 className="font-semibold text-emerald-400">Giai đoạn Hiện tại: Áp lực chuyển sang PennSchool & Sông Dương</h3>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Có lợi cho Phân hiệu</span>
                </div>
                <p className="text-sm text-slate-300 mt-2">
                  Dư luận hỏi: Vì sao hết hợp đồng từ 2025 vẫn thu học phí? Trách nhiệm bảo vệ học sinh thuộc về ai? Sở GD&ĐT đã vào cuộc yêu cầu báo cáo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Engagement Posts Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            Tương tác MXH Đáng chú ý
          </h2>

          <div className="space-y-4">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>Beatvn</span>
                <span className="text-indigo-400">2.900 cảm xúc</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">125 bình luận - Tập trung phê phán học phí cao nhưng thiếu ổn định</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>Tuổi Trẻ (Bài ban đầu)</span>
                <span className="text-indigo-400">2.700 cảm xúc</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">86 lượt chia sẻ - Tác động tiếp cận ban đầu rất lớn</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>VnExpress</span>
                <span className="text-indigo-400">1.800 cảm xúc</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">28 bình luận, 42 chia sẻ - Đánh giá năng lực dự phòng PennSchool</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex justify-between text-sm font-semibold text-white">
                <span>Tuổi Trẻ (Bài Phân hiệu lên tiếng)</span>
                <span className="text-emerald-400">92 cảm xúc</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">2 chia sẻ - Lượng tiếp cận bài phản hồi thấp hơn bài gốc</p>
            </div>
          </div>
        </div>

      </div>

      {/* Risk Matrix & Immediate Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Risk Assessment */}
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
                <span className="text-sm font-semibold text-slate-200">2. Cáo buộc nguyên nhân mất chỗ học</span>
                <p className="text-xs text-slate-400">Tiêu đề báo chí giật gân vẫn gây hiểu nhầm.</p>
              </div>
              <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs rounded font-medium">Trung bình</span>
            </div>

            <div className="flex items-start justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="text-sm font-semibold text-slate-200">3. Quản lý tài sản công</span>
                <p className="text-xs text-slate-400">Câu hỏi về hợp tác bên thứ 3 và nâng tầng từ 4 lên 6.</p>
              </div>
              <span className="px-2 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs rounded font-medium">TB - Cao</span>
            </div>

            <div className="flex items-start justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="text-sm font-semibold text-slate-200">4. Rủi ro bùng phát ngày 03/09</span>
                <p className="text-xs text-slate-400">Nếu PennSchool không thể tổ chức học như cam kết.</p>
              </div>
              <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs rounded font-medium">Cao</span>
            </div>
          </div>
        </div>

        {/* Action Recommendations */}
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
              <span>Gửi thông tin đính chính trực tiếp cho các báo dùng từ "đang gia hạn hợp đồng".</span>
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