import { Accessor } from 'solid-js';
import { MessageType } from '../Bot';
type Props = {
    message: any;
    baseUrl: string;
    imagedSaved: boolean;
    chatBotBEUrl: string;
    createdAt: string;
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
    fontSize?: number;
    onMintHandler: any;
    isMintButtonDisabled: boolean;
    loading: Accessor<boolean>;
    index: Accessor<number>;
    messages: Accessor<MessageType[]>;
};
export declare const BotBubble: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=BotBubble.d.ts.map