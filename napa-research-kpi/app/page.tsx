'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Search, Loader2, Newspaper, ExternalLink, Hash, Activity } from 'lucide-react';

export default function Home() {
  const [query, setQuery] = useState('Phân hiệu Học viện Hành chính và Quản trị công tại Thành phố Hồ Chí Minh');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra khi truy vấn dữ liệu');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const SENTIMENT_COLORS = {
    positive: '#22c55e', // Green
    neutral: '#64748b',  // Gray
    negative: '#ef4444', // Red
  };

  const chartData = data ? [
    { name: 'Tích cực', value: data.kpi_summary.sentiment_ratio.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Trung tính', value: data.kpi_summary.sentiment_ratio.neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Tiêu cực', value: data.kpi_summary.sentiment_ratio.negative, color: SENTIMENT_COLORS.negative },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="text-blue-600" /> Hệ Thống Giám Sát Truyền Thông Real-Time
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Phân tích KPI, sắc thái tin tức & tổng hợp thông tin tự động qua Gemini AI
            </p>
          </div>
        </header>

        {/* Search Bar */}
        <form onSubmit={handleResearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập tên đơn vị hoặc từ khóa cần giám sát..."
              className="w-full p-4 pr-12 bg-white border border-slate-300 rounded-xl shadow-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            <span>Research KPI</span>
          </button>
        </form>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Dashboard Grid */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* KPI Card 1: Tổng số bài viết */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Tổng Số Thông Tin Thu Thập</p>
                <p className="text-4xl font-extrabold text-blue-600 mt-2">
                  {data.kpi_summary.total_articles} <span className="text-base font-normal text-slate-500">bài viết</span>
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Hash size={14} /> Từ khóa nổi bật
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.kpi_summary.top_keywords.map((kw: string, idx: number) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* KPI Card 2: Biểu đồ Sắc thái Tin tức */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-500">Phân Bổ Sắc Thái Thông Tin (KPI)</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-slate-600 font-medium">Tích cực:</span>
                    <span className="font-bold text-slate-900">{data.kpi_summary.sentiment_ratio.positive}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                    <span className="text-slate-600 font-medium">Trung tính:</span>
                    <span className="font-bold text-slate-900">{data.kpi_summary.sentiment_ratio.neutral}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-slate-600 font-medium">Tiêu cực:</span>
                    <span className="font-bold text-slate-900">{data.kpi_summary.sentiment_ratio.negative}%</span>
                  </div>
                </div>
              </div>

              <div className="w-48 h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Feed Danh sách tin tức & Tóm tắt AI */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-3 space-y-4">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Newspaper className="text-blue-600" size={20} /> Danh Sách Bài Viết & Tóm Tắt Tự Động
              </h2>
              <div className="divide-y divide-slate-100">
                {data.articles.map((art: any, i: number) => (
                  <div key={i} className="py-4 space-y-2 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <a
                        href={art.link}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-slate-900 hover:text-blue-600 flex items-center gap-1.5 transition"
                      >
                        {art.title} <ExternalLink size={14} className="text-slate-400" />
                      </a>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${
                          art.sentiment === 'positive'
                            ? 'bg-green-100 text-green-700'
                            : art.sentiment === 'negative'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {art.sentiment}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{art.summary}</p>
                    <p className="text-slate-400 text-xs">Nguồn: {art.source}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}