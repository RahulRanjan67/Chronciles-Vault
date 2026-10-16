import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { listLocalFiles } from "@chronicles-vault/reader";
import type { LocalFileMetadata } from "@chronicles-vault/reader";
import { Button } from "@chronicles-vault/ui";

const PdfReader = React.lazy(() =>
  import("./PdfReader").then((module) => ({ default: module.PdfReader })),
);
const EpubReader = React.lazy(() =>
  import("./EpubReader").then((module) => ({ default: module.EpubReader })),
);
const CbzReader = React.lazy(() =>
  import("./CbzReader").then((module) => ({ default: module.CbzReader })),
);

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
        <p role="alert" className="max-w-xl text-cv-sm text-[var(--cv-danger)]">
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
      <main className="flex min-h-[32rem] items-center justify-center gap-2 text-[var(--cv-text-muted)]">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Opening local reader…
      </main>
    );
  }

  return (
    <React.Suspense
      fallback={
        <main className="flex min-h-[32rem] items-center justify-center gap-2 text-[var(--cv-text-muted)]">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading {file.format.toUpperCase()} reader…
        </main>
      }
    >
      {file.format === "epub" ? (
        <EpubReader fileId={file.id} onBack={onBack} />
      ) : file.format === "cbz" ? (
        <CbzReader fileId={file.id} onBack={onBack} />
      ) : (
        <PdfReader fileId={file.id} onBack={onBack} />
      )}
    </React.Suspense>
  );
}
