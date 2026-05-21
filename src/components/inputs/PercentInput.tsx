type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
};

export default function PercentInput({
  value,
  onChange,
  disabled = false,
  placeholder = "0",
  required = false,
}: Props) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-black/10 bg-white focus-within:border-black/30 dark:border-white/15 dark:bg-black">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
        className="w-full flex-1 bg-transparent px-3 py-2 text-sm text-black outline-none disabled:opacity-60 dark:text-zinc-50"
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
      <span className="flex items-center border-l border-black/10 px-3 text-sm font-medium text-zinc-600 dark:border-white/15 dark:text-zinc-300">
        %
      </span>
    </div>
  );
}
