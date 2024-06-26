import { Accessor, Show, createSignal, onMount } from 'solid-js';
import { Avatar } from '../avatars/Avatar';
import { Marked } from '@ts-stack/markdown';
import { sendFileDownloadQuery } from '@/queries/sendMessageQuery';
import { MessageType } from '../Bot';
import { LoadingBubble } from './LoadingBubble';
import { updateConversationById } from '@/queries/conversations';
import { deleteImageByMessageId, saveImage } from '@/queries/generated-images';

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

const defaultFontSize = 16;

Marked.setOptions({ isNoP: true });

export const BotBubble = (props: Props) => {
  let botMessageEl: any;
  const [imagedSaved, setImagedSaved] = createSignal(props.imagedSaved);

  const downloadFile = async (fileAnnotation: any) => {
    try {
      const response = await sendFileDownloadQuery({
        apiHost: props.apiHost,
        body: { question: '', history: [], fileName: fileAnnotation.fileName } as any,
      });
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileAnnotation.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const onClickHandler = async (text: any, messageId: string) => {
    if (props.onMintHandler) {
      return props.onMintHandler(text, messageId);
    }
  };

  const onSaveImageHandler = async (text: any, messageId: string) => {
    try {
      await saveImage({ baseUrl: props.baseUrl, imageUrl: text, messageId });
      setImagedSaved(true);
    } catch (error) {
      console.error('Save image failed:', error);
    }
  };

  const onUnsaveImageHandler = async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
    try {
      await deleteImageByMessageId({ baseUrl: props.baseUrl, messageId, conversationId });
      setImagedSaved(false);
    } catch (error) {
      console.error('Unsave image failed:', error);
    }
  };

  onMount(() => {
    if (botMessageEl) {
      botMessageEl.innerHTML = props.message;
      botMessageEl.querySelectorAll('a').forEach((link: any) => {
        link.target = '_blank';
      });
      botMessageEl.querySelectorAll('strong').forEach((strong: any) => {
        strong.className = 'text-white';
      });
      botMessageEl.querySelectorAll('img').forEach((img: any) => {
        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'image-wrapper';

        wrapperDiv.appendChild(img.cloneNode(true));

        const imgInsideWrapper = wrapperDiv.querySelector('img');
        if (imgInsideWrapper) {
          imgInsideWrapper.onload = () => {
            displayMintButtons(wrapperDiv, props);
          };
        }

        img.parentNode.replaceChild(wrapperDiv, img);
      });

      if (props.fileAnnotations && props.fileAnnotations.length) {
        for (const annotations of props.fileAnnotations) {
          const button = document.createElement('button');
          button.textContent = annotations.fileName;
          button.className =
            'py-2 mb-2 justify-center font-semibold text-white focus:outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 transition-all filter hover:brightness-90 active:brightness-75 file-annotation-button';
          button.addEventListener('click', function () {
            downloadFile(annotations);
          });
          const svgContainer = document.createElement('div');
          svgContainer.className = 'ml-2';
          svgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-download" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>`;

          button.appendChild(svgContainer);
          botMessageEl.appendChild(button);
        }
      }
    }
  });

  function displayMintButtons(wrapper: any, props: Props) {
    const leftMintButtonContainer = document.createElement('div');
    leftMintButtonContainer.className = 'mint-button-container';
    leftMintButtonContainer.style.position = 'absolute';
    leftMintButtonContainer.style.bottom = '5px';
    leftMintButtonContainer.style.left = '5px';

    const rightMintButtonContainer = document.createElement('div');
    rightMintButtonContainer.className = 'save-button-container';
    rightMintButtonContainer.style.position = 'absolute';
    rightMintButtonContainer.style.bottom = '5px';

    const mintIconLeft = document.createElement('img');
    mintIconLeft.src = 'https://res.cloudinary.com/dwc808l7t/image/upload/v1713262197/game-launcher/some-mint-icon_rk0pma.svg';
    mintIconLeft.alt = 'mint-icon-left';

    const mintButtonLeft = document.createElement('button');
    mintButtonLeft.textContent = 'MINT NFT';
    mintButtonLeft.className = 'mint-button';

    mintButtonLeft.onclick = () => {
      mintButtonLeft.disabled = true;
      leftMintButtonContainer.classList.add('disabled');

      onClickHandler(wrapper?.children[0].currentSrc || null, props.messageId);

      setTimeout(() => {
        mintButtonLeft.disabled = false;
        leftMintButtonContainer.classList.remove('disabled');
      }, 10000);
    };

    const saveIcon = document.createElement('img');
    saveIcon.className = 'mint-button';
    saveIcon.src = imagedSaved() ? '/saved-image.svg' : '/save-image.svg';
    saveIcon.alt = 'save-icon';

    const handleSaveClick = async () => {
      const saveState = !imagedSaved();
      setImagedSaved(saveState);
      saveIcon.src = saveState ? '/saved-image.svg' : '/save-image.svg';

      if (saveState) {
        await onSaveImageHandler(wrapper?.children[0].currentSrc || null, props.messageId);
      } else {
        await onUnsaveImageHandler({ messageId: props.messageId, conversationId: props.chatId });
      }

      await updateConversationById({
        conversationId: props.chatId,
        saveImage: saveState,
        messageId: props.messageId,
        walletAddress: props.walletAddress,
        baseUrl: props.chatBotBEUrl,
      });
    };

    saveIcon.onclick = handleSaveClick;

    rightMintButtonContainer.appendChild(saveIcon);

    leftMintButtonContainer.appendChild(mintIconLeft);
    leftMintButtonContainer.appendChild(mintButtonLeft);

    wrapper.style.position = 'relative';
    wrapper.appendChild(leftMintButtonContainer);
    wrapper.appendChild(rightMintButtonContainer);
  }

  return (
    <div
      class="flex flex-row items-start lg:mr-5 md:mr-5 justify-start mb-2 bg-[#272727] p-4 rounded-xl host-container"
    >
      <Show when={true}>
        <>
          <Avatar initialAvatarSrc={'/ai-avatar.svg'} />
          {props.role === 'assistant' && props.message === '' && props.loading() && props.index() === props.messages().length - 1 && (
            <LoadingBubble />
          )}
        </>
      </Show>
      {props.message && (
        <div style={{ position: 'relative', 'padding-left': '12px' }}>
          <p class="text-[16px] font-semibold">AImagine</p>
          <span
            ref={botMessageEl}
            class="py-2 max-w-full chatbot-host-bubble prose"
            data-testid="host-bubble"
            style={{
              'max-width': '100%',
              color: 'white',
              display: 'inline',
              'border-radius': '6px',
              'font-size': props.fontSize ? `${props.fontSize}px` : `${defaultFontSize}`,
            }}
          />
        </div>
      )}
    </div>
  );
};
