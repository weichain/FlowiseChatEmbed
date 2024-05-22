import { Accessor } from 'solid-js';
import { MessageType } from '../Bot';
type Props = {
    message: any;
    imagedSaved: boolean;
    walletAddress: string;
    messageId: string;
    role: string;
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
    onMintHandler: any;
    onSaveHandler: any;
    onUnsaveImageHandler: any;
    isMintButtonDisabled: boolean;
    loading: Accessor<boolean>;
    index: Accessor<number>;
    messages: Accessor<MessageType[]>;
};
export declare const BotBubble: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=BotBubble.d.ts.map