import type { DeviceProps } from './DeviceProps.ts';
import type { InputProps } from './InputProps.ts';
import type { RenderForAudienceProps } from './RenderForAudienceProps.ts';

export type RenderForProps =
  & RenderForAudienceProps
  & Partial<DeviceProps>
  & Partial<InputProps>;
