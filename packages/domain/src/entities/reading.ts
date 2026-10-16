/**
 * Reading entities and compatibility re-exports.
 */
import {
  PersonalState,
  ReadingRelationship,
  ReadingAttempt,
  ReadingSession,
  ReadingPriority,
} from './reading-relationship.js';
import {
  ProgressEvent,
  ProgressMethod,
  ProgressConfidence,
  ProgressAnchor,
} from './progress.js';

export {
  PersonalState,
  PersonalState as ReadingState,
  ReadingPriority,
  ReadingRelationship,
  ReadingAttempt,
  ReadingSession,
} from './reading-relationship.js';

export {
  ProgressEvent,
  ProgressMethod,
  ProgressConfidence,
} from './progress.js';
export type { ProgressAnchor } from './progress.js';
