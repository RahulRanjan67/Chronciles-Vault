import * as React from "react";
import { ArrowLeft, Headphones, LoaderCircle, Play, Video } from "lucide-react";
import { listLocalFiles, getLocalFileBlob } from "@grimoire/reader";
import type { LocalFileMetadata } from "@grimoire/reader";
import { Button, PageContainer } from "@grimoire/ui";

const PdfReader = React.lazy(() =>
  import("./PdfReader").then((module) => ({ default: module.PdfReader })),
);
const EpubReader = React.lazy(() =>
  import("./EpubReader").then((module) => ({ default: module.EpubReader })),
);
const CbzReader = React.lazy(() =>
  import("./CbzReader").then((module) => ({ default: module.CbzReader })),
);
const TxtReader = React.lazy(() =>
  import("./TxtReader").then((module) => ({ default: module.TxtReader })),
);

function MediaFileReader({
  file,
  onBack,
}: {
  readonly file: LocalFileMetadata;
  readonly onBack?: () => void;
}) {
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    void getLocalFileBlob(file.id).then((blob) => {
      if (!cancelled) {
        objectUrl = URL.createObjectURL(blob);
        setMediaUrl(objectUrl);
      }
    });
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };
  }, [file.id]);

  if (!mediaUrl) {
    return (
      <main className="flex min-h-[32rem] items-center justify-center gap-2 text-[var(--gm-text-muted)]">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Loading media stream…
      </main>
    );
  }

  const isAudio = file.format === "audio" || file.mimeType.startsWith("audio/");

  return (
    <PageContainer maxWidth="default" className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Local Shelf</span>
        </Button>
        <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-[var(--gm-surface)] border border-[var(--gm-border)] text-[var(--gm-accent-strong)]">
          {file.format.toUpperCase()} Media
        </span>
      </div>

      <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 sm:p-8 shadow-lg text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gm-accent)]/15 text-[var(--gm-accent-strong)] mx-auto">
          {isAudio ? <Headphones className="h-8 w-8" /> : <Video className="h-8 w-8" />}
        </div>

        <div>
          <h2 className="text-gm-xl font-bold text-[var(--gm-text)]">{file.displayName}</h2>
          <p className="text-gm-xs text-[var(--gm-text-muted)] mt-1 font-mono">
            Local Shelf Offline Storage · {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>

        <div className="pt-2">
          {isAudio ? (
            <audio controls src={mediaUrl} className="w-full max-w-md mx-auto" autoPlay />
          ) : (
            <video controls src={mediaUrl} className="w-full max-w-2xl mx-auto rounded-lg shadow" autoPlay />
          )}
        </div>
      </div>
    </PageContainer>
  );
}

interface FileReaderProps {
  readonly fileId?: string;
  readonly onBack?: () => void;
}

export function FileReader({ fileId, onBack }: FileReaderProps) {
  const [file, setFile] = React.useState<LocalFileMetadata | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setFile(null);
    setError(null);
    void listLocalFiles()
      .then((files) => {
        if (cancelled) return;
        const selected = files.find((item) => item.id === fileId);
        if (!selected) throw new Error("This file is no longer on your Local Shelf.");
        setFile(selected);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to open this file.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  if (error) {
    return (
      <main className="flex min-h-[32rem] flex-col items-center justify-center gap-4 p-8 text-center">
        <p role="alert" className="max-w-xl text-gm-sm text-[var(--gm-danger)]">
          {error}
        </p>
        <Button variant="outline" onClick={onBack}>
          Back to Local Shelf
        </Button>
      </main>
    );
  }
  if (!file) {
    return (
      <main className="flex min-h-[32rem] items-center justify-center gap-2 text-[var(--gm-text-muted)]">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Opening local reader…
      </main>
    );
  }

  return (
    <React.Suspense
      fallback={
        <main className="flex min-h-[32rem] items-center justify-center gap-2 text-[var(--gm-text-muted)]">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading {file.format.toUpperCase()} reader…
        </main>
      }
    >
      {file.format === "epub" ? (
        <EpubReader fileId={file.id} onBack={onBack} />
      ) : file.format === "cbz" ? (
        <CbzReader fileId={file.id} onBack={onBack} />
      ) : file.format === "txt" || file.format === "md" || file.format === "docx" ? (
        <TxtReader fileId={file.id} onBack={onBack} />
      ) : file.format === "audio" || file.format === "video" ? (
        <MediaFileReader file={file} onBack={onBack} />
      ) : (
        <PdfReader fileId={file.id} onBack={onBack} />
      )}
    </React.Suspense>
  );
}
