import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Paperclip, Download } from 'lucide-react';
import { WbMessage } from '../api';

interface Props {
  viewerRole: 'reporter' | 'handler';
  status: string;
  messages: WbMessage[];
  canReply?: boolean;
  onReply: (message: string) => Promise<void>;
  onUpload?: (file: File) => Promise<void>;
  onDownload: (fileId: number, filename: string) => void;
}

/** Encrypted two-way thread, rendered for both the reporter (via access code) and a handler. */
export const ThreadPanel: React.FC<Props> = ({ viewerRole, status, messages, canReply = true, onReply, onUpload, onDownload }) => {
  const { t } = useTranslation('whistleblower');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const label = (sender: 'reporter' | 'handler') => {
    if (viewerRole === 'reporter') return sender === 'reporter' ? t('thread.you') : t('thread.company');
    return sender === 'handler' ? t('thread.you') : t('detail.reporter');
  };
  const mine = (sender: 'reporter' | 'handler') => sender === viewerRole;

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try { await onReply(text.trim()); setText(''); } finally { setBusy(false); }
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && onUpload) { setBusy(true); try { await onUpload(f); } finally { setBusy(false); } }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {messages.length === 0 && <p className="text-sm text-[#6b7280]">{t('thread.empty')}</p>}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-[12px] px-4 py-3 ${mine(m.sender) ? 'self-end bg-[#e7f2ee]' : 'self-start bg-[#f3f4f6]'}`}>
            <p className="text-xs text-[#6b7280] mb-1">{label(m.sender)}{m.createdAt ? ` · ${new Date(m.createdAt).toLocaleString()}` : ''}</p>
            <p className="text-sm text-[#0d0e0e] whitespace-pre-wrap">{m.body}</p>
            {m.files.map((f) => (
              <button key={f.id} type="button" onClick={() => onDownload(f.id, f.filename ?? 'attachment')} className="mt-2 inline-flex items-center gap-1 text-xs text-[#1a5948] underline">
                <Download className="h-3.5 w-3.5" /> {f.filename ?? 'attachment'}
              </button>
            ))}
          </div>
        ))}
      </div>

      {canReply && status !== 'closed' && (
        <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={t('thread.reply')}
            className="bg-[#f2f2f2] rounded-[7px] p-3 text-[15px] text-[#373b3b] border-0 focus-visible:ring-0 w-full" />
          <div className="flex items-center gap-2">
            <Button onClick={send} disabled={busy || !text.trim()} className="bg-[#1a5948] hover:bg-[#143e33] text-white rounded-[10px]">
              {busy ? t('thread.sending') : t('thread.send')}
            </Button>
            {onUpload && (
              <>
                <input ref={fileRef} type="file" className="hidden" onChange={upload} />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
                  <Paperclip className="h-4 w-4 mr-1" /> {t('thread.attach')}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
