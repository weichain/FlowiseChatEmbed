import { For, Show, onMount } from 'solid-js';
import { Avatar } from '../avatars/Avatar';
import { Marked } from '@ts-stack/markdown';

type Props = {
  message: any;
  messages: any;
  apiHost?: string;
  chatflowid: string;
  chatId: string;
  showAvatar?: boolean;
  avatarSrc?: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  userUploadedImageUrl: any;
};

const defaultTextColor = '#ffffff';
const defaultFontSize = 16;

Marked.setOptions({ isNoP: true });

export const GuestBubble = (props: Props) => {
  let userMessageEl: HTMLDivElement | undefined;

  onMount(() => {
    if (userMessageEl) {
      const parsedMessage = Marked.parse(props.message);
      userMessageEl.innerHTML = parsedMessage;
      styleLinksInElement(userMessageEl);
    }
  });

  const styleLinksInElement = (element: HTMLDivElement) => {
    const links = element.querySelectorAll('a');
    links.forEach((link) => {
      link.style.wordBreak = 'break-all';
    });
  };

  return (
    <div class="flex p-4 mb-6 lg:mt-6 md:mt-6 mt-0">
      <Show when={props.showAvatar}>
        <Avatar initialAvatarSrc={'/drop-down-icon.svg'} />
      </Show>
      <div
        class="max-w-full flex flex-col justify-center items-start chatbot-guest-bubble px-2 gap-2"
        data-testid="guest-bubble"
        style={{
          color: props.textColor ?? defaultTextColor,
          'border-radius': '6px',
        }}
      >
        <p class="text-[16px] font-semibold">You</p>
        {props.message && (
          <>
            <div
              ref={userMessageEl}
              class="mr-2 whitespace-pre-wrap"
              style={{
                'font-size': props.fontSize ? `${props.fontSize}px` : `${defaultFontSize}, ${props.messages().length === 0 ? 'width: 600px' : ''}`,
              }}
            />
          </>
        )}
        {props.userUploadedImageUrl && (
          <div class="flex flex-col items-start flex-wrap w-full gap-2">
            <div class="flex items-center justify-center max-w-[128px] mr-[10px] p-0 m-0">
              <img class="w-full rounded-md h-full bg-cover" src={props.userUploadedImageUrl} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
