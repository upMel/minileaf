type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
};

const noop = () => {};

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
      <div className="grid shrink-0 grid-cols-1 focus-within:relative">
        <select
          aria-label="Currency"
          className="col-start-1 row-start-1 w-full appearance-none rounded-xl bg-transparent py-2 pr-8 pl-3 text-sm font-medium text-zinc-700 outline-none disabled:opacity-60 dark:text-zinc-200"
          value="EUR"
          onChange={noop}
          disabled={disabled}
        >
          <option value="EUR">EUR</option>
        </select>
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
          className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-zinc-500"
        >
          <path
            d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
            fillRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}
