import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { employmentTypesApi, type EmploymentType } from '@/features/employment-types/api';
import { departmentsApi, type Department } from '@/features/departments/api';
import { handbookApi, type ExtraHandbook, type HandbookBooks } from '../api';

/** The company's employment types and departments: the audience an extra handbook can be limited to. */
export function useAudienceOptions(enabled = true) {
    const { user } = useAuth();
    const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    useEffect(() => {
        if (!enabled || !user?.companyId) return;
        const companyId = user.companyId;
        employmentTypesApi.getEmploymentTypes(companyId).then(setEmploymentTypes).catch(() => { /* no options shown */ });
        departmentsApi.getDepartments(companyId).then(setDepartments).catch(() => { /* no options shown */ });
    }, [enabled, user?.companyId]);
    return { employmentTypes, departments };
}

/** "Vises for: Vikar, Lærling" / "Vises for alle medarbejdere". */
export function audienceSummary(
    book: Pick<ExtraHandbook, 'employmentTypeIds' | 'departmentIds'>,
    employmentTypes: EmploymentType[],
    departments: Department[],
    t: (key: string, opts?: Record<string, unknown>) => string,
): string {
    const etNames = new Map(employmentTypes.map((et) => [Number(et.id), et.name]));
    const deptNames = new Map(departments.map((d) => [Number(d.id), d.name]));
    const names = [
        ...book.employmentTypeIds.map((id) => etNames.get(id)),
        ...book.departmentIds.map((id) => deptNames.get(id)),
    ].filter((n): n is string => !!n);
    if (book.employmentTypeIds.length + book.departmentIds.length === 0) return t('books.audienceAll');
    // Restricted to types/departments the list doesn't know (yet): still say it is restricted.
    return t('books.audienceSome', { names: names.length > 0 ? names.join(', ') : '…' });
}

interface ExtraHandbooksBarProps {
    books: HandbookBooks;
    /** The extra handbook being shown, or null for the main handbook. */
    selectedBid: number | null;
    onSelect: (bookBid: number | null) => void;
    /** After a handbook was created, changed or deleted (reload the list; select createdBid if given). */
    onChanged: (createdBid?: number | null, deletedBid?: number | null) => void;
}

/**
 * Switches the pages list between the company's main handbook and its extra handbooks,
 * and lets admins create an extra handbook (within the company's limit) or change one.
 */
