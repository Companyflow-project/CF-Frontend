import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { ArrowLeft, Search, ArrowUpDown, ArrowDownWideNarrow, Edit } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyState } from '@/components/common/empty-state';
import { usePublicContacts } from '../hooks';
import { contactsRoutes } from '../routes';

export const PublicContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'name' | 'email' | 'employment'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { data: contacts, loading, error } = usePublicContacts();

  const uniqueContacts = useMemo(() => {
    const map: Record<string, (typeof contacts)[number]> = {};
    for (const c of contacts) {
      const key = (c.email || c.name || '').trim().toLowerCase();
      if (!key) continue;
      if (!map[key]) map[key] = c;
    }
    return Object.values(map);
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return uniqueContacts;
    const q = search.trim().toLowerCase();
    return uniqueContacts.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.telephone && c.telephone.includes(q)),
    );
  }, [uniqueContacts, search]);

  const sortedContacts = useMemo(() => {
    const list = [...filteredContacts];
    const getKey = (c: (typeof filteredContacts)[number]) => {
      if (sortField === 'name') return c.name ?? '';
      if (sortField === 'email') return c.email ?? '';
      const employment = c.functionTitle || (c.areas && c.areas.length > 0 ? c.areas[0] : '');
      return employment ?? '';
    };
    list.sort((a, b) => {
      const av = getKey(a).toLowerCase();
      const bv = getKey(b).toLowerCase();
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      const cmp = av.localeCompare(bv, undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredContacts, sortField, sortDirection]);

  const sortLabel = useMemo(() => {
    if (sortField === 'name') return 'Name';
    if (sortField === 'email') return 'Email';
    return 'Employment';
  }, [sortField]);

  const handleCycleSortField = () => {
    setSortField((prev) => (prev === 'name' ? 'email' : prev === 'email' ? 'employment' : 'name'));
  };

  const handleToggleDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleResetSort = () => {
    setSortField('name');
    setSortDirection('asc');
  };

  return (
    <PageShell>
      {/* Page header — back button + title */}
      <div className="flex items-center gap-3 mb-6">
        <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(contactsRoutes.list)}
              className="flex items-center gap-1.5 rounded-[10px] border-[rgba(15,23,42,0.12)] text-[#0d0e0e] h-9 px-3 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="text-[13px] font-medium">Back</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to contacts</TooltipContent>
        </Tooltip>
        </TooltipProvider>
        <h1 className="text-2xl font-bold text-[#0d0e0e] tracking-tight">Public Contacts Information List</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load public contacts: {error.message}
        </div>
      )}

      {/* Help banner */}
      <div className="mb-6 bg-[#fff9f0] rounded-[16px] border border-[#f59e0b] border-l-[6px] shadow-[0_18px_40px_rgba(219,145,0,0.15)] px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-[#0d0e0e]">
            <span className="font-bold">Help.</span>{' '}
            This list shows contacts that are marked as public and can be surfaced on handbook pages and information lists.
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

      <Card className="bg-white border border-[#e5efea] rounded-[22px] shadow-[0_18px_45px_rgba(14,51,38,0.08)] flex flex-col overflow-hidden">
        <CardContent className="pt-5 pb-5 flex flex-col gap-4">

          {/* Sort + search toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#0d0e0e]">Sort</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[rgba(15,23,42,0.18)] text-[#242727] rounded-[10px] px-4 py-[9px] h-auto bg-white shadow-[0_6px_14px_rgba(15,23,42,0.05)]"
                    onClick={handleCycleSortField}
                  >
                    {sortLabel}
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
                    onClick={handleToggleDirection}
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
                    onClick={handleResetSort}
                  >
                    <ArrowDownWideNarrow className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset sort</TooltipContent>
              </Tooltip>
            </div>
            </TooltipProvider>

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
              Loading public contacts…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full text-[13px]">
                <TableHeader className="bg-[#f5fbf8]">
                  <TableRow className="border-b border-[#dbe8e1]">
                    <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[25%]">
                      <div className="flex items-center gap-1">
                        Name
                        <span className="text-[#f77c19] text-xs">↑</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[25%]">
                      Email
                    </TableHead>
                    <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[20%]">
                      Telephone
                    </TableHead>
                    <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[20%]">
                      Function / areas
                    </TableHead>
                    <TableHead className="text-[#1a5948] font-semibold tracking-wide w-[10%] text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <EmptyState
                          title="No contacts found"
                          description="Try adjusting your search."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedContacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        className="border-b border-[#ebf3ef] hover:bg-[#f6fbf9]"
                      >
                        <TableCell className="w-[25%]">
                          <span className="font-medium text-[#111827] truncate block" title={contact.name}>
                            {contact.name}
                          </span>
                        </TableCell>
                        <TableCell className="w-[25%] text-[#111b18] break-words">
                          <div className="line-clamp-2" title={contact.email}>
                            {contact.email || <span className="text-[#9fa4a4]">Not available</span>}
                          </div>
                        </TableCell>
                        <TableCell className="w-[20%]">
                          {contact.telephone ? (
                            <span className="text-[#111b18]">{contact.telephone}</span>
                          ) : (
                            <span className="text-[#9fa4a4]">Not available</span>
                          )}
                        </TableCell>
                        <TableCell className="w-[20%] text-[#111b18]">
                          {contact.areas && contact.areas.length > 0
                            ? contact.areas.join(', ')
                            : contact.functionTitle || <span className="text-[#9ca3af]">Not available</span>}
                        </TableCell>
                        <TableCell className="w-[10%] text-center">
                          <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md bg-[#e7f5ef] text-[#2c7860] hover:bg-[#d0ebe0] mx-auto"
                                aria-label="Edit contact"
                                onClick={() => navigate(`${contactsRoutes.list}?edit-contact-id=${contact.id}`)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit contact</TooltipContent>
                          </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
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
          onClick={() => navigate(contactsRoutes.list)}
          className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[999px] px-5 py-[11px] h-auto text-[13.3px] shadow-[0_10px_20px_rgba(23,102,79,0.35)]"
        >
          Edit Contacts
        </Button>
      </div>
    </PageShell>
  );
};

