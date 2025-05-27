// src/components/ui/CategorySidebar.tsx
import React, { useState } from 'react';

interface Category {
  id: string;
  name: string;
  count: number;
  icon?: React.ReactNode;
  subcategories?: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory?: string;
  selectedSubcategory?: string;
  onCategorySelect: (categoryId: string) => void;
  onSubcategorySelect: (subcategoryId: string) => void;
  title?: string;
  className?: string;
  collapsible?: boolean;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  onSubcategorySelect,
  title = "Categorías",
  className = '',
  collapsible = false
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-(--color-text-main) dark:text-white mb-4">
        {title}
      </h3>
      
      <div className="space-y-2">
        {/* All categories option */}
        <button
          onClick={() => onCategorySelect('')}
          className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
            !selectedCategory 
              ? 'bg-(--color-accent-1) text-(--color-text-main)' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-(--color-text-secondary) dark:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7l2 2-2 2M5 13l-2 2 2 2" />
            </svg>
            <span>Todas las categorías</span>
          </div>
          <span className="text-sm opacity-75">
            {categories.reduce((sum, cat) => sum + cat.count, 0)}
          </span>
        </button>

        {/* Category list */}
        {categories.map((category) => (
          <div key={category.id} className="space-y-1">
            <button
              onClick={() => {
                onCategorySelect(category.id);
                if (category.subcategories && collapsible) {
                  toggleCategory(category.id);
                }
              }}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                selectedCategory === category.id 
                  ? 'bg-(--color-accent-1) text-(--color-text-main)' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-(--color-text-secondary) dark:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {category.icon && (
                  <span className="h-5 w-5 flex items-center justify-center">
                    {category.icon}
                  </span>
                )}
                <span>{category.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-75">{category.count}</span>
                {category.subcategories && collapsible && (
                  <svg 
                    className={`h-4 w-4 transition-transform ${
                      expandedCategories.has(category.id) ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </button>

            {/* Subcategories */}
            {category.subcategories && (
              <div className={`ml-4 space-y-1 ${
                collapsible ? (expandedCategories.has(category.id) ? 'block' : 'hidden') : 'block'
              }`}>
                {category.subcategories.map((subcategory) => (
                  <button
                    key={subcategory.id}
                    onClick={() => onSubcategorySelect(subcategory.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors text-sm ${
                      selectedSubcategory === subcategory.id 
                        ? 'bg-(--color-accent-1) text-(--color-text-main)' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-(--color-text-secondary) dark:text-gray-300'
                    }`}
                  >
                    <span>{subcategory.name}</span>
                    <span className="opacity-75">{subcategory.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};