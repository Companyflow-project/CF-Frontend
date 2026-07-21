import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Password field with an in-app show/hide toggle.
 *
 * Browsers ship their own reveal control (Edge's ::-ms-reveal, Safari's
 * autofill eye) but only on some engines and in some states, so the field
 * looked different from machine to machine. We hide the native affordance and
 * render our own so every password field behaves the same everywhere.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ className, ...props }, ref) => {
    const { t } = useTranslation('common');
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-11 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden', className)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // A reveal control is not a form stop — keep tabbing going to the submit button.
          tabIndex={-1}
          aria-label={visible ? t('password.hide') : t('password.show')}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#6b7280] transition-colors hover:text-[#0d0e0e] focus-visible:outline-none focus-visible:text-[#0d0e0e]"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
