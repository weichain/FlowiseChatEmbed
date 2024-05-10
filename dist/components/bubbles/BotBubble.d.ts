import { Accessor } from 'solid-js';
import { MessageType } from '../Bot';
type Props = {
    message: MessageType;
    chatflowid: string;
    chatId: string;
    apiHost?: string;
    fileAnnotations?: any;
    showAvatar?: boolean;
    avatarSrc?: string;
    backgroundColor?: string;
    textColor?: string;
    chatFeedbackStatus?: boolean;
    fontSize?: number;
    onMintHandler: (input: string) => void;
    onSaveHandler: (input: string) => void;
    isMintButtonDisabled: boolean;
    loading: Accessor<boolean>;
    index: Accessor<number>;
    messages: Accessor<MessageType[]>;
};
export declare const BotBubble: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=BotBubble.d.ts.map