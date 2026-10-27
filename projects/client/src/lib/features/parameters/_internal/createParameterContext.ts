import { page } from '$app/state';
import { BehaviorSubject } from 'rxjs';
import { getContext, setContext } from 'svelte';
import type { ParameterContextData } from './ParameterContextData.ts';
import type { ParameterType } from './ParameterType.ts';
import { PARAMETER_CONTEXT_KEY } from './PARAMETER_CONTEXT_KEY.ts';
import { PARAMETER_ESCAPE_KEY } from './PARAMETER_ESCAPE_KEY.ts';
import { PARAMETER_SETTER_CONTEXT_KEY } from './PARAMETER_SETTER_CONTEXT_KEY.ts';

export function createParameterContext() {
  const context = setContext(
    PARAMETER_CONTEXT_KEY,
    getContext<ParameterContextData>(PARAMETER_CONTEXT_KEY) ?? {
      parameters: new BehaviorSubject(new Map<string, ParameterType>()),
      url: new BehaviorSubject(page.url),
    },
  );
  const override = setContext(
    PARAMETER_SETTER_CONTEXT_KEY,
    getContext<BehaviorSubject<string>>(PARAMETER_SETTER_CONTEXT_KEY) ??
      new BehaviorSubject(''),
  );
  const isEscaped = setContext(
    PARAMETER_ESCAPE_KEY,
    getContext<BehaviorSubject<boolean>>(PARAMETER_ESCAPE_KEY) ??
      new BehaviorSubject(false),
  );

  return { ...context, override, isEscaped };
}
