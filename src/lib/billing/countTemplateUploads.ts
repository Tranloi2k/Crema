import type { Block, StackBlock } from "@/lib/types";

const CLOUDINARY_HOST = "res.cloudinary.com";

export function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes(CLOUDINARY_HOST);
  } catch {
    return false;
  }
}

function collectCloudinaryUrls(blocks: Block[], urls: Set<string>) {
  for (const block of blocks) {
    if (block.type === "image" && block.content.src && isCloudinaryUrl(block.content.src)) {
      urls.add(block.content.src);
    }
    if (block.type === "stack") {
      collectCloudinaryUrls(block.children, urls);
    }
  }
}

export function countCloudinaryUploadsInRoot(root: StackBlock): number {
  const urls = new Set<string>();
  collectCloudinaryUrls(root.children, urls);
  return urls.size;
}

export function countCloudinaryUploadsInContent(contentJson: string): number {
  try {
    const parsed = JSON.parse(contentJson) as StackBlock;
    if (parsed?.type === "stack" && Array.isArray(parsed.children)) {
      return countCloudinaryUploadsInRoot(parsed);
    }
  } catch {
    // ignore malformed content
  }
  return 0;
}
