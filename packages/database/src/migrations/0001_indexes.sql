-- Migration: 0001_indexes
-- Description: Performance indexes for all hot query paths

-- ============================================================
-- works indexes
-- ============================================================
CREATE INDEX idx_works_content_type    ON works(content_type);
CREATE INDEX idx_works_privacy_state   ON works(privacy_state);
CREATE INDEX idx_works_publication_state ON works(publication_state);
CREATE INDEX idx_works_updated_at      ON works(updated_at DESC);
CREATE INDEX idx_works_created_at      ON works(created_at DESC);
CREATE INDEX idx_works_deleted_at      ON works(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================
-- work_aliases indexes
-- ============================================================
CREATE INDEX idx_work_aliases_work_id  ON work_aliases(work_id);
CREATE INDEX idx_work_aliases_alias    ON work_aliases(alias COLLATE NOCASE);

-- ============================================================
-- work_external_ids indexes
-- ============================================================
CREATE INDEX idx_work_external_ids_work_id   ON work_external_ids(work_id);
CREATE INDEX idx_work_external_ids_provider  ON work_external_ids(provider, external_id);

-- ============================================================
-- work_genres indexes
-- ============================================================
CREATE INDEX idx_work_genres_genre     ON work_genres(genre);

-- ============================================================
-- work_tags indexes
-- ============================================================
CREATE INDEX idx_work_tags_tag         ON work_tags(tag);

-- ============================================================
-- work_relations indexes
-- ============================================================
CREATE INDEX idx_work_relations_source ON work_relations(source_work_id);
CREATE INDEX idx_work_relations_target ON work_relations(target_work_id);
CREATE INDEX idx_work_relations_type   ON work_relations(relation_type);

-- ============================================================
-- reading_relationships indexes
-- ============================================================
CREATE INDEX idx_reading_rel_personal_state ON reading_relationships(personal_state);
CREATE INDEX idx_reading_rel_priority       ON reading_relationships(priority);
CREATE INDEX idx_reading_rel_last_active    ON reading_relationships(last_active_at DESC);
CREATE INDEX idx_reading_rel_completed_at   ON reading_relationships(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_reading_rel_started_at     ON reading_relationships(started_at DESC)   WHERE started_at IS NOT NULL;

-- ============================================================
-- reading_attempts indexes
-- ============================================================
CREATE INDEX idx_reading_attempts_work_id   ON reading_attempts(work_id);
CREATE INDEX idx_reading_attempts_rel_id    ON reading_attempts(reading_relationship_id);
CREATE INDEX idx_reading_attempts_started   ON reading_attempts(started_at DESC);

-- ============================================================
-- reading_sessions indexes
-- ============================================================
CREATE INDEX idx_reading_sessions_work_id   ON reading_sessions(work_id);
CREATE INDEX idx_reading_sessions_rel_id    ON reading_sessions(reading_relationship_id);
CREATE INDEX idx_reading_sessions_access    ON reading_sessions(access_path_id) WHERE access_path_id IS NOT NULL;
CREATE INDEX idx_reading_sessions_started   ON reading_sessions(started_at DESC);

-- ============================================================
-- access_paths indexes
-- ============================================================
CREATE INDEX idx_access_paths_work_id       ON access_paths(work_id);
CREATE INDEX idx_access_paths_kind          ON access_paths(kind);
CREATE INDEX idx_access_paths_health        ON access_paths(health_state);
CREATE INDEX idx_access_paths_preferred     ON access_paths(work_id, is_preferred);
CREATE INDEX idx_access_paths_provider      ON access_paths(provider) WHERE provider IS NOT NULL;
CREATE INDEX idx_access_paths_last_opened   ON access_paths(last_opened_at DESC) WHERE last_opened_at IS NOT NULL;

-- ============================================================
-- source_health_events indexes
-- ============================================================
CREATE INDEX idx_health_events_access_path  ON source_health_events(access_path_id);
CREATE INDEX idx_health_events_checked_at   ON source_health_events(checked_at DESC);

-- ============================================================
-- progress_events indexes
-- ============================================================
CREATE INDEX idx_progress_events_work_id    ON progress_events(work_id);
CREATE INDEX idx_progress_events_rel_id     ON progress_events(reading_relationship_id) WHERE reading_relationship_id IS NOT NULL;
CREATE INDEX idx_progress_events_access     ON progress_events(access_path_id) WHERE access_path_id IS NOT NULL;
CREATE INDEX idx_progress_events_created    ON progress_events(created_at DESC);
CREATE INDEX idx_progress_events_method     ON progress_events(method);

-- ============================================================
-- captures indexes
-- ============================================================
CREATE INDEX idx_captures_batch_id          ON captures(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_captures_state             ON captures(state);
CREATE INDEX idx_captures_possible_work     ON captures(possible_work_id) WHERE possible_work_id IS NOT NULL;
CREATE INDEX idx_captures_captured_at       ON captures(captured_at DESC);
CREATE INDEX idx_captures_normalized_url    ON captures(normalized_url) WHERE normalized_url IS NOT NULL;

-- ============================================================
-- capture_batches indexes
-- ============================================================
CREATE INDEX idx_capture_batches_source     ON capture_batches(source);
CREATE INDEX idx_capture_batches_created    ON capture_batches(created_at DESC);

-- ============================================================
-- memories indexes
-- ============================================================
CREATE INDEX idx_memories_work_id           ON memories(work_id) WHERE work_id IS NOT NULL;
CREATE INDEX idx_memories_type              ON memories(type);
CREATE INDEX idx_memories_privacy           ON memories(privacy_state);
CREATE INDEX idx_memories_gallery           ON memories(show_in_global_gallery, created_at DESC);
CREATE INDEX idx_memories_created_at        ON memories(created_at DESC);

-- ============================================================
-- memory_assets indexes
-- ============================================================
CREATE INDEX idx_memory_assets_memory_id    ON memory_assets(memory_id);

-- ============================================================
-- memory_tags indexes
-- ============================================================
CREATE INDEX idx_memory_tags_tag            ON memory_tags(tag);

-- ============================================================
-- local_files indexes
-- ============================================================
CREATE INDEX idx_local_files_work_id        ON local_files(work_id) WHERE work_id IS NOT NULL;
CREATE INDEX idx_local_files_format         ON local_files(format) WHERE format IS NOT NULL;
CREATE INDEX idx_local_files_content_hash   ON local_files(content_hash) WHERE content_hash IS NOT NULL;

-- ============================================================
-- update_entries indexes
-- ============================================================
CREATE INDEX idx_update_entries_work_id     ON update_entries(work_id);
CREATE INDEX idx_update_entries_access      ON update_entries(access_path_id) WHERE access_path_id IS NOT NULL;
CREATE INDEX idx_update_entries_detected    ON update_entries(detected_at DESC);
CREATE INDEX idx_update_entries_certainty   ON update_entries(certainty);

-- ============================================================
-- lists indexes
-- ============================================================
CREATE INDEX idx_lists_privacy              ON lists(privacy_state);
CREATE INDEX idx_lists_updated              ON lists(updated_at DESC);

-- ============================================================
-- list_items indexes
-- ============================================================
CREATE INDEX idx_list_items_list_id         ON list_items(list_id);
CREATE INDEX idx_list_items_work_id         ON list_items(work_id);
CREATE INDEX idx_list_items_position        ON list_items(list_id, position);

-- ============================================================
-- archive_records indexes
-- ============================================================
CREATE INDEX idx_archive_records_work_id    ON archive_records(work_id);
CREATE INDEX idx_archive_records_archived   ON archive_records(archived_at DESC);

-- ============================================================
-- lore_entries indexes
-- ============================================================
CREATE INDEX idx_lore_entries_work_id       ON lore_entries(work_id);
CREATE INDEX idx_lore_entries_entity_type   ON lore_entries(entity_type);

-- ============================================================
-- event_log indexes
-- ============================================================
CREATE INDEX idx_event_log_entity           ON event_log(entity_type, entity_id);
CREATE INDEX idx_event_log_event_type       ON event_log(event_type);
CREATE INDEX idx_event_log_created_at       ON event_log(created_at DESC);
CREATE INDEX idx_event_log_device           ON event_log(device_id) WHERE device_id IS NOT NULL;
