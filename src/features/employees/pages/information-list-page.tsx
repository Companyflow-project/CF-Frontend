import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useEmployees } from '@/lib/api-hooks';
import { transformEmployee, type BackendEmployeeLike } from '@/lib/api-transformers';
import { employeesRoutes } from '../routes';
import { ArrowLeft, Search, ArrowUpDown, ArrowDownWideNarrow, Edit } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';

export const InformationListPage: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const { data: apiEmployees, loading, error } = useEmployees({ limit: 1000 });

    const employees = useMemo(() => {
        if (!apiEmployees) return [];
        const allEmployees = (apiEmployees as unknown as BackendEmployeeLike[]).map(transformEmployee);
        // Info list only shows public profiles — private employees appear in Manage Employees but not here
        return allEmployees.filter((emp) => emp.isPublic !== false);
    }, [apiEmployees]);

    const filteredEmployees = useMemo(() => {
        if (!search.trim()) return employees;
        const q = search.trim().toLowerCase();
        return employees.filter(
            (emp) =>
                emp.name.toLowerCase().includes(q) ||
                emp.email.toLowerCase().includes(q) ||
                (emp.telephone && emp.telephone.includes(q)) ||
                (emp.mobileNumber && emp.mobileNumber.includes(q))
        );
    }, [employees, search]);

    return (
        <PageShell>
            {/* Page header — back button + title */}
            <div className="flex items-center gap-3 mb-6">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(employeesRoutes.list)}
                    className="flex items-center gap-1.5 rounded-[10px] border-[rgba(15,23,42,0.12)] text-[#0d0e0e] h-9 px-3 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span className="text-[13px] font-medium">Back</span>
                </Button>
                <h1 className="text-2xl font-bold text-[#0d0e0e] tracking-tight">Information List</h1>
            </div>

            {/* Help banner */}
            <div className="mb-6 bg-[#fff9f0] rounded-[16px] border border-[#f59e0b] border-l-[6px] shadow-[0_18px_40px_rgba(219,145,0,0.15)] px-5 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-sm text-[#0d0e0e]">
                        <span className="font-bold">Help.</span>{' '}
                        Here you can view all employees and assign them these employment type.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] hover:bg-[#f0f7f5] rounded-[10px] px-[11px] py-[9px] h-auto whitespace-nowrap self-start sm:self-auto"
                    >
                        User manual
                    </Button>
                </div>
            </div>

            {/* Main card */}
            <Card className="bg-white border border-[#e5efea] rounded-[22px] shadow-[0_18px_45px_rgba(14,51,38,0.08)] flex flex-col overflow-hidden">
                <CardContent className="pt-5 pb-5 flex flex-col gap-4">

                    {/* Sort + search toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#0d0e0e]">Sort</span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-[rgba(15,23,42,0.18)] text-[#242727] rounded-[10px] px-4 py-[9px] h-auto bg-white shadow-[0_6px_14px_rgba(15,23,42,0.05)]"
                            >
                                Name
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-[#707677] rounded-full bg-white shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
                                aria-label="Toggle sort direction"
                            >
                                <ArrowUpDown className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-[#1a5948] rounded-full bg-white shadow-[0_6px_14px_rgba(28,91,72,0.25)]"
                                aria-label="Advanced sort"
                            >
                                <ArrowDownWideNarrow className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-auto sm:min-w-[280px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8a85]" />
                            <Input
                                placeholder="Search contacts (name, email, phone)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-10 rounded-[999px] border border-[#c8d8d3] bg-white text-sm w-full"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-sm text-[#6b7475]">
                            Loading employees…
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-12 text-sm text-red-500">
                            Failed to load: {error.message}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="w-full table-fixed text-[13px]">
                                <TableHeader className="bg-[#f5fbf8]">
                                    <TableRow className="border-b border-[#dbe8e1]">
                                        <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[18%]">
                                            <div className="flex items-center gap-1">
                                                Name
                                                <span className="text-[#f77c19] text-xs">↑</span>
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[22%]">
                                            Email
                                        </TableHead>
                                        <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[15%]">
                                            Telephone
                                        </TableHead>
                                        <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[18%]">
                                            Relative
                                        </TableHead>
                                        <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[18%]">
                                            Relative Contact
                                        </TableHead>
                                        <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[9%] text-center">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEmployees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6}>
                                                <EmptyState
                                                    title="No employees found"
                                                    description="Try adjusting your search."
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEmployees.map((employee) => {
                                            const phone =
                                                employee.telephone ||
                                                employee.mobileNumber ||
                                                employee.alternateNumber;

                                            // The Employee model doesn't have relative fields yet —
                                            // these will be populated once the backend exposes them.
                                            // We fall back gracefully to "Not available" for now.
                                            const relativeName: string | undefined =
                                                (employee as unknown as Record<string, unknown>)['emergencyContactName'] as string | undefined;
                                            const relativeContact: string | undefined =
                                                (employee as unknown as Record<string, unknown>)['emergencyContactMobile'] as string | undefined;

                                            return (
                                                <TableRow
                                                    key={employee.id}
                                                    className="border-b border-[#ebf3ef] hover:bg-[#f6fbf9]"
                                                >
                                                    <TableCell className="w-[18%]">
                                                        <span className="font-medium text-[#111827] truncate block" title={employee.name}>
                                                            {employee.name}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="w-[22%] text-[#111b18] break-words">
                                                        <div className="line-clamp-2" title={employee.email}>
                                                            {employee.email || <span className="text-[#9fa4a4]">Not available</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="w-[15%]">
                                                        {phone ? (
                                                            <span className="text-[#111b18]">{phone}</span>
                                                        ) : (
                                                            <span className="text-[#9fa4a4]">Not available</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="w-[18%]">
                                                        {relativeName ? (
                                                            <span className="text-[#111b18]">{relativeName}</span>
                                                        ) : (
                                                            <span className="text-[#9fa4a4]">Not available</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="w-[18%]">
                                                        {relativeContact ? (
                                                            <span className="text-[#111b18]">{relativeContact}</span>
                                                        ) : (
                                                            <span className="text-[#9fa4a4]">Not available</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="w-[9%] text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-md bg-[#e7f5ef] text-[#2c7860] hover:bg-[#d0ebe0] mx-auto"
                                                            aria-label="Edit employee"
                                                            onClick={() => navigate(employeesRoutes.edit(employee.id))}
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Footer actions */}
            <div className="mt-5 flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={() => navigate(employeesRoutes.informationListLinks)}
                    className="border-[rgba(15,23,42,0.12)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-[13.3px] bg-white"
                >
                    Edit Links
                </Button>
                <Button
                    onClick={() => navigate(employeesRoutes.list)}
                    className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[999px] px-5 py-[11px] h-auto text-[13.3px] shadow-[0_10px_20px_rgba(23,102,79,0.35)]"
                >
                    Edit Employees
                </Button>
            </div>
        </PageShell>
    );
};
