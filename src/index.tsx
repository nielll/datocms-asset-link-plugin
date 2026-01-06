import ReactDOM from "react-dom/client";
import { connect, type RenderFieldExtensionCtx } from "datocms-plugin-sdk";
import AssetLinkAddon from "./entrypoints/AssetLinkAddon";

function render(component: React.ReactNode) {
  ReactDOM.createRoot(document.getElementById("root")!).render(component);
}

connect({
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
