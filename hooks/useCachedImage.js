import { useEffect, useState } from "react";
import * as FileSystem from "expo-file-system";

export default function useCachedImage(imageUrl, itemId) {
  const [uri, setUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const cachePath = `${FileSystem.cacheDirectory}wardrobe-${itemId}.jpg`;

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const info = await FileSystem.getInfoAsync(cachePath);
        if (info.exists) {
          if (isMounted) setUri(info.uri);
        } else {
          // Show remote image immediately
          if (isMounted) setUri(imageUrl);
          // Start background cache download
          FileSystem.downloadAsync(imageUrl, cachePath).catch(() => {});
        }
      } catch (e) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (imageUrl && itemId) load();
    return () => {
      isMounted = false;
    };
  }, [imageUrl, itemId]);

  return { uri, loading, error };
}
