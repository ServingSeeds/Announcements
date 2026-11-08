// Living Word Fellowship — Announcements API (Netlify Function)
// Weekly announcements text + Digital Announcements flyers, saved in Netlify Blobs.
// Viewing needs no code; saving needs EDIT_CODE (default 4405).
import { getStore } from "@netlify/blobs";

const EDIT_CODE = process.env.EDIT_CODE || "4405";
const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export default async (req) => {
  const store = getStore({ name: "announcements", consistency: "strong" });
  const needCode = (c) => { if (String(c || "") !== EDIT_CODE) throw new Error("The edit code is not correct."); };
  try {
    const u = new URL(req.url);

    // Serve an uploaded flyer image
    if (req.method === "GET" && u.searchParams.get("img")) {
      const id = u.searchParams.get("img").replace(/[^a-z0-9-]/gi, "");
      const meta = await store.getWithMetadata("img/" + id, { type: "arrayBuffer" });
      if (!meta) return new Response("Not found", { status: 404 });
      return new Response(meta.data, { headers: { "Content-Type": meta.metadata?.type || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" } });
    }

    let action, a;
    if (req.method === "GET") { action = u.searchParams.get("api"); a = Object.fromEntries(u.searchParams); }
    else if (req.method === "POST") { a = await req.json().catch(() => ({})); action = a.action; }
    else return json({ ok: false, error: "Method not allowed" }, 405);

    let result;
    switch (action) {
      case "get": {
        const weekly = await store.get("weekly", { type: "json" });
        const digital = await store.get("digital", { type: "json" });
        result = { weekly, digital };
        break;
      }
      case "checkCode":
        result = String(a.code || "") === EDIT_CODE;
        break;
      case "uploadImage": {
        needCode(a.code);
        const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(a.dataUrl || "");
        if (!m) throw new Error("That file is not a picture.");
        const bytes = Buffer.from(m[2], "base64");
        if (bytes.length > 4.5 * 1024 * 1024) throw new Error("That picture is too large.");
        const id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
        await store.set("img/" + id, bytes, { metadata: { type: m[1] } });
        result = { id, src: "/api/announce?img=" + id };
        break;
      }
      case "save": {
        needCode(a.code);
        if (typeof a.weekly === "string") {
          if (a.weekly.length > 40000) throw new Error("The weekly announcements are too long.");
          await store.setJSON("weekly", { text: a.weekly, savedAt: new Date().toISOString() });
        }
        if (Array.isArray(a.digital)) {
          const clean = a.digital.slice(0, 30).map((d) => ({
            src: String(d.src || "").slice(0, 300),
            caption: String(d.caption || "").slice(0, 300),
          })).filter((d) => d.src);
          // Remove uploaded images that are no longer used
          const old = (await store.get("digital", { type: "json" })) || { items: [] };
          const keep = new Set(clean.map((d) => d.src));
          for (const o of old.items || []) {
            const mm = /img=([a-z0-9-]+)/i.exec(o.src || "");
            if (mm && !keep.has(o.src)) await store.delete("img/" + mm[1]);
          }
          await store.setJSON("digital", { items: clean, savedAt: new Date().toISOString() });
        }
        result = true;
        break;
      }
      default:
        throw new Error("Unknown request.");
    }
    return json({ ok: true, result });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
};

export const config = { path: "/api/announce" };
