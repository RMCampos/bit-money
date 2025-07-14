import React, { useState, useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

// Import commands and utilities
import {
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';

// Import node types
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';

// Toolbar Component
const ToolbarPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const formatText = useCallback(
      (format) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
      },
      [editor]
  );

  const formatHeading = useCallback(
      (headingSize) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode(headingSize));
          }
        });
      },
      [editor]
  );

  const formatQuote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  }, [editor]);

  const formatList = useCallback(
      (listType) => {
        if (listType === 'number') {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        } else {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }
      },
      [editor]
  );

  return (
      <div className="toolbar">
        {/* Text formatting */}
        <button
            onClick={() => formatText('bold')}
            className={`toolbar-item ${isBold ? 'active' : ''}`}
            aria-label="Format Bold"
        >
          <strong>B</strong>
        </button>

        <button
            onClick={() => formatText('italic')}
            className={`toolbar-item ${isItalic ? 'active' : ''}`}
            aria-label="Format Italic"
        >
          <em>I</em>
        </button>

        <button
            onClick={() => formatText('underline')}
            className={`toolbar-item ${isUnderline ? 'active' : ''}`}
            aria-label="Format Underline"
        >
          <u>U</u>
        </button>

        <div className="divider" />

        {/* Block formatting */}
        <select
            className="toolbar-item"
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'quote') {
                formatQuote();
              } else if (value.startsWith('h')) {
                formatHeading(value);
              }
            }}
        >
          <option value="">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="quote">Quote</option>
        </select>

        {/* Lists */}
        <button
            onClick={() => formatList('bullet')}
            className="toolbar-item"
            aria-label="Bullet List"
        >
          • List
        </button>

        <button
            onClick={() => formatList('number')}
            className="toolbar-item"
            aria-label="Numbered List"
        >
          1. List
        </button>

        <div className="divider" />

        {/* History */}
        <button
            onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            className="toolbar-item"
            aria-label="Undo"
        >
          ↶
        </button>

        <button
            onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            className="toolbar-item"
            aria-label="Redo"
        >
          ↷
        </button>
      </div>
  );
}

// Main Editor Configuration
const initialConfig = {
  namespace: 'MyRichEditor',
  theme: {
    paragraph: 'editor-paragraph',
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
      h3: 'editor-heading-h3',
    },
    text: {
      bold: 'editor-text-bold',
      italic: 'editor-text-italic',
      underline: 'editor-text-underline',
    },
    list: {
      ol: 'editor-list-ol',
      ul: 'editor-list-ul',
      listitem: 'editor-listitem',
    },
    quote: 'editor-quote',
  },
  onError: (error) => {
    console.error('Lexical Editor Error:', error);
  },
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
  ],
};

function RichTextEditor() {
  const [editorState, setEditorState] = useState(null);

  const handleEditorChange = (editorState) => {
    setEditorState(editorState);

    // Convert to JSON for storage
    const serializedState = JSON.stringify(editorState.toJSON());
    console.log('Editor state:', serializedState);
  };

  return (
      <div className="editor-container">
        <LexicalComposer initialConfig={initialConfig}>
          <ToolbarPlugin />
          <div className="editor-inner">
            <RichTextPlugin
                contentEditable={
                  <ContentEditable
                      className="editor-input"
                      aria-placeholder="Enter some rich text..."
                      placeholder={
                        <div className="editor-placeholder">
                          Enter some rich text...
                        </div>
                      }
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin onChange={handleEditorChange} />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <ListPlugin />
          </div>
        </LexicalComposer>
      </div>
  );
}

export default RichTextEditor;
