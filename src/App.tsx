import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { parseExplanationData } from './components/ExplanationView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthPage } from './pages/AuthPages';
import { ChatPage } from './pages/ChatPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExplainerPage } from './pages/ExplainerPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { CodeFile, ExplainerDraft, PageRoute, SavedExplanation } from './types';

const DEFAULT_PYTHON_SNIPPET = `def is_palindrome(text):
    cleaned = "".join(ch.lower() for ch in text if ch.isalnum())
    return cleaned == cleaned[::-1]

print(is_palindrome("Race car"))`;

const LANGUAGE_DEFAULTS: Record<string, { fileName: string; code: string }> = {
  Python: {
    fileName: 'palindrome.py',
    code: DEFAULT_PYTHON_SNIPPET,
  },
  JavaScript: {
    fileName: 'debounce.js',
    code: `function debounce(fn, delayMs) {
  let timerId = null;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delayMs);
  };
}`,
  },
  TypeScript: {
    fileName: 'group_by.ts',
    code: `export function groupBy<T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}`,
  },
  Java: {
    fileName: 'TwoSum.java',
    code: `import java.util.HashMap;
import java.util.Map;

public class TwoSum {
    public static int[] findPair(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int needed = target - nums[i];
            if (seen.containsKey(needed)) {
                return new int[] { seen.get(needed), i };
            }
            seen.put(nums[i], i);
        }
        return new int[] {};
    }
}`,
  },
  'C++': {
    fileName: 'reverse_vector.cpp',
    code: `#include <iostream>
#include <vector>
using namespace std;

void reverseArray(vector<int>& arr) {
    int left = 0, right = (int)arr.size() - 1;
    while (left < right) {
        swap(arr[left++], arr[right--]);
    }
}`,
  },
  C: {
    fileName: 'swap_pointers.c',
    code: `#include <stdio.h>

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main(void) {
    int x = 10, y = 20;
    swap(&x, &y);
    printf("x=%d, y=%d\\n", x, y);
    return 0;
}`,
  },
  HTML: {
    fileName: 'contact_form.html',
    code: `<form action="/submit" method="POST">
  <label for="email">Email Address</label>
  <input id="email" name="email" type="email" required />
  <button type="submit">Subscribe</button>
</form>`,
  },
  CSS: {
    fileName: 'card_grid.css',
    code: `.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}`,
  },
  SQL: {
    fileName: 'active_orders.sql',
    code: `SELECT u.name, SUM(o.total_amount) AS total_spent
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name
ORDER BY total_spent DESC;`,
  },
  Go: {
    fileName: 'worker.go',
    code: `package main

import "fmt"

func sumSlice(nums []int) int {
	total := 0
	for _, n := range nums {
		total += n
	}
	return total
}

func main() {
	fmt.Println(sumSlice([]int{3, 6, 9}))
}`,
  },
  Rust: {
    fileName: 'main.rs',
    code: `fn largest_number(list: &[i32]) -> Option<i32> {
    let mut largest = *list.first()?;
    for &item in list.iter() {
        if item > largest {
            largest = item;
        }
    }
    Some(largest)
}`,
  },
  PHP: {
    fileName: 'sanitize.php',
    code: `<?php
function formatGreeting(string $name): string {
    $safeName = htmlspecialchars(trim($name), ENT_QUOTES, 'UTF-8');
    return "Hello, " . ($safeName !== '' ? $safeName : 'Guest') . "!";
}`,
  },
};

