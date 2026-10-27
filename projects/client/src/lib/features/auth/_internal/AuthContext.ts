import type { BehaviorSubject } from 'rxjs';

export type AuthContext = {
  isAuthorized: BehaviorSubject<boolean>;
  logout: () => void;
};
