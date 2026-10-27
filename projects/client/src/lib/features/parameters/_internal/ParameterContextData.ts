import type { BehaviorSubject } from 'rxjs';
import type { ParameterType } from './ParameterType.ts';

export type ParameterContextData = {
  parameters: BehaviorSubject<Map<string, ParameterType>>;
  url: BehaviorSubject<URL>;
};
