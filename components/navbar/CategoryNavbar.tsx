'use client'

import { Utensils, Coffee } from 'lucide-react'

type Category = 'ALL' | 'MAKANAN' | 'MINUMAN'

interface CategoryNavbarProps {
  selectedCategory: Category
  onCategoryChange: (category: Category) => void
}

export default function CategoryNavbar({ selectedCategory, onCategoryChange }: CategoryNavbarProps) {
  return (
    <div className="sticky top-[64px] z-40 bg-canvas border-b border-hairline font-jakarta">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onCategoryChange('ALL')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-wide uppercase transition-all duration-200 cursor-pointer ${selectedCategory === 'ALL'
              ? 'bg-ink text-canvas'
              : 'bg-soft-cloud text-ink hover:bg-hairline-soft'
              }`}
          >
            <Utensils size={16} />
            ALL
          </button>
          <button
            onClick={() => onCategoryChange('MAKANAN')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-wide uppercase transition-all duration-200 cursor-pointer ${selectedCategory === 'MAKANAN'
              ? 'bg-ink text-canvas'
              : 'bg-soft-cloud text-ink hover:bg-hairline-soft'
              }`}
          >
            <Utensils size={16} />
            FOOD
          </button>
          <button
            onClick={() => onCategoryChange('MINUMAN')}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-wide uppercase transition-all duration-200 cursor-pointer ${selectedCategory === 'MINUMAN'
              ? 'bg-ink text-canvas'
              : 'bg-soft-cloud text-ink hover:bg-hairline-soft'
              }`}
          >
            <Coffee size={16} />
            DRINK
          </button>
        </div>
      </div>
    </div>
  )
}

