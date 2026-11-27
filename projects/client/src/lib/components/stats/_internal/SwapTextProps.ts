export type SwapTextProps = {
  text: string;
  alternate: () => string;
  swap: boolean;
  triggerProps?: Record<string, unknown>;
} & Record<`data-${string}`, string | number>;
