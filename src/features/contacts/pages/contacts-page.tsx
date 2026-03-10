import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { ContactsTable } from '../components/contacts-table';
import { AddExternalContactModal } from '../components/add-external-contact-modal';
import { AddExistingEmployeeModal } from '../components/add-existing-employee-modal';
import { EditContactModal } from '../components/edit-contact-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useContacts, usePotentialContacts } from '../hooks';
import { AddEmployeeAsContactModal, type EmployeeContactData } from '../components/add-employee-as-contact-modal';
import { AddSelfAsContactModal } from '../components/add-self-as-contact-modal';
import {
  AddSelectedAsContactsModal,
  type BatchContactTarget,
} from '../components/add-selected-as-contacts-modal';
import { useEmployees } from '@/lib/api-hooks';
import { transformEmployee, type BackendEmployeeLike } from '@/lib/api-transformers';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { contactsApi } from '../api';
import { contactsRoutes } from '@/features/contacts/routes';
import type { Contact } from '@/types/models';
import { ArrowDownWideNarrow, ArrowUpDown, Search, Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'company_admin' || user?.role === 'MANAGER';
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [publicOnly, setPublicOnly] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'email' | 'employment'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addExternalModalOpen, setAddExternalModalOpen] = useState(false);
  const [addContactModalOpen, setAddContactModalOpen] = useState(false);
  const [editContactId, setEditContactId] = useState<string | null>(null);
  const [deleteContact, setDeleteContact] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [addingSelectedLoading, setAddingSelectedLoading] = useState(false);
  const [employeeContactModal, setEmployeeContactModal] = useState<{
    open: boolean;
    employee: EmployeeContactData | null;
    contactId?: string;
    existingAreaIds?: number[];
  }>({ open: false, employee: null });
  const [addSelfModalOpen, setAddSelfModalOpen] = useState(false);
  const [addSelectedModalOpen, setAddSelectedModalOpen] = useState(false);
  const [addSelectedTargets, setAddSelectedTargets] = useState<BatchContactTarget[]>([]);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: contacts, error: contactsError, refetch: refetchContacts } = useContacts();
  const { data: apiEmployees } = useEmployees({ limit: 1000 });
  const { data: potentialContacts } = usePotentialContacts();

  // Merge ALL company employees into the contacts list.
  // The /api/contacts endpoint returns only status=1 rows; employees not in contacts appear
  // as "emp-{id}" rows with an "Add as contact" button.
  const mergedContacts = useMemo(() => {
    const transformedEmployees = (apiEmployees as unknown as BackendEmployeeLike[] | undefined ?? [])
      .map(transformEmployee);

    const employees = transformedEmployees
      .map((emp) => ({
        id: `emp-${emp.id}`,
        accountId: emp.accountId,
        name: emp.name,
        email: emp.email,
        telephone: emp.mobileNumber ?? emp.telephone,
        isPublic: emp.isPublic,
        isEmployeeContact: true,
        isExternalContact: false,
        role: emp.role,
        status: emp.status,
        createdAt: emp.createdAt,
      }) satisfies import('@/types/models').Contact);

    // Build a role lookup by email so we can propagate roles to real contacts
    const roleByEmail = new Map<string, string>();
    for (const emp of transformedEmployees) {
      if (emp.email && emp.role) {
        roleByEmail.set(emp.email.trim().toLowerCase(), emp.role);
      }
    }

    // De-duplicate raw contacts: the backend can return multiple nids for the same person
    // (e.g. if they were added as a contact more than once). Keep the first occurrence,
    // using email as the primary key and normalised name as fallback.
    const seenKeys = new Set<string>();
    const dedupedContacts = contacts.filter((c) => {
      const key = c.email?.trim().toLowerCase() || c.name.trim().toLowerCase();
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

    // Build a set of employee names to distinguish employee contacts from external ones
    const employeeNames = new Set(employees.map((e) => e.name.trim().toLowerCase()));

    // Mark real contacts as employee or external based on name match, and propagate role
    const markedContacts = dedupedContacts.map((c) => ({
      ...c,
      isEmployeeContact: employeeNames.has(c.name.trim().toLowerCase()),
      isExternalContact: !employeeNames.has(c.name.trim().toLowerCase()),
      role: c.email ? roleByEmail.get(c.email.trim().toLowerCase()) : undefined,
    }));

    // De-duplicate: only append employees not already in contacts
    const existingKeys = new Set(dedupedContacts.map((c) =>
      c.email?.trim().toLowerCase() || c.name.trim().toLowerCase()
    ));
    const newEmployees = employees.filter((emp) => {
      const key = emp.email?.trim().toLowerCase() || emp.name.trim().toLowerCase();
      return !existingKeys.has(key);
    });

    return [...markedContacts, ...newEmployees];
  }, [contacts, apiEmployees]);

  const applyFilters = useCallback((list: Contact[]) => {
    let result = list;
    if (!showInactive) result = result.filter((c) => c.status !== 'INACTIVE');
    if (publicOnly) result = result.filter((c) => c.isPublic);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.telephone && c.telephone.includes(q))
      );
    }
    return result;
  }, [showInactive, publicOnly, search]);

  const employeeContacts = useMemo(
    () => mergedContacts.filter((c) => c.isEmployeeContact),
    [mergedContacts],
  );

  const externalContacts = useMemo(
    () => mergedContacts.filter((c) => c.isExternalContact),
    [mergedContacts],
  );

  const filteredContacts = useMemo(
    () => applyFilters(mergedContacts),
    [mergedContacts, applyFilters],
  );

  const filteredEmployeeContacts = useMemo(
    () => applyFilters(employeeContacts),
    [employeeContacts, applyFilters],
  );

  const filteredExternalContacts = useMemo(
    () => applyFilters(externalContacts),
    [externalContacts, applyFilters],
  );

  const sortContacts = useCallback((list: Contact[]) => {
    const getKey = (c: Contact) => {
      if (sortField === 'name') return c.name ?? '';
      if (sortField === 'email') return c.email ?? '';
      const employment = c.functionTitle || (c.areas && c.areas.length > 0 ? c.areas[0] : '');
      return employment ?? '';
    };
    return [...list].sort((a, b) => {
      // Admins/owners always pinned to the very top.
      const aIsAdmin = a.role === 'company_admin' || a.role === 'ADMIN';
      const bIsAdmin = b.role === 'company_admin' || b.role === 'ADMIN';
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;

      // "You" row (current user) stays right after admins.
      if (a.isCurrentUser && !b.isCurrentUser) return -1;
      if (!a.isCurrentUser && b.isCurrentUser) return 1;

      const av = getKey(a).toLowerCase();
      const bv = getKey(b).toLowerCase();
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      const cmp = av.localeCompare(bv, undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [sortField, sortDirection]);

  const sortedEmployeeContacts = useMemo(
    () => sortContacts(filteredEmployeeContacts),
    [filteredEmployeeContacts, sortContacts],
  );

  const sortedExternalContacts = useMemo(
    () => sortContacts(filteredExternalContacts),
    [filteredExternalContacts, sortContacts],
  );

  const visibilityStats = useMemo(() => ({
    publicProfiles: mergedContacts.filter((c) => c.isPublic !== false).length,
    inactive: mergedContacts.filter((c) => c.status === 'INACTIVE').length,
    employee: employeeContacts.length,
    external: externalContacts.length,
    total: mergedContacts.length,
  }), [mergedContacts, employeeContacts.length, externalContacts.length]);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback((selected: boolean, contactList: Contact[]) => {
    if (!selected) {
      setSelectedIds([]);
      return;
    }
    const selectable = contactList.filter(
      (c) => c.role !== 'company_admin' && c.role !== 'ADMIN' && !c.isCurrentUser
    );
    setSelectedIds(selectable.map((c) => c.id));
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteContact) return;
    setIsDeleting(true);
    try {
      await contactsApi.deleteContact(deleteContact.id);
      refetchContacts();
      setDeleteContact(null);
      toast.success('Contact removed');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status === 403
            ? 'You can only delete contacts in your company.'
            : (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : 'Failed to delete contact';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteContact, refetchContacts]);

  const handleSetVisibility = useCallback(async (status: 0 | 1, nids: number[]) => {
    if (nids.length === 0) return;
    setVisibilityLoading(true);
    try {
      const { updated } = await contactsApi.updateContactsVisibility({ nids, status });
      refetchContacts();
      setSelectedIds([]);
      const label = status === 1 ? 'public' : 'private';
      toast.success(
        updated === 1 ? `1 contact set to ${label}` : `${updated} contacts set to ${label}`,
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : 'Failed to update visibility';
      toast.error(msg ?? 'Failed to update visibility');
    } finally {
      setVisibilityLoading(false);
    }
  }, [refetchContacts]);


  const handleExport = useCallback(async () => {
    setExportLoading(true);
    try {
      const blob = await contactsApi.exportContacts();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts-export.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Contacts exported');
    } catch (err: unknown) {
      let msg: string | null = null;
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: unknown } }).response;
        const data = res?.data;
        if (data instanceof Blob) {
          try {
            const text = await data.text();
            const json = JSON.parse(text) as { error?: { message?: string } };
            msg = json?.error?.message ?? null;
          } catch {
            /* ignore parse */
          }
        } else if (data && typeof data === 'object' && data !== null && 'error' in data) {
          msg = (data as { error?: { message?: string } }).error?.message ?? null;
        }
      }
      if (!msg && err instanceof Error) msg = err.message;
      toast.error(msg ?? 'Export failed');
    } finally {
      setExportLoading(false);
    }
  }, []);

  const handleImportClick = useCallback(() => {
    importFileInputRef.current?.click();
  }, []);

  const handleImportFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPendingImportFile(file);
  }, []);

  const handleImportConfirm = useCallback(async () => {
    if (!pendingImportFile) return;
    const file = pendingImportFile;
    setPendingImportFile(null);
    setImportLoading(true);
    try {
      const { imported, failed, errors } = await contactsApi.importContacts(file);
      refetchContacts();
      if (imported > 0) {
        toast.success(
          failed != null && failed > 0
            ? `${imported} contact(s) imported, ${failed} failed`
            : imported === 1
              ? '1 contact imported'
              : `${imported} contacts imported`,
        );
      }
      if (failed != null && failed > 0 && errors?.length) {
        const first = errors[0];
        toast.error(first ? `Row ${first.row}: ${first.message}` : 'Some rows could not be imported');
      }
      if (imported === 0 && (failed == null || failed === 0)) {
        toast.info('No contacts imported');
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : 'Import failed';
      toast.error(msg ?? 'Import failed');
    } finally {
      setImportLoading(false);
    }
  }, [pendingImportFile, refetchContacts]);

  const handleAddAsContact = useCallback((_contact: Contact) => {
    const uid = user?.id != null ? Number(user.id) : null;
    if (uid == null || Number.isNaN(uid)) {
      toast.error('You must be logged in to add yourself as a contact.');
      return;
    }
    setAddSelfModalOpen(true);
  }, [user]);

  const handleAddSelfConfirm = useCallback(async (data: {
    name: string;
    uid: number;
    phone?: string;
    areaIds: number[];
    newAreas?: string[];
  }) => {
    try {
      await contactsApi.createContact({
        name: data.name,
        uid: data.uid,
        phone: data.phone,
        areaIds: data.areaIds ?? [],
        newAreas: data.newAreas,
      });
      refetchContacts();
      toast.success('Added as contact');
      setAddSelfModalOpen(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status === 403
            ? 'Company context required.'
            : (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error ? err.message : 'Failed to add as contact';
      toast.error(msg);
    }
  }, [refetchContacts]);

  const handleOpenEmployeeContactModal = useCallback((contact: Contact) => {
    const empId = contact.id.startsWith('emp-') ? contact.id.replace('emp-', '') : contact.id;
    setEmployeeContactModal({
      open: true,
      employee: {
        uid: Number(empId),
        name: contact.name,
        email: contact.email ?? '',
        telephone: contact.telephone,
      },
    });
  }, []);

  const handleEditEmployeeContact = useCallback(async (contact: Contact) => {
    let existingAreaIds: number[] = [];
    try {
      const areas = await contactsApi.getContactAreasForContact(contact.id);
      existingAreaIds = areas.map((a) => a.id);
    } catch {
      // Proceed without existing areas
    }

    // Fall back to employee's responsibilityIds if the contact has none
    if (existingAreaIds.length === 0 && apiEmployees) {
      const empList = (apiEmployees as unknown as BackendEmployeeLike[]).map(transformEmployee);
      const matched = empList.find(
        (e) => e.name.trim().toLowerCase() === contact.name.trim().toLowerCase(),
      );
      if (matched?.responsibilityIds?.length) {
        existingAreaIds = matched.responsibilityIds;
      }
    }

    setEmployeeContactModal({
      open: true,
      contactId: contact.id,
      existingAreaIds,
      employee: {
        uid: Number(contact.id),
        name: contact.name,
        email: contact.email ?? '',
        telephone: contact.telephone,
      },
    });
  }, [apiEmployees]);

  const handleEmployeeContactConfirm = useCallback(async (data: {
    uid: number;
    name: string;
    phone?: string;
    areaIds: number[];
    newAreas?: string[];
  }) => {
    const isEdit = !!employeeContactModal.contactId;
    try {
      if (isEdit) {
        await contactsApi.updateContact(employeeContactModal.contactId!, {
          phone: data.phone,
          areaIds: data.areaIds,
          newAreas: data.newAreas,
        });
        toast.success('Contact updated');
      } else {
        await contactsApi.createContact({
          name: data.name,
          uid: data.uid,
          phone: data.phone,
          areaIds: data.areaIds,
          newAreas: data.newAreas,
        });
        toast.success('Employee added as contact');
      }
      refetchContacts();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number; data?: { message?: string } } }).response?.status === 403
            ? 'Company context required.'
            : (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error ? err.message : 'Failed to save contact';
      toast.error(msg);
    }
  }, [employeeContactModal.contactId, refetchContacts]);

  // Open add/import from console redirect (?open=add | ?open=import)
  // Or open a specific contact in edit mode when coming from the public contacts page (?edit-contact-id=123)
  useEffect(() => {
    const open = searchParams.get('open');
    const editId = searchParams.get('edit-contact-id');
    if (!open && !editId) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('open');
      next.delete('edit-contact-id');
      return next;
    }, { replace: true });
    if (open === 'add') {
      setAddContactModalOpen(true);
    } else if (open === 'import') {
      const t = setTimeout(() => importFileInputRef.current?.click(), 0);
      return () => clearTimeout(t);
    }
    if (editId) {
      const contactToEdit = mergedContacts.find((c) => c.id === editId);
      if (contactToEdit) {
        void handleEditEmployeeContact(contactToEdit);
      }
    }
  }, [searchParams, setSearchParams, mergedContacts, handleEditEmployeeContact]);

  const handleEditSaved = useCallback(() => {
    refetchContacts();
    toast.success('Contact updated');
  }, [refetchContacts]);

  const handleAddEmployeeConfirm = useCallback(async (data: {
    uid: number;
    name: string;
    phone?: string;
    areaIds: number[];
    newAreas?: string[];
  }) => {
    try {
      await contactsApi.createContact({
        name: data.name,
        uid: data.uid,
        phone: data.phone,
        areaIds: data.areaIds ?? [],
        newAreas: data.newAreas,
      });
      refetchContacts();
      toast.success('Contact added');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { status?: number; data?: { message?: string } } }).response?.status === 403
          ? 'Company context required.'
          : (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : err instanceof Error ? err.message : 'Failed to add contact';
      toast.error(msg);
    }
  }, [refetchContacts]);

  const handleAddExternalConfirm = useCallback(async (data: {
    name: string;
    email: string;
    phone: string;
    areaIds: number[];
    newAreas?: string[];
  }) => {
    try {
      await contactsApi.createContact({
        name: data.name,
        email: data.email,
        phone: data.phone,
        areaIds: data.areaIds ?? [],
        newAreas: data.newAreas,
      });
      refetchContacts();
      toast.success('Contact added');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { status?: number } }).response?.status === 403
          ? 'Company context required.'
          : (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : err instanceof Error ? err.message : 'Failed to add contact';
      toast.error(msg);
    }
  }, [refetchContacts]);

  const handleAddSelectedAsContacts = useCallback(() => {
    if (selectedIds.length === 0) return;

    const potentialByName = new Map(
      potentialContacts.map((item) => [item.name.trim().toLowerCase(), item]),
    );

    const matchingContacts = filteredContacts.filter(
      (contact) =>
        selectedIds.includes(contact.id) &&
        contact.isEmployeeContact &&
        potentialByName.has(contact.name.trim().toLowerCase()),
    );

    if (matchingContacts.length === 0) {
      toast.info('No employees to add as contacts.');
      return;
    }

    const targets: BatchContactTarget[] = matchingContacts.map((contact) => {
      const potential = potentialByName.get(contact.name.trim().toLowerCase())!;
      return {
        id: contact.id,
        name: contact.name,
        email: contact.email ?? undefined,
        telephone: contact.telephone,
        uid: potential.uid,
      };
    });
    setAddSelectedTargets(targets);
    setAddSelectedModalOpen(true);
  }, [selectedIds, filteredContacts, potentialContacts]);

  const handleAddSelectedConfirm = useCallback(async (payload: {
    areaIds: number[];
    newAreas?: string[];
  }) => {
    if (addSelectedTargets.length === 0) return;
    setAddingSelectedLoading(true);
    try {
      await Promise.all(
        addSelectedTargets.map((t) =>
          contactsApi.createContact({
            name: t.name,
            uid: t.uid,
            phone: t.telephone,
            email: t.email,
            areaIds: payload.areaIds ?? [],
            newAreas: payload.newAreas,
          }),
        ),
      );
      refetchContacts();
      toast.success(
        addSelectedTargets.length === 1
          ? '1 employee added as a contact.'
          : `${addSelectedTargets.length} employees added as contacts.`,
      );
      setAddSelectedModalOpen(false);
      setAddSelectedTargets([]);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : 'Failed to add selected employees as contacts';
      toast.error(msg);
    } finally {
      setAddingSelectedLoading(false);
    }
  }, [addSelectedTargets, refetchContacts]);

  const handleSetPrivate = useCallback(
    () => handleSetVisibility(0, selectedIds.map((id) => Number(id))),
    [handleSetVisibility, selectedIds],
  );

  const handleSetPublic = useCallback(
    () => handleSetVisibility(1, selectedIds.map((id) => Number(id))),
    [handleSetVisibility, selectedIds],
  );

  const handleSetAllPrivate = useCallback(
    () => handleSetVisibility(0, contacts.map((c) => Number(c.id))),
    [handleSetVisibility, contacts],
  );

  const handleSetAllPublic = useCallback(
    () => handleSetVisibility(1, contacts.map((c) => Number(c.id))),
    [handleSetVisibility, contacts],
  );

  const handleDeleteOpen = useCallback(
    (contact: Contact) => setDeleteContact({ id: contact.id, name: contact.name }),
    [],
  );
  const handleEditModalChange = useCallback(
    (open: boolean) => { if (!open) setEditContactId(null); },
    [],
  );

  return (
    <PageShell>
      <PageHeader
        title="Manage Contacts"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-[rgba(15,23,42,0.12)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-sm bg-white"
              onClick={() => navigate(contactsRoutes.informationList)}
            >
              View information list
            </Button>
            {isAdmin && (
              <>
                <Button
                  onClick={() => setAddContactModalOpen(true)}
                  variant="outline"
                  className="border-[rgba(15,23,42,0.12)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-sm bg-white"
                >
                  Add contact
                </Button>
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportFileChange}
                />
                <Button
                  variant="outline"
                  className="border-[rgba(15,23,42,0.12)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-sm bg-white"
                  disabled={importLoading}
                  onClick={handleImportClick}
                >
                  {importLoading ? 'Importing…' : 'Import CSV'}
                </Button>
                <Button
                  variant="outline"
                  className="border-[rgba(15,23,42,0.12)] text-[#0d0e0e] rounded-[999px] px-5 py-[11px] h-auto text-sm bg-white"
                  disabled={exportLoading}
                  onClick={handleExport}
                >
                  {exportLoading ? 'Exporting…' : 'Export'}
                </Button>
                <Button
                  onClick={() => setAddExternalModalOpen(true)}
                  className="bg-[#2f946f] hover:bg-[#2f946f]/90 text-white rounded-[999px] px-5 py-[11px] h-auto text-sm shadow-[0_10px_20px_rgba(13,94,67,0.3)]"
                >
                  Add external contact
                </Button>
              </>
            )}
          </div>
        }
      />
      {contactsError && (
        <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load contacts: {contactsError.message}
        </div>
      )}
      <div className="mb-6 bg-[#fff9f0] rounded-[16px] border border-[#f59e0b] border-l-[6px] shadow-[0_18px_40px_rgba(219,145,0,0.15)] px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-[#0d0e0e]">
            <span className="font-bold">Help.</span> Contacts can be employees or external contacts who
            appear in the info list and on relevant handbook pages. Existing employees are listed
            below—you can add them as contacts with one click or in bulk. For people who are not
            employees, use "Add external contact". Assign areas of responsibility so the right
            contacts show on the right pages.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] hover:bg-[#f0f7f5] rounded-[10px] px-4 py-2 h-auto whitespace-nowrap"
          >
            User Manual
          </Button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:items-start">
        <div className="space-y-4">
          <Card className="bg-white border border-[#e5efea] rounded-[22px] shadow-[0_18px_45px_rgba(14,51,38,0.08)]">
            <div className="bg-[#f2f7f5] border border-[#d6e8e1] rounded-[16px] mx-4 mt-4 px-4 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              {/* Sort controls */}
              <TooltipProvider delayDuration={300}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#0d0e0e]">Sort</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[rgba(15,23,42,0.18)] text-[#242727] rounded-[10px] px-4 py-[9px] h-auto bg-white shadow-[0_6px_14px_rgba(15,23,42,0.05)]"
                      onClick={() =>
                        setSortField((prev) =>
                          prev === 'name' ? 'email' : prev === 'email' ? 'employment' : 'name',
                        )
                      }
                    >
                      {sortField === 'name' ? 'Name' : sortField === 'email' ? 'Email' : 'Employment'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Cycle sort field</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-[#707677] rounded-full bg-white shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
                      aria-label="Toggle sort direction"
                      onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                    >
                      <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle sort direction</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-[#1a5948] rounded-full bg-white shadow-[0_6px_14px_rgba(28,91,72,0.25)]"
                      aria-label="Reset sort"
                      onClick={() => {
                        setSortField('name');
                        setSortDirection('asc');
                      }}
                    >
                      <ArrowDownWideNarrow className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset sort</TooltipContent>
                </Tooltip>
              </div>
              </TooltipProvider>

              {/* Search + filters */}
              <div className="flex flex-1 flex-wrap items-center gap-3 lg:justify-end">
                <div className="relative w-full lg:w-auto lg:max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8a85]" />
                  <Input
                    placeholder="Search contacts (name, email, phone)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-12 rounded-[999px] border border-[#c8d8d3] bg-white text-sm w-full"
                  />
                </div>
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-[999px] border transition-colors ${showInactive
                    ? 'border-[#2c7860] bg-white text-[#0f172a]'
                    : 'border-transparent bg-[#e9f3ef] text-[#7b8a85]'
                    }`}
                  onClick={() => setShowInactive((v) => !v)}
                >
                  <Checkbox
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="h-3 w-3 rounded-[2.5px] border-[#3d997d]"
                  />
                  <span className="text-xs font-medium">Show inactive</span>
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-[999px] border transition-colors ${publicOnly
                    ? 'border-[#2c7860] bg-white text-[#0f172a]'
                    : 'border-transparent bg-[#e9f3ef] text-[#7b8a85]'
                    }`}
                  onClick={() => setPublicOnly((v) => !v)}
                >
                  <Checkbox
                    checked={publicOnly}
                    onChange={(e) => setPublicOnly(e.target.checked)}
                    className="h-3 w-3 rounded-[2.5px] border-[#3d997d]"
                  />
                  <span className="text-xs font-medium">Public only</span>
                </button>
              </div>
            </div>
            <CardContent className="pt-6 space-y-6">
              {/* Employee Contacts */}
              <div>
                <h3 className="text-sm font-bold text-[#0d0e0e] mb-3">Employee Contacts</h3>
                <ContactsTable
                  contacts={sortedEmployeeContacts}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onSelectAll={(selected) => handleSelectAll(selected, sortedEmployeeContacts)}
                  onDelete={isAdmin ? handleDeleteOpen : undefined}
                  onAddAsContact={isAdmin ? handleAddAsContact : undefined}
                  onAddEmployeeAsContact={isAdmin ? handleOpenEmployeeContactModal : undefined}
                  onEditEmployeeContact={isAdmin ? handleEditEmployeeContact : undefined}
                  currentUserEmail={user?.email ?? undefined}
                  currentUserName={user?.name ?? undefined}
                  showActions={isAdmin}
                />
              </div>

              {/* External Contacts — only shown when there are entries */}
              {filteredExternalContacts.length > 0 && (
                <div className="pt-2 border-t border-dashed border-[#d5e7e1]">
                  <h3 className="text-sm font-bold text-[#0d0e0e] mb-3 mt-4">External Contacts</h3>
                  <ContactsTable
                    contacts={sortedExternalContacts}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onSelectAll={(selected) => handleSelectAll(selected, sortedExternalContacts)}
                    onDelete={isAdmin ? handleDeleteOpen : undefined}
                    onAddAsContact={isAdmin ? handleAddAsContact : undefined}
                    onAddEmployeeAsContact={isAdmin ? handleOpenEmployeeContactModal : undefined}
                    onEditEmployeeContact={isAdmin ? handleEditEmployeeContact : undefined}
                    showActions={isAdmin}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          {isAdmin && (
            <div className="bg-white border border-[#e5efea] rounded-[16px] shadow-[0_18px_45px_rgba(14,51,38,0.08)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-[4px] ${selectedIds.length > 0 ? 'bg-[#1a5948]' : 'bg-[#cfd6d4]'
                    }`}
                />
                <span
                  className={`text-sm ${selectedIds.length > 0 ? 'text-[#484b4b]' : 'text-[#9fa4a4]'
                    }`}
                >
                  {selectedIds.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-[999px] text-sm px-5"
                  disabled={selectedIds.length === 0 || visibilityLoading}
                  onClick={handleSetPrivate}
                >
                  Set selected to private
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-[999px] text-sm px-5"
                  disabled={selectedIds.length === 0 || visibilityLoading}
                  onClick={handleSetPublic}
                >
                  Set selected to public
                </Button>
                <Button
                  size="sm"
                  className="rounded-[999px] text-sm px-5 bg-[#2f946f] text-white hover:bg-[#2f946f]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedIds.length === 0 || addingSelectedLoading}
                  onClick={handleAddSelectedAsContacts}
                >
                  {addingSelectedLoading ? 'Adding…' : 'Add selected as contacts'}
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <Card className="bg-white border border-[#e5efea] rounded-[18px] shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-3 px-5 py-4">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-[#0d0e0e]">Visibility</h3>
                <p className="text-xs text-[#6b7475]">{visibilityStats.total} contacts listed</p>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Public profiles', value: visibilityStats.publicProfiles },
                  { label: 'Inactive contacts', value: visibilityStats.inactive },
                  { label: 'Employee contacts', value: visibilityStats.employee },
                  { label: 'External contacts', value: visibilityStats.external },
                ].map((item, index) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center py-2 text-sm text-[#0d0e0e]">
                      <span>{item.label}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                    {index < 3 && <div className="border-t border-dashed border-[#cbe1d8]" />}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-[999px] px-4"
                    disabled={contacts.length === 0 || visibilityLoading}
                    onClick={handleSetAllPrivate}
                  >
                    Set all to private
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-[999px] px-4"
                    disabled={contacts.length === 0 || visibilityLoading}
                    onClick={handleSetAllPublic}
                  >
                    Set all to public
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-white border border-[#e5efea] rounded-[18px] shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-2 px-5 py-4">
              <h3 className="text-sm font-bold text-[#0d0e0e]">Help Guides</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const headers = 'name,email,phone,role,status';
                    const example = 'John Doe,john@example.com,12345678,Manager,1';
                    const csv = `${headers}\n${example}\n`;
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'contacts-import-template.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-[12px] border border-[#cce3da] bg-white text-sm text-[#0d0e0e] hover:bg-[#f0f7f5]"
                >
                  <span className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-[#3d997d]" />
                    Download CSV Template
                  </span>
                  <span className="text-base text-[#0d0e0e]">⇢</span>
                </button>
                {[
                  'How to edit employee profiles',
                  'How to add relatives information',
                  'How to import contacts',
                ].map((label) => (
                  <button
                    key={label}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-[12px] border border-[#cce3da] bg-white text-sm text-[#0d0e0e] hover:bg-[#f0f7f5]"
                  >
                    <span>{label}</span>
                    <span className="text-base text-[#0d0e0e]">⇢</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <EditContactModal
        open={editContactId !== null}
        onOpenChange={handleEditModalChange}
        contactId={editContactId}
        onSaved={handleEditSaved}
      />
      <Dialog open={deleteContact !== null} onOpenChange={(open) => !open && setDeleteContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete contact</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#374151]">
            Are you sure you want to remove {deleteContact?.name} from contacts? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteContact(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={pendingImportFile !== null}
        onOpenChange={(open) => !open && setPendingImportFile(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Import contacts</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#374151]">
            Import contacts from <strong>{pendingImportFile?.name}</strong>? New contacts will be
            added to your company.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingImportFile(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#2f946f] hover:bg-[#2f946f]/90 text-white"
              onClick={handleImportConfirm}
              disabled={importLoading}
            >
              {importLoading ? 'Importing…' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AddExistingEmployeeModal
        open={addContactModalOpen}
        onOpenChange={setAddContactModalOpen}
        onConfirm={handleAddEmployeeConfirm}
      />
      <AddExternalContactModal
        open={addExternalModalOpen}
        onOpenChange={setAddExternalModalOpen}
        onConfirm={handleAddExternalConfirm}
      />
      <AddEmployeeAsContactModal
        open={employeeContactModal.open}
        onOpenChange={(open) => setEmployeeContactModal((prev) => ({ ...prev, open }))}
        employee={employeeContactModal.employee}
        contactId={employeeContactModal.contactId}
        existingAreaIds={employeeContactModal.existingAreaIds}
        onConfirm={handleEmployeeContactConfirm}
      />
      <AddSelfAsContactModal
        open={addSelfModalOpen}
        onOpenChange={setAddSelfModalOpen}
        user={addSelfModalOpen && user ? { id: Number(user.id), name: user.name ?? undefined, email: user.email ?? undefined } : null}
        onConfirm={handleAddSelfConfirm}
      />
      <AddSelectedAsContactsModal
        open={addSelectedModalOpen}
        onOpenChange={(open) => { setAddSelectedModalOpen(open); if (!open) setAddSelectedTargets([]); }}
        targets={addSelectedTargets}
        onConfirm={handleAddSelectedConfirm}
      />
    </PageShell>
  );
};
