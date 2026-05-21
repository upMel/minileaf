type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
};

export default function MoneyInput({
  value,
  onChange,
  disabled = false,
  placeholder = "0.00",
  required = false,
}: Props) {
  return (
    <div className="flex items-center rounded-xl border border-black/10 bg-white pl-3 outline-none focus-within:border-black/30 dark:border-white/15 dark:bg-black">
      <div className="shrink-0 select-none text-sm font-medium text-zinc-600 dark:text-zinc-300">€</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder={placeholder}
        className="block min-w-0 grow bg-transparent py-2 pr-3 pl-2 text-sm text-black placeholder:text-zinc-500 focus:outline-none disabled:opacity-60 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        disabled={disabled}
        required={required}
      />
      <div className="shrink-0 select-none rounded-r-xl border-l border-black/10 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
        EUR
      </div>
    </div>
  );
}
