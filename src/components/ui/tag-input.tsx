import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";

type TagInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function TagInput({ value, onChange, placeholder, className }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
  }

  function removeTag(tag: string) {
    onChange(value.filter((item) => item !== tag));
  }

  function commitDraft() {
    addTag(draft);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitDraft();
    }

    if (event.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-11 w-full flex-wrap items-center gap-2 border border-input bg-transparent px-2 py-2 text-sm focus-within:border-accent",
        className,
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex h-7 items-center gap-1 border border-border bg-card/70 px-2 text-xs"
        >
          {tag}
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => removeTag(tag)}
            aria-label={`Remove ${tag}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        className="h-7 min-w-28 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={value.length ? undefined : placeholder}
      />
    </div>
  );
}