function AppShell() {
  const { user } = useAuth();
  const [page, setPage] = useState<PageRoute>('home');
  const [selectedChatFileId, setSelectedChatFileId] = useState<number | null>(null);

  const [explainerDraft, setExplainerDraft] = useState<ExplainerDraft>({
    fileName: 'palindrome.py',
    programmingLanguage: 'Python',
    explanationLevel: 'beginner',
    code: DEFAULT_PYTHON_SNIPPET,
  });

  const handleNavigate = (next: PageRoute) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLanguageQuickstart = (language: string) => {
    const preset = LANGUAGE_DEFAULTS[language] || {
      fileName: 'snippet.txt',
      code: '',
    };
    const level =
      user?.preferredLevel === 'developer' || user?.preferredLevel === 'manager'
        ? user.preferredLevel
        : 'beginner';
    setExplainerDraft({
      fileName: preset.fileName,
      programmingLanguage: language,
      explanationLevel: level,
      code: preset.code,
      explanation: undefined,
    });
    handleNavigate('explainer');
  };

  const handleExplainFile = (file: CodeFile) => {
    const level =
      user?.preferredLevel === 'developer' || user?.preferredLevel === 'manager'
        ? user.preferredLevel
        : 'beginner';
    setExplainerDraft({
      fileId: file.id,
      projectId: file.project_id,
      fileName: file.file_name,
      programmingLanguage: file.programming_language,
      explanationLevel: level,
      code: file.code_content,
      explanation: undefined,
    });
    handleNavigate('explainer');
  };

  const handleOpenInExplainer = (item: SavedExplanation) => {
    const parsed = parseExplanationData(item.explanation) ?? undefined;
    const level =
      item.explanation_level === 'developer' || item.explanation_level === 'manager'
        ? item.explanation_level
        : 'beginner';
    setExplainerDraft({
      fileId: item.file_id,
      projectId: item.project_id,
      fileName: item.file_name || 'snippet.txt',
      programmingLanguage: item.programming_language || 'Python',
      explanationLevel: level,
      code: item.code_content || '',
      explanation: parsed,
    });
    handleNavigate('explainer');
  };

  const handleOpenChat = (fileId: number) => {
    setSelectedChatFileId(fileId);
    handleNavigate('chat');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2F3B34]">
      <Navbar currentPage={page} onNavigate={handleNavigate} />

      <main className="flex-1">
        {page === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectLanguageQuickstart={handleSelectLanguageQuickstart}
          />
        )}

        {page === 'signup' && (
          <AuthPage
            mode="signup"
            onNavigate={handleNavigate}
            onSuccess={() => handleNavigate('dashboard')}
          />
        )}

        {page === 'login' && (
          <AuthPage
            mode="login"
            onNavigate={handleNavigate}
            onSuccess={() => handleNavigate('dashboard')}
          />
        )}

        {page === 'dashboard' && (
          <DashboardPage
            onNavigate={handleNavigate}
            onExplainFile={handleExplainFile}
            onChatWithFile={handleOpenChat}
          />
        )}

        {page === 'explainer' && (
          <ExplainerPage
            draft={explainerDraft}
            onDraftChange={setExplainerDraft}
            onNavigate={handleNavigate}
            onOpenChat={handleOpenChat}
          />
        )}

        {page === 'chat' && (
          <ChatPage
            selectedFileId={selectedChatFileId}
            onSelectFileId={setSelectedChatFileId}
            onNavigate={handleNavigate}
          />
        )}

        {page === 'history' && (
          <HistoryPage
            onNavigate={handleNavigate}
            onOpenInExplainer={handleOpenInExplainer}
            onOpenChat={handleOpenChat}
          />
        )}

        {page === 'profile' && <ProfilePage onNavigate={handleNavigate} />}
      </main>

      {/* Calm Light Footer */}
      <footer className="border-t border-[#E7E2DA] bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-sm text-[#2F3B34]">
              SyntaxSage
            </span>
            <span aria-hidden="true" className="text-[#7C9A83]">·</span>
            <span>Calm AI code explanations for students & developers</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigate('explainer')}
              className="hover:text-[#2F3B34] transition-colors cursor-pointer"
            >
              Code Explainer
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('dashboard')}
              className="hover:text-[#2F3B34] transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('chat')}
              className="hover:text-[#2F3B34] transition-colors cursor-pointer"
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('history')}
              className="hover:text-[#2F3B34] transition-colors cursor-pointer"
            >
              History
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
