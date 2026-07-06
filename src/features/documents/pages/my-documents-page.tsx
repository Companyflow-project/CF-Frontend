import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SignaturePad } from '@/components/common/signature-pad';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { FileText, ExternalLink, CheckCircle2, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { resolveBackendUrl } from '@/lib/utils';
import { documentsApi, EmployeeDocument } from '../api';

export const MyDocumentsPage: React.FC = () => {
  const { t } = useTranslation('account');
  const { t: tCommon } = useTranslation('common');
  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<EmployeeDocument | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    documentsApi
      .listMine()
      .then((d) => setDocs(d))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const openDoc = (doc: EmployeeDocument) => {
    setActive(doc);
    setSignature(null);
  };

  const handleSubmit = async () => {
    if (!active) return;
    if (active.requirement === 'signature' && !signature) {
      toast.error(t('myDocs.needSignature'));
      return;
    }
    setSubmitting(true);
    try {
      await documentsApi.complete(active.id, active.requirement === 'signature' ? signature ?? undefined : undefined);
      toast.success(t('myDocs.done'));
      setActive(null);
      setSignature(null);
      setLoading(true);
      load();
    } catch {
      toast.error(t('myDocs.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel = (s: EmployeeDocument['status']) =>
    s === 'signed' ? t('myDocs.signed') : s === 'approved' ? t('myDocs.approved') : t('myDocs.pending');

  return (
    <PageShell>
      <PageHeader title={t('myDocs.title')} description={t('myDocs.subtitle')} />
      <div className="max-w-[720px]">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-sm text-[#6b7280]">…</div>
            ) : docs.length === 0 ? (
              <div className="p-6 text-sm text-[#6b7280]">{t('myDocs.empty')}</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {docs.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-3 px-5 py-4">
                    <FileText className="h-5 w-5 text-[#6b7280] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] text-[#0d0e0e] truncate">{doc.title || doc.filename || `#${doc.id}`}</p>
                      <p className={`text-xs ${doc.status === 'pending' ? 'text-amber-600' : 'text-[#1a5948]'}`}>{statusLabel(doc.status)}</p>
                    </div>
                    <a href={resolveBackendUrl(doc.fileUri)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#1a5948] underline">
                      <ExternalLink className="h-4 w-4" /> {t('myDocs.view')}
                    </a>
                    {doc.status === 'pending' && (
                      <Button size="sm" onClick={() => openDoc(doc)}
                        className="bg-[#1a5948] hover:bg-[#143e33] text-white rounded-[8px]">
                        {doc.requirement === 'signature' ? <PenLine className="h-4 w-4 mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                        {doc.requirement === 'signature' ? t('myDocs.sign') : t('myDocs.approve')}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!active} onOpenChange={(open) => { if (!open) { setActive(null); setSignature(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{active?.requirement === 'approval' ? t('myDocs.approveTitle') : t('myDocs.signTitle')}</DialogTitle>
            <DialogDescription>
              {active?.requirement === 'approval' ? t('myDocs.approvePrompt') : t('myDocs.signPrompt')}
            </DialogDescription>
          </DialogHeader>
          {active && (
            <a href={resolveBackendUrl(active.fileUri)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#1a5948] underline mb-2">
              <ExternalLink className="h-4 w-4" /> {active.title || active.filename || t('myDocs.view')}
            </a>
          )}
          {active?.requirement === 'signature' && <SignaturePad onChange={setSignature} clearLabel={tCommon('clear', 'Clear')} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActive(null); setSignature(null); }} disabled={submitting}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}
              className="bg-[#1a5948] hover:bg-[#143e33] text-white">
              {submitting ? t('myDocs.submitting') : t('myDocs.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};
