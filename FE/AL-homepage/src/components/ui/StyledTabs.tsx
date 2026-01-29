// src/components/ui/StyledTabs.tsx
import { type ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs'
import { cn } from '../../utils/cn'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface StyledTabsProps {
  tabs: Tab[]
  defaultTabId?: string
}

export default function StyledTabs({ tabs, defaultTabId }: StyledTabsProps) {
  if (tabs.length === 0) {
    return null
  }

  const defaultTab = defaultTabId || tabs[0].id

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="flex justify-start h-auto p-0 bg-transparent border-b border-gray-200 rounded-none">
        {tabs.map(tab => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              // 기본 스타일
              'flex-shrink-0 rounded-b-none px-4 py-2 -mb-px text-gray-600 bg-transparent shadow-none ring-offset-0 focus-visible:ring-0 transition-all duration-200',
              // 호버 스타일
              'hover:-translate-y-1 hover:bg-blue-500 hover:text-white hover:shadow-md',
              // 활성 상태 스타일
              'data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none',
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id} className="p-6 mt-0">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
