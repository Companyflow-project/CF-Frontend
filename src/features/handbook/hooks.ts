import { useState, useEffect } from 'react';
import { HandbookSection, HandbookPage } from '@/types/models';
import { HandbookDetail } from '@/lib/api-types';
import { handbookApi } from './api';

export const useHandbookSections = () => {
  const [data, setData] = useState<HandbookSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await handbookApi.listSections();
        console.log('Handbook sections fetched:', result);
        setData(result);
      } catch (err) {
        console.error('Error fetching handbook sections:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sections';
        setError(new Error(errorMessage));
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  return { data, loading, error, refetch: () => { } };
};

export const useHandbookPages = (sectionId?: string) => {
  const [data, setData] = useState<HandbookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPages = async () => {
      if (!sectionId) {
        setData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await handbookApi.listPages(sectionId);
        console.log('Handbook pages fetched for section:', sectionId, result);
        setData(result);
      } catch (err) {
        console.error('Error fetching handbook pages:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pages';
        setError(new Error(errorMessage));
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [sectionId]);

  return { data, loading, error, refetch: () => { } };
};

export const useHandbook = (id?: string) => {
  const [data, setData] = useState<HandbookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchHandbook = async () => {
      if (!id) {
        setData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await handbookApi.getHandbook(id);
        setData(result);
      } catch (err) {
        console.error('Error fetching handbook:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch handbook';
        setError(new Error(errorMessage));
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHandbook();
  }, [id]);

  return { data, loading, error };
};

