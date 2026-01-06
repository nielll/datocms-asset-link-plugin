import React from "react";
import ReactDOM from "react-dom/client";
import { connect, type RenderFieldExtensionCtx } from "datocms-plugin-sdk";
import AssetLinkAddon from "./entrypoints/AssetLinkAddon";

console.log("PLUGIN LOADED: index.tsx");

function render(component: React.ReactNode) {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>{component}</React.StrictMode>
  );
}

connect({
  overrideFieldExtensions(field: any) {
    const ft = field?.attributes?.field_type;
    if (ft === "file" || ft === "gallery") {
      return { addons: [{ id: "assetLinkAddon" }] };
    }
    return undefined;
  },

  manualFieldExtensions() {
    return [
      { id: "assetLinkAddon", name: "Asset link", type: "addon", fieldTypes: ["gallery", "file"] },
    ];
  },

  renderFieldExtension(fieldExtensionId: string, ctx: RenderFieldExtensionCtx) {
    if (fieldExtensionId === "assetLinkAddon") {
      return render(<AssetLinkAddon ctx={ctx} />);
    }
  },
});