import { axiosClient } from '@/lib/axios-client';
import type { ApiResponse } from '@/lib/api-types';

export interface QuizQuestion {
  id?: number;
  question: string;
  options: string[];
  correctIndex?: number;
}

export interface Quiz {
  id: number;
  nid: number;
  title: string | null;
  passMark: number;
  questions: QuizQuestion[];
}

export interface QuizStatus {
  attempted: boolean;
  passed: boolean;
  bestScore: number;
}

export interface QuizAttemptResult {
  score: number;
  passed: boolean;
  total: number;
  correct: number;
  passMark: number;
}

export interface QuizResultRow {
  uid: number;
  name: string;
  email: string;
  score: number;
  passed: boolean;
  takenAt: string;
}

export interface SaveQuizInput {
  nid: number;
  title?: string;
  passMark: number;
  questions: { question: string; options: string[]; correctIndex: number }[];
}

/** CF-21: quizzes attached to handbook pages. */
export const quizzesApi = {
  /** Admin: quiz with correct answers, for editing (null if none). */
  async getForManage(nid: number): Promise<Quiz | null> {
    const resp = await axiosClient.get<ApiResponse<Quiz | null>>(`/quizzes/manage/${nid}`);
    return resp.data.data ?? null;
  },

  async save(input: SaveQuizInput): Promise<void> {
    await axiosClient.post('/quizzes', input);
  },

  async remove(id: number): Promise<void> {
    await axiosClient.delete(`/quizzes/${id}`);
  },

  /** Employee: quiz without answers + the caller's status. */
  async getForPage(nid: number): Promise<{ quiz: Quiz | null; status: QuizStatus | null }> {
    const resp = await axiosClient.get<ApiResponse<{ quiz: Quiz | null; status: QuizStatus | null }>>(`/quizzes/for-page/${nid}`);
    return resp.data.data ?? { quiz: null, status: null };
  },

  async attempt(id: number, answers: number[]): Promise<QuizAttemptResult> {
    const resp = await axiosClient.post<ApiResponse<QuizAttemptResult>>(`/quizzes/${id}/attempt`, { answers });
    return resp.data.data;
  },

  /** Owner: results/attempts for a quiz. */
  async results(id: number): Promise<QuizResultRow[]> {
    const resp = await axiosClient.get<ApiResponse<QuizResultRow[]>>(`/quizzes/${id}/results`);
    return resp.data.data ?? [];
  },
};
