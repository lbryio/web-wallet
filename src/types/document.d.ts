interface Document {
  hasStorageAccess: () => Promise<boolean>; // NOTE: Experimental https://developer.mozilla.org/en-US/docs/Web/API/Document/hasStorageAccess
  requestStorageAccess: () => Promise<void>;
}
