import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Link,
    Image as ImageIcon,
    FileText,
    ChevronDown,
    Upload,
    Plus,
    Trash2,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { handbookApi } from '../api';
import { useEmployees } from '@/features/employees/hooks';
import { useAuth } from '@/context/auth-context';
import type { HandbookPageDetail, UpdatePagePayload } from '@/types/models';
import { resolveBackendUrl } from '@/lib/utils';

interface HandbookEditorProps {
    pageId?: number;
    onSave?: () => void;
    onCancel?: () => void;
}

interface LinkItem {
    uri: string;
    title: string;
}

interface DocumentItem {
    id: number;
    url?: string | null;
    name: string;
    description: string | null;
}

export const HandbookEditorEnhanced: React.FC<HandbookEditorProps> = ({
    pageId,
    onSave,
    onCancel,
}) => {
    // Auth and employees
    const { user } = useAuth();
    const { data: employees, loading: employeesLoading } = useEmployees();

    // Loading state
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Page data from API
    const [pageDetail, setPageDetail] = useState<HandbookPageDetail | null>(null);

    // Form fields
    const [heading, setHeading] = useState('');
    const [customText, setCustomText] = useState('');
    const [textMode, setTextMode] = useState<'0' | '1'>('0'); // 0 = CompanyFlow, 1 = Own
    const [notes, setNotes] = useState('');
    const [imageId, setImageId] = useState<number | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageName, setImageName] = useState<string | null>(null);
    const [imagePlacement, setImagePlacement] = useState<string | null>(null);
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [links, setLinks] = useState<LinkItem[]>([]);
    const [owners, setOwners] = useState<number[]>([]);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    // Other settings
    const [askForReceipt, setAskForReceipt] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [includeInHandbook, setIncludeInHandbook] = useState(false);
    const [notifyEmployees, setNotifyEmployees] = useState(false);

    // Local upload state
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingDocuments, setUploadingDocuments] = useState(false);

    // Load page data on mount
    useEffect(() => {
        if (!pageId) return;

        const loadPage = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await handbookApi.getPageDetail(pageId);
                if (data) {
                    setPageDetail(data);
                    setHeading(data.title || '');
                    setCustomText(data.versions?.custom || data.content || '');
                    setTextMode(data.sourceMode === 'custom' ? '1' : '0');
                    setNotes(data.internalNote || '');

                    const firstPicture = data.pictures && data.pictures.length > 0 ? data.pictures[0] : undefined;
                    if (firstPicture) {
                        setImageId(firstPicture.id ?? data.imageId ?? null);
                        setImageUrl(resolveBackendUrl(firstPicture.url) || null);
                        setImageName(firstPicture.name || null);
                    } else {
                        setImageId(data.imageId ?? null);
                        setImageUrl(null);
                        setImageName(null);
                    }
                    setDocuments(
                        (data.documents || []).map((d) => {
                            const docId = (d as { id?: number; fid?: number }).id ?? (d as { fid?: number }).fid;
                            return {
                                id: typeof docId === 'number' ? docId : 0,
                                url: (d as any).url ?? null,
                                name: d.name,
                                description: d.description ?? null,
                            };
                        })
                    );
                    setLinks(
                        (data.links || []).map((l) => ({
                            uri: l.uri || l.url || '',
                            title: l.title || '',
                        }))
                    );
                    setOwners(data.owners || []);

                    if (data.settings) {
                        setAskForReceipt(!!data.settings.askForReceipt);
                        setIsReady(!!data.settings.isReady);
                        setIncludeInHandbook(!!data.settings.includeInHandbook);
                        setNotifyEmployees(!!data.settings.notifyEmployees);
                    } else {
                        setAskForReceipt(false);
                        setIsReady(false);
                        setIncludeInHandbook(false);
                        setNotifyEmployees(false);
                    }
                }
            } catch (err: any) {
                console.error('Failed to load page:', err);
                setError(err.message || 'Failed to load page data');
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [pageId]);

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const isSectionExpanded = (section: string) => expandedSections.has(section);

    // Links helpers
    const addLink = () => setLinks([...links, { uri: '', title: '' }]);
    const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));
    const updateLink = (index: number, field: keyof LinkItem, value: string) => {
        const updated = [...links];
        updated[index] = { ...updated[index], [field]: value };
        setLinks(updated);
    };

    // Documents helpers
    const removeDocument = (index: number) => setDocuments(documents.filter((_, i) => i !== index));
    const updateDocumentDescription = (index: number, description: string) => {
        const updated = [...documents];
        updated[index] = { ...updated[index], description };
        setDocuments(updated);
    };

    const uploadImageFile = async (file: File) => {
        try {
            setUploadingImage(true);
            const uploaded = await handbookApi.uploadFile(file);
            setImageId(uploaded.id);
            setImageUrl(uploaded.url ?? null);
            setImageName(uploaded.name ?? file.name);
        } catch (err: any) {
            console.error('Failed to upload image:', err);
            toast.error(err.message || 'Failed to upload image. Please try again.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        void uploadImageFile(file);
    };

    const uploadDocumentFiles = async (files: File[]) => {
        if (!files.length) return;
        try {
            setUploadingDocuments(true);
            const uploadedItems = await Promise.all(
                files.map(async (file) => {
                    const uploaded = await handbookApi.uploadFile(file);
                    return {
                        id: uploaded.id,
                        name: uploaded.name || file.name,
                        description: null as string | null,
                    };
                })
            );
            setDocuments((prev) => [...prev, ...uploadedItems]);
        } catch (err: any) {
            console.error('Failed to upload documents:', err);
            toast.error(err.message || 'Failed to upload one or more documents. Please try again.');
        } finally {
            setUploadingDocuments(false);
        }
    };

    const handleDocumentFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        if (!files.length) return;
        void uploadDocumentFiles(files);
        event.target.value = '';
    };

    // Save handler
    const handleSave = useCallback(async () => {
        if (!pageId) return;

        try {
            setSaving(true);
            setError(null);

            const effectiveCustomText = textMode === '1' ? customText : '';

            const payload: UpdatePagePayload = {
                textMode,
                customText: effectiveCustomText,
                notes,
                imageId,
                imagePlacement,
                documents: documents
                    .filter((d) => typeof d.id === 'number' && d.id > 0)
                    .map((d) => ({
                        id: d.id,
                        description: d.description ?? null,
                    })),
                links: links.map((l) => ({
                    uri: l.uri,
                    title: l.title,
                })),
                owners,
                settings: {
                    askForReceipt,
                    isReady,
                    includeInHandbook,
                    notifyEmployees,
                },
            };

            await handbookApi.updatePage(pageId, payload);

            toast.success('Page saved successfully!');
            onSave?.();
        } catch (err: any) {
            console.error('Failed to save page:', err);
            toast.error(err.message || 'Failed to save page. Please try again.');
        } finally {
            setSaving(false);
        }
    }, [pageId, textMode, customText, notes, imageId, imagePlacement, documents, links, owners, onSave]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading page...
            </div>
        );
    }

    if (error && !pageDetail) {
        return (
            <div className="text-center py-12 text-red-500">{error}</div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Heading */}
            <div className="space-y-2">
                <Label className="text-sm font-medium text-[#0d0e0e]">Heading</Label>
                <Input
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    className="h-10 rounded-[10px] border border-[#c8d8d3] bg-white"
                />
            </div>

            {/* Text Editor */}
            <div className="space-y-2">
                <Label className="text-sm font-medium text-[#0d0e0e]">Text</Label>

                {/* Rich Text Toolbar */}
                <div className="rounded-t-[10px] p-2 flex items-center justify-between" style={{ backgroundColor: 'var(--cf-nav-bg, #000000)' }}>
                    <div className="flex items-center gap-1">
                        {/* Paragraph Dropdown */}
                        <button className="flex items-center gap-2 px-3 py-1.5 text-white text-sm hover:bg-white/10 rounded-[6px]">
                            <span>Paragraph</span>
                            <ChevronDown className="h-3.5 w-3.5" />
                        </button>

                        <div className="w-px h-5 bg-white/20 mx-1" />

                        {/* Formatting Buttons */}
                        <button className="p-1.5 text-white hover:bg-white/10 rounded-[6px]">
                            <Bold className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-white hover:bg-white/10 rounded-[6px]">
                            <Italic className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-white hover:bg-white/10 rounded-[6px]">
                            <Underline className="h-4 w-4" />
                        </button>

                        <div className="w-px h-5 bg-white/20 mx-1" />

                        <button className="p-1.5 text-white hover:bg-white/10 rounded-[6px]">
                            <List className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-white hover:bg-white/10 rounded-[6px]">
                            <ListOrdered className="h-4 w-4" />
                        </button>

                        <div className="w-px h-5 bg-white/20 mx-1" />

                        <button className="p-1.5 text-white hover:bg-white/10 rounded-[6px]">
                            <Link className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-white hover:bg-white/10 rounded-[6px]">
                            <ImageIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-white hover:bg-white/10 rounded-[6px]">
                            <FileText className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-white text-xs">
                        <span>CompanyFlow text</span>
                        <button className="p-1 hover:bg-white/10 rounded-[4px]">
                            <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* Text Area */}
                <Textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    rows={6}
                    placeholder="Add your text here"
                    className="rounded-b-[10px] rounded-t-none border border-t-0 border-[#c8d8d3] bg-white resize-none"
                />
            </div>

            {/* Text Mode Options */}
            <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                        checked={textMode === '0'}
                        onChange={() => setTextMode('0')}
                        className="rounded-[4px] border-[#3d997d] h-4 w-4"
                    />
                    <span className="text-[#0d0e0e]">Use CompanyFlow text</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                        checked={textMode === '1'}
                        onChange={() => setTextMode('1')}
                        className="rounded-[4px] border-[#3d997d] h-4 w-4"
                    />
                    <span className="text-[#0d0e0e]">Use your own text</span>
                </label>
            </div>

            {/* Pictures Section */}
            <div className="border border-[#e5efea] rounded-[12px]">
                <button
                    onClick={() => toggleSection('pictures')}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#f6fbf9] transition-colors"
                >
                    <span className="font-semibold text-[#0d0e0e]">Pictures</span>
                    <ChevronDown
                        className={`h-4 w-4 text-[#7b8a85] transition-transform ${isSectionExpanded('pictures') ? 'rotate-180' : ''
                            }`}
                    />
                </button>
                {isSectionExpanded('pictures') && (
                    <div className="px-4 pb-4 space-y-3">
                        <div className="border-2 border-dashed border-[#c8d8d3] rounded-[10px] p-6 text-center">
                            <label
                                htmlFor="handbook-image-upload"
                                className="flex flex-col items-center justify-center cursor-pointer"
                            >
                                <Upload className="h-8 w-8 text-[#7b8a85] mx-auto mb-2" />
                                <p className="text-sm text-[#7b8a85] mb-1">Click to upload image</p>
                                <p className="text-xs text-[#7b8a85]">Allowed: jpg, jpeg, jiff, png</p>
                                {uploadingImage && (
                                    <p className="text-xs text-[#4b5563] mt-2">Uploading image...</p>
                                )}
                                {!uploadingImage && imageUrl && (
                                    <div className="mt-3 flex flex-col items-center gap-2">
                                        <img
                                            src={imageUrl}
                                            alt={imageName || 'Uploaded image'}
                                            className="max-h-40 rounded-md object-contain"
                                        />
                                        {imageName && (
                                            <p className="text-xs text-[#4b5563]">
                                                {imageName}
                                            </p>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setImageId(null);
                                                setImageUrl(null);
                                                setImageName(null);
                                                setImagePlacement(null);
                                            }}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs gap-1"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Remove image
                                        </Button>
                                    </div>
                                )}
                            </label>
                            <input
                                id="handbook-image-upload"
                                type="file"
                                accept=".jpg,.jpeg,.jiff,.png"
                                className="hidden"
                                onChange={handleImageFileChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#0d0e0e]">
                                Select image placement:
                            </Label>
                            <div className="flex items-center gap-3">
                                {['before', 'left', 'right', 'after'].map((placement) => (
                                    <label key={placement} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="placement"
                                            value={placement}
                                            checked={imagePlacement === placement}
                                            onChange={() => setImagePlacement(placement)}
                                            className="text-[#3d997d]"
                                        />
                                        <span className="text-sm text-[#0d0e0e] capitalize">{placement}</span>
                                    </label>
                                ))}
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="placement"
                                        value=""
                                        checked={imagePlacement === null}
                                        onChange={() => setImagePlacement(null)}
                                        className="text-[#3d997d]"
                                    />
                                    <span className="text-sm text-[#0d0e0e]">None</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Documents Section */}
            <div className="border border-[#e5efea] rounded-[12px]">
                <button
                    onClick={() => toggleSection('documents')}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#f6fbf9] transition-colors"
                >
                    <span className="font-semibold text-[#0d0e0e]">Documents</span>
                    <ChevronDown
                        className={`h-4 w-4 text-[#7b8a85] transition-transform ${isSectionExpanded('documents') ? 'rotate-180' : ''
                            }`}
                    />
                </button>
                {isSectionExpanded('documents') && (
                    <div className="px-4 pb-4 space-y-3">
                        {documents.length > 0 && (
                            <div className="space-y-2">
                                {documents.map((doc, index) => (
                                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-white border border-[#e5efea] rounded-[8px]">
                                        <FileText className="h-4 w-4 text-[#7b8a85] flex-shrink-0" />
                                        <span className="text-sm text-[#0d0e0e] flex-shrink-0">{doc.name}</span>
                                        <Input
                                            value={doc.description || ''}
                                            onChange={(e) => updateDocumentDescription(index, e.target.value)}
                                            placeholder="Description (optional)"
                                            className="h-8 text-sm rounded-[6px] border-[#c8d8d3]"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeDocument(index)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 flex-shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="border-2 border-dashed border-[#c8d8d3] rounded-[10px] p-6 text-center">
                            <label
                                htmlFor="handbook-documents-upload"
                                className="flex flex-col items-center justify-center cursor-pointer"
                            >
                                <Upload className="h-8 w-8 text-[#7b8a85] mx-auto mb-2" />
                                <p className="text-sm text-[#7b8a85] mb-1">Click to upload files</p>
                                <p className="text-xs text-[#7b8a85]">
                                    Allowed: jpg, jpeg, png, rtf, doc, docx, xls, xlsx, ppt, pptx, odt,
                                    ods, odp, pdf, mp4, webm, ogg, mp3, wav, flac
                                </p>
                                {uploadingDocuments && (
                                    <p className="text-xs text-[#4b5563] mt-2">Uploading documents...</p>
                                )}
                            </label>
                            <input
                                id="handbook-documents-upload"
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleDocumentFilesChange}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Links Section */}
            <div className="border border-[#e5efea] rounded-[12px]">
                <button
                    onClick={() => toggleSection('links')}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#f6fbf9] transition-colors"
                >
                    <span className="font-semibold text-[#0d0e0e]">Links</span>
                    <ChevronDown
                        className={`h-4 w-4 text-[#7b8a85] transition-transform ${isSectionExpanded('links') ? 'rotate-180' : ''
                            }`}
                    />
                </button>
                {isSectionExpanded('links') && (
                    <div className="px-4 pb-4 space-y-3">
                        {links.map((link, index) => (
                            <div key={index} className="flex items-end gap-3">
                                <div className="flex-1 space-y-1">
                                    <Label className="text-xs font-medium text-[#7b8a85]">Title</Label>
                                    <Input
                                        value={link.title}
                                        onChange={(e) => updateLink(index, 'title', e.target.value)}
                                        placeholder="Link title"
                                        className="h-9 rounded-[8px] border-[#c8d8d3] bg-white text-sm"
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Label className="text-xs font-medium text-[#7b8a85]">URL</Label>
                                    <Input
                                        value={link.uri}
                                        onChange={(e) => updateLink(index, 'uri', e.target.value)}
                                        placeholder="https://..."
                                        className="h-9 rounded-[8px] border-[#c8d8d3] bg-white text-sm"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLink(index)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0 flex-shrink-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addLink}
                            className="border-[#c8d8d3] text-[#1a5948] rounded-[8px] px-3 h-8 text-xs gap-1"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add link
                        </Button>
                        <p className="text-sm text-[#7b8a85]">
                            <span className="font-semibold">Note:</span> Add https:// in front of your specific
                            website link. These links will appear below the page when it is displayed.
                        </p>
                    </div>
                )}
            </div>

            {/* Others Section */}
            <div className="border border-[#e5efea] rounded-[12px]">
                <button
                    onClick={() => toggleSection('others')}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#f6fbf9] transition-colors"
                >
                    <span className="font-semibold text-[#0d0e0e]">Others</span>
                    <ChevronDown
                        className={`h-4 w-4 text-[#7b8a85] transition-transform ${isSectionExpanded('others') ? 'rotate-180' : ''
                            }`}
                    />
                </button>
                {isSectionExpanded('others') && (
                    <div className="px-4 pb-4 space-y-3">
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={askForReceipt}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setAskForReceipt(e.target.checked)
                                }
                                className="rounded-[4px] border-[#3d997d] h-4 w-4 mt-0.5"
                            />
                            <span className="text-sm text-[#0d0e0e]">
                                Ask for a receipt{' '}
                                <span className="text-[#7b8a85]">
                                    (Ask the employees for a receipt that they have viewed this page.)
                                </span>
                            </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={isReady}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const next = e.target.checked;
                                    setIsReady(next);
                                    if (!next) {
                                        setIncludeInHandbook(false);
                                    }
                                }}
                                className="rounded-[4px] border-[#3d997d] h-4 w-4 mt-0.5"
                            />
                            <span className="text-sm text-[#0d0e0e]">
                                I think the page is ready now{' '}
                                <span className="text-[#7b8a85]">
                                    (Even if you mark the page as ready, you can always come back and change it.)
                                </span>
                            </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={includeInHandbook}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setIncludeInHandbook(e.target.checked)
                                }
                                disabled={!isReady}
                                className="rounded-[4px] border-[#3d997d] h-4 w-4 mt-0.5 disabled:opacity-50"
                            />
                            <span className="text-sm text-[#0d0e0e]">
                                Include this page in the handbook{' '}
                                <span className="text-[#7b8a85]">
                                    (Tick to include the page in the handbook, untick to exclude the page.)
                                </span>
                            </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                                checked={notifyEmployees}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setNotifyEmployees(e.target.checked)
                                }
                                className="rounded-[4px] border-[#3d997d] h-4 w-4 mt-0.5"
                            />
                            <span className="text-sm text-[#0d0e0e]">
                                Notify employees{' '}
                                <span className="text-[#7b8a85]">
                                    (Check the box to notify employees about this page when it is saved and ready.)
                                </span>
                            </span>
                        </label>
                    </div>
                )}
            </div>

            {/* Responsible Section */}
            <div className="border border-[#e5efea] rounded-[12px]">
                <button
                    onClick={() => toggleSection('responsible')}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#f6fbf9] transition-colors"
                >
                    <span className="font-semibold text-[#0d0e0e]">Responsible</span>
                    <ChevronDown
                        className={`h-4 w-4 text-[#7b8a85] transition-transform ${isSectionExpanded('responsible') ? 'rotate-180' : ''
                            }`}
                    />
                </button>
                {isSectionExpanded('responsible') && (
                    <div className="px-4 pb-4 space-y-3">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-[#0d0e0e]">Owner</Label>
                            {employeesLoading ? (
                                <div className="flex items-center gap-2 text-sm text-[#7b8a85] py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading employees...
                                </div>
                            ) : employees && employees.length > 0 ? (
                                <div className="space-y-2">
                                    {employees.map((employee) => {
                                        const employeeId = parseInt(employee.id, 10);
                                        const isCurrentUser = user?.id === employee.accountId;
                                        const isSelected = owners.includes(employeeId);

                                        return (
                                            <label
                                                key={employee.id}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => {
                                                        if (isSelected) {
                                                            setOwners(owners.filter((id) => id !== employeeId));
                                                        } else {
                                                            setOwners([...owners, employeeId]);
                                                        }
                                                    }}
                                                    className="rounded-[4px] border-[#3d997d] h-4 w-4"
                                                />
                                                <span className="text-sm text-[#0d0e0e]">
                                                    {employee.name}
                                                    {isCurrentUser && (
                                                        <span className="text-[#7b8a85]"> (You)</span>
                                                    )}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-[#7b8a85] py-2">
                                    No employees found in your company.
                                </p>
                            )}
                        </div>
                        <p className="text-sm text-[#7b8a85]">
                            <span className="font-semibold">Note:</span> Assign who is responsible for this page.
                            If you have multiple administrators you can divide the responsibility between you.
                        </p>
                    </div>
                )}
            </div>

            {/* Notes Section */}
            <div className="border border-[#e5efea] rounded-[12px]">
                <button
                    onClick={() => toggleSection('notes')}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#f6fbf9] transition-colors"
                >
                    <span className="font-semibold text-[#0d0e0e]">Notes</span>
                    <ChevronDown
                        className={`h-4 w-4 text-[#7b8a85] transition-transform ${isSectionExpanded('notes') ? 'rotate-180' : ''
                            }`}
                    />
                </button>
                {isSectionExpanded('notes') && (
                    <div className="px-4 pb-4 space-y-3">
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add your internal notes here"
                            rows={4}
                            className="rounded-[10px] border border-[#c8d8d3] bg-white resize-none"
                        />
                        <p className="text-sm text-[#7b8a85]">
                            <span className="font-semibold">Note:</span> Here you can write notes for yourself or
                            others who can edit the pages. This means that the company administrators can see the
                            notes.
                        </p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
                {onCancel && (
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={saving}
                        className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-6 py-2 h-auto text-sm"
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    onClick={handleSave}
                    disabled={saving || !pageId}
                    className="rounded-[8px] px-6 py-2 h-auto text-sm"
                    style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                        </>
                    ) : (
                        'Save page'
                    )}
                </Button>
            </div>
        </div>
    );
};
