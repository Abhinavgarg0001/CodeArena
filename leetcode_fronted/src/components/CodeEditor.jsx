import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState, Compartment } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';

function langExtension(language) {
  switch (String(language || '').toLowerCase()) {
    case 'java':
      return java();
    case 'cpp':
    case 'c++':
      return cpp();
    case 'javascript':
    default:
      return javascript();
  }
}

const languageNames = {
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
  'c++': 'C++',
};

export function CodeEditor({
  initialCode = '',
  language = 'javascript',
  onChange,
  readOnly = false,
  height = '400px',
  className = '',
}) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const compartmentRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Create the editor once
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const langCompartment = new Compartment();
    compartmentRef.current = langCompartment;

    const state = EditorState.create({
      doc: initialCode,
      extensions: [
        basicSetup,
        langCompartment.of(langExtension(language)),
        oneDark,
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            height,
            fontSize: '14px',
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
          },
          '.cm-scroller': {
            fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
          },
          '.cm-content': {
            padding: '12px',
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString());
          }
        }),
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
      compartmentRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch language without destroying the editor
  useEffect(() => {
    if (!viewRef.current || !compartmentRef.current) return;
    viewRef.current.dispatch({
      effects: compartmentRef.current.reconfigure(langExtension(language)),
    });
  }, [language]);

  // Sync outside edits (e.g. starter code loaded after fetch).
  // No-op while the user is typing, since doc already equals initialCode then.
  useEffect(() => {
    if (!viewRef.current) return;
    const current = viewRef.current.state.doc.toString();
    if (current !== initialCode) {
      viewRef.current.dispatch({
        changes: { from: 0, to: current.length, insert: initialCode },
      });
    }
  }, [initialCode]);

  return (
    <div
      ref={editorRef}
      className={`codemirror-editor ${className}`}
      style={{ height, borderRadius: '8px', overflow: 'hidden' }}
    />
  );
}

export { languageNames };