const superStorage: Record<string, any> = {};

function storeData<T>(key: string, value: T) {
  superStorage[key] = value;
}

function retrieveData<T>(key: string): T | undefined {
  return superStorage[key];
}

export { storeData, retrieveData };
