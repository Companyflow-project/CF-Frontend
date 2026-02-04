import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface AddExternalContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: any) => void;
}

export const AddExternalContactModal: React.FC<AddExternalContactModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telephone: '',
    areas: [] as string[],
  });

  const areas = [
    'Human Resources',
    'Finance',
    'Operations',
    'Sales',
    'Marketing',
    'IT',
  ];

  const handleAreaToggle = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter((a) => a !== area)
        : [...prev.areas, area],
    }));
  };

  const handleSubmit = () => {
    onConfirm(formData);
    onOpenChange(false);
    setFormData({ name: '', email: '', telephone: '', areas: [] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add External Contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="telephone">Telephone</Label>
            <Input
              id="telephone"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
          </div>
          <div>
            <Label>Areas of responsibility</Label>
            <div className="mt-2 space-y-2">
              {areas.map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={`area-${area}`}
                    checked={formData.areas.includes(area)}
                    onChange={() => handleAreaToggle(area)}
                  />
                  <Label htmlFor={`area-${area}`} className="font-normal">
                    {area}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Contact</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

