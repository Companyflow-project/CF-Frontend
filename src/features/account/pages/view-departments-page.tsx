import React, { useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { ArrowLeft, ArrowUpDown, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useDepartments } from '@/features/departments/hooks';
import { useAuth } from '@/context/auth-context';
import { HelpBanner } from '@/components/ui/help-banner';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/api\/?$/, '');

export const ViewDepartmentsPage: React.FC = () => {
    const navigate = useNavigate();
    const [sortBy, setSortBy] = useState('name');
    const { user } = useAuth();
    const companyId = user?.companyId ? String(user.companyId) : undefined;

    const { data: departments, isLoading } = useDepartments(companyId);

    const departmentRows = departments || [];

    const getFullLogoUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    };

    return (
        <PageShell>
            <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/account')}
                            className="h-9 px-3"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-[#0d0e0e]">Departments - All Departments</h1>
                    </div>
                    <Button
                        variant="link"
                        onClick={() => navigate('/account/departments/add')}
                        className="text-[#0d0e0e] underline"
                    >
                        Add New Department
                    </Button>
                </div>

                {/* Help Banner */}
                <HelpBanner className="mb-6">
                    Here you can view all departments in your organization. Click on a department to edit its details, or use the "Add New Department" button to create a new one.
                </HelpBanner>

                {/* Sort Controls */}
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-medium text-[#0d0e0e]">Sort</span>
                    <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-[180px]">
                        <option value="name">Name</option>
                        <option value="managerName">Manager</option>
                        <option value="email">Email</option>
                    </Select>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Departments Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="w-[60px]"></TableHead>
                            <TableHead className="font-semibold text-[#0d0e0e]">Name</TableHead>
                            <TableHead className="font-semibold text-[#0d0e0e]">Manager</TableHead>
                            <TableHead className="font-semibold text-[#0d0e0e]">Email</TableHead>
                            <TableHead className="font-semibold text-[#0d0e0e]">Description</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Loading departments...
                                </TableCell>
                            </TableRow>
                        ) : departmentRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No departments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            departmentRows.map((dept) => (
                                <TableRow key={dept.id} className="hover:bg-gray-50">
                                    <TableCell>
                                        {dept.logoUrl && (
                                            <img
                                                src={getFullLogoUrl(dept.logoUrl)!}
                                                alt={dept.name}
                                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium text-[#0d0e0e] whitespace-nowrap">{dept.name}</TableCell>
                                    <TableCell className="text-gray-700 whitespace-nowrap">{dept.managerName || '-'}</TableCell>
                                    <TableCell className="text-gray-700 whitespace-nowrap">{dept.email || '-'}</TableCell>
                                    <TableCell className="text-gray-700 whitespace-normal min-w-[250px]">{dept.description || '-'}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                navigate(`/account/departments/edit/${dept.id}`, {
                                                    state: { department: dept },
                                                })
                                            }
                                            className="h-8 w-8 p-0 text-[#2f946f] hover:text-[#2f946f]/80 hover:bg-[#2f946f]/10"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </PageShell>
    );
};
