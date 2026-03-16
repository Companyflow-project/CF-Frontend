import React from 'react';
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
import { Edit, Trash2, UserPlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Contact } from '@/types/models';
import { formatDanishPhone, isAdminEmployeeRole } from '@/lib/utils';

interface ContactsTableProps {
  contacts: Contact[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onDelete?: (contact: Contact) => void;
  /** For the current-user placeholder row (nid === 0 / isCurrentUser): add as contact using current user's uid */
  onAddAsContact?: (contact: Contact) => void;
  /** For employee-only rows (id starts with "emp-") that are not yet real contacts */
  onAddEmployeeAsContact?: (contact: Contact) => void;
  /** For real employee contacts — opens the pre-filled edit modal */
  onEditEmployeeContact?: (contact: Contact) => void;
  /** Email of the logged-in user — their row is pinned to the top and cannot be deleted */
  currentUserEmail?: string;
  /** Name of the logged-in user — used as a fallback when contact email is missing */
  currentUserName?: string;
  /** Whether to show the Actions column (default: true). Hide for non-admin users. */
  showActions?: boolean;
}

function ContactsTableInner({
  contacts,
  selectedIds,
  onSelect,
  onSelectAll,
  onDelete,
  onAddAsContact,
  onAddEmployeeAsContact,
  onEditEmployeeContact,
  currentUserEmail,
  currentUserName,
  showActions = true,
}: ContactsTableProps) {
  // Pin admin/owner rows to the very top, then the authenticated user's row
  const sortedContacts = React.useMemo(() => {
    const email = currentUserEmail?.toLowerCase();
    const name = currentUserName?.trim().toLowerCase();
    return [...contacts].sort((a, b) => {
      // Admins/owners always first
      const aIsAdmin = isAdminEmployeeRole(a.role);
      const bIsAdmin = isAdminEmployeeRole(b.role);
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;

      if (!email && !name) return 0;

      const aEmail = (a.email ?? '').toLowerCase();
      const bEmail = (b.email ?? '').toLowerCase();
      const aName = a.name.trim().toLowerCase();
      const bName = b.name.trim().toLowerCase();

      const aIsSelf =
        (!!email && aEmail === email) || (!aEmail && !!name && aName === name);
      const bIsSelf =
        (!!email && bEmail === email) || (!bEmail && !!name && bName === name);
      if (aIsSelf && !bIsSelf) return -1;
      if (!aIsSelf && bIsSelf) return 1;
      return 0;
    });
  }, [contacts, currentUserEmail, currentUserName]);

  const selfEmail = currentUserEmail?.toLowerCase();
  const selfName = currentUserName?.trim().toLowerCase();
  const selectableContacts = sortedContacts.filter((c) => {
    if (isAdminEmployeeRole(c.role)) return false;
    if (c.isCurrentUser) return false;
    const cEmail = (c.email ?? '').toLowerCase();
    const cName = c.name.trim().toLowerCase();
    if (selfEmail && cEmail === selfEmail) return false;
    if (!cEmail && selfName && cName === selfName) return false;
    return true;
  });
  const allSelected = selectableContacts.length > 0 && selectableContacts.every((c) => selectedIds.includes(c.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <Table className="w-full text-[13px]">
      <TableHeader className="bg-[#f5fbf8]">
        <TableRow className="border-b border-[#dbe8e1]">
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              ref={(el) => {
                if (el) {
                  el.indeterminate = someSelected;
                }
              }}
              className="rounded-[4px] border-[#3d997d] h-4 w-4"
            />
          </TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide">Name</TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide">Email</TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[130px]">
            Telephone
          </TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide">Function</TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[160px]">Status</TableHead>
          {showActions && <TableHead className="text-[#1a5948] font-semibold tracking-wide text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr:last:border-b]">
        {sortedContacts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 7 : 6}>
              <EmptyState />
            </TableCell>
          </TableRow>
        ) : (
          sortedContacts.map((contact) => {
            const email = currentUserEmail?.toLowerCase();
            const name = currentUserName?.trim().toLowerCase();
            const contactEmail = (contact.email ?? '').toLowerCase();
            const contactName = contact.name.trim().toLowerCase();
            const isSelf =
              (!!email && contactEmail === email) ||
              (!contactEmail && !!name && contactName === name);
            const isAdminRow = isAdminEmployeeRole(contact.role);
            const isProtected = isSelf || isAdminRow;
            return (
              <TableRow key={contact.id} className={`border-b border-[#ebf3ef] hover:bg-[#f6fbf9] ${isSelf ? 'bg-[#f6fbf9]' : ''}`}>
                <TableCell>
                  <Checkbox
                    checked={!isProtected && selectedIds.includes(contact.id)}
                    onChange={() => !isProtected && onSelect(contact.id)}
                    disabled={isProtected}
                    className={`rounded-[4px] h-4 w-4 ${isProtected ? 'border-[#c8d4d0] opacity-40 cursor-not-allowed' : 'border-[#3d997d]'}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#111827]">{contact.name}</span>
                    {isSelf && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#d4f4e6] text-[#1a5948]">You</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className={contact.email ? 'text-[#111b18]' : 'text-[#9fa4a4] text-xs'}>
                  {contact.email || '—'}
                </TableCell>
                <TableCell
                  className={
                    contact.telephone ? 'text-[#111b18] w-[130px] tabular-nums whitespace-nowrap' : 'text-[#9fa4a4] text-xs w-[130px]'
                  }
                >
                  {contact.telephone ? formatDanishPhone(contact.telephone) : 'Not available'}
                </TableCell>
                <TableCell className="text-[#111b18]">
                  {contact.areas && contact.areas.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {contact.areas.map((area) => (
                        <span
                          key={area}
                          className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#e8f5ef] text-[#1a5948] whitespace-nowrap"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  ) : contact.functionTitle ? (
                    <span className="text-sm">{contact.functionTitle}</span>
                  ) : (
                    <span className="text-[#9fa4a4] text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-[#111b18]">
                  <div className="space-y-1 text-xs text-[#0d0e0e]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${contact.isPublic !== false ? 'bg-[#2f946f]' : 'bg-[#a15c00]'}`}
                      />
                      <span>{contact.isPublic !== false ? 'Public' : 'Private'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${contact.id.startsWith('emp-')
                        ? 'bg-[#9ca3af]'
                        : contact.isExternalContact
                          ? 'bg-[#1e40af]'
                          : 'bg-[#1a5948]'
                        }`} />
                      <span className={contact.id.startsWith('emp-') ? 'text-[#9ca3af]' : ''}>
                        {contact.id.startsWith('emp-')
                          ? 'Not in contacts'
                          : contact.isExternalContact
                            ? 'External contact'
                            : 'Existing contact'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${contact.status === 'ACTIVE' ? 'bg-[#2f946f]' : 'bg-[#d64545]'}`}
                      />
                      <span>{contact.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </TableCell>
                {showActions && (
                <TableCell className="text-right">
                  <TooltipProvider delayDuration={300}>
                  <div className="inline-flex items-center gap-2">
                    {/* Current-user placeholder row */}
                    {contact.isCurrentUser || contact.id === '0' ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full bg-[#e7f5ef] text-[#2c7860] hover:bg-[#d0ebe0]"
                            onClick={() => onAddAsContact?.(contact)}
                            aria-label="Add as contact"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add as contact</TooltipContent>
                      </Tooltip>
                    ) : contact.id.startsWith('emp-') ? (
                      /* Employee-only row — not yet a real contact */
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full bg-[#e7f5ef] text-[#2c7860] hover:bg-[#d0ebe0]"
                            onClick={() => onAddEmployeeAsContact?.(contact)}
                            aria-label="Add as contact"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add as contact</TooltipContent>
                      </Tooltip>
                    ) : (
                      /* Real contact — edit only if handler provided; delete only if handler provided and not self */
                      <>
                        {onEditEmployeeContact && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full bg-[#e7f5ef] text-[#2c7860]"
                                onClick={() => onEditEmployeeContact(contact)}
                                aria-label="Edit contact"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit contact</TooltipContent>
                          </Tooltip>
                        )}
                        {!isProtected && onDelete && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full bg-[#ffecef] text-[#d5384b]"
                                onClick={() => onDelete(contact)}
                                aria-label="Delete contact"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete contact</TooltipContent>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </div>
                  </TooltipProvider>
                </TableCell>
                )}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

export const ContactsTable = React.memo(ContactsTableInner);
