import React from "react";
import ReactDOM from "react-dom/client";
import { connect, type RenderFieldExtensionCtx, type Field, type FieldIntentCtx } from "datocms-plugin-sdk";
import AssetLinkAddon from "./entrypoints/AssetLinkAddon";

console.log("PLUGIN LOADED: index.tsx");

function render(component: React.ReactNode) {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>{component}</React.StrictMode>
  );
}

connect({
  manualFieldExtensions() {
    return [
      {
        id: "assetLinkAddon",
        name: "Asset link",
        type: "addon",
        fieldTypes: ["file", "gallery"], // Asset Gallery
      },
    ];
  },

  renderFieldExtension(fieldExtensionId, ctx) {
    if (fieldExtensionId === "assetLinkAddon") {
      return render(<AssetLinkAddon ctx={ctx} />);
    }
  },
});