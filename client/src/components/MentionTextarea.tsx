import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MentionTextarea({ value, onChange, placeholder, className }: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: users } = trpc.users.all.useQuery();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if user is typing a mention
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMentionQuery("");
    }
  };

  const insertMention = (username: string) => {
    if (!textareaRef.current) return;

    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Find the @ symbol position
    const atIndex = textBeforeCursor.lastIndexOf("@");
    const newText = 
      textBeforeCursor.substring(0, atIndex) + 
      `@${username} ` + 
      textAfterCursor;

    onChange(newText);
    setShowSuggestions(false);
    setMentionQuery("");

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = atIndex + username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const filteredUsers = users?.filter(user => 
    user.name?.toLowerCase().includes(mentionQuery.toLowerCase())
  ) || [];

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        rows={4}
      />
      
      {showSuggestions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-black/95 border border-white/20 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
          <div className="p-2 space-y-1">
            {filteredUsers.slice(0, 5).map((user) => (
              <button
                key={user.id}
                onClick={() => insertMention(user.name || user.email || "")}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                    {(user.name || user.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user.name || user.email}</p>
                    {user.role && (
                      <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
