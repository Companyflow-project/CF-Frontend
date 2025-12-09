import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Upload } from 'lucide-react';

export const AddEmployeeForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    alternateNumber: '',
    emergencyName: '',
    emergencyMobile: '',
    employmentType: 'none',
    status: true,
    sendEmail: 'no',
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Employee contact information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center flex-col cursor-pointer hover:bg-gray-50">
              <Upload className="h-6 w-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-400">Upload</span>
            </div>
            <div className="flex-1 space-y-4">
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
            </div>
          </div>
          <div>
            <Label htmlFor="mobileNumber">Mobile number</Label>
            <Input
              id="mobileNumber"
              value={formData.mobileNumber}
              onChange={(e) =>
                setFormData({ ...formData, mobileNumber: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="alternateNumber">Alternate number</Label>
            <Input
              id="alternateNumber"
              value={formData.alternateNumber}
              onChange={(e) =>
                setFormData({ ...formData, alternateNumber: e.target.value })
              }
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="public-info" />
            <Label htmlFor="public-info">Make information public</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency contact information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="emergencyName">Name</Label>
            <Input
              id="emergencyName"
              value={formData.emergencyName}
              onChange={(e) =>
                setFormData({ ...formData, emergencyName: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="emergencyMobile">Mobile number</Label>
            <Input
              id="emergencyMobile"
              value={formData.emergencyMobile}
              onChange={(e) =>
                setFormData({ ...formData, emergencyMobile: e.target.value })
              }
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="public-emergency" />
            <Label htmlFor="public-emergency">Make information public</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employment type, permissions & notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Employment type</Label>
            <RadioGroup
              value={formData.employmentType}
              onValueChange={(value) =>
                setFormData({ ...formData, employmentType: value })
              }
            >
              <RadioGroupItem value="none">No employment type</RadioGroupItem>
            </RadioGroup>
          </div>
            <div className="flex items-center justify-between">
            <Label>Status</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.checked })
                }
              />
              <span className="text-sm">Active</span>
            </div>
          </div>
          <div>
            <Label>Permissions</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="senior" />
                <Label htmlFor="senior">Senior employee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="admin" />
                <Label htmlFor="admin">Business administrator</Label>
              </div>
            </div>
          </div>
          <div>
            <Label>Send email to employee</Label>
            <RadioGroup
              value={formData.sendEmail}
              onValueChange={(value) =>
                setFormData({ ...formData, sendEmail: value })
              }
            >
              <RadioGroupItem value="no">No</RadioGroupItem>
              <RadioGroupItem value="standard">Standard</RadioGroupItem>
              <RadioGroupItem value="customized">Customized</RadioGroupItem>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

