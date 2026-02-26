import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TermsModalProps {
    open: boolean;
    onClose: () => void;
    /** Called when the user clicks Luk after reading to the bottom — auto-ticks the checkbox */
    onAccept?: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ open, onClose, onAccept }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hasReadAll, setHasReadAll] = useState(false);

    // Reset every time the modal is opened so short-cutting isn't possible
    useEffect(() => {
        if (open) {
            setHasReadAll(false);
            // Small delay to let the DOM render, then check if content fits without scrolling
            setTimeout(() => {
                const el = scrollRef.current;
                if (el && el.scrollHeight <= el.clientHeight) {
                    setHasReadAll(true); // Content fits — no scroll needed
                }
            }, 50);
        }
    }, [open]);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        // 8px tolerance so it triggers just before the very last pixel
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
            setHasReadAll(true);
        }
    };

    // Escape closes without accepting
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    const handleLuk = () => {
        onAccept?.();
        onClose();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
            aria-labelledby="terms-title"
        >
            {/* Panel */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-[#e5e7eb] flex-shrink-0">
                    <h2 id="terms-title" className="text-xl font-bold text-[#1a5948]">
                        Vilkår og betingelser
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Luk"
                        className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scroll-to-read hint */}
                {!hasReadAll && (
                    <div className="flex items-center justify-center gap-1.5 py-2 bg-[#fffbeb] border-b border-[#fde68a] text-[12px] text-[#92400e] flex-shrink-0">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Scroll til bunden for at acceptere
                    </div>
                )}

                {/* Scrollable body */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="overflow-y-auto px-8 py-6 text-sm text-[#374151] leading-relaxed space-y-4 flex-1"
                >
                    <h3 className="font-semibold text-[#111827]">Data Controller at CompanyFlow</h3>
                    <p>
                        Michael Hartmann Frandsen –{' '}
                        <a href="mailto:michael@companyflow.dk" className="text-[#1a5948] underline">
                            michael@companyflow.dk
                        </a>
                    </p>

                    <p>
                        CompanyFlow is to be considered a data processor in the use of the company's data. The
                        company itself is the data controller. CompanyFlow.dk collects and processes data that is
                        necessary to be able to deliver our services to the company, which is our customer and
                        which has purchased access to our employee handbook.
                    </p>

                    <p>
                        We register company and personal information. This includes names, email addresses,
                        phone numbers and various other information about the company that is entered into the
                        system. The company's employees indirectly consent to the collection of their
                        information. The collection of personal data for employees is fundamental to our ability
                        to provide our services to the company.
                    </p>

                    <p>
                        Without this information, we are unable to fulfill the agreement that is entered into and
                        cannot deliver our service as agreed. We collect the information that the company itself
                        provides us when entering into the agreement as well as information about the users' use
                        of the system. This is a central and necessary part of our service.
                    </p>

                    <p>
                        The company is responsible for the accuracy of this data, and we have no obligation (or
                        ability) to ensure this. Similarly, we cannot ensure that confidential information is not
                        included in the company handbook. This is solely the company's own responsibility.
                    </p>

                    <p>
                        We collect information via cookies to customize the user experience on companyflow.dk
                        and to optimize the product. See more about this in our cookie policy at the bottom of
                        the page.
                    </p>

                    <p>
                        This data is stored for as long as the company has an account with us, and is only
                        accessible to CompanyFlow employees and the company itself. The data is{' '}
                        <strong>NOT</strong> shared with third parties.
                    </p>

                    <p>
                        The company has the right to view, correct and delete its own data – and to object to our
                        processing of data. The individual user / employee does not have these rights directly,
                        but must go through their company to enforce their rights under the GDPR.
                    </p>

                    <p>
                        If there are other objections to our processing of data, or if you wish to access the
                        information registered about the company and employees at CompanyFlow, or if you wish
                        to change, export or delete it, you can do so by contacting Kim Conrad Petersen –{' '}
                        <a href="mailto:michael@companyflow.dk" className="text-[#1a5948] underline">
                            michael@companyflow.dk
                        </a>
                    </p>

                    <p>
                        It is possible to complain about our processing of the information if we do not agree
                        with the objections. The complaint must be sent to the Danish Data Protection Authority.
                        See more at the Danish Data Protection Authority.
                    </p>

                    <h3 className="font-semibold text-[#111827] pt-2">We protect all data</h3>

                    <p>
                        We store the information on computers (servers) with limited access, and our security
                        measures are constantly checked to ensure that our information is handled responsibly
                        and with constant consideration for your rights. We take all necessary security measures
                        and keep our software updated as best as is technically possible in order to prevent
                        security gaps or breaches.
                    </p>

                    <p>
                        We cannot guarantee 100 percent security for data transfers via the Internet. This means
                        that there may be a risk that others may gain unauthorized access to information when
                        data is sent and stored electronically. Personal information is therefore provided at your
                        own risk. We undertake to inform you of any security breaches that we become aware of.
                    </p>

                    <p>
                        We are constantly changing our data processing practices as our product and relevant
                        technologies evolve. We therefore reserve the right to update and change this document.
                        If we do so, we will revise the "last updated" date. In the event of significant changes,
                        we will notify you by means of a visible notice on our website or by email.
                    </p>

                    <h3 className="font-semibold text-[#111827] pt-2">Cookies</h3>

                    <p>
                        A cookie is a small text file that is stored in the user's browser to recognize the
                        computer on return visits. No personal information is stored in CompanyFlow ApS'
                        cookies, and they cannot contain viruses.
                    </p>

                    <h4 className="font-medium text-[#111827]">Necessary cookie before consent</h4>
                    <p>
                        <code className="bg-[#f3f4f6] px-1 rounded text-xs">_js</code> – checks if the browser
                        has JavaScript and only lasts until the browser is closed.
                    </p>

                    <h4 className="font-medium text-[#111827]">Removing cookies</h4>
                    <p>
                        Cookies can be controlled as described below. However, as a company or employee of a
                        company that has entered into an agreement with CompanyFlow ApS, it makes no sense to
                        remove cookies, as the system cannot function as intended without them.
                    </p>

                    <h4 className="font-medium text-[#111827]">Control your own cookies</h4>
                    <ul className="list-disc list-inside space-y-1 text-[#374151]">
                        <li>Reject all cookies</li>
                        <li>Reject cookies from selected domains</li>
                        <li>Delete all cookies from selected domains</li>
                    </ul>

                    <p className="text-xs text-[#6b7280] italic">
                        Note: If the use of some or all cookies is prevented on companyflow.dk, the system will
                        not function as intended. This is the customer's own responsibility and does not exempt
                        them from paying the subscription.
                    </p>

                    <p>
                        Learn how to manage cookies at the Danish Business Authority:{' '}
                        <a
                            href="https://www.virk.dk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1a5948] underline"
                        >
                            How to avoid cookies
                        </a>
                        .
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-8 py-5 border-t border-[#e5e7eb] flex-shrink-0">
                    <p className="text-xs text-[#9ca3af]">
                        {hasReadAll
                            ? '✓ Du har læst dokumentet'
                            : 'Scroll til bunden for at aktivere knappen'}
                    </p>
                    <Button
                        onClick={handleLuk}
                        disabled={!hasReadAll}
                        className={`rounded-[999px] px-8 h-10 text-[13.5px] transition-colors ${hasReadAll
                                ? 'bg-[#1a5948] hover:bg-[#143e33] active:bg-[#0f2e26] text-white'
                                : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                            }`}
                    >
                        Luk
                    </Button>
                </div>
            </div>
        </div>
    );
};
