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
        <TabsList className="w-full sm:w-auto min-w-max">
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="whitespace-nowrap">
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
};

