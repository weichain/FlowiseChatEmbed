import { Accessor, Show, createSignal, onMount } from 'solid-js';
import { Avatar } from '../avatars/Avatar';
import { Marked } from '@ts-stack/markdown';
import { FeedbackRatingType, sendFeedbackQuery, sendFileDownloadQuery, updateFeedbackQuery } from '@/queries/sendMessageQuery';
import { MessageType } from '../Bot';
import { CopyToClipboardButton, ThumbsDownButton, ThumbsUpButton } from '../buttons/FeedbackButtons';
import FeedbackContentDialog from '../FeedbackContentDialog';
import { LoadingBubble } from './LoadingBubble';

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

const defaultBackgroundColor = '#f7f8ff';
const defaultTextColor = '#303235';
const defaultFontSize = 16;

Marked.setOptions({ isNoP: true });

export const BotBubble = (props: Props) => {
  let botMessageEl: any;
  const [rating, setRating] = createSignal('');
  const [feedbackId, setFeedbackId] = createSignal('');
  const [showFeedbackContentDialog, setShowFeedbackContentModal] = createSignal(false);

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

  const copyMessageToClipboard = async () => {
    try {
      const text = botMessageEl ? botMessageEl?.textContent : '';
      await navigator.clipboard.writeText(text || '');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const onThumbsUpClick = async () => {
    if (rating() === '') {
      const body = {
        chatflowid: props.chatflowid,
        chatId: props.chatId,
        messageId: props.message?.messageId as string,
        rating: 'THUMBS_UP' as FeedbackRatingType,
        content: '',
      };
      const result = await sendFeedbackQuery({
        chatflowid: props.chatflowid,
        apiHost: props.apiHost,
        body,
      });

      if (result.data) {
        const data = result.data as any;
        let id = '';
        if (data && data.id) id = data.id;
        setRating('THUMBS_UP');
        setFeedbackId(id);
        setShowFeedbackContentModal(true);
      }
    }
  };

  const onThumbsDownClick = async () => {
    if (rating() === '') {
      const body = {
        chatflowid: props.chatflowid,
        chatId: props.chatId,
        messageId: props.message?.messageId as string,
        rating: 'THUMBS_DOWN' as FeedbackRatingType,
        content: '',
      };
      const result = await sendFeedbackQuery({
        chatflowid: props.chatflowid,
        apiHost: props.apiHost,
        body,
      });

      if (result.data) {
        const data = result.data as any;
        let id = '';
        if (data && data.id) id = data.id;
        setRating('THUMBS_DOWN');
        setFeedbackId(id);
        setShowFeedbackContentModal(true);
      }
    }
  };

  const onClickHandler = async (text: any) => {
    if (props.onMintHandler) {
      return props.onMintHandler(text);
    }
  };

  const onSaveImageHandler = async (text: any) => {
    if (props.onSaveHandler) {
      return props.onSaveHandler(text);
    }
  };

  const submitFeedbackContent = async (text: string) => {
    const body = {
      content: text,
    };
    const result = await updateFeedbackQuery({
      id: feedbackId(),
      apiHost: props.apiHost,
      body,
    });

    if (result.data) {
      setFeedbackId('');
      setShowFeedbackContentModal(false);
    }
  };

  onMount(() => {
    if (botMessageEl) {
      botMessageEl.innerHTML = Marked.parse(props.message.message);
      botMessageEl.querySelectorAll('a').forEach((link: any) => {
        link.target = '_blank';
      });
      botMessageEl.querySelectorAll('img').forEach((img: any) => {
        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'image-wrapper';

        wrapperDiv.appendChild(img.cloneNode(true));

        img.parentNode.replaceChild(wrapperDiv, img);

        const imgInsideWrapper = wrapperDiv.querySelector('img');
        if (imgInsideWrapper) {
          imgInsideWrapper.onload = () => {
            displayMintButtons(wrapperDiv); // Pass the wrapperDiv to displayMintButton
          };
        }
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

  function displayMintButtons(wrapper: any) {
    const leftMintButtonContainer = document.createElement('div');
    leftMintButtonContainer.className = 'mint-button-container';
    leftMintButtonContainer.style.position = 'absolute';
    leftMintButtonContainer.style.bottom = '5px';
    leftMintButtonContainer.style.left = '5px';

    const rightMintButtonContainer = document.createElement('div');
    rightMintButtonContainer.className = 'save-button-container';
    rightMintButtonContainer.style.position = 'absolute';

    const mintIconLeft = document.createElement('img');
    mintIconLeft.src = 'https://res.cloudinary.com/dwc808l7t/image/upload/v1713262197/game-launcher/some-mint-icon_rk0pma.svg';
    mintIconLeft.alt = 'mint-icon-left';

    const mintButtonLeft = document.createElement('button');
    mintButtonLeft.textContent = 'MINT NFT';
    mintButtonLeft.className = 'mint-button';

    mintButtonLeft.onclick = () => {
      mintButtonLeft.disabled = true;
      leftMintButtonContainer.classList.add('disabled');

      onClickHandler(wrapper?.children[0].currentSrc || null);

      setTimeout(() => {
        mintButtonLeft.disabled = false;
        leftMintButtonContainer.classList.remove('disabled');
      }, 10000);
    };

    const mintIconRight1 = document.createElement('img');
    mintIconRight1.src = '/save-image.svg';
    mintIconRight1.alt = 'save-icon';

    mintIconRight1.onclick = () => {
      onSaveImageHandler(wrapper?.children[0].currentSrc || null);
    };

    const mintButtonRight = document.createElement('button');
    mintButtonRight.className = 'mint-button';

    leftMintButtonContainer.appendChild(mintIconLeft);
    leftMintButtonContainer.appendChild(mintButtonLeft);

    rightMintButtonContainer.appendChild(mintIconRight1);
    rightMintButtonContainer.appendChild(mintButtonRight);

    wrapper.style.position = 'relative';
    wrapper.appendChild(leftMintButtonContainer);
    wrapper.appendChild(rightMintButtonContainer);
  }

  return (
    <div
      class="flex flex-row justify-start mb-2 bg-[#272727] p-4 rounded-xl host-container"
      style={{ 'margin-right': '20px', 'align-items': 'start' }}
    >
      <Show when={true}>
        <>
          <Avatar initialAvatarSrc={'/ai-avatar.svg'} />
          {props.message.type === 'apiMessage' &&
            props.message.message === '' &&
            props.loading() &&
            props.index() === props.messages().length - 1 && <LoadingBubble />}
        </>
      </Show>
      {props.message.message && (
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
      {props.chatFeedbackStatus && props.message.messageId && (
        <>
          <div class="flex items-center px-2">
            <CopyToClipboardButton onClick={() => copyMessageToClipboard()} />
            {rating() === '' || rating() === 'THUMBS_UP' ? (
              <ThumbsUpButton isDisabled={rating() === 'THUMBS_UP'} rating={rating()} onClick={onThumbsUpClick} />
            ) : null}
            {rating() === '' || rating() === 'THUMBS_DOWN' ? (
              <ThumbsDownButton isDisabled={rating() === 'THUMBS_DOWN'} rating={rating()} onClick={onThumbsDownClick} />
            ) : null}
          </div>
          <Show when={showFeedbackContentDialog()}>
            <FeedbackContentDialog
              isOpen={showFeedbackContentDialog()}
              onClose={() => setShowFeedbackContentModal(false)}
              onSubmit={submitFeedbackContent}
              backgroundColor={props.backgroundColor}
              textColor={props.textColor}
            />
          </Show>
        </>
      )}
    </div>
  );
};
