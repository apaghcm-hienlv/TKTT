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
  Search,
  Loader2,
  ExternalLink,
  Key
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

  const quota = data?.api_quota_remaining;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-full uppercase tracking-wider">
              Khủng hoảng Truyền thông Real-time
            </span>
            <span className="text-slate-400 text-sm">Đơn vị: APAG.HCM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-2 text-white">
            Giám sát Truyền thông APAG.HCM
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Phân hiệu Học viện Hành chính và Quản trị công tại TP. Hồ Chí Minh
          </p>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="flex w-full md:w-auto gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
            placeholder="Nhập từ khóa cần quét..."
            className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full md:w-72"
          />
          <button
            onClick={handleResearch}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition disabled:opacity-50 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Đang phân tích...' : 'Quét KPI'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 4 Thẻ KPI chính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Báo chí & Trang tin</span>
            <Newspaper className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {data?.kpi_summary?.total_articles || '0'} <span className="text-lg text-slate-400 font-normal">URLs</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Bài viết định danh thu thập được</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Mạng Xã Hội</span>
            <Share2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {data?.kpi_summary?.social_count || '0'} <span className="text-lg text-slate-400 font-normal">Bài</span>
          </div>
          <p className="text-xs text-amber-400 mt-2">Bài đăng Facebook, TikTok, YouTube</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Mức độ Khủng hoảng</span>
            <TrendingDown className="w-5 h-5 text-emerald-400" />
          </div>
          <div className={`text-2xl font-bold ${
            data?.kpi_summary?.crisis_level === 'CAO' ? 'text-red-400' :
            data?.kpi_summary?.crisis_level === 'TRUNG BÌNH' ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {data?.kpi_summary?.crisis_level || 'CHƯA QUÉT'}
          </div>
          <p className="text-xs text-slate-400 mt-2 line-clamp-1">
            {data?.kpi_summary?.crisis_trend || 'Đang chờ phân tích dữ liệu'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-sm font-medium">Tỷ lệ Tiêu cực (Negative)</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400">
            {data?.kpi_summary?.sentiment_ratio?.negative || 0}%
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Tích cực: {data?.kpi_summary?.sentiment_ratio?.positive || 0}% | Trung tính: {data?.kpi_summary?.sentiment_ratio?.neutral || 0}%
          </p>
        </div>
      </div>

      {/* HIỂN THỊ SỐ LƯỢT / CREDITS CÒN LẠI THỰC TẾ TRONG TÀI KHOẢN */}
      <div className="mb-8 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Hạn Mức API Key Còn Lại Thực Tế (Live Account Quota)</h3>
            <p className="text-xs text-slate-400">Số dư lượt tìm kiếm và hạn mức request còn khả dụng trực tiếp từ tài khoản dịch vụ</p>
          </div>
        </div>

        <div className="flex gap-4 text-xs">
          <div className="px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 text-center">
            <span className="text-slate-400 block mb-0.5">Serper API (Số dư tìm kiếm)</span>
            <span className="text-emerald-400 font-bold text-sm">
              {quota?.serper_credits !== undefined ? `${quota.serper_credits} credits` : 'Đang lấy...'}
            </span>
          </div>
          <div className="px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 text-center">
            <span className="text-slate-400 block mb-0.5">Groq AI (Hạn mức gọi)</span>
            <span className="text-indigo-400 font-bold text-sm">
              {quota?.groq_requests || '14,400 reqs/ngày'}
            </span>
          </div>
        </div>
      </div>

      {/* Diễn biến 3 giai đoạn & Top nguồn tin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Diễn biến Thông tin theo Giai đoạn
          </h2>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
            {data?.phases?.length > 0 ? (
              data.phases.map((p: any, idx: number) => (
                <div key={idx} className="relative pl-10">
                  <div className="absolute left-0 top-1.5 w-7 h-7 bg-slate-950 border-2 border-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-blue-400">
                    {p.phase || idx + 1}
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-blue-300">{p.title}</h3>
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">{p.tag || 'Diễn biến'}</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-2">{p.desc}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic pl-4">Nhấn "Quét KPI" để AI phân tích diễn biến truyền thông...</p>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            Top Nguồn Tin Thu Thập Được
          </h2>

          <div className="space-y-4">
            {data?.top_sources?.length > 0 ? (
              data.top_sources.map((src: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex justify-between text-sm font-semibold text-white">
                    <span>{src.name}</span>
                    <span className="text-indigo-400">{src.count}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{src.note}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">Chưa có dữ liệu nguồn tin...</p>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách bài viết */}
      {data?.articles && data.articles.length > 0 && (
        <div className="mb-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <span>Danh Sách Bài Viết Thu Thập Được ({data.articles.length} bài)</span>
            <span className="text-xs font-normal text-slate-400">Phân loại nguồn tin & Sắc thái</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
            {data.articles.map((art: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-blue-300">
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

      {/* Rủi ro & Kiến nghị */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Đánh giá Rủi ro Truyền thông
          </h2>
          <div className="space-y-3">
            {data?.risks?.length > 0 ? (
              data.risks.map((r: any, idx: number) => (
                <div key={idx} className="flex items-start justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-sm font-semibold text-slate-200">{r.name}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                  </div>
                  <span className={`px-2 py-1 border text-xs rounded font-medium shrink-0 ml-2 ${
                    r.level === 'Cao' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    r.level === 'Trung bình' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {r.level}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">Chưa có đánh giá rủi ro...</p>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Kiến nghị Xử lý Truyền thông
          </h2>
          <ul className="space-y-2.5 text-sm text-slate-300">
            {data?.recommendations?.length > 0 ? (
              data.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">Chưa có kiến nghị xử lý...</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}