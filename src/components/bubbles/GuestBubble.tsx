import { For, Show, onMount } from 'solid-js';
import { Avatar } from '../avatars/Avatar';
import { Marked } from '@ts-stack/markdown';
import { MessageType } from '../Bot';

type Props = {
  message: MessageType;
  apiHost?: string;
  chatflowid: string;
  chatId: string;
  showAvatar?: boolean;
  avatarSrc?: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
};

const defaultBackgroundColor = '#3B81F6';
const defaultTextColor = '#ffffff';
const defaultFontSize = 16;

Marked.setOptions({ isNoP: true });

export const GuestBubble = (props: Props) => {
  let userMessageEl: HTMLDivElement | undefined;

  onMount(() => {
    if (userMessageEl) {
      const parsedMessage = Marked.parse(props.message.message);
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
        {props.message.fileUploads && props.message.fileUploads.length > 0 && (
          <div class="flex flex-col items-start flex-wrap w-full gap-2">
            <For each={props.message.fileUploads}>
              {(item) => {
                const fileData = `${props.apiHost}/api/v1/get-upload-file?chatflowId=${props.chatflowid}&chatId=${props.chatId}&fileName=${item.name}`;
                const src = (item.data as string) ?? fileData;
                return (
                  <>
                    {item.mime && item.mime.startsWith('image/') ? (
                      <div class="flex items-center justify-center max-w-[128px] mr-[10px] p-0 m-0">
                        <img class="w-full h-full bg-cover" src={src} />
                      </div>
                    ) : (
                      <audio class="w-[200px] h-10 block bg-cover bg-center rounded-none text-transparent" controls>
                        Your browser does not support the &lt;audio&gt; tag.
                        <source src={src} type={item.mime} />
                      </audio>
                    )}
                  </>
                );
              }}
            </For>
          </div>
        )}
        {props.message.message && (
          <>
            <p class="text-[16px] font-semibold">You</p>
            <div
              ref={userMessageEl}
              class="mr-2 whitespace-pre-wrap"
              style={{ 'font-size': props.fontSize ? `${props.fontSize}px` : `${defaultFontSize}` }}
            />
          </>
        )}
      </div>
    </div>
  );
};
