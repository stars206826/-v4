import React from 'react';
import { X, Plus, Trash2, FolderPlus, Tag, Check } from 'lucide-react';
import { Category, PlanItem } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  plans: PlanItem[];
  onAddCategory: (cat: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
}

const COLOR_OPTIONS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

const ICON_OPTIONS = [
  { name: 'Briefcase', label: '工作' },
  { name: 'GraduationCap', label: '学习' },
  { name: 'Home', label: '生活' },
  { name: 'HeartPulse', label: '健康' },
  { name: 'ShoppingCart', label: '购物' },
  { name: 'Folder', label: '其它' },
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  plans,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [newCatName, setNewCatName] = React.useState('');
  const [newCatColor, setNewCatColor] = React.useState(COLOR_OPTIONS[0]);
  const [newCatIcon, setNewCatIcon] = React.useState('Folder');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    onAddCategory({
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon,
    });

    setNewCatName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1B18]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-[#262420] rounded-3xl shadow-2xl border border-[#E5E0D3] dark:border-[#3F3B35] p-6 flex flex-col space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D3] dark:border-[#3F3B35]">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-[#C86D51]" />
            <h2 className="text-base font-bold text-[#2D2A26] dark:text-[#F2EFE9]">分类标签管理</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7C776E] hover:text-[#2D2A26] dark:hover:text-[#F2EFE9] rounded-full hover:bg-[#F1EDE4] dark:hover:bg-[#302D28]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Categories List */}
        <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
          {categories.map((cat) => {
            const count = plans.filter((p) => p.categoryId === cat.id).length;
            const isDefault = ['work', 'study', 'life', 'health', 'finance'].includes(cat.id);

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F3] dark:bg-[#1C1B18] border border-[#E5E0D3] dark:border-[#3F3B35]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9]">{cat.name}</span>
                  <span className="text-[10px] text-[#7C776E] bg-[#F1EDE4] dark:bg-[#302D28] px-1.5 py-0.2 rounded-full">
                    {count}项
                  </span>
                </div>

                {!isDefault && (
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1 text-[#7C776E] hover:text-[#C05238] rounded hover:bg-[#FAF3E5] transition-colors"
                    title="删除分类"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Category Form */}
        <form onSubmit={handleAdd} className="pt-3 border-t border-[#E5E0D3] dark:border-[#3F3B35] space-y-3">
          <span className="text-xs font-bold text-[#2D2A26] dark:text-[#F2EFE9] block">添加自定义分类</span>

          <input
            type="text"
            required
            placeholder="分类名称 (例如：家庭、兴趣、理财)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E5E0D3] dark:border-[#3F3B35] bg-[#FAF8F3] dark:bg-[#1C1B18] text-[#2D2A26] dark:text-[#F2EFE9] text-xs focus:outline-none"
          />

          {/* Color Selection */}
          <div>
            <span className="text-[11px] text-[#7C776E] dark:text-[#A39E93] block mb-1">主题颜色</span>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setNewCatColor(hex)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                    newCatColor === hex ? 'scale-125 ring-2 ring-[#2D2A26] dark:ring-white' : ''
                  }`}
                  style={{ backgroundColor: hex }}
                >
                  {newCatColor === hex && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#2D2A26] dark:bg-[#F2EFE9] text-white dark:text-[#1C1B18] font-bold text-xs hover:opacity-90 flex items-center justify-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            新增此分类
          </button>
        </form>
      </div>
    </div>
  );
};
