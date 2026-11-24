export type PageRoute =
  | 'home'
  | 'signup'
  | 'login'
  | 'dashboard'
  | 'explainer'
  | 'chat'
  | 'history'
  | 'profile';

export interface User {
  id: number;
  name: string;
  email: string;
  preferredExplanationLanguage: string;
  preferredLevel: 'beginner' | 'developer' | 'manager' | string;
  createdAt: string;
}

export interface UserStats {
  projectsCount: number;
  filesCount: number;
  explanationsCount: number;
  chatMessagesCount: number;
}

export interface Project {
  id: number;
  user_id: number;
  project_name: string;
  description: string | null;
  created_at: string;
  file_count?: number;
}

export interface CodeFile {
  id: number;
  project_id: number;
  file_name: string;
  programming_language: string;
  code_content: string;
  created_at: string;
  project_name?: string;
}

export interface StructuredExplanation {
  whatCodeDoes: string;
  lineByLine: Array<{
    lines: string;
    codeSnippet: string;
    explanation: string;
  }>;
  importantConcepts: Array<{
    concept: string;
    description: string;
  }>;
  possibleBugs: Array<{
    severity: string;
    issue: string;
    recommendation: string;
  }>;
  suggestedImprovements: Array<{
    title: string;
    detail: string;
  }>;
}

export interface SavedExplanation {
  id: number;
  file_id: number;
  explanation_level: string;
  explanation: string;
  created_at: string;
  file_name?: string;
  programming_language?: string;
  code_content?: string;
  project_id?: number;
  project_name?: string;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  file_id: number | null;
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
}

export interface ExplainerDraft {
  fileId?: number;
  fileName?: string;
  projectId?: number;
  code: string;
  programmingLanguage: string;
  explanationLevel: 'beginner' | 'developer' | 'manager';
  explanation?: StructuredExplanation;
}
