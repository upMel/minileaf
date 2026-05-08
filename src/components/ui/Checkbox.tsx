type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

export default function Checkbox({ checked, onChange, label, disabled = false }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
        disabled={disabled}
      />
      {label}
    </label>
  );
}
