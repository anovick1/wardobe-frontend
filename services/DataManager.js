import api from '../api';
import { dataCache } from './DataCache';

class DataManager {
  // Wardrobe Items Management
  async getWardrobeItems(page = 1, forceRefresh = false, limit = 12) {
    const cacheKey = `wardrobe_items_page_${page}_limit_${limit}`;
    
    if (!forceRefresh && dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey);
    }

    try {
      const response = await api.get(`/wardrobe_items?page=${page}&limit=${limit}`);
      const data = {
        items: response.data.wardrobe_items || [],
        pagination: response.data.pagination || {}
      };
      
      dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching wardrobe items:', error);
      throw error;
    }
  }

  async getAllWardrobeItemsForSelection(forceRefresh = false) {
    const cacheKey = 'all_wardrobe_items_selection';
    
    if (!forceRefresh && dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey);
    }

    try {
      // Get first page to determine total pages
      const firstResponse = await api.get('/wardrobe_items?page=1&limit=12');
      const pagination = firstResponse.data.pagination;
      let allItems = firstResponse.data.wardrobe_items || [];

      // If there are more pages, fetch them concurrently
      if (pagination.pages > 1) {
        const additionalRequests = [];
        for (let page = 2; page <= Math.min(pagination.pages, 10); page++) { // Limit to 10 pages max
          additionalRequests.push(
            api.get(`/wardrobe_items?page=${page}&limit=12`)
          );
        }

        const additionalResponses = await Promise.all(additionalRequests);
        additionalResponses.forEach(response => {
          allItems = allItems.concat(response.data.wardrobe_items || []);
        });
      }

      dataCache.set(cacheKey, allItems, 10 * 60 * 1000); // Cache for 10 minutes
      return allItems;
    } catch (error) {
      console.error('Error fetching all wardrobe items:', error);
      throw error;
    }
  }

  async addWardrobeItem(itemData) {
    try {
      const response = await api.post('/wardrobe_items', itemData);
      
      // Invalidate relevant caches
      dataCache.invalidatePattern('wardrobe_items');
      dataCache.invalidate('all_wardrobe_items_selection');
      
      return response.data;
    } catch (error) {
      console.error('Error adding wardrobe item:', error);
      throw error;
    }
  }

  async updateWardrobeItem(itemId, itemData) {
    try {
      const response = await api.put(`/wardrobe_items/${itemId}`, itemData);
      
      // Invalidate relevant caches
      dataCache.invalidatePattern('wardrobe_items');
      dataCache.invalidate('all_wardrobe_items_selection');
      
      return response.data;
    } catch (error) {
      console.error('Error updating wardrobe item:', error);
      throw error;
    }
  }

  async deleteWardrobeItem(itemId) {
    try {
      await api.delete(`/wardrobe_items/${itemId}`);
      
      // Invalidate relevant caches
      dataCache.invalidatePattern('wardrobe_items');
      dataCache.invalidate('all_wardrobe_items_selection');
      dataCache.invalidatePattern('outfits'); // Outfits might reference this item
      
      return true;
    } catch (error) {
      console.error('Error deleting wardrobe item:', error);
      throw error;
    }
  }

  // Get all outfits for filtering (simple version - outfit properties only)
  async getAllOutfits(forceRefresh = false) {
    const cacheKey = 'all_outfits';
    
    if (!forceRefresh && dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey);
    }

    try {
      const firstResponse = await api.get('/outfits/?page=1&per_page=10&include_items=true');
      const pagination = firstResponse.data.pagination;
      let allOutfits = firstResponse.data.outfits || [];

      // If there are more pages, fetch them concurrently
      if (pagination.pages > 1) {
        const additionalRequests = [];
        for (let page = 2; page <= Math.min(pagination.pages, 10); page++) { // Limit to 10 pages max
          additionalRequests.push(
            api.get(`/outfits/?page=${page}&per_page=10&include_items=true`)
          );
        }

        const additionalResponses = await Promise.all(additionalRequests);
        additionalResponses.forEach(response => {
          allOutfits = allOutfits.concat(response.data.outfits || []);
        });
      }

      dataCache.set(cacheKey, allOutfits, 5 * 60 * 1000); // Cache for 5 minutes
      return allOutfits;
    } catch (error) {
      console.error('Error fetching all outfits:', error);
      throw error;
    }
  }

  // Outfits Management (paginated)
  async getOutfits(page = 1, forceRefresh = false, per_page = 12) {
    const cacheKey = `outfits_page_${page}_per_page_${per_page}`;
    
    if (!forceRefresh && dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey);
    }

    try {
      const response = await api.get(`/outfits/?page=${page}&per_page=${per_page}&include_items=true`);
      const data = {
        items: response.data.outfits || [],
        pagination: response.data.pagination || {}
      };
      
      dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching outfits:', error);
      throw error;
    }
  }

  async getOutfitById(outfitId, forceRefresh = false) {
    const cacheKey = `outfit_${outfitId}`;
    
    if (!forceRefresh && dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey);
    }

    try {
      const response = await api.get(`/outfits/${outfitId}`);
      dataCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching outfit:', error);
      throw error;
    }
  }

  async createManualOutfit(outfitData) {
    try {
      const response = await api.post('/outfits/manual_create', outfitData);
      
      // Invalidate relevant caches
      dataCache.invalidatePattern('outfits');
      dataCache.invalidate('all_outfits');
      
      return response.data;
    } catch (error) {
      console.error('Error creating manual outfit:', error);
      throw error;
    }
  }

  async generateAIOutfit(outfitData) {
    try {
      const response = await api.post('/outfits/ai_generate', outfitData);
      
      // Invalidate relevant caches
      dataCache.invalidatePattern('outfits');
      dataCache.invalidate('all_outfits');
      
      return response.data;
    } catch (error) {
      console.error('Error generating AI outfit:', error);
      throw error;
    }
  }

  async generateHybridOutfit(promptData) {
    try {
      const response = await api.post('/outfits/ai_generate_hybrid', promptData);
      
      // Invalidate relevant caches
      dataCache.invalidatePattern('outfits');
      dataCache.invalidate('all_outfits');
      
      return response.data;
    } catch (error) {
      console.error('Error generating hybrid outfit:', error);
      throw error;
    }
  }

  async updateOutfit(outfitId, outfitData) {
    try {
      const response = await api.put(`/outfits/${outfitId}`, outfitData);
      
      // Invalidate relevant caches
      dataCache.invalidatePattern('outfits');
      dataCache.invalidate('all_outfits');
      dataCache.invalidate(`outfit_${outfitId}`);
      
      return response.data;
    } catch (error) {
      console.error('Error updating outfit:', error);
      throw error;
    }
  }

  async deleteOutfit(outfitId) {
    try {
      await api.delete(`/outfits/${outfitId}`);
      
      // Invalidate relevant caches
      dataCache.invalidatePattern('outfits');
      dataCache.invalidate('all_outfits');
      dataCache.invalidate(`outfit_${outfitId}`);
      
      return true;
    } catch (error) {
      console.error('Error deleting outfit:', error);
      throw error;
    }
  }

  async copyOutfit(outfitId) {
    try {
      const response = await api.post(`/outfits/${outfitId}/copy`);
      
      // Invalidate relevant caches to refresh outfit list
      dataCache.invalidatePattern('outfits');
      
      return response.data;
    } catch (error) {
      console.error('Error copying outfit:', error);
      throw error;
    }
  }

  async uploadOutfitImage(outfitId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const response = await api.post(`/outfits/${outfitId}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Invalidate relevant caches
      dataCache.invalidate(`outfit_${outfitId}`);
      
      return response.data;
    } catch (error) {
      console.error('Error uploading outfit image:', error);
      throw error;
    }
  }

  // Utility methods
  clearCache() {
    dataCache.clear();
  }

  invalidateWardrobeCache() {
    dataCache.invalidatePattern('wardrobe_items');
    dataCache.invalidate('all_wardrobe_items_selection');
  }

  invalidateOutfitCache() {
    dataCache.invalidatePattern('outfits');
    dataCache.invalidate('all_outfits');
  }
}

export const dataManager = new DataManager();