// Manifests retain stable asset identities; hosting supplies the public prefix.
export function localAssetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
