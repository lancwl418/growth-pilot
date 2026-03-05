"use client";

import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("Failed to fetch data");
    throw error;
  }
  return res.json();
};

export function useDashboardData<T>(
  endpoint: string,
  params?: Record<string, string>
) {
  const searchParams = params ? new URLSearchParams(params).toString() : "";
  const url = searchParams ? `${endpoint}?${searchParams}` : endpoint;

  const { data, error, isLoading, mutate } = useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  };
}
