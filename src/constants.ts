import type { BubbleProps } from './features/bubble';

export const defaultBotProps: BubbleProps = {
  chatflowid: '',
  apiHost: undefined,
  chatflowConfig: undefined,
  theme: undefined,
  observersConfig: undefined,
  onMintHandler: (input: string) => {
    return input;
  },
  isMintButtonDisabled: false,
  authToken: ''
};
