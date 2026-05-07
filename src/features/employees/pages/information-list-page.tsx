import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { useEmployees, useCompany, useCompanyInfoListLinks } from '@/lib/api-hooks';
import { transformEmployee, type BackendEmployeeLike } from '@/lib/api-transformers';
import { employeesRoutes } from '../routes';
import { handbookRoutes } from '@/features/handbook/routes';
import { adminRoutes } from '@/features/admin/routes';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { isAdminRole } from '@/lib/utils';

export const InformationListPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('employees');
    const { user } = useAuth();
    const isAdmin = isAdminRole(user?.role);
    const companyId = user?.companyId ? String(user.companyId) : null;

    const { data: company } = useCompany(companyId);
    const { data: companyLinks } = useCompanyInfoListLinks(companyId);
    const { data: apiEmployees, loading: employeesLoading, error: employeesError } = useEmployees({ limit: 1000 });

    // Flatten the saved company links into rows for the General links table.
    const generalLinks: Array<{ key: string; label: string; href: string }> = [];
    if (companyLinks) {
        if (companyLinks.homepage) generalLinks.push({ key: 'homepage', label: t('infoList.linkHomepage', 'Homepage'), href: companyLinks.homepage });
        if (companyLinks.drivesheet) generalLinks.push({ key: 'drivesheet', label: t('infoList.linkDrivesheet', 'Drivesheet'), href: companyLinks.drivesheet });
        if (companyLinks.firePlan) generalLinks.push({ key: 'firePlan', label: t('infoList.linkFirePlan', 'Fire plan'), href: companyLinks.firePlan });
        if (companyLinks.gdpr) generalLinks.push({ key: 'gdpr', label: t('infoList.linkGdpr', 'GDPR'), href: companyLinks.gdpr });
        if (companyLinks.intranet) generalLinks.push({ key: 'intranet', label: t('infoList.linkIntranet', 'Intranet'), href: companyLinks.intranet });
        if (companyLinks.timesheet) generalLinks.push({ key: 'timesheet', label: t('infoList.linkTimesheet', 'Timesheet'), href: companyLinks.timesheet });
    }

    const [linksOpen, setLinksOpen] = useState(true);
    const [employeesOpen, setEmployeesOpen] = useState(true);

    const employees = (apiEmployees ?? [])
        .map((e) => transformEmployee(e as unknown as BackendEmployeeLike))
        .filter((e) => e.isPublic !== false);

    const companyName = company?.name ?? '';

    const handleEditLinks = () => {
        if (!companyId) return;
        // Land on the admin edit page anchored to the Links section. The
        // page's existing location.hash effect scrolls it into view.
        navigate(`${adminRoutes.companyEdit.replace(':id', companyId)}#links-section`);
    };

    const handleEditEmployees = () => {
        // The user's Manage Employees page (admins use the same route).
        navigate(employeesRoutes.list);
    };

    const handleEntireHandbook = () => {
        navigate(handbookRoutes.tableOfContents);
    };

    return (
        <PageShell>
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Breadcrumb */}
                <div className="text-sm text-gray-500">
                    <Link to="/" className="hover:underline">{t('infoList.console', 'Console')}</Link>
                    <span className="mx-1">›</span>
                    <span className="text-gray-700">{t('infoList.title', 'Info List')}</span>
                </div>

                {/* Page title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e]">
                    {t('infoList.heading', 'Info list')}
                </h1>

                {/* Links card */}
                <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                    <header className="flex items-center justify-between px-5 sm:px-6 py-4">
                        <button
                            type="button"
                            className="flex items-center gap-2 text-base font-semibold text-[#0d0e0e]"
                            onClick={() => setLinksOpen((v) => !v)}
                            aria-expanded={linksOpen}
                        >
                            {linksOpen ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                            {t('infoList.linksTitle', 'Links')}
                        </button>
                        {isAdmin && (
                            <Button
                                size="sm"
                                className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90 rounded-lg"
                                onClick={handleEditLinks}
                                disabled={!companyId}
                            >
                                {t('infoList.editLinks', 'Edit links')}
                            </Button>
                        )}
                    </header>
                    {linksOpen && (
                        <div className="border-t border-gray-100">
                            <div className="bg-gray-50 px-5 sm:px-6 py-3 text-sm font-semibold text-[#0d0e0e]">
                                {t('infoList.generalLinks', 'General links')}
                            </div>
                            <ul className="divide-y divide-gray-100">
                                <li className="px-5 sm:px-6 py-3 text-sm">
                                    <Link to="/" className="text-blue-600 hover:underline">
                                        {t('infoList.home', 'Home')}
                                    </Link>
                                </li>
                                {generalLinks.map((link) => (
                                    <li key={link.key} className="px-5 sm:px-6 py-3 text-sm">
                                        <a
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                            {companyLinks?.additionalInfo && (
                                <div className="px-5 sm:px-6 py-3 text-sm text-gray-700 border-t border-gray-100 whitespace-pre-line">
                                    {companyLinks.additionalInfo}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Employees card */}
                <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                    <header className="flex items-center justify-between px-5 sm:px-6 py-4">
                        <button
                            type="button"
                            className="flex items-center gap-2 text-base font-semibold text-[#0d0e0e]"
                            onClick={() => setEmployeesOpen((v) => !v)}
                            aria-expanded={employeesOpen}
                        >
                            {employeesOpen ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                            {companyName
                                ? t('infoList.employeesAt', 'Employees at {{company}}', { company: companyName })
                                : t('infoList.employees', 'Employees')}
                        </button>
                        {isAdmin && (
                            <Button
                                size="sm"
                                className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90 rounded-lg"
                                onClick={handleEditEmployees}
                            >
                                {t('infoList.editEmployees', 'Edit employees')}
                            </Button>
                        )}
                    </header>
                    {employeesOpen && (
                        <div className="border-t border-gray-100">
                            <p className="px-5 sm:px-6 pt-4 text-sm text-gray-600">
                                {t(
                                    'infoList.adminListNote',
                                    'You may see this list — or see more names in the list than employees do — because you have permission to manage it.',
                                )}
                            </p>
                            <div className="px-2 sm:px-4 pb-4 pt-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="text-xs font-semibold text-[#0d0e0e]">
                                                {t('infoList.colName', 'Name')}
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold text-[#0d0e0e]">
                                                {t('infoList.colEmail', 'Email')}
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold text-[#0d0e0e]">
                                                {t('infoList.colTelephone', 'Telephone')}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employeesLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="py-6 text-center text-sm text-gray-500">
                                                    {t('infoList.loading', 'Loading…')}
                                                </TableCell>
                                            </TableRow>
                                        ) : employeesError ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="py-6 text-center text-sm text-red-500">
                                                    {employeesError.message}
                                                </TableCell>
                                            </TableRow>
                                        ) : employees.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="py-6 text-center text-sm text-gray-500">
                                                    {t('infoList.noEmployees', 'No employees')}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            employees.map((emp) => {
                                                const phone = emp.telephone || emp.mobileNumber || emp.alternateNumber || '';
                                                return (
                                                    <TableRow key={emp.id} className="border-t border-gray-100">
                                                        <TableCell className="text-sm text-[#0d0e0e]">{emp.name}</TableCell>
                                                        <TableCell className="text-sm">
                                                            {emp.email ? (
                                                                <a
                                                                    href={`mailto:${emp.email}`}
                                                                    className="text-blue-600 hover:underline"
                                                                >
                                                                    {emp.email}
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-400">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-[#0d0e0e]">
                                                            {phone || <span className="text-gray-400">—</span>}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </section>

                {/* Bottom-right action */}
                <div className="flex justify-end pt-2">
                    <Button
                        size="sm"
                        className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90 rounded-lg"
                        onClick={handleEntireHandbook}
                    >
                        {t('infoList.entireHandbook', 'The entire handbook')}
                    </Button>
                </div>
            </div>
        </PageShell>
    );
};
