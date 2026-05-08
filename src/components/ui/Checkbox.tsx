type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

export default function Checkbox({ checked, onChange, label, disabled = false }: Props) {
  return (
    <label
      className={`flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
        style={
          checked
            ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)" }
            : { borderColor: "rgba(0,0,0,0.2)", backgroundColor: "transparent" }
        }
      >
        {checked && (
          <svg
            width="9"
            height="9"
            viewBox="0 0 12 12"
            fill="none"
            stroke="var(--accent-fg)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      {label}
    </label>
  );
}
