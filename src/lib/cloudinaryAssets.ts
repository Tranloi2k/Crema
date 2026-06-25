import { cloudinary } from "@/lib/cloudinary";

/** Extract Cloudinary public_id from a secure_url (only our cloud + crema folder). */
export function getCloudinaryPublicId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("res.cloudinary.com")) return null;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (cloudName && !parsed.pathname.startsWith(`/${cloudName}/`)) return null;

    const marker = "/upload/";
    const uploadIdx = parsed.pathname.indexOf(marker);
    if (uploadIdx === -1) return null;

    let rest = parsed.pathname.slice(uploadIdx + marker.length);
    rest = rest.replace(/^v\d+\//, "");

    const lastSlash = rest.lastIndexOf("/");
    const lastDot = rest.lastIndexOf(".");
    if (lastDot > lastSlash) rest = rest.slice(0, lastDot);

    const publicId = decodeURIComponent(rest);
    if (!publicId.startsWith("crema/")) return null;

    return publicId;
  } catch {
    return null;
  }
}

export async function deleteCloudinaryAssetByUrl(url: string): Promise<void> {
  const publicId = getCloudinaryPublicId(url);
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "image",
    });
  } catch {
    // Non-fatal — new upload already succeeded; orphaned asset is acceptable vs losing the replace.
  }
}
