import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { useCompanies } from '@/lib/api-hooks';

export const CompaniesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data: companies, meta, loading, error } = useCompanies({ page, limit });

  if (loading) {
    return (
      <PageShell>
        <PageHeader title="Companies" />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading companies...</div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <PageHeader title="Companies" />
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error: {error.message}</div>
        </div>
      </PageShell>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <PageShell>
        <PageHeader title="Companies" />
        <EmptyState />
      </PageShell>
    );
  }

  const totalPages = meta?.total && meta?.limit ? Math.ceil(meta.total / meta.limit) : 1;

  return (
    <PageShell>
      <PageHeader title="Companies" />
      <div className="space-y-4">
        <div className="grid gap-4">
          {companies.map((company) => (
            <Link
              key={company.id}
              to={`/companies/${company.id}`}
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{company.name}</h3>
                  {company.companyCity && (
                    <p className="text-sm text-gray-600 mt-1">{company.companyCity}</p>
                  )}
                  {company.companyCvr && (
                    <p className="text-xs text-gray-500 mt-1">CVR: {company.companyCvr}</p>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Created: {new Date(company.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
};