export const ExtraHandbooksBar: React.FC<ExtraHandbooksBarProps> = ({ books, selectedBid, onSelect, onChanged }) => {
    const { t } = useTranslation('handbook');
    const { employmentTypes, departments } = useAudienceOptions(books.extras.length > 0 || books.canManage);
    const [dialog, setDialog] = useState<{ mode: 'create' } | { mode: 'edit'; book: ExtraHandbook } | null>(null);

    const selected = books.extras.find((b) => b.bid === selectedBid) ?? null;
    const canCreate = books.canManage && books.quota.used < books.quota.allowed;

    const pill = (active: boolean) =>
        `inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${active
            ? 'border-[#0d0e0e] bg-[#0d0e0e] text-white'
            : 'border-[#e5e7eb] bg-white text-[#0d0e0e] hover:bg-[#f6fbf9]'}`;

    return (
        <div className="mb-6 rounded-[8px] border border-[#e5e7eb] bg-white p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm font-semibold text-[#0d0e0e]">{t('books.label')}:</span>
                <button type="button" className={pill(selected == null)} onClick={() => onSelect(null)} aria-pressed={selected == null}>
                    <span className="truncate">{books.main.title || t('books.mainDefault')}</span>
                </button>
                {books.extras.map((book) => (
                    <button
                        key={book.bid}
                        type="button"
                        className={pill(selected?.bid === book.bid)}
                        onClick={() => onSelect(book.bid)}
                        aria-pressed={selected?.bid === book.bid}
                    >
                        <span className="truncate">{book.title}</span>
                        {!book.isPublished && (
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${selected?.bid === book.bid ? 'bg-white/20 text-white' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                                {t('books.notPublished')}
                            </span>
                        )}
                    </button>
                ))}
                {canCreate && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDialog({ mode: 'create' })}
                        className="h-auto gap-1 rounded-full border-dashed border-[#3d997d] px-3 py-1.5 text-sm text-[#1a5948] hover:bg-[#f6fbf9]"
                    >
                        <Plus className="h-4 w-4" />
                        {t('books.new')}
                    </Button>
                )}
                {books.canManage && books.quota.allowed > 0 && (
                    <span className="w-full text-xs text-[#7b8a85] sm:ml-auto sm:w-auto">
                        {t('books.quota', { used: books.quota.used, allowed: books.quota.allowed })}
                    </span>
                )}
            </div>

            {selected && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#f1f5f3] pt-3 text-sm">
                    <span className="inline-flex min-w-0 items-center gap-2 text-[#0d0e0e]">
                        <Users className="h-4 w-4 shrink-0 text-[#7b8a85]" />
                        <span className="break-words">{audienceSummary(selected, employmentTypes, departments, t)}</span>
                    </span>
                    <span className={selected.isPublished ? 'text-[#1a5948]' : 'text-[#92400e]'}>
                        {selected.isPublished ? t('books.published') : t('books.notPublished')}
                    </span>
                    {books.canManage && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDialog({ mode: 'edit', book: selected })}
                            className="h-auto gap-2 rounded-[8px] border-[#e5e7eb] px-3 py-1.5 text-sm text-[#0d0e0e] sm:ml-auto"
                        >
                            <Settings className="h-4 w-4" />
                            {t('books.settings')}
                        </Button>
                    )}
                </div>
            )}

            {dialog && (
                <ExtraHandbookDialog
                    mode={dialog.mode}
                    book={dialog.mode === 'edit' ? dialog.book : undefined}
                    employmentTypes={employmentTypes}
                    departments={departments}
                    onClose={() => setDialog(null)}
                    onSaved={(bid) => {
                        setDialog(null);
                        onChanged(dialog.mode === 'create' ? bid : null);
                    }}
                    onDeleted={(bid) => {
                        setDialog(null);
                        onChanged(null, bid);
                    }}
                />
            )}
        </div>
    );
};

interface ExtraHandbookDialogProps {
    mode: 'create' | 'edit';
    book?: ExtraHandbook;
    employmentTypes: EmploymentType[];
    departments: Department[];
    onClose: () => void;
    onSaved: (bid: number) => void;
    onDeleted: (bid: number) => void;
}

