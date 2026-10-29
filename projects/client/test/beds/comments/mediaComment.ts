import { mapToMediaComment } from '$lib/requests/_internal/mapToMediaComment.ts';
import type { MediaComment } from '$lib/requests/models/MediaComment.ts';
import {
  commentResponse,
  type CommentResponseParams,
} from '$test/beds/request/commentResponse.ts';

export function mediaComment(params: CommentResponseParams): MediaComment {
  return mapToMediaComment(commentResponse(params));
}
