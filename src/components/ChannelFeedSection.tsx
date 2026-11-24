import { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import {
  CHANNEL_POSTS,
  type ActivityEngineId,
  type ChannelPost,
} from '../data/channelContent';
import { soundFX } from '../utils/soundEffects';

interface ChannelFeedSectionProps {
  educatorMode: boolean;
  onLaunchPostActivity: (seriesId: ActivityEngineId, targetItemId?: string) => void;
}

const FILTER_OPTIONS: { id: 'all' | ActivityEngineId; label: string }[] = [
  { id: 'all', label: 'جميع منشورات 2026' },
  { id: 'etiquette', label: 'آداب الطفل المسلم' },
  { id: 'seerah', label: 'السيرة والمعجزات' },
  { id: 'faith', label: 'علمي طفلك والطهارة' },
  { id: 'values', label: 'نور في دربي' },
  { id: 'seasonal', label: 'البرنامج الصيفي 2026' },
];

export function ChannelFeedSection({
  educatorMode,
  onLaunchPostActivity,
}: ChannelFeedSectionProps) {
  const [filter, setFilter] = useState<'all' | ActivityEngineId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = CHANNEL_POSTS.filter((post) => {
    const matchesFilter = filter === 'all' || post.seriesId === filter;
    const normalized = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !normalized ||
      post.title.toLowerCase().includes(normalized) ||
      post.excerpt.toLowerCase().includes(normalized) ||
      post.seriesLabel.toLowerCase().includes(normalized) ||
      post.publishYear.toLowerCase().includes(normalized);
    return matchesFilter && matchesSearch;
  });

  return (
    <section id="channel-feed" aria-labelledby="channel-feed-title" className="py-10 sm:py-12">
      <div className="w-full px-5 sm:px-8 lg:px-10">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-semibold text-emerald-800">
              أرشيف موسم 2026 · @rasael_emaratia_children
            </p>
            <h2
              id="channel-feed-title"
              className="font-display text-lg font-bold text-teal-950 sm:text-xl leading-snug"
            >
              سلاسل ومنشورات <span className="text-emerald-700">2026</span> المحوّلة إلى أنشطة
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              تصفح جميع الموضوعات والسلاسل المنشورة في موسم 2026 (آداب الطفل، معجزات الرسول ﷺ، الطهارة والصلاة، العربية لغة القرآن، والبرنامج الصيفي والرمضاني)، واضغط لفتح النشاط مباشرة.
            </p>
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في أنشطة 2026..."
              aria-label="ابحث في منشورات القناة"
              className="min-h-[40px] w-full rounded-xl border border-slate-200 bg-white pr-9 pl-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Segmented Filter Controls */}
        <div
          className="mb-7 flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5"
          role="group"
          aria-label="تصفية المنشورات حسب السلسلة"
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setFilter(opt.id);
                }}
                className={`min-h-[36px] rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-slate-800 mb-1">
              لا توجد منشورات مطابقة لبحثك
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mb-4">
              جرّب تغيير كلمة البحث أو اختيار جميع منشورات 2026.
            </p>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setFilter('all');
                setSearchQuery('');
              }}
              className="min-h-[38px] rounded-xl border border-slate-200 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              إعادة ضبط التصفية
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post: ChannelPost) => (
              <article
                key={post.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-emerald-300"
              >
                <div>
                  {/* Clean Unboxed Metadata */}
                  <div className="mb-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-emerald-800">{post.seriesLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.publishYear}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.ageGroup}</span>
                  </div>

                  <h3 className="font-display text-base font-bold leading-snug text-slate-900 mb-2">
                    {post.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-slate-600 mb-4">
                    {post.excerpt}
                  </p>

                  {educatorMode && (
                    <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs leading-relaxed text-sky-950">
                      <span className="font-bold">توجيه للمربي: </span>
                      {post.educatorNote}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      onLaunchPostActivity(post.seriesId, post.targetItemId);
                    }}
                    className="inline-flex min-h-[42px] w-full items-center justify-between rounded-xl border border-slate-200 border-b-2 bg-slate-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:border-emerald-800 hover:bg-emerald-700 hover:text-white cursor-pointer"
                  >
                    <span>افتح النشاط التفاعلي</span>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