/** Create an extra handbook, or change its name, audience and publishing, or delete it while empty. */
export const ExtraHandbookDialog: React.FC<ExtraHandbookDialogProps> = ({
    mode, book, employmentTypes, departments, onClose, onSaved, onDeleted,
}) => {
    const { t } = useTranslation('handbook');
    const [title, setTitle] = useState(book?.title ?? '');
    const [employmentTypeIds, setEmploymentTypeIds] = useState<number[]>(book?.employmentTypeIds ?? []);
    const [departmentIds, setDepartmentIds] = useState<number[]>(book?.departmentIds ?? []);
    const [isPublished, setIsPublished] = useState(book?.isPublished ?? false);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ticking only changes the ids shown; a restriction to a type/department the lists no
    // longer show (e.g. since deleted) is kept as it is.
    const toggle = (list: number[], id: number, on: boolean) => (on ? [...new Set([...list, id])] : list.filter((x) => x !== id));

    const errorText = (err: unknown) => {
        const message = err instanceof Error ? err.message : '';
        if (message === 'Extra handbook limit reached') return t('books.limitReached');
        return t('books.failed');
    };

    const save = async () => {
        const name = title.trim();
        if (!name) {
            setError(t('books.errorNoName'));
            return;
        }
        setSaving(true);
        setError(null);
        try {
            if (mode === 'create') {
                const { bid } = await handbookApi.createBook({ title: name, employmentTypeIds, departmentIds });
                toast.success(t('books.created'));
                onSaved(bid);
            } else if (book) {
                await handbookApi.updateBook(book.bid, {
                    title: name,
                    employmentTypeIds,
                    departmentIds,
                    ...(isPublished !== book.isPublished ? { isPublished } : {}),
                });
                toast.success(t('books.saved'));
                onSaved(book.bid);
            }
        } catch (err) {
            setError(errorText(err));
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!book) return;
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await handbookApi.deleteBook(book.bid);
            toast.success(t('books.deleted'));
            onDeleted(book.bid);
        } catch (err) {
            setError(errorText(err));
            setConfirmDelete(false);
        } finally {
            setSaving(false);
        }
    };

    const hasOptions = employmentTypes.length > 0 || departments.length > 0;

    return (
        <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-[16px] border-[#e5efea]">
                <DialogHeader>
                    <DialogTitle className="text-[#0d0e0e]">
                        {mode === 'create' ? t('books.createTitle') : t('books.editTitle')}
                    </DialogTitle>
                    {mode === 'create' && (
                        <DialogDescription className="text-sm text-[#7b8a85]">{t('books.createDesc')}</DialogDescription>
                    )}
                </DialogHeader>

                <form
                    className="space-y-5 pt-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        void save();
                    }}
                >
                    <div className="space-y-2">
                        <Label htmlFor="extra-handbook-name" className="text-sm font-medium text-[#0d0e0e]">{t('books.name')}</Label>
                        <Input
                            id="extra-handbook-name"
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); setError(null); }}
                            placeholder={t('books.namePlaceholder')}
                            maxLength={200}
                            disabled={saving}
                            autoFocus
                            className="h-10 rounded-[8px] border-[#e5e7eb]"
                        />
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-sm font-medium text-[#0d0e0e]">{t('books.audience')}</p>
                            <p className="mt-1 text-sm text-[#7b8a85]">
                                {hasOptions ? t('books.audienceDesc') : t('books.noAudienceOptions')}
                            </p>
                        </div>
                        {employmentTypes.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-[#0d0e0e]">{t('editor.employmentTypes')}</Label>
                                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                    {employmentTypes.map((et) => (
                                        <label key={et.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-[#f6fbf9]">
                                            <Checkbox
                                                checked={employmentTypeIds.includes(Number(et.id))}
                                                disabled={saving}
                                                onChange={(e) => setEmploymentTypeIds((prev) => toggle(prev, Number(et.id), e.target.checked))}
                                            />
                                            <span className="text-sm text-[#0d0e0e]">{et.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        {departments.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-[#0d0e0e]">{t('editor.departments')}</Label>
                                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                    {departments.map((dept) => (
                                        <label key={dept.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-[#f6fbf9]">
                                            <Checkbox
                                                checked={departmentIds.includes(Number(dept.id))}
                                                disabled={saving}
                                                onChange={(e) => setDepartmentIds((prev) => toggle(prev, Number(dept.id), e.target.checked))}
                                            />
                                            <span className="text-sm text-[#0d0e0e]">{dept.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {mode === 'edit' && book && (
                        <div className="space-y-2 border-t border-[#f1f5f3] pt-4">
                            <p className="text-sm font-medium text-[#0d0e0e]">{t('books.status')}</p>
                            {book.isPublished ? (
                                <label className="flex cursor-pointer items-center gap-2">
                                    <Checkbox
                                        checked={isPublished}
                                        disabled={saving}
                                        onChange={(e) => setIsPublished(e.target.checked)}
                                    />
                                    <span className="text-sm text-[#0d0e0e]">{t('books.publishedToggle')}</span>
                                </label>
                            ) : (
                                <p className="text-sm text-[#7b8a85]">{t('books.notPublishedHint')}</p>
                            )}
                        </div>
                    )}

                    {mode === 'edit' && book && (
                        <div className="space-y-2 border-t border-[#f1f5f3] pt-4">
                            {book.entryCount === 0 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={saving}
                                    onClick={() => void remove()}
                                    className="rounded-[8px] border-[#fca5a5] bg-[#fef2f2] text-sm text-[#b91c1c] hover:bg-[#fee2e2]"
                                >
                                    {confirmDelete ? t('books.deleteConfirm') : t('books.delete')}
                                </Button>
                            ) : (
                                <p className="text-sm text-[#7b8a85]">{t('books.deleteNotEmpty')}</p>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="rounded-[8px]">
                            {t('books.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="rounded-[8px]"
                            style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
                        >
                            {saving ? t('books.saving') : mode === 'create' ? t('books.create') : t('books.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
