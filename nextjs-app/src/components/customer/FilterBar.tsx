'use client';

interface Props {
  selected: string;
  onChange: (v: string) => void;
  cuisines: string[];
}

const CUISINE_ICONS: Record<string, string> = {
  All: '🌐', Italian: '🍕', American: '🍔', Mexican: '🌮', Indian: '🍛',
  'Coffee & Bakery': '☕', Bar: '🍸', BBQ: '🔥', Seafood: '🐟',
};

export default function FilterBar({ selected, onChange, cuisines }: Props) {
  const all = ['All', ...cuisines];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {all.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selected === c
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-600'
          }`}
        >
          <span>{CUISINE_ICONS[c] ?? '🍽️'}</span>
          {c}
        </button>
      ))}
    </div>
  );
}
