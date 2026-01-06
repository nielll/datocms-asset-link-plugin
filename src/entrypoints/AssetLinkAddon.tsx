import React, { useEffect, useMemo, useState } from "react";
import type { RenderFieldExtensionCtx } from "datocms-plugin-sdk";
import { Canvas, TextField, Button, Spinner } from "datocms-react-ui";
import { buildClient } from "@datocms/cma-client-browser";
import get from "lodash-es/get";

type Props = { ctx: RenderFieldExtensionCtx };

type FileValue = { upload_id?: string } | null;
type GalleryValue = Array<{ upload_id?: string }> | null;

function extractUploadIds(value: unknown, ctx: RenderFieldExtensionCtx): string[] {
  if (!value) return [];

  // file: { upload_id: "..." }
  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;

    if (typeof obj.upload_id === "string") return [obj.upload_id];

    // localized file field: { en: {upload_id}, de: {upload_id}, ... }
    // wir versuchen ctx.locale, sonst nehmen wir das erste Locale-Objekt mit upload_id
    const maybeLocale = (ctx as any).locale as string | undefined;
    if (maybeLocale && obj[maybeLocale] && typeof obj[maybeLocale] === "object") {
      const inner = obj[maybeLocale] as any;
      if (typeof inner?.upload_id === "string") return [inner.upload_id];
    }

    for (const v of Object.values(obj)) {
      if (v && typeof v === "object" && typeof (v as any).upload_id === "string") {
        return [(v as any).upload_id];
      }
    }

    return [];
  }

  // gallery: [{ upload_id: "..." }, ...]
  if (Array.isArray(value)) {
    return (value as GalleryValue)
      .map((x) => x?.upload_id)
      .filter((x): x is string => typeof x === "string");
  }

  return [];
}

export default function AssetLinkAddon({ ctx }: Props) {
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(() => {
    // benötigt Permission "currentUserAccessToken" :contentReference[oaicite:9]{index=9}
    const token = (ctx as any).currentUserAccessToken as string | undefined;
    if (!token) return null;
    return buildClient({ apiToken: token, environment: ctx.environment });
  }, [ctx]);

  const fieldValue = useMemo(() => get(ctx.formValues, ctx.fieldPath), [ctx.formValues, ctx.fieldPath]);
  const uploadIds = useMemo(() => extractUploadIds(fieldValue, ctx), [fieldValue, ctx]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      setUrls([]);

      if (!client) {
        setError("Kein currentUserAccessToken verfügbar (Permission fehlt?).");
        return;
      }

      if (uploadIds.length === 0) return;

      setLoading(true);
      try {
        const uploads = await Promise.all(uploadIds.map((id) => client.uploads.find(id)));
        const nextUrls = uploads.map((u) => u.url).filter(Boolean);
        if (!cancelled) setUrls(nextUrls);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Fehler beim Laden der Upload-Daten");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [client, uploadIds]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <Canvas ctx={ctx}>
      {loading && <Spinner size={18} />}
      {error && <div style={{ fontSize: 12 }}>{error}</div>}

      {!loading && !error && urls.length === 0 && (
        <div style={{ fontSize: 12 }}>Kein Asset ausgewählt.</div>
      )}

      {urls.map((url, i) => (
        <div key={url + i} style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 8 }}>
          <TextField
            id={`asset-url-${i}`}
            name={`asset-url-${i}`}
            label={urls.length > 1 ? `Asset URL ${i + 1}` : "Asset URL"}
            value={url}
            readOnly
          />
          <Button type="button" buttonSize="s" onClick={() => copy(url)}>
            Copy
          </Button>
        </div>
      ))}
    </Canvas>
  );
}
