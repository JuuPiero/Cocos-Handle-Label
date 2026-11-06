"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
}, __copyProps = (to, from, except, desc) => {
  if (from && typeof from == "object" || typeof from == "function")
    for (let key of __getOwnPropNames(from))
      !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: !0 }), mod);

// source/main.ts
var main_exports = {};
__export(main_exports, {
  load: () => load,
  methods: () => methods,
  unload: () => unload
});
module.exports = __toCommonJS(main_exports);
var import_path = require("path"), methods = {
  /** Extension > Scene Handles > Show / Hide Labels */
  async toggleLabels() {
    try {
      await Editor.Message.request("scene", "execute-scene-script", { name: "scene-handles", method: "toggle", args: [] });
    } catch (e) {
      console.warn("[SceneHandles] No scene is open:", e);
    }
  },
  /** Extension > Scene Handles > Open README */
  async openDocs() {
    try {
      let { shell } = require("electron");
      await shell.openPath((0, import_path.join)(__dirname, "..", "README.md"));
    } catch (e) {
      console.error("[SceneHandles] Could not open the README:", e);
    }
  }
};
function load() {
}
function unload() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  load,
  methods,
  unload
});
//# sourceMappingURL=main.js.map
