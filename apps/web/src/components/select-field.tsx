'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';

export type SelectFieldOption = {
  value: string;
  label: string;
  detail?: string;
  disabled?: boolean;
};

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
}: {
  label: string;
  value: string;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative grid gap-2">
      <label
        id={`${id}-label`}
        className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500"
      >
        {label}
      </label>
      <button
        type="button"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-950/75 px-4 text-left text-sm text-zinc-50 outline-none transition duration-300 hover:border-white/20 hover:bg-zinc-900/80 focus:border-[#a7c957]/70 focus:ring-4 focus:ring-[#a7c957]/15 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <span id={`${id}-value`} className="min-w-0">
          <span className="block truncate font-semibold">
            {selected?.label ?? placeholder}
          </span>
          {selected?.detail ? (
            <span className="mt-0.5 block truncate text-xs text-zinc-500">
              {selected.detail}
            </span>
          ) : null}
        </span>
        <CaretDown
          size={17}
          weight="bold"
          className={`shrink-0 text-zinc-500 transition duration-300 group-hover:text-zinc-200 ${
            isOpen ? 'rotate-180 text-[#a7c957]' : ''
          }`}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-72 overflow-auto rounded-2xl border border-white/12 bg-[#101014] p-1.5 shadow-[0_24px_70px_-34px_rgba(0,0,0,0.9),0_0_0_1px_rgba(167,201,87,0.08)]"
        >
          {options.length === 0 ? (
            <div className="rounded-xl px-3 py-3 text-sm text-zinc-500">
              No options available
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => {
                    if (!option.disabled) {
                      onChange(option.value);
                      setIsOpen(false);
                    }
                  }}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? 'bg-[#a7c957] text-zinc-950'
                      : 'text-zinc-200 hover:bg-white/[0.075]'
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {option.label}
                    </span>
                    {option.detail ? (
                      <span
                        className={`mt-0.5 block truncate text-xs ${
                          isSelected ? 'text-zinc-800' : 'text-zinc-500'
                        }`}
                      >
                        {option.detail}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? <Check size={16} weight="bold" /> : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
