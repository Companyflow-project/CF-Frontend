import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Search } from 'lucide-react';
import { useEmployees } from '@/lib/api-hooks';
import { useAuth } from '@/context/auth-context';
import { useAssignEmploymentType } from '@/features/employment-types/hooks';
import { toast } from 'sonner';

export const AssignEmploymentTypePage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();

    // Get employment type info from navigation state
    const typeName = location.state?.typeName || 'Employment Type';

    const [search, setSearch] = useState('');
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

    const { user } = useAuth();
    const companyId = user?.companyId ? String(user.companyId) : undefined;

    const { data: employees, loading } = useEmployees({ companyId, search });
    const assignMutation = useAssignEmploymentType();

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = employees?.map(emp => emp.id) || [];
            setSelectedEmployeeIds(allIds);
        } else {
            setSelectedEmployeeIds([]);
        }
    };

    const handleSelectEmployee = (employeeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedEmployeeIds(prev => [...prev, employeeId]);
        } else {
            setSelectedEmployeeIds(prev => prev.filter(id => id !== employeeId));
        }
    };

    const handleAssign = async () => {
        if (!id) {
            toast.error('Employment type ID is missing');
            return;
        }

        if (selectedEmployeeIds.length === 0) {
            toast.error('Please select at least one employee');
            return;
        }

        try {
            const result = await assignMutation.mutateAsync({
                employeeIds: selectedEmployeeIds.map(id => parseInt(id, 10)),
                employmentTypeId: parseInt(id, 10),
            });

            toast.success(result.message || `${typeName} assigned successfully to ${selectedEmployeeIds.length} employee(s)`);
            setSelectedEmployeeIds([]);

            // Navigate back to employment types page
            navigate('/account/employment-types');
        } catch (error) {
            console.error('Failed to assign employment type:', error);
            toast.error('Failed to assign employment type. Please try again.');
        }
    };

    return (
        <PageShell>
            <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/account/employment-types')}
                            className="h-9 px-3"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-[#0d0e0e]">
                            {typeName} - Assign Employment Type
                        </h1>
                    </div>
                </div>

                {/* Help Banner */}
                <div className="mb-6 bg-[#fff9f0] rounded-lg border-l-4 border-[#f59e0b] p-4 flex items-start justify-between">
                    <p className="text-sm text-[#0d0e0e]">
                        <span className="font-bold">Help.</span> Here you can view all employees and assign them these employment type.
                    </p>
                    <Button
                        variant="link"
                        className="text-[#0d0e0e] underline whitespace-nowrap"
                    >
                        User manual
                    </Button>
                </div>

                {/* Search and Sort */}
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-medium text-[#0d0e0e]">Sort</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Name</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            ↕
                        </Button>
                    </div>
                    <div className="ml-auto relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search employees (name, email, phone)"
                            className="pl-10 w-[300px]"
                        />
                    </div>
                </div>
            </div>

            {/* Employees Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={!!(employees && employees.length > 0 && selectedEmployeeIds.length === employees.length)}
                                    onChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="font-semibold text-[#0d0e0e]">Name</TableHead>
                            <TableHead className="font-semibold text-[#0d0e0e]">Email</TableHead>
                            <TableHead className="font-semibold text-[#0d0e0e]">Telephone</TableHead>
                            <TableHead className="font-semibold text-[#0d0e0e]">Employment</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    Loading employees...
                                </TableCell>
                            </TableRow>
                        ) : !employees || employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    No employees found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((employee) => (
                                <TableRow key={employee.id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedEmployeeIds.includes(employee.id)}
                                            onChange={(e) => handleSelectEmployee(employee.id, e)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-[#0d0e0e]">
                                        {employee.name}
                                    </TableCell>
                                    <TableCell className="text-gray-700">{employee.email}</TableCell>
                                    <TableCell className="text-gray-700">{employee.telephone || employee.mobileNumber || '-'}</TableCell>
                                    <TableCell className="text-gray-700">{employee.employmentType || '-'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer with Assign Button */}
            <div className="mt-6 flex justify-end">
                <Button
                    onClick={handleAssign}
                    disabled={selectedEmployeeIds.length === 0 || assignMutation.isPending}
                    className="px-8"
                    style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
                >
                    {assignMutation.isPending ? 'Assigning...' : 'Assign employment type'}
                </Button>
            </div>
        </PageShell>
    );
};
