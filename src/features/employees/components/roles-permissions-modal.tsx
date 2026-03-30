import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { employeesRoutes } from '../routes';
import { useEmployeesAll } from '@/lib/api-hooks';
import { ShieldCheck, Search, ChevronRight, Loader2 } from 'lucide-react';

interface RolesPermissionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const initials = (name: string) =>
    name
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('');

export const RolesPermissionsModal: React.FC<RolesPermissionsModalProps> = ({
    open,
    onOpenChange,
}) => {
    const navigate = useNavigate();
    const { data: employees, loading } = useEmployeesAll();
    const [search, setSearch] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    // Reset search when modal opens
    useEffect(() => {
        if (open) {
            setSearch('');
            setTimeout(() => searchRef.current?.focus(), 80);
        }
    }, [open]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = employees ?? [];
        if (!q) return list;
        return list.filter(
            (e) =>
                e.name?.toLowerCase().includes(q) ||
                e.email?.toLowerCase().includes(q),
        );
    }, [employees, search]);

    const handleSelect = (employeeId: string) => {
        onOpenChange(false);
        // Navigate to the edit page and append #permissions so the page can
        // scroll to / highlight the permissions section automatically.
        navigate(`${employeesRoutes.edit(employeeId)}#permissions`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] p-0 rounded-[20px] overflow-hidden border border-[#e5efea] shadow-[0_20px_60px_rgba(14,51,38,0.15)] flex flex-col max-h-[85vh]">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5efea] bg-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-[12px] bg-[#d4f4e6] flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="h-5 w-5 text-[#1a5948]" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-[#0d0e0e]">
                                Roles &amp; permissions
                            </DialogTitle>
                            <p className="text-xs text-[#6b7280] mt-0.5">
                                Select an employee to manage their role and permissions
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                {/* Search */}
                <div className="px-4 py-3 border-b border-[#f3f4f6] flex-shrink-0 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-9 pr-3 text-sm bg-[#f9fafb] rounded-[10px] border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#3d997d]/20 focus:border-[#3d997d] placeholder:text-[#9ca3af]"
                        />
                    </div>
                </div>

                {/* Employee list */}
                <div className="overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-[#9ca3af] gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading employees…</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-12 text-center text-sm text-[#9ca3af]">
                            {search ? 'No employees match your search' : 'No employees found'}
                        </div>
                    ) : (
                        <ul className="py-2">
                            {filtered.map((emp) => {
                                const id = String(emp.id);
                                return (
                                    <li key={id}>
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(id)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#f6fbf9] transition-colors group"
                                        >
                                            {/* Avatar */}
                                            <span className="h-9 w-9 rounded-full bg-[#e8f5ef] text-[#1a5948] text-xs font-bold flex items-center justify-center flex-shrink-0 group-hover:bg-[#d4f4e6] transition-colors">
                                                {initials(emp.name ?? '')}
                                            </span>

                                            {/* Name + email */}
                                            <span className="flex-1 min-w-0">
                                                <span className="text-sm font-medium text-[#0d0e0e] block truncate">
                                                    {emp.name}
                                                </span>
                                                {emp.email && (
                                                    <span className="text-xs text-[#6b7280] block truncate">
                                                        {emp.email}
                                                    </span>
                                                )}
                                            </span>

                                            {/* Inactive badge */}
                                            {emp.status === 'INACTIVE' && (
                                                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] bg-[#f3f4f6] rounded-full px-2 py-0.5 flex-shrink-0">
                                                    Inactive
                                                </span>
                                            )}

                                            {/* Employment type badge */}
                                            {emp.employmentType && emp.employmentType !== 'N/A' && (
                                                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#3d997d] bg-[#e8f5ef] rounded-full px-2 py-0.5 flex-shrink-0">
                                                    {emp.employmentType}
                                                </span>
                                            )}

                                            <ChevronRight className="h-4 w-4 text-[#9ca3af] group-hover:text-[#3d997d] transition-colors flex-shrink-0" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
