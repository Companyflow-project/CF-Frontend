import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

export const HandbookEditor: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [textOption, setTextOption] = useState('companyflow');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Page</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="title">Heading</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter page title..."
          />
        </div>
        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="Enter page content..."
          />
        </div>
        <div>
          <Label>Text Options</Label>
          <RadioGroup value={textOption} onValueChange={setTextOption}>
            <RadioGroupItem value="companyflow">Use CompanyFlow text</RadioGroupItem>
            <RadioGroupItem value="mixed">
              Use CompanyFlow text & your own
            </RadioGroupItem>
            <RadioGroupItem value="own">Use your own text</RadioGroupItem>
          </RadioGroup>
        </div>
        <Accordion type="multiple" defaultValue={[]}>
          <AccordionItem value="pictures">
            <AccordionTrigger>Pictures</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm">Upload Image</Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="documents">
            <AccordionTrigger>Documents</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm">Upload Document</Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="links">
            <AccordionTrigger>Links</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <Input placeholder="Enter URL..." />
                <Button variant="outline" size="sm">Add Link</Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="responsible">
            <AccordionTrigger>Responsible</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <Input placeholder="Enter responsible person..." />
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="notes">
            <AccordionTrigger>Notes</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <Textarea placeholder="Enter notes..." rows={3} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

