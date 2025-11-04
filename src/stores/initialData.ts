import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  CachedInitialData,
  DecompressedInitialData,
  GetInitialDataResponse
} from '@/types/initial-data'
import { decompressData } from '@/utils/compression'
import { initialDataApi } from '@/services/api'

const STORAGE_KEYS = {
  HASH_VALUE: 'hris_hash_value',
  INITIAL_DATA: 'hris_initial_data',
  LANG_KEY: 'hris_language'
}

export const useInitialDataStore = defineStore('initialData', () => {
  const hashValue = ref<string | null>(null)
  const data = ref<CachedInitialData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Load từ localStorage
  function loadFromCache(): CachedInitialData | null {
    try {
      const cachedHash = localStorage.getItem(STORAGE_KEYS.HASH_VALUE)
      const cachedData = localStorage.getItem(STORAGE_KEYS.INITIAL_DATA)

      if (cachedHash && cachedData) {
        hashValue.value = cachedHash
        const parsed = JSON.parse(cachedData) as CachedInitialData
        data.value = parsed
        return parsed
      }
    } catch (err) {
      console.error('Failed to load cache:', err)
    }
    return null
  }

  // Lưu vào localStorage
  function saveToCache(hash: string, initialData: CachedInitialData) {
    try {
      hashValue.value = hash
      data.value = initialData
      localStorage.setItem(STORAGE_KEYS.HASH_VALUE, hash)
      
      // Try to save data, catch if quota exceeded
      try {
        localStorage.setItem(STORAGE_KEYS.INITIAL_DATA, JSON.stringify(initialData))
        console.log('✅ Data saved to localStorage successfully')
      } catch (storageErr: any) {
        console.warn('⚠️ localStorage quota exceeded, data saved to memory only:', storageErr)
        // Data vẫn có trong memory (data.value), chỉ không persist
      }
    } catch (err) {
      console.error('Failed to save cache:', err)
    }
  }

  // Fetch initial data từ server
  async function fetchInitialData(language: string = 'en-US'): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Load cache trước
      const cachedData = loadFromCache()
      const currentHash = hashValue.value

      // Gọi API với hash hiện tại
      const response: GetInitialDataResponse = await initialDataApi.getInitialData({
        hashValue: currentHash,
        language: { key: language }
      })

      console.log('📡 API Response:', {
        hashMatched: response.hashMatched,
        hashValue: response.hashValue,
        hasCompressedData: !!response.initialCompressedData,
        compressedDataLength: response.initialCompressedData?.length || 0
      })

      // Nếu hash matched, dùng cache
      if (response.hashMatched && cachedData) {
        console.log('✅ Hash matched - using cached data')
        data.value = cachedData
        return
      }

      // Nếu có dữ liệu mới compressed
      if (response.initialCompressedData) {
        console.log('📦 Decompressing new data...')
        
        // Decompress
        const decompressed = decompressData<DecompressedInitialData>(
          response.initialCompressedData
        )

        // Map simple employee list
        const simpleEmpList = decompressed.employeeList.map((emp) => ({
          id: emp.id,
          name: emp.name,
          employeeCode: emp.employeeCode
        }))

        // Tạo cached data
        const newCachedData: CachedInitialData = {
          fieldConfigs: decompressed.fieldConfigs,
          companyGroups: decompressed.companyGroups,
          listWorkWeek: decompressed.listWorkWeek,
          simpleEmpList: simpleEmpList,
          orgConfigs: decompressed.orgConfigs,
          employeeGlobals: decompressed.employeeGlobals || [],
          employeeList: decompressed.employeeList
        }

        // Save to cache
        saveToCache(response.hashValue, newCachedData)
        
        console.log('✅ Data loaded and cached successfully')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch initial data'
      console.error('Error fetching initial data:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Clear cache
  function clearCache() {
    hashValue.value = null
    data.value = null
    localStorage.removeItem(STORAGE_KEYS.HASH_VALUE)
    localStorage.removeItem(STORAGE_KEYS.INITIAL_DATA)
  }

  return {
    hashValue,
    data,
    loading,
    error,
    fetchInitialData,
    loadFromCache,
    clearCache
  }
})
