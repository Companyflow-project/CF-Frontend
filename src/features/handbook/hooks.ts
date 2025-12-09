import { useState, useEffect } from 'react';
import { HandbookSection, HandbookPage } from '@/types/models';
import { handbookApi } from './api';

export const useHandbookSections = () => {
  const [data, setData] = useState<HandbookSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const result = await handbookApi.listSections();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch sections'));
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  return { data, loading, error, refetch: () => {} };
};

export const useHandbookPages = (sectionId?: string) => {
  const [data, setData] = useState<HandbookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const result = await handbookApi.listPages(sectionId);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch pages'));
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [sectionId]);

  return { data, loading, error, refetch: () => {} };
};

