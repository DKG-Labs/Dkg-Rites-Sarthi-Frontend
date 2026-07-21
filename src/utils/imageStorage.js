export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('InspectionDB', 1);
    request.onerror = (e) => reject(e);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images');
      }
    };
  });
};

export const saveImages = async (key, images) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readwrite');
      const store = tx.objectStore('images');
      const request = store.put(images, key);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e);
    });
  } catch (error) {
    console.error('IndexedDB save error:', error);
  }
};

export const getImages = async (key) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readonly');
      const store = tx.objectStore('images');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e);
    });
  } catch (error) {
    console.error('IndexedDB get error:', error);
    return [];
  }
};

export const removeImages = async (key) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readwrite');
      const store = tx.objectStore('images');
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e);
    });
  } catch (error) {
    console.error('IndexedDB remove error:', error);
  }
};
