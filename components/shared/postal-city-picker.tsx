"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** The fields a picker needs; both the staff and client endpoints return them. */
export interface PostalCityOption {
  id: number;
  name: string;
  district: string | null;
}

export const postalCityLabel = (city: PostalCityOption) =>
  city.district ? `${city.name} — ${city.district}` : city.name;

interface PostalCityPickerProps {
  /** Searches server-side. Which endpoint depends on who is signed in. */
  search: (term: string) => Promise<PostalCityOption[]>;
  /** A query-cache namespace, so staff and client searches never share results. */
  queryKey: string;
  value: PostalCityOption | null;
  onChange: (city: PostalCityOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Choose a postal city by typing, never by scrolling.
 *
 * There are 2,111 of them, so a dropdown of every option is both too heavy to
 * send and useless to read — and a free-text town field is what this replaces:
 * an address typed as text cannot be routed to a branch. The search runs on the
 * server (`shouldFilter={false}`), and every row shows its district because four
 * post office names repeat across districts.
 *
 * The value is the whole option rather than an id, so an edit form can show the
 * current selection without first fetching it.
 */
export function PostalCityPicker({
  search,
  queryKey,
  value,
  onChange,
  placeholder = "Search postal city…",
  disabled,
  id,
}: PostalCityPickerProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const debounced = useDebounced(term.trim(), 250);

  const { data, isFetching } = useQuery({
    queryKey: ["postal-city-search", queryKey, debounced],
    queryFn: () => search(debounced),
    enabled: open && debounced.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const results = debounced.length >= 2 ? data ?? [] : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value ? postalCityLabel(value) : placeholder}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type at least 2 letters…"
            value={term}
            onValueChange={setTerm}
          />
          <CommandList>
            {debounced.length < 2 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Start typing a post office town.
              </div>
            ) : isFetching && results.length === 0 ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CommandEmpty>No postal city matches.</CommandEmpty>
            )}
            <CommandGroup>
              {results.map((city) => (
                <CommandItem
                  key={city.id}
                  value={String(city.id)}
                  onSelect={() => {
                    onChange(value?.id === city.id ? null : city);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("size-4", value?.id === city.id ? "opacity-100" : "opacity-0")}
                  />
                  <span>{city.name}</span>
                  {city.district && (
                    <span className="ml-auto text-xs text-muted-foreground">{city.district}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
