import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Input } from './input';
import { Bold, Italic, Link, Smile, List, Undo, Redo } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '👏',
  '🙌', '👐', '🤲', '🤜', '🤛', '✊', '👊', '🤚', '👎', '👍',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
  '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
  '🔥', '💫', '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔴', '🟠',
  '🎉', '🎊', '🎈', '🎂', '🎀', '🎁', '🏆', '🥇', '🥈', '🥉'
];

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing...", 
  className = "", 
  minHeight = "400px" 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Initialize content when value changes from parent
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      const sanitizedValue = DOMPurify.sanitize(value || '', {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'ul', 'li', 'br', 'p', 'span'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'style']
      });
      editorRef.current.innerHTML = sanitizedValue;
    }
  }, [value]);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const insertEmoji = (emoji: string) => {
    executeCommand('insertText', emoji);
  };

  const insertLink = () => {
    if (linkUrl && linkText) {
      const sanitizedUrl = DOMPurify.sanitize(linkUrl, { ALLOWED_TAGS: [] });
      const sanitizedText = DOMPurify.sanitize(linkText, { ALLOWED_TAGS: [] });
      const linkHtml = `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${sanitizedText}</a>`;
      executeCommand('insertHTML', linkHtml);
      setLinkUrl('');
      setLinkText('');
      setShowLinkDialog(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            executeCommand('redo');
          } else {
            executeCommand('undo');
          }
          break;
      }
    }
  };

  return (
    <div className={`border rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('bold')}
          className="h-8 w-8 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('italic')}
          className="h-8 w-8 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('insertUnorderedList')}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>

        <Popover open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Insert Link"
            >
              <Link className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <h4 className="font-medium">Insert Link</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Link text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                />
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    onClick={insertLink}
                    disabled={!linkUrl || !linkText}
                    size="sm"
                  >
                    Insert
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowLinkDialog(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Insert Emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <h4 className="font-medium">Insert Emoji</h4>
              <div className="grid grid-cols-10 gap-1 max-h-40 overflow-y-auto">
                {EMOJI_LIST.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-sm"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('undo')}
          className="h-8 w-8 p-0"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('redo')}
          className="h-8 w-8 p-0"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        className="p-4 focus:outline-none"
        style={{ minHeight }}
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
          [contenteditable][data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          [contenteditable] ul {
            list-style-type: disc;
            margin-left: 20px;
            margin-top: 8px;
            margin-bottom: 8px;
          }
          [contenteditable] li {
            margin-bottom: 4px;
          }
        `
      }} />
    </div>
  );
}