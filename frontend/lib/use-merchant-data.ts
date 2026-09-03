import { useState, useEffect, useCallback } from "react";

export function useMerchantData<T>(
  fetcher: (merchantId: string, token?: string) => Promise<T>,
  merchantId: string,
  initialData: T
) {
  const [data, setData] = useState<T>(initialData);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (!merchantId) return;
    let ignore = false;

    async function load() {
      try {
        const result = await fetcher(merchantId);
        if (!ignore) {
          setData(result);
        }
      } catch (e) {
        console.error("Data load failed", e);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [merchantId, refreshIndex, fetcher]);

  const refresh = useCallback(() => setRefreshIndex((i) => i + 1), []);

  return { data, setData, refresh };
}
