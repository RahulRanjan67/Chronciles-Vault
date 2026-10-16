import type Database from 'better-sqlite3';
import type { VaultExportDataV1 } from './vault-export.js';

export interface ImportSummary {
  success: boolean;
  inserted: {
    works: number;
    readingRelationships: number;
    accessPaths: number;
    memories: number;
    updateEntries: number;
    progressEvents: number;
  };
  errors?: string[];
}

export interface VaultImportOptions {
  onConflict?: 'skip' | 'overwrite' | 'merge';
}

/**
 * Import a VaultExportDataV1 snapshot into SQLite database within a single transaction.
 */
export async function importVaultFromJson(
  db: Database.Database,
  data: VaultExportDataV1,
  options: VaultImportOptions = {},
): Promise<ImportSummary> {
  const { onConflict = 'overwrite' } = options;

  if (!data || data.version !== 1 || !data.data) {
    throw new Error('Invalid vault export format: version 1 expected');
  }

  const conflictClause = onConflict === 'skip' ? 'OR IGNORE' : 'OR REPLACE';

  const inserted = {
    works: 0,
    readingRelationships: 0,
    accessPaths: 0,
    memories: 0,
    updateEntries: 0,
    progressEvents: 0,
  };

  const importTx = db.transaction(() => {
    // 1. Works
    const insertWork = db.prepare(`
      INSERT ${conflictClause} INTO works (
        id, title, description, content_type, origin, publication_state, privacy_state, cover_ref, created_at, updated_at, deleted_at
      ) VALUES (
        @id, @title, @description, @content_type, @origin, @publication_state, @privacy_state, @cover_ref, @created_at, @updated_at, @deleted_at
      )
    `);
    for (const work of data.data.works || []) {
      insertWork.run({
        id: work.id,
        title: work.title,
        description: work.description ?? null,
        content_type: work.content_type,
        origin: work.origin ?? 'unknown',
        publication_state: work.publication_state ?? 'unknown',
        privacy_state: work.privacy_state ?? 'public',
        cover_ref: work.cover_ref ?? null,
        created_at: work.created_at,
        updated_at: work.updated_at,
        deleted_at: work.deleted_at ?? null,
      });
      inserted.works++;
    }

    // 2. Work Aliases
    const insertAlias = db.prepare(`
      INSERT ${conflictClause} INTO work_aliases (id, work_id, alias, alias_type)
      VALUES (@id, @work_id, @alias, @alias_type)
    `);
    for (const alias of data.data.workAliases || []) {
      insertAlias.run({
        id: alias.id,
        work_id: alias.work_id,
        alias: alias.alias,
        alias_type: alias.alias_type ?? 'alternative',
      });
    }

    // 3. Work External IDs
    const insertExternalId = db.prepare(`
      INSERT ${conflictClause} INTO work_external_ids (id, work_id, provider, external_id)
      VALUES (@id, @work_id, @provider, @external_id)
    `);
    for (const ext of data.data.workExternalIds || []) {
      insertExternalId.run({
        id: ext.id,
        work_id: ext.work_id,
        provider: ext.provider,
        external_id: ext.external_id,
      });
    }

    // 4. Work Genres
    const insertGenre = db.prepare(`
      INSERT ${conflictClause} INTO work_genres (work_id, genre)
      VALUES (@work_id, @genre)
    `);
    for (const g of data.data.workGenres || []) {
      insertGenre.run({
        work_id: g.work_id,
        genre: g.genre,
      });
    }

    // 5. Work Tags
    const insertTag = db.prepare(`
      INSERT ${conflictClause} INTO work_tags (work_id, tag)
      VALUES (@work_id, @tag)
    `);
    for (const t of data.data.workTags || []) {
      insertTag.run({
        work_id: t.work_id,
        tag: t.tag,
      });
    }

    // 6. Reading Relationships
    const insertRelationship = db.prepare(`
      INSERT ${conflictClause} INTO reading_relationships (
        id, work_id, personal_state, priority, started_at, last_active_at, completed_at, stopped_at, stopped_reason, stopped_note, created_at, updated_at
      ) VALUES (
        @id, @work_id, @personal_state, @priority, @started_at, @last_active_at, @completed_at, @stopped_at, @stopped_reason, @stopped_note, @created_at, @updated_at
      )
    `);
    for (const rel of data.data.readingRelationships || []) {
      insertRelationship.run({
        id: rel.id,
        work_id: rel.work_id,
        personal_state: rel.personal_state ?? 'planned',
        priority: rel.priority ?? 'normal',
        started_at: rel.started_at ?? null,
        last_active_at: rel.last_active_at ?? null,
        completed_at: rel.completed_at ?? null,
        stopped_at: rel.stopped_at ?? null,
        stopped_reason: rel.stopped_reason ?? null,
        stopped_note: rel.stopped_note ?? null,
        created_at: rel.created_at,
        updated_at: rel.updated_at,
      });
      inserted.readingRelationships++;
    }

    // 7. Access Paths
    const insertAccessPath = db.prepare(`
      INSERT ${conflictClause} INTO access_paths (
        id, work_id, kind, provider, label, url, file_id, is_preferred, health_state, last_checked_at, last_opened_at, provenance, created_at, updated_at
      ) VALUES (
        @id, @work_id, @kind, @provider, @label, @url, @file_id, @is_preferred, @health_state, @last_checked_at, @last_opened_at, @provenance, @created_at, @updated_at
      )
    `);
    for (const ap of data.data.accessPaths || []) {
      insertAccessPath.run({
        id: ap.id,
        work_id: ap.work_id,
        kind: ap.kind,
        provider: ap.provider ?? null,
        label: ap.label ?? null,
        url: ap.url ?? null,
        file_id: ap.file_id ?? null,
        is_preferred: ap.is_preferred ? 1 : 0,
        health_state: ap.health_state ?? 'unknown',
        last_checked_at: ap.last_checked_at ?? null,
        last_opened_at: ap.last_opened_at ?? null,
        provenance: ap.provenance ? (typeof ap.provenance === 'string' ? ap.provenance : JSON.stringify(ap.provenance)) : null,
        created_at: ap.created_at,
        updated_at: ap.updated_at,
      });
      inserted.accessPaths++;
    }

    // 8. Source Capabilities
    const insertCapability = db.prepare(`
      INSERT ${conflictClause} INTO source_capabilities (access_path_id, capability, status)
      VALUES (@access_path_id, @capability, @status)
    `);
    for (const cap of data.data.sourceCapabilities || []) {
      insertCapability.run({
        access_path_id: cap.access_path_id,
        capability: cap.capability,
        status: cap.status ?? 'unknown',
      });
    }

    // 9. Memories
    const insertMemory = db.prepare(`
      INSERT ${conflictClause} INTO memories (
        id, work_id, type, title, body, privacy_state, spoiler_level, show_in_global_gallery, access_path_id, progress_anchor, created_at, updated_at
      ) VALUES (
        @id, @work_id, @type, @title, @body, @privacy_state, @spoiler_level, @show_in_global_gallery, @access_path_id, @progress_anchor, @created_at, @updated_at
      )
    `);
    for (const mem of data.data.memories || []) {
      insertMemory.run({
        id: mem.id,
        work_id: mem.work_id ?? null,
        type: mem.type,
        title: mem.title ?? null,
        body: mem.body ?? null,
        privacy_state: mem.privacy_state ?? 'normal',
        spoiler_level: mem.spoiler_level ?? 'spoiler_free',
        show_in_global_gallery: mem.show_in_global_gallery ? 1 : 0,
        access_path_id: mem.access_path_id ?? null,
        progress_anchor: mem.progress_anchor ? (typeof mem.progress_anchor === 'string' ? mem.progress_anchor : JSON.stringify(mem.progress_anchor)) : null,
        created_at: mem.created_at,
        updated_at: mem.updated_at,
      });
      inserted.memories++;
    }

    // 10. Memory Tags
    const insertMemTag = db.prepare(`
      INSERT ${conflictClause} INTO memory_tags (memory_id, tag)
      VALUES (@memory_id, @tag)
    `);
    for (const mt of data.data.memoryTags || []) {
      insertMemTag.run({
        memory_id: mt.memory_id,
        tag: mt.tag,
      });
    }

    // 11. Update Entries
    const insertUpdate = db.prepare(`
      INSERT ${conflictClause} INTO update_entries (
        id, work_id, access_path_id, anchor, certainty, source, detected_at, published_at
      ) VALUES (
        @id, @work_id, @access_path_id, @anchor, @certainty, @source, @detected_at, @published_at
      )
    `);
    for (const ue of data.data.updateEntries || []) {
      insertUpdate.run({
        id: ue.id,
        work_id: ue.work_id,
        access_path_id: ue.access_path_id ?? null,
        anchor: typeof ue.anchor === 'string' ? ue.anchor : JSON.stringify(ue.anchor),
        certainty: ue.certainty ?? 'unknown',
        source: ue.source ?? null,
        detected_at: ue.detected_at,
        published_at: ue.published_at ?? null,
      });
      inserted.updateEntries++;
    }

    // 12. Progress Events
    const insertProgress = db.prepare(`
      INSERT ${conflictClause} INTO progress_events (
        id, work_id, reading_relationship_id, access_path_id, method, confidence, anchor_before, anchor_after, provenance_note, created_at
      ) VALUES (
        @id, @work_id, @reading_relationship_id, @access_path_id, @method, @confidence, @anchor_before, @anchor_after, @provenance_note, @created_at
      )
    `);
    for (const pe of data.data.progressEvents || []) {
      insertProgress.run({
        id: pe.id,
        work_id: pe.work_id,
        reading_relationship_id: pe.reading_relationship_id ?? null,
        access_path_id: pe.access_path_id ?? null,
        method: pe.method ?? 'manual',
        confidence: pe.confidence ?? 'confirmed',
        anchor_before: pe.anchor_before ? (typeof pe.anchor_before === 'string' ? pe.anchor_before : JSON.stringify(pe.anchor_before)) : null,
        anchor_after: typeof pe.anchor_after === 'string' ? pe.anchor_after : JSON.stringify(pe.anchor_after),
        provenance_note: pe.provenance_note ?? null,
        created_at: pe.created_at,
      });
      inserted.progressEvents++;
    }
  });

  importTx();

  return {
    success: true,
    inserted,
  };
}
