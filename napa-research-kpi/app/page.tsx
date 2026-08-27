{/* TỔNG HỢP KPI TOÀN DIỆN (6 THẺ KPI) */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
  {/* Thẻ 1: Báo chí */}
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
    <div className="flex justify-between items-center text-slate-400 mb-1">
      <span className="text-xs font-medium">Báo chí & Trang tin</span>
      <Newspaper className="w-4 h-4 text-blue-400" />
    </div>
    <div className="text-2xl font-bold text-white">
      {kpi?.news_count || '0'} <span className="text-xs text-slate-400 font-normal">bài</span>
    </div>
    <p className="text-[11px] text-slate-400 mt-1">Tổng: {kpi?.total_articles || 0} URLs</p>
  </div>

  {/* Thẻ 2: Mạng xã hội */}
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
    <div className="flex justify-between items-center text-slate-400 mb-1">
      <span className="text-xs font-medium">Mạng Xã Hội</span>
      <Share2 className="w-4 h-4 text-indigo-400" />
    </div>
    <div className="text-2xl font-bold text-indigo-400">
      {kpi?.social_count || '0'} <span className="text-xs text-slate-400 font-normal">bài</span>
    </div>
    <p className="text-[11px] text-slate-400 mt-1">FB: {kpi?.facebook_count || 0} | TT: {kpi?.tiktok_count || 0} | YT: {kpi?.youtube_count || 0}</p>
  </div>

  {/* Thẻ 3: Tiêu cực */}
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
    <div className="flex justify-between items-center text-slate-400 mb-1">
      <span className="text-xs font-medium">Sắc thái Tiêu cực</span>
      <AlertTriangle className="w-4 h-4 text-red-400" />
    </div>
    <div className="text-2xl font-bold text-red-400">
      {kpi?.negative_count || '0'} <span className="text-xs text-slate-400 font-normal">bài</span>
    </div>
    <p className="text-[11px] text-red-300/80 mt-1">Tỷ lệ: {kpi?.sentiment_ratio?.negative || 0}%</p>
  </div>

  {/* Thẻ 4: Tích cực */}
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
    <div className="flex justify-between items-center text-slate-400 mb-1">
      <span className="text-xs font-medium">Sắc thái Tích cực</span>
      <ThumbsUp className="w-4 h-4 text-emerald-400" />
    </div>
    <div className="text-2xl font-bold text-emerald-400">
      {kpi?.positive_count || '0'} <span className="text-xs text-slate-400 font-normal">bài</span>
    </div>
    <p className="text-[11px] text-emerald-300/80 mt-1">Tỷ lệ: {kpi?.sentiment_ratio?.positive || 0}%</p>
  </div>

  {/* Thẻ 5: Trung tính */}
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
    <div className="flex justify-between items-center text-slate-400 mb-1">
      <span className="text-xs font-medium">Sắc thái Trung tính</span>
      <MinusCircle className="w-4 h-4 text-slate-400" />
    </div>
    <div className="text-2xl font-bold text-slate-300">
      {kpi?.neutral_count || '0'} <span className="text-xs text-slate-400 font-normal">bài</span>
    </div>
    <p className="text-[11px] text-slate-400 mt-1">Tỷ lệ: {kpi?.sentiment_ratio?.neutral || 0}%</p>
  </div>

  {/* Thẻ 6: Khủng hoảng */}
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
    <div className="flex justify-between items-center text-slate-400 mb-1">
      <span className="text-xs font-medium">Mức độ Khủng hoảng</span>
      <TrendingDown className="w-4 h-4 text-amber-400" />
    </div>
    <div className={`text-lg font-bold ${
      kpi?.crisis_level === 'CAO' ? 'text-red-400' :
      kpi?.crisis_level === 'TRUNG BÌNH' ? 'text-amber-400' : 'text-emerald-400'
    }`}>
      {kpi?.crisis_level || 'CHƯA QUÉT'}
    </div>
    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">Trạng thái theo dõi</p>
  </div>
</div>