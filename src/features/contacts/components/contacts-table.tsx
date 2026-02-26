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
import { Contact } from '@/types/models';

interface ContactsTableProps {
  contacts: Contact[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  /** For the current-user placeholder row (nid === 0 / isCurrentUser): add as contact using current user's uid */
  onAddAsContact?: (contact: Contact) => void;
}

function ContactsTableInner({
  contacts,
  selectedIds,
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onAddAsContact,
}: ContactsTableProps) {
  const allSelected = contacts.length > 0 && selectedIds.length === contacts.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < contacts.length;

  return (
    <Table className="min-w-[860px] text-[13px]">
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
          <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[220px]">
            Telephone
          </TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide">Function</TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[220px]">Status</TableHead>
          <TableHead className="text-[#1a5948] font-semibold tracking-wide text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr:last:border-b]">
        {contacts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7}>
              <EmptyState />
            </TableCell>
          </TableRow>
        ) : (
          contacts.map((contact) => (
            <TableRow key={contact.id} className="border-b border-[#ebf3ef] hover:bg-[#f6fbf9]">
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(contact.id)}
                  onChange={() => onSelect(contact.id)}
                  className="rounded-[4px] border-[#3d997d] h-4 w-4"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#111827]">{contact.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-[#111b18]">{contact.email}</TableCell>
              <TableCell
                className={
                  contact.telephone ? 'text-[#111b18] w-[220px] whitespace-nowrap' : 'text-[#9fa4a4] text-xs'
                }
              >
                {contact.telephone || 'Not available'}
              </TableCell>
              <TableCell className="text-[#111b18]">
                {contact.functionTitle || '-'}
              </TableCell>
              <TableCell className="text-[#111b18]">
                <div className="space-y-1 text-xs text-[#0d0e0e]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${contact.isPublic ? 'bg-[#2f946f]' : 'bg-[#a15c00]'
                        }`}
                    />
                    <span>{contact.isPublic ? 'Public' : 'Private'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1a5948]" />
                    <span>
                      {contact.isEmployeeContact
                        ? 'Employee'
                        : contact.isExternalContact
                          ? 'External contact'
                          : 'Contact'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${contact.status === 'ACTIVE' ? 'bg-[#2f946f]' : 'bg-[#d64545]'
                        }`}
                    />
                    <span>{contact.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center gap-2">
                  {contact.isCurrentUser || contact.id === '0' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-full bg-[#e7f5ef] border-[#3d997d] text-[#2c7860] hover:bg-[#d0ebe0] text-xs gap-1.5"
                      onClick={() => onAddAsContact?.(contact)}
                      aria-label="Add as contact"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Add as contact
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-[#e7f5ef] text-[#2c7860]"
                        onClick={() => onEdit?.(contact)}
                        aria-label="Edit contact"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-[#ffecef] text-[#d5384b]"
                        onClick={() => onDelete?.(contact)}
                        aria-label="Delete contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export const ContactsTable = React.memo(ContactsTableInner);
