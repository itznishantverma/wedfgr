"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { parseUniqueId } from "@/lib/services/auth.service";
import { InstitutePublicCredentials } from "@/lib/types/institute.types";

interface UseInstituteResolverResult {
  institute: InstitutePublicCredentials | null;
  isLoading: boolean;
  error: string | null;
  roleCode: string | null;
}

const DEBOUNCE_MS = 500;

export function useInstituteResolver(
  uniqueId: string
): UseInstituteResolverResult {
  const [institute, setInstitute] =
    useState<InstitutePublicCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleCode, setRoleCode] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, InstitutePublicCredentials>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCodeRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  useEffect(() => {
    cleanup();

    const parsed = parseUniqueId(uniqueId);

    if (!parsed) {
      setInstitute(null);
      setIsLoading(false);
      setError(null);
      setRoleCode(null);
      lastCodeRef.current = null;
      return;
    }

    setRoleCode(parsed.role_code);

    if (lastCodeRef.current === parsed.inst_code && institute) {
      return;
    }

    const cached = cacheRef.current.get(parsed.inst_code);
    if (cached) {
      setInstitute(cached);
      setIsLoading(false);
      setError(null);
      lastCodeRef.current = parsed.inst_code;
      return;
    }

    setIsLoading(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/institute/resolve?inst_code=${encodeURIComponent(parsed.inst_code)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Institute not found");
          setInstitute(null);
        } else {
          const data: InstitutePublicCredentials = await res.json();
          cacheRef.current.set(parsed.inst_code, data);
          setInstitute(data);
          setError(null);
          lastCodeRef.current = parsed.inst_code;
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError("Failed to verify institute");
          setInstitute(null);
        }
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return cleanup;
  }, [uniqueId, cleanup, institute]);

  return { institute, isLoading, error, roleCode };
}
