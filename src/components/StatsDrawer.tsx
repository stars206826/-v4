import React from 'react';
import {
  PieChart,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Upload,
  BarChart3,
  Flame,
  Award,
} from 'lucide-react';
import { Category, PlanItem } from '../types';
import { PRIORITY_MAP } from '../data/initialData';

interface StatsDrawerProps {
  plans: PlanItem[];
  categories: Category[];
  onImportData: (plans: PlanItem[]) => void;
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({ plans, categories, onImportData }) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const total = plans.length;
  const completedCount = plans.filter((p) => p.completed).length;
  const overdueCount = plans.filter((p) => {
    if (p.completed) return false;
    const now = new Date();
    const [y, m, d] = p.dueDate.split('-').map(Number);
    const [h, min] = p.dueTime.split(':').map(Number);
    const target = new Date(y, m - 1, d, h, min);
    return now.getTime() > target.getTime();
  }).length;

  const completionPercentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Export JSON backup
  const handleExport = () => {
    const dataStr = JSON.stringify(plans, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan_reminder_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportData(parsed);
          alert('数据导入成功！计划与日程已更新。');
        } else {
          alert('导入失败：文件格式不符合要求。');
        }
      } catch {
        alert('导入失败：JSON 解析错误。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Overview Cards */}
      <div className="bg-white dark:bg-[#262420] rounded-2xl p-4 border border-[#E5E0D3] dark:border-[#3F3B35] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#C86D51]" />
            <h2 className="text-base font-bold text-[#2D2A26] dark:text-[#F2EFE9]">计划数据概览</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#C86D51]/10 text-[#C86D51] dark:text-[#E07A5F] border border-[#C86D51]/20">
            完成率 {completionPercentage}%
          </span>
        </div>

        {/* Completion Progress Bar */}
        <div className="w-full bg-[#F1EDE4] dark:bg-[#302D28] h-3 rounded-full overflow-hidden mb-4 p-0.5">
          <div
            className="bg-gradient-to-r from-[#C86D51] to-[#D9A05B] h-full rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* 3 Metric Cards Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#FAF8F3] dark:bg-[#1C1B18] p-3 rounded-xl border border-[#E5E0D3] dark:border-[#3F3B35]">
            <span className="text-lg font-black text-[#2D2A26] dark:text-[#F2EFE9] block">{total}</span>
            <span className="text-[11px] text-[#7C776E] dark:text-[#A39E93] flex items-center justify-center gap-1">
              全部计划
            </span>
          </div>
          <div className="bg-[#FAF3E5] dark:bg-[#382B1B] p-3 rounded-xl border border-[#F2DEB9] dark:border-[#574328]">
            <span className="text-lg font-black text-[#60775A] dark:text-[#81A078] block">
              {completedCount}
            </span>
            <span className="text-[11px] text-[#60775A] dark:text-[#81A078] flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              已完成
            </span>
          </div>
          <div className="bg-[#FAF8F3] dark:bg-[#1C1B18] p-3 rounded-xl border border-[#E5E0D3] dark:border-[#3F3B35]">
            <span className="text-lg font-black text-[#C05238] block">{overdueCount}</span>
            <span className="text-[11px] text-[#C05238] flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" />
              逾期待办
            </span>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="bg-white dark:bg-[#262420] rounded-2xl p-4 border border-[#E5E0D3] dark:border-[#3F3B35] shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9] uppercase tracking-wider flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-[#D9A05B]" />
          重要性分布 (四象限)
        </h3>

        {(['P1', 'P2', 'P3', 'P4'] as const).map((pLevel) => {
          const info = PRIORITY_MAP[pLevel];
          const count = plans.filter((p) => p.priority === pLevel).length;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const dotColor = pLevel === 'P1' ? 'bg-[#C05238]' : pLevel === 'P2' ? 'bg-[#D9A05B]' : pLevel === 'P3' ? 'bg-[#60775A]' : 'bg-[#7C776E]';

          return (
            <div key={pLevel} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#2D2A26] dark:text-[#F2EFE9] flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  {info.level} {info.label}
                </span>
                <span className="font-bold text-[#7C776E] dark:text-[#A39E93]">
                  {count} 项 ({pct}%)
                </span>
              </div>
              <div className="w-full bg-[#F1EDE4] dark:bg-[#302D28] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${dotColor} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Categories Breakdown */}
      <div className="bg-white dark:bg-[#262420] rounded-2xl p-4 border border-[#E5E0D3] dark:border-[#3F3B35] shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9] uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-4 h-4 text-[#C86D51]" />
          分类计划统计
        </h3>

        <div className="space-y-2">
          {categories.map((cat) => {
            const count = plans.filter((p) => p.categoryId === cat.id).length;

            return (
              <div key={cat.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#FAF8F3] dark:bg-[#1C1B18]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-medium text-[#2D2A26] dark:text-[#F2EFE9]">{cat.name}</span>
                </div>
                <span className="font-bold text-[#7C776E] dark:text-[#A39E93]">{count} 项</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backup & Restore JSON */}
      <div className="bg-white dark:bg-[#262420] rounded-2xl p-4 border border-[#E5E0D3] dark:border-[#3F3B35] shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9] uppercase tracking-wider">
          数据备份与同步
        </h3>
        <p className="text-xs text-[#7C776E] dark:text-[#A39E93]">
          您可以导出当前所有的计划日程与提醒数据 JSON 文件进行本地备份，或在其它设备上导入恢复。
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExport}
            className="py-2.5 px-3 bg-[#F1EDE4] hover:bg-[#E5E0D3] dark:bg-[#302D28] dark:hover:bg-[#3F3B35] text-[#2D2A26] dark:text-[#F2EFE9] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-[#60775A]" />
            导出数据 JSON
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-2.5 px-3 bg-[#F1EDE4] hover:bg-[#E5E0D3] dark:bg-[#302D28] dark:hover:bg-[#3F3B35] text-[#2D2A26] dark:text-[#F2EFE9] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4 text-[#C86D51]" />
            导入备份恢复
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
