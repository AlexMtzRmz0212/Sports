import { useEffect, useState } from "react";

const cache = new Map<string, Promise<unknown>>();

function load<T>(name: string): Promise<T> {
  if (!cache.has(name)) {
    const url = `${import.meta.env.BASE_URL}data/${name}.json`;
    cache.set(
      name,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`${name}.json returned ${r.status}`);
        return r.json();
      }),
    );
  }
  return cache.get(name) as Promise<T>;
}

/** Fetch one of the pipeline's JSON files. Results are shared across components. */
export function useData<T>(name: string): { data: T | null; error: string | null } {
  const [state, setState] = useState<{ data: T | null; error: string | null }>({ data: null, error: null });
  useEffect(() => {
    let live = true;
    load<T>(name)
      .then((data) => live && setState({ data, error: null }))
      .catch((e: Error) => {
        cache.delete(name);
        if (live) setState({ data: null, error: e.message });
      });
    return () => {
      live = false;
    };
  }, [name]);
  return state;
}
