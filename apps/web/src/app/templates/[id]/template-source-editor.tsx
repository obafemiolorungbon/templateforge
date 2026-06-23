'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import {
  autocompletion,
  type CompletionContext,
} from '@codemirror/autocomplete';
import { linter, type Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import type { TemplateDetail } from '@templateforge/shared-types';
import { api } from '../../../lib/api';

const brandVariables = [
  'brand_name',
  'brand_product_name',
  'brand_website',
  'brand_logo_url',
  'brand_primary_color',
  'brand_accent_color',
  'brand_footer_text',
];

const editorTheme = EditorView.theme({
  '&': {
    backgroundColor: '#09090b',
    color: '#e4e4e7',
    borderRadius: '1.15rem',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  '.cm-scroller': {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '12px',
    lineHeight: '1.7',
  },
  '.cm-content': {
    padding: '16px 0',
  },
  '.cm-line': {
    padding: '0 16px',
  },
  '.cm-gutters': {
    backgroundColor: '#09090b',
    color: '#52525b',
    borderRight: '1px solid rgba(255,255,255,0.08)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(167,201,87,0.08)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(167,201,87,0.08)',
  },
  '.cm-tooltip': {
    backgroundColor: '#18181b',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#e4e4e7',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'rgba(167,201,87,0.18)',
    color: '#f4f4f5',
  },
});

type EditorMode = 'mjml' | 'text';

export function TemplateSourceEditor({
  template,
}: {
  template: TemplateDetail;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(template.subject);
  const [mjml, setMjml] = useState(template.mjml);
  const [text, setText] = useState(template.text);
  const [mode, setMode] = useState<EditorMode>('mjml');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const allowedVariables = useMemo(
    () =>
      Array.from(
        new Set([
          ...template.variables.map((variable) => variable.name),
          ...brandVariables,
        ]),
      ).sort(),
    [template.variables],
  );
  const extensions = useMemo(
    () => sourceEditorExtensions(allowedVariables, mode),
    [allowedVariables, mode],
  );
  const hasChanges =
    subject !== template.subject || mjml !== template.mjml || text !== template.text;

  async function save() {
    setSaving(true);
    setMessage(null);

    try {
      await api.updateTemplate(template.id, {
        subject,
        mjml,
        text,
        changeNote: 'Updated source with CodeMirror editor',
      });
      setMessage('Source saved as a new version.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save source.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#171713] p-4 text-zinc-50 shadow-[0_24px_70px_-50px_rgba(24,24,27,0.58)] md:p-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Template source</h2>
          <p className="mt-2 max-w-[65ch] text-sm leading-6 text-zinc-500">
            Edit MJML and text with variable autocomplete. Type {'{{'} to insert
            a known placeholder.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || !hasChanges}
          className="min-h-11 rounded-xl bg-[#a7c957] px-4 text-sm font-semibold text-zinc-950 transition hover:bg-[#98bb4f] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving source' : 'Save source'}
        </button>
      </div>

      <label className="mt-5 grid gap-2">
        <span className="text-xs font-medium text-zinc-500">Subject</span>
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="input-dark rounded-xl"
        />
      </label>

      <div className="mt-5 flex flex-wrap gap-2">
        <ModeButton active={mode === 'mjml'} onClick={() => setMode('mjml')}>
          MJML
        </ModeButton>
        <ModeButton active={mode === 'text'} onClick={() => setMode('text')}>
          Plain text
        </ModeButton>
      </div>

      <div className="mt-4">
        <CodeMirror
          value={mode === 'mjml' ? mjml : text}
          height={mode === 'mjml' ? '620px' : '420px'}
          theme="dark"
          basicSetup={{
            foldGutter: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
          }}
          extensions={extensions}
          onChange={(value) => {
            if (mode === 'mjml') {
              setMjml(value);
            } else {
              setText(value);
            }
          }}
        />
      </div>

      <details className="mt-4 rounded-[1rem] border border-white/10 bg-white/[0.035]">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-300">
          Available variables
        </summary>
        <div className="flex flex-wrap gap-2 border-t border-white/10 p-4">
          {allowedVariables.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => navigator.clipboard?.writeText(`{{${name}}}`)}
              className="rounded-lg border border-[#a7c957]/20 bg-[#a7c957]/10 px-2.5 py-1 font-mono text-[0.72rem] text-[#d8ef9a] transition hover:bg-[#a7c957]/[0.16] active:translate-y-px"
            >
              {'{{'}{name}{'}}'}
            </button>
          ))}
        </div>
      </details>

      {message ? (
        <div className="mt-4 rounded-[1rem] border border-white/10 bg-white/[0.055] p-3 text-sm text-zinc-300">
          {message}
        </div>
      ) : null}
    </section>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-xl border px-4 text-sm font-semibold transition active:translate-y-px ${
        active
          ? 'border-[#a7c957]/30 bg-[#a7c957]/15 text-[#d8ef9a]'
          : 'border-white/10 text-zinc-500 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  );
}

function sourceEditorExtensions(
  allowedVariables: string[],
  mode: EditorMode,
): Extension[] {
  const allowedSet = new Set(allowedVariables);

  return [
    mode === 'mjml' ? html() : [],
    editorTheme,
    autocompletion({
      override: [variableCompletionSource(allowedVariables)],
    }),
    linter((view) => {
      const diagnostics: Diagnostic[] = [];
      const source = view.state.doc.toString();

      for (const match of source.matchAll(/{{{[^}]+}}}/g)) {
        diagnostics.push({
          from: match.index ?? 0,
          to: (match.index ?? 0) + match[0].length,
          severity: 'error',
          message: 'Triple-brace HTML injection is disabled in v1.',
        });
      }

      for (const match of source.matchAll(/{{\s*([a-z][a-z0-9_]*)\s*}}/gi)) {
        const name = match[1];

        if (!allowedSet.has(name)) {
          diagnostics.push({
            from: match.index ?? 0,
            to: (match.index ?? 0) + match[0].length,
            severity: 'warning',
            message: `Unknown variable: ${name}`,
          });
        }
      }

      return diagnostics;
    }),
  ].flat();
}

function variableCompletionSource(variables: string[]) {
  return (context: CompletionContext) => {
    const before = context.matchBefore(/\{\{[a-zA-Z0-9_]*$/);

    if (!before) {
      return null;
    }

    return {
      from: before.from + 2,
      options: variables.map((name) => ({
        label: name,
        type: 'variable',
        detail: name.startsWith('brand_') ? 'brand config' : 'template data',
        apply: `${name}}}`,
      })),
    };
  };
}
