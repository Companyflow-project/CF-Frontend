import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DeleteBookDialogProps {
  open: boolean;
  bookTitle: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteBookDialog: React.FC<DeleteBookDialogProps> = ({
  open,
  bookTitle,
  pending,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation('admin');
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const matches = typed.trim() === bookTitle.trim() && bookTitle.length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {t('books.delete.title', 'Delete book')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('books.delete.close', 'Close')}
            className="h-6 w-6 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {t(
            'books.delete.body',
            'You are deleting a template book and all of its pages. This action is irreversible and will result in data loss. Proceed with caution.',
          )}
        </p>
        <p className="text-sm text-gray-700">
          {t('books.delete.typeToConfirm', 'Type the name of the book to confirm.')}
        </p>
        <Input
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={bookTitle}
          aria-label={t('books.delete.bookTitleLabel', 'Book title')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && matches && !pending) onConfirm();
          }}
        />
        <div className="flex justify-center pt-1">
          <Button
            disabled={!matches || pending}
            className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed px-8"
            onClick={onConfirm}
          >
            {pending
              ? t('books.delete.deleting', 'Deleting…')
              : t('books.delete.confirm', 'Delete')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
