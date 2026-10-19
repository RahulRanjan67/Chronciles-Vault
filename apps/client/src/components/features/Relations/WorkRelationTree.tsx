import * as React from 'react';
import {
  Network,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  ArrowRight,
  GitFork,
  Sparkles,
  Link2,
} from 'lucide-react';
import {
  Button,
  Cover,
  toast,
} from '@grimoire/ui';
import {
  formatProgressAnchor,
  getInverseRelationType,
  WorkRelation,
  WorkRelationType,
} from '@grimoire/domain';
import { WorkId, WorkRelationId } from '@grimoire/shared';
import {
  clientRepository,
  useWorkDetailStore,
} from '@grimoire/state';

export interface WorkRelationTreeProps {
  workId: string;
  onNavigateWork?: (workId: string) => void;
}

interface RelationBadgeStyle {
  label: string;
  badgeClass: string;
  group: 'adaptation' | 'chronology' | 'related';
}

function getRelationDisplay(
  relation: WorkRelation,
  currentWorkId: string,
): RelationBadgeStyle {
  const isDirect = relation.sourceWorkId === currentWorkId;
  const effectiveType = isDirect
    ? relation.relationType
    : getInverseRelationType(relation.relationType);

  switch (effectiveType) {
    case WorkRelationType.AdaptationOf:
      return {
        label: 'Adaptation of',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        group: 'adaptation',
      };
    case WorkRelationType.OriginalWorkOf:
      return {
        label: 'Adapted into',
        badgeClass: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
        group: 'adaptation',
      };
    case WorkRelationType.Sequel:
      return {
        label: 'Sequel to',
        badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        group: 'chronology',
      };
    case WorkRelationType.Prequel:
      return {
        label: 'Prequel to',
        badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
        group: 'chronology',
      };
    case WorkRelationType.SpinOff:
      return {
        label: 'Spin-off of',
        badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        group: 'related',
      };
    case WorkRelationType.SideStory:
      return {
        label: 'Side story to',
        badgeClass: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
        group: 'related',
      };
    case WorkRelationType.Related:
    default:
      return {
        label: 'Related to',
        badgeClass: 'bg-[var(--gm-surface)] text-[var(--gm-text-muted)] border-[var(--gm-border)]',
        group: 'related',
      };
  }
}

