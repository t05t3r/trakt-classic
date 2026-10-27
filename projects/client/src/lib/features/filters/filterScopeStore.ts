import { BehaviorSubject } from 'rxjs';

export type FilterScopeValue = Record<string, string> | null;

export const filterScopeStore = new BehaviorSubject<FilterScopeValue>(null);
