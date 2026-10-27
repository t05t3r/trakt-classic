export type SwapTextProps = {
  text: string;
  alternate: () => string;
  swap: boolean;
} & Record<`data-${string}`, string | number>;