export function WorkRelationTree({ workId, onNavigateWork }: WorkRelationTreeProps) {
  const { relations, linkWorkRelation, removeWorkRelation } = useWorkDetailStore();

  const [isAdding, setIsAdding] = React.useState(false);
  const [targetId, setTargetId] = React.useState<string>('');
  const [relationType, setRelationType] = React.useState<WorkRelationType>(WorkRelationType.AdaptationOf);
  const [notes, setNotes] = React.useState<string>('');

  // Available works to connect to (excluding current work and already related works)
  const availableWorks = React.useMemo(() => {
    const existingRelatedIds = new Set(
      relations.map((r) => (r.sourceWorkId === workId ? r.targetWorkId : r.sourceWorkId)),
    );
    return clientRepository
      .getItems()
      .filter((i) => i.work.id !== workId && !i.work.deletedAt && !existingRelatedIds.has(i.work.id));
  }, [workId, relations]);

  const handleLink = () => {
    if (!targetId) {
      toast({ title: 'Select a work to link', variant: 'destructive' });
      return;
    }

    try {
      linkWorkRelation(
        workId as WorkId,
        targetId as WorkId,
        relationType,
        notes.trim() || undefined,
      );
      toast({
        title: 'Relationship linked',
        description: 'Updated work relation tree.',
      });
      setIsAdding(false);
      setTargetId('');
      setNotes('');
    } catch (err) {
      toast({
        title: 'Failed to link relationship',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = (relationId: WorkRelationId, otherTitle: string) => {
    removeWorkRelation(relationId);
    toast({
      title: 'Relationship unlinked',
      description: `Disconnected relation with "${otherTitle}".`,
    });
  };

  // Group relations by adaptation, chronology, related
  const relationCards = React.useMemo(() => {
    return relations.map((rel) => {
      const otherId = rel.sourceWorkId === workId ? rel.targetWorkId : rel.sourceWorkId;
      const otherItem = clientRepository.getItem(otherId as WorkId);
      const display = getRelationDisplay(rel, workId);
      return {
        relation: rel,
        otherItem,
        otherId,
        display,
      };
    });
  }, [relations, workId]);

  return (
    <div className="space-y-6">
      {/* Header & Link Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gm-sm font-semibold text-[var(--gm-text)] flex items-center gap-2">
            <Network className="h-4 w-4 text-[var(--gm-accent-strong)]" />
            <span>Adaptation Graph & Work Relations</span>
          </h3>
          <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
            Explicit connections to original novels, anime/manga adaptations, prequels, sequels, and spin-offs.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Link Work</span>
        </Button>
      </div>

      {/* Add Relation Form */}
      {isAdding && (
        <div className="rounded-gm-xl border border-[var(--gm-accent-muted)] bg-[var(--gm-bg-elevated)] p-4 shadow-sm space-y-3">
          <div className="font-semibold text-gm-xs text-[var(--gm-text)] flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 text-[var(--gm-accent-strong)]" />
            <span>Connect a Related Work</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gm-xs">
            {/* Target work */}
            <div>
              <label className="block text-[var(--gm-text-muted)] mb-1 font-medium">
                Related Work in Library:
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-xs text-[var(--gm-text)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent)]"
              >
                <option value="">-- Choose work --</option>
                {availableWorks.map((item) => (
                  <option key={item.work.id} value={item.work.id}>
                    {item.work.title} ({item.work.contentType})
                  </option>
                ))}
              </select>
            </div>

            {/* Relation Type */}
            <div>
              <label className="block text-[var(--gm-text-muted)] mb-1 font-medium">
                Relationship Type:
              </label>
              <select
                value={relationType}
                onChange={(e) => setRelationType(e.target.value as WorkRelationType)}
                className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-xs text-[var(--gm-text)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent)]"
              >
                <option value={WorkRelationType.AdaptationOf}>Adaptation of (e.g. Manga adapting Novel)</option>
                <option value={WorkRelationType.OriginalWorkOf}>Original Work of (e.g. Source Novel for Anime)</option>
                <option value={WorkRelationType.Sequel}>Sequel to (Follow-up chronologically)</option>
                <option value={WorkRelationType.Prequel}>Prequel to (Preceding storyline)</option>
                <option value={WorkRelationType.SpinOff}>Spin-off of</option>
                <option value={WorkRelationType.SideStory}>Side Story to</option>
                <option value={WorkRelationType.Related}>Related</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[var(--gm-text-muted)] mb-1 text-gm-xs font-medium">
              Notes or Context (optional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Official manga adaptation covering LN Volumes 1-4"
              className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-xs text-[var(--gm-text)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent)]"
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleLink} disabled={!targetId}>
              Confirm Link
            </Button>
          </div>
        </div>
      )}

      {/* Relations Tree / Cards List */}
      {relationCards.length === 0 ? (
        <div className="rounded-gm-xl border border-dashed border-[var(--gm-border)] bg-[var(--gm-surface)]/30 p-8 text-center">
          <GitFork className="h-8 w-8 mx-auto mb-2 text-[var(--gm-text-subtle)] opacity-40" />
          <p className="text-gm-sm font-semibold text-[var(--gm-text)]">No explicit relationships recorded</p>
          <p className="text-gm-xs text-[var(--gm-text-muted)] max-w-md mx-auto mt-1">
            Link adaptations (e.g. Light Novel → Manga), prequels, sequels, or franchise spin-offs to navigate
            seamlessly across related fiction.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="mt-4 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Link Related Work</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relationCards.map(({ relation, otherItem, otherId, display }) => {
            const otherWork = otherItem?.work;
            const otherTitle = otherWork?.title ?? otherId;
            const anchor = otherItem?.relationship?.currentAnchor;

            return (
              <div
                key={relation.id}
                className="group rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-4 flex flex-col justify-between hover:border-[var(--gm-border-strong)] transition-all shadow-sm"
              >
                <div>
                  {/* Top Bar with Badge and Unlink button */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-gm-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase font-mono ${display.badgeClass}`}
                    >
                      <ArrowRight className="h-3 w-3" />
                      {display.label}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemove(relation.id, otherTitle)}
                      title="Unlink relationship"
                      className="p-1 rounded-gm-sm text-[var(--gm-text-subtle)] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Work Card with Quick-navigation */}
                  <div
                    onClick={() => onNavigateWork?.(otherId)}
                    className="flex gap-3 cursor-pointer p-1 rounded-gm-lg hover:bg-[var(--gm-surface)]/50 transition-colors"
                  >
                    <Cover
                      title={otherTitle}
                      src={otherWork?.coverRef ?? null}
                      size="sm"
                      className="w-14 h-20 rounded-cv shadow shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-[var(--gm-accent-strong)] font-medium text-gm-xs group-hover:underline">
                        <span className="truncate font-bold text-gm-sm text-[var(--gm-text)]">
                          {otherTitle}
                        </span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                      </div>

                      {otherWork && (
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--gm-text-muted)]">
                          <span className="rounded-gm-sm bg-[var(--gm-surface)] px-1.5 py-0.2 border border-[var(--gm-border)] font-mono text-[10px]">
                            {otherWork.contentType}
                          </span>
                          <span>·</span>
                          <span>{otherWork.publicationState}</span>
                        </div>
                      )}

                      {anchor && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--gm-text-subtle)] font-mono">
                          <BookOpen className="h-3 w-3 text-[var(--gm-accent-strong)]" />
                          <span>{formatProgressAnchor(anchor)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional Note / Context */}
                {(relation.notes || relation.description) && (
                  <p className="mt-3 pt-2.5 border-t border-[var(--gm-border)] text-gm-xs text-[var(--gm-text-subtle)] italic leading-relaxed">
                    "{relation.notes || relation.description}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
