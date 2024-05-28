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
  fileUploaded: any[];
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
    <div class="flex p-4 mb-6 mt-6 guest-container">
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
        {props.message && (
          <>
            <p class="text-[16px] font-semibold">You</p>
            <div
              ref={userMessageEl}
              class="mr-2 whitespace-pre-wrap"
              style={{
                'font-size': props.fontSize ? `${props.fontSize}px` : `${defaultFontSize}, ${props.messages().length === 0 ? 'width: 600px' : ''}`,
              }}
            />
          </>
        )}
        {props.fileUploaded && props.fileUploaded.length > 0 && (
          <div class="flex flex-col items-start flex-wrap w-full gap-2">
            <For each={props.fileUploaded}>
              {(item) => {
                const fileData = `${props.apiHost}/api/v1/get-upload-file?chatflowId=${props.chatflowid}&chatId=${props.chatId}&fileName=${item.name}`;
                const src = (item.data as string) ?? fileData;
                return (
                  <div class="flex items-center justify-center max-w-[128px] mr-[10px] p-0 m-0">
                    <img class="w-full rounded-md h-full bg-cover" src={src} />
                  </div>
                );
              }}
            </For>
          </div>
        )}
      </div>
    </div>
  );
};
