import { useState, useEffect, useCallback, useRef } from 'react';
import type { HandbookNode, HandbookPageDetail } from '@/types/models';
import { handbookApi } from './api';

const POLL_INTERVAL_MS = 5000;

/**
 * Hook to fetch the handbook tree (chapters and pages).
 * When the tree comes back empty (no chapters) it auto-polls every 5s
 * until chapters appear — handles handbook provisioning after new signup.
 */
export const useHandbookTree = (lang: string = 'en') => {
  const [data, setData] = useState<HandbookNode[]>([]);
  const [bid, setBid] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchTree = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      setError(null);
      const result = await handbookApi.getHandbookTree(lang);
      console.log('Handbook tree fetched:', result);
      setData(result.chapters);
      setBid(result.bid);

      if (result.chapters.length > 0) {
        setProvisioning(false);
        stopPolling();
      } else if (!isPolling) {
        setProvisioning(true);
      }
    } catch (err) {
      console.error('Error fetching handbook tree:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch handbook tree';
      setError(new Error(errorMessage));
      setData([]);
      setBid(null);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [lang, stopPolling]);

  useEffect(() => {
    fetchTree();
    return stopPolling;
  }, [fetchTree, stopPolling]);

  // Poll while provisioning
  useEffect(() => {
    if (provisioning && !pollRef.current) {
      pollRef.current = setInterval(() => fetchTree(true), POLL_INTERVAL_MS);
    }
    if (!provisioning) stopPolling();
    return stopPolling;
  }, [provisioning, fetchTree, stopPolling]);

  return { data, bid, loading, error, provisioning, refetch: () => fetchTree() };
};

/**
 * Hook to fetch a specific handbook page for editing
 */
export const useHandbookPage = (pageId?: number, lang: string = 'en') => {
  const [data, setData] = useState<HandbookPageDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      if (!pageId) {
        setData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await handbookApi.getPageDetail(pageId, lang);
        console.log('Handbook page fetched:', result);
        setData(result);
      } catch (err) {
        console.error('Error fetching handbook page:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch page';
        setError(new Error(errorMessage));
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [pageId, lang]);

  return { data, loading, error, refetch: () => { } };
};

// Legacy hooks for backward compatibility (deprecated - use useHandbookTree instead)
/**
 * @deprecated Use useHandbookTree instead
 */
export const useHandbookSections = () => {
  const { data: tree, loading, error } = useHandbookTree();

  // Convert tree to sections format for backward compatibility
  const sections = tree
    .filter(node => node.type === 'chapter')
    .map((chapter, index) => ({
      id: String(chapter.id),
      title: chapter.title,
      slug: chapter.title.toLowerCase().replace(/\s+/g, '-'),
      order: index,
      accountId: '',
    }));

  return { data: sections, loading, error, refetch: () => { } };
};

/**
 * @deprecated Use useHandbookTree and filter pages from chapters instead
 */
export const useHandbookPages = (sectionId?: string) => {
  const { data: tree, loading, error } = useHandbookTree();

  // Find pages for the given section
  const pages = sectionId
    ? tree
      .find(node => String(node.id) === sectionId)
      ?.pages?.map(page => ({
        id: String(page.id),
        sectionId: sectionId,
        title: page.title,
        status: page.status === 'ready' ? 'READY' as const : 'NOT_READY' as const,
        updatedAt: new Date().toISOString(),
      })) || []
    : [];

  return { data: pages, loading, error, refetch: () => { } };
};

/**
 * @deprecated No longer supported - use useHandbookPage instead
 */
export const useHandbook = (id?: string) => {
  const [data] = useState<any | null>(null);
  const [loading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (id) {
      setError(new Error('useHandbook is deprecated. Use useHandbookPage instead.'));
    }
  }, [id]);

  return { data, loading, error };
};
