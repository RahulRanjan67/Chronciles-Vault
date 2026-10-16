import * as React from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input } from "@chronicles-vault/ui";
import { useListsStore, type UserPersonalList, type UserPersonalListItem } from "@chronicles-vault/state";
import { PrivacyState } from "@chronicles-vault/domain";

const NOTE_LIMIT = 500;

export interface EditListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: UserPersonalList;
}

/** Edit a list's title, description, and visibility. */
export function EditListDialog({ open, onOpenChange, list }: EditListDialogProps) {
  const updateList = useListsStore((state) => state.updateList);
  const [title, setTitle] = React.useState(list.title);
  const [description, setDescription] = React.useState(list.description ?? "");
  const [isPublic, setIsPublic] = React.useState(list.privacyState === PrivacyState.Public);

  React.useEffect(() => {
    if (!open) return;
    setTitle(list.title);
    setDescription(list.description ?? "");
    setIsPublic(list.privacyState === PrivacyState.Public);
  }, [open, list]);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    updateList(list.id, {
      title: trimmedTitle,
      description: description.trim() || null,
      privacyState: isPublic ? PrivacyState.Public : PrivacyState.Private,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit list</DialogTitle>
          <DialogDescription>Title, description, and visibility. Private lists cannot be published.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-cv-xs font-medium text-[var(--cv-text-muted)]">Title</span>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required />
          </label>
          <label className="block space-y-1.5">
            <span className="text-cv-xs font-medium text-[var(--cv-text-muted)]">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={600}
              rows={3}
              className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-cv-sm text-[var(--cv-text)] focus:outline-none focus:ring-2 focus:ring-[var(--cv-border-focus)]"
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-cv-xs font-medium text-[var(--cv-text-muted)]">Visibility</span>
            <div className="flex gap-2" role="radiogroup" aria-label="Visibility">
              <Button type="button" size="sm" variant={isPublic ? "default" : "outline"} aria-pressed={isPublic} onClick={() => setIsPublic(true)}>
                Public
              </Button>
              <Button type="button" size="sm" variant={!isPublic ? "default" : "outline"} aria-pressed={!isPublic} onClick={() => setIsPublic(false)}>
                Private
              </Button>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface ItemNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  item: UserPersonalListItem | null;
  workTitle: string;
}

/** Edit the personal note attached to one entry in a list. */
export function ItemNoteDialog({ open, onOpenChange, listId, item, workTitle }: ItemNoteDialogProps) {
  const setListItemNote = useListsStore((state) => state.setListItemNote);
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (open) setNote(item?.personalNote ?? "");
  }, [open, item]);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;
    setListItemNote(listId, item.id, note);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Note for “{workTitle}”</DialogTitle>
          <DialogDescription>This note is part of this list only. Check it before publishing.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, NOTE_LIMIT))}
            rows={4}
            placeholder="Why this entry belongs here…"
            className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-cv-sm text-[var(--cv-text)] focus:outline-none focus:ring-2 focus:ring-[var(--cv-border-focus)]"
          />
          <p className="text-right text-[11px] text-[var(--cv-text-subtle)]">
            {note.length}/{NOTE_LIMIT}
          </p>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save note</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
