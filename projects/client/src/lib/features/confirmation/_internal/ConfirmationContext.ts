import { BehaviorSubject } from 'rxjs';
import type { ConfirmationRequest } from '../models/ConfirmationRequest.ts';

export type ConfirmationContext = {
  showConfirmation: (request: ConfirmationRequest) => void;
  hideConfirmation: () => void;
  activeConfirmation: BehaviorSubject<ConfirmationRequest | Nil>;
};
