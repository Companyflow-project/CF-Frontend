import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useCompany, useCompanyContacts, useCompanyHandbooks } from '@/lib/api-hooks';

export const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('contacts');
  const [contactsPage, setContactsPage] = useState(1);
  const [handbooksPage, setHandbooksPage] = useState(1);
  const limit = 20;

  const { data: company, loading: companyLoading, error: companyError } = useCompany(id || null);
  const { data: contacts, meta: contactsMeta, loading: contactsLoading } = useCompanyContacts(
    id ? { companyId: id, page: contactsPage, limit } : null
  );
  const { data: handbooks, meta: handbooksMeta, loading: handbooksLoading } = useCompanyHandbooks(
    id ? { companyId: id, page: handbooksPage, limit } : null
  );

  if (companyLoading) {
    return (
      <PageShell>
        <PageHeader title="Company Details" />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading company...</div>
        </div>
      </PageShell>
    );
  }

  if (companyError || !company) {
    return (
      <PageShell>
        <PageHeader title="Company Details" />
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">
            {companyError ? `Error: ${companyError.message}` : 'Company not found'}
          </div>
        </div>
      </PageShell>
    );
  }

  const contactsTotalPages =
    contactsMeta?.total && contactsMeta?.limit
      ? Math.ceil(contactsMeta.total / contactsMeta.limit)
      : 1;
  const handbooksTotalPages =
    handbooksMeta?.total && handbooksMeta?.limit
      ? Math.ceil(handbooksMeta.total / handbooksMeta.limit)
      : 1;

  return (
    <PageShell>
      <PageHeader title={company.name} />
      <div className="space-y-4 mb-4">
        <div className="text-sm text-gray-600">
          {company.companyCity && <div>City: {company.companyCity}</div>}
          {company.companyCvr && <div>CVR: {company.companyCvr}</div>}
          <div>Created: {new Date(company.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="handbooks">Handbooks</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          {contactsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading contacts...</div>
          ) : !contacts || contacts.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.nid}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="font-semibold">{contact.title}</div>
                    <div className="text-sm text-gray-600">
                      Status: {contact.status === 1 ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Created: {new Date(contact.created * 1000).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {contactsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => setContactsPage((p) => Math.max(1, p - 1))}
                    disabled={contactsPage === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {contactsPage} of {contactsTotalPages}
                  </span>
                  <button
                    onClick={() => setContactsPage((p) => Math.min(contactsTotalPages, p + 1))}
                    disabled={contactsPage >= contactsTotalPages}
                    className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="handbooks" className="space-y-4">
          {handbooksLoading ? (
            <div className="text-center py-8 text-gray-500">Loading handbooks...</div>
          ) : !handbooks || handbooks.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="space-y-2">
                {handbooks.map((handbook) => (
                  <div
                    key={handbook.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">{handbook.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Created: {new Date(handbook.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/handbooks/${handbook.id}/viewer`)}
                        className="ml-4"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {handbooksTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => setHandbooksPage((p) => Math.max(1, p - 1))}
                    disabled={handbooksPage === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {handbooksPage} of {handbooksTotalPages}
                  </span>
                  <button
                    onClick={() => setHandbooksPage((p) => Math.min(handbooksTotalPages, p + 1))}
                    disabled={handbooksPage >= handbooksTotalPages}
                    className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
};

