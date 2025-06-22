class DataCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  set(key, data, customDuration = null) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now() + (customDuration || this.CACHE_DURATION));
  }

  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const timestamp = this.timestamps.get(key);
    if (Date.now() > timestamp) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  invalidate(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  has(key) {
    return this.cache.has(key) && Date.now() <= this.timestamps.get(key);
  }
}

export const dataCache = new DataCache();