import React, { useState, useRef, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { Edit, MessageSquare, BarChart3, Trash2, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Employee } from '@/types/models';
import { formatRelativeTime, isAdminEmployeeRole } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

/** All languages that can be assigned to employees. */
const ALL_LANGUAGES: readonly { code: string; label: string; flag: string; isDefault?: boolean }[] = [
  { code: 'da', label: 'Danish', flag: '\u{1F1E9}\u{1F1F0}', isDefault: true },
  { code: 'en', label: 'English (US)', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'en-uk', label: 'English (UK)', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'nl', label: 'Dutch', flag: '\u{1F1F3}\u{1F1F1}' },
  { code: 'fr', label: 'French', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'de', label: 'German', flag: '\u{1F1E9}\u{1F1EA}' },
];

const LANG_FLAG_MAP = Object.fromEntries(ALL_LANGUAGES.map(l => [l.code, l.flag]));

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
function resolvePhotoUrl(uri: string | null | undefined): string | null {
  if (!uri) return null;
  if (uri.startsWith('blob:') || uri.startsWith('http') || uri.startsWith('data:')) return uri;
  const base = API_ORIGIN.replace(/\/api\/?$/, '');
  return `${base}${uri}`;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

const EmployeeAvatar: React.FC<{ name: string; photoUri?: string | null }> = ({ name, photoUri }) => {
  const url = resolvePhotoUrl(photoUri);
  const [imgFailed, setImgFailed] = React.useState(false);
  const initials = getInitials(name) || '?';

  if (url && !imgFailed) {
    return (
      <img
        src={url}
        alt={name}
        className="h-8 w-8 rounded-full object-cover shrink-0"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <div className="h-8 w-8 rounded-full bg-[#d4f4e6] text-[#1a5948] flex items-center justify-center text-xs font-semibold shrink-0">
      {initials}
    </div>
  );
};

/** Inline language quick-add dropdown */
const LanguageQuickAdd: React.FC<{
  employeeId: string;
  currentLangs: string[];
  companyLangs: string[];
  onSave: (id: string, languages: string[]) => void;
}> = ({ employeeId, currentLangs, companyLangs, onSave }) => {
  const { t } = useTranslation('employees');
  const [open, setOpen] = useState(false);
  const [langs, setLangs] = useState(currentLangs);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLangs(currentLangs);
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, currentLangs]);

  const handleToggle = (code: string) => {
    if (code === 'da') return;
    const next = langs.includes(code) ? langs.filter(l => l !== code) : [...langs, code];
    setLangs(next);
  };

  const handleSave = () => {
    onSave(employeeId, langs);
    setOpen(false);
  };

  const available = ALL_LANGUAGES.filter(l => companyLangs.includes(l.code));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="h-6 w-6 rounded-full border border-dashed border-[#3d997d] flex items-center justify-center text-[#3d997d] hover:bg-[#e7f5ef] transition-colors"
        title={t('table.addLanguage')}
      >
        <Plus className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
          {available.map(lang => {
            const checked = langs.includes(lang.code);
            const isDa = lang.code === 'da';
            return (
              <label
                key={lang.code}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 ${isDa ? 'opacity-60 cursor-default' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isDa}
                  onChange={() => handleToggle(lang.code)}
                  className="h-3.5 w-3.5 accent-[#3d997d]"
                />
                <span>{lang.flag}</span>
                <span className="text-xs">{lang.label}</span>
              </label>
            );
          })}
          <div className="border-t border-gray-100 mt-1 pt-1 px-3">
            <button
              type="button"
              onClick={handleSave}
              className="w-full text-center text-xs font-medium text-white bg-[#3d997d] rounded-md py-1.5 hover:bg-[#348a6f] transition-colors"
            >
              {t('common:save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface EmployeesTableProps {
  employees: Employee[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onDelete?: (id: string, name: string) => void;
  onEdit?: (id: string) => void;
  onStatistics?: (id: string) => void;
  onMessageLogs?: (id: string) => void;
  onUpdateLanguages?: (id: string, languages: string[]) => void;
  companyLanguages?: string[];
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  /** Email of the currently logged-in user — used to lock self-row actions */
  currentUserEmail?: string;
  /** Role of the currently logged-in user — account_owner can manage all employees */
  currentUserRole?: string;
}

export const EmployeesTable: React.FC<EmployeesTableProps> = ({
  employees,
  selectedIds,
  onSelect,
  onSelectAll,
  onDelete,
  onEdit,
  onStatistics,
  onMessageLogs,
  onUpdateLanguages,
  companyLanguages = ['da'],
  emptyStateTitle = 'No data yet.',
  emptyStateDescription,
  currentUserEmail,
  currentUserRole,
}) => {
  const { t } = useTranslation('employees');
  const viewerIsOwner = currentUserRole === 'account_owner';
  // For the header checkbox: exclude self-row; also exclude admin rows unless the viewer is account_owner
  const selectableEmployees = employees.filter(
    (e) =>
      (!currentUserEmail || e.email.toLowerCase() !== currentUserEmail.toLowerCase()) &&
      (viewerIsOwner || !isAdminEmployeeRole(e.role))
  );
  const allSelected = selectableEmployees.length > 0 && selectableEmployees.every((e) => selectedIds.includes(e.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <div className="w-full overflow-x-auto">
      <Table className="w-full min-w-[860px] text-[13px]">
        <TableHeader className="bg-[#f5fbf8]">
          <TableRow className="border-b border-[#dbe8e1]">
            <TableHead className="w-10 min-w-[40px]">
              <Checkbox
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                className="rounded-[4px] border-[#3d997d] h-4 w-4"
              />
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide min-w-[160px]">
              <div className="flex items-center gap-1 truncate">
                {t('table.colName')}
                <span className="text-[#f77c19] text-xs shrink-0">↑</span>
              </div>
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide min-w-[180px]">
              {t('table.colEmail')}
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide min-w-[110px]">
              {t('table.colTelephone')}
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide min-w-[120px]">
              {t('table.colEmployment')}
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide min-w-[100px]">
              {t('table.colLanguages')}
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide min-w-[110px]">
              {t('table.colRecentVisits')}
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide text-center min-w-[80px] align-middle">
              {t('table.colMessages')}
            </TableHead>
            <TableHead className="text-[#1a5948] font-semibold tracking-wide text-center min-w-[130px] align-middle">
              {t('table.colActions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr]:last:border-b">
          {employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9}>
                <EmptyState title={emptyStateTitle} description={emptyStateDescription} />
              </TableCell>
            </TableRow>
          ) : (
            employees.map((employee) => {
              const phone =
                employee.telephone || employee.mobileNumber || employee.alternateNumber;
              const isSelf = !!(currentUserEmail && employee.email.toLowerCase() === currentUserEmail.toLowerCase());
              const isAdminRow = isAdminEmployeeRole(employee.role);
              const viewerIsOwner = currentUserRole === 'account_owner';
              // account_owner can manage everyone except themselves; others cannot touch admins
              const isProtected = isSelf || (!viewerIsOwner && isAdminRow);

              return (
                <TableRow
                  key={employee.id}
                  className={`border-b border-[#ebf3ef] hover:bg-[#f6fbf9] ${isSelf ? 'bg-[#fafcfb]' : ''}`}
                >
                  <TableCell className="w-10">
                    <Checkbox
                      checked={!isProtected && selectedIds.includes(employee.id)}
                      onChange={() => !isProtected && onSelect(employee.id)}
                      disabled={isProtected}
                      className={`rounded-[4px] h-4 w-4 ${isProtected ? 'border-[#c8d4d0] opacity-40 cursor-not-allowed' : 'border-[#3d997d]'}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5" title={employee.name}>
                      <EmployeeAvatar name={employee.name} photoUri={employee.userPictureUri} />
                      <div className="min-w-0">
                        <p className="font-semibold text-[#111827] truncate">{employee.name}</p>
                        <p className="text-[11px] uppercase tracking-[0.04em] text-[#7b8a85] truncate">
                          {employee.isPublic ? t('table.publicProfile') : t('table.privateProfile')}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#111b18]" title={employee.email}>
                    <div className="truncate">{employee.email}</div>
                  </TableCell>
                  <TableCell
                    className={phone ? 'text-[#111b18]' : 'text-[#9fa4a4] text-xs'}
                    title={phone || t('table.notAvailable')}
                  >
                    <div className="truncate">{phone || t('table.notAvailable')}</div>
                  </TableCell>
                  <TableCell className="text-[#111b18]" title={employee.employmentTitle || employee.employmentType || '-'}>
                    <div className="truncate">{employee.employmentTitle || employee.employmentType || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {(isAdminRow ? companyLanguages : (employee.languages ?? ['da'])).map(code => (
                        <span key={code} className="text-base leading-none" title={ALL_LANGUAGES.find(l => l.code === code)?.label ?? code}>
                          {LANG_FLAG_MAP[code] ?? code}
                        </span>
                      ))}
                      {onUpdateLanguages && !isAdminRow && (employee.languages ?? ['da']).length < companyLanguages.length && (
                        <LanguageQuickAdd
                          employeeId={employee.id}
                          currentLangs={employee.languages ?? ['da']}
                          companyLangs={companyLanguages}
                          onSave={onUpdateLanguages}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#111b18] truncate" title={employee.recentVisitAt || t('table.never')}>
                    {formatRelativeTime(employee.recentVisitAt)}
                  </TableCell>
                  <TableCell className="align-middle p-0">
                    <div className="flex items-center justify-center w-full h-full text-[#111b18]">
                      {employee.messagesCount ?? 0}
                    </div>
                  </TableCell>
                  {/* Actions */}
                  <TableCell className="align-middle">
                    <TooltipProvider delayDuration={300}>
                    <div className="flex items-center justify-center gap-1">
                      {/* Edit — only visible when handler is provided (admin) */}
                      {onEdit && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md bg-[#e7f5ef] text-[#2c7860] hover:bg-[#d0ebe0]"
                              aria-label={t('table.editEmployee')}
                              onClick={() => onEdit(employee.id)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('table.editEmployee')}</TooltipContent>
                        </Tooltip>
                      )}
                      {/* Message — always visible */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md bg-[#e8f0fe] text-[#2060d7] hover:bg-[#d4e4fc]"
                            aria-label={t('table.messageLogs')}
                            onClick={() => onMessageLogs?.(employee.id)}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('table.messageLogs')}</TooltipContent>
                      </Tooltip>
                      {/* Statistics — hidden for self and admins */}
                      {!isProtected && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md bg-[#fff1e8] text-[#ee7623] hover:bg-[#ffe4d1]"
                              aria-label={t('table.statistics')}
                              onClick={() => onStatistics?.(employee.id)}
                            >
                              <BarChart3 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('table.statistics')}</TooltipContent>
                        </Tooltip>
                      )}
                      {/* Delete — hidden for self, admins, and non-admin viewers */}
                      {!isProtected && onDelete && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md bg-[#ffecef] text-[#d5384b] hover:bg-[#ffd9df]"
                              aria-label={t('table.deleteEmployee')}
                              onClick={() => onDelete(employee.id, employee.name)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('table.deleteEmployee')}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
