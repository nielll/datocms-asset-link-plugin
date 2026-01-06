import { useEffect, useMemo, useState } from "react";
import type { RenderFieldExtensionCtx } from "datocms-plugin-sdk";
import { Canvas, Button, Spinner } from "datocms-react-ui";
import { buildClient } from "@datocms/cma-client-browser";

type Props = { ctx: RenderFieldExtensionCtx };

function getAtPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function extractUploadIds(value: unknown, ctx: RenderFieldExtensionCtx): string[] {
  if (!value) return [];

  // gallery: [{ upload_id: "..." }, ...]
  if (Array.isArray(value)) {
    return value
      .map((x) => (x as any)?.upload_id)
      .filter((x): x is string => typeof x === "string");
  }

  // file: { upload_id: "..." }  OR localized: { en: {upload_id}, de: {upload_id} }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    const direct = (obj as any)?.upload_id;
    if (typeof direct === "string") return [direct];

    const maybeLocale = (ctx as any)?.locale as string | undefined;
    const localized = maybeLocale ? (obj as any)?.[maybeLocale] : undefined;
    const locId = localized?.upload_id;
    if (typeof locId === "string") return [locId];

    for (const v of Object.values(obj)) {
      const up = (v as any)?.upload_id;
      if (typeof up === "string") return [up];
    }
  }

  return [];
}

function ReadonlyUrlField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, minWidth: 240 }}>
      <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.85 }}>{label}</div>
      <input
        value={value}
        readOnly
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid rgba(0,0,0,0.2)",
          background: "rgba(0,0,0,0.03)",
          fontSize: 13,
        }}
        onFocus={(e) => e.currentTarget.select()}
      />
    </div>
  );
}

export default function AssetLinkAddon({ ctx }: Props) {
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(() => {
    const token = (ctx as any).currentUserAccessToken as string | undefined;
    if (!token) return null;
    return buildClient({ apiToken: token, environment: ctx.environment });
  }, [ctx]);

  const fieldValue = useMemo(() => getAtPath(ctx.formValues as any, ctx.fieldPath), [
    ctx.formValues,
    ctx.fieldPath,
  ]);

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
        const nextUrls = uploads.map((u) => u.url).filter((u): u is string => typeof u === "string");
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
        <div
          key={url + i}
          style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 8 }}
        >
          <ReadonlyUrlField
            label={urls.length > 1 ? `Asset URL ${i + 1}` : "Asset URL"}
            value={url}
          />
          <Button type="button" buttonSize="s" onClick={() => copy(url)}>
            Copy
          </Button>
        </div>
      ))}
    </Canvas>
  );
}
