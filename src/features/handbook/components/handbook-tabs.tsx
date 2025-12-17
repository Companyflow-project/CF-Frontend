import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HandbookSection } from '@/types/models';

interface HandbookTabsProps {
  sections: HandbookSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  children: React.ReactNode;
}

export const HandbookTabs: React.FC<HandbookTabsProps> = ({
  sections,
  activeSection,
  onSectionChange,
  children,
}) => {
  return (
    <Tabs value={activeSection} onValueChange={onSectionChange}>
      <div className="overflow-x-auto">
        <TabsList className="w-full sm:w-auto min-w-max bg-transparent p-0 flex flex-wrap gap-2 h-auto rounded-none">
          {sections.map((section) => (
            <TabsTrigger
              key={section.id}
              value={section.id}
              className="whitespace-nowrap rounded-[999px] border border-[#d6e8e1] px-4 py-2 text-sm font-semibold text-[#0d0e0e] data-[state=active]:bg-[#e2f2ec] data-[state=active]:border-[#1a5948]"
            >
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
};
