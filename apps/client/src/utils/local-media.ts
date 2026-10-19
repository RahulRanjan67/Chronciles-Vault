import { toast } from "@grimoire/ui";

/**
 * Opens a local video or media file in the user's default OS video player.
 * Dispatches to the native PC Workstation engine on port 47920 if available,
 * or initiates the native file URI handler.
 */
export async function openLocalDiskPath(filePath: string, label?: string): Promise<boolean> {
  const cleanPath = filePath.trim();
  if (!cleanPath) return false;

  const displayLabel = label ?? cleanPath.split(/[/\\]/).pop() ?? "local media";

  // 1. Attempt to launch via local PC Workstation App engine (os.startfile)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch("http://127.0.0.1:47920/api/pc/open-native", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath: cleanPath }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (res.ok && data?.ok) {
      toast({
        title: "Launched in Default Player",
        description: `Playing "${displayLabel}" in your system media player.`,
        variant: "success",
      });
      return true;
    } else if (data?.error) {
      toast({
        title: "Could not open media file",
        description: data.error,
        variant: "destructive",
      });
      return false;
    }
  } catch {
    // Workstation native engine is offline or running in standard web mode
  }

  // 2. Attempt file:// scheme trigger
  try {
    const fileUri = cleanPath.startsWith("file://")
      ? cleanPath
      : `file:///${cleanPath.replace(/\\/g, "/")}`;
    const opened = window.open(fileUri, "_blank");
    if (opened) {
      toast({
        title: "Opening Local Video",
        description: `Launching ${displayLabel}. Confirm browser prompt if requested.`,
      });
      return true;
    }
  } catch {
    // Browser sandbox security restriction
  }

  // 3. Fallback: Copy path to clipboard with clear instructions
  try {
    await navigator.clipboard.writeText(cleanPath);
    toast({
      title: "File path copied",
      description: `${cleanPath} (Paste in File Explorer, VLC, or press Win+R to play)`,
    });
    return true;
  } catch {
    toast({
      title: "Local Media Location",
      description: cleanPath,
    });
    return false;
  }
}
