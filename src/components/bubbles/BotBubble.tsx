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
  onMintHandler?: (input: string) => void;
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
      if (props.fileAnnotations && props.fileAnnotations.length) {
        for (const annotations of props.fileAnnotations) {
          const button = document.createElement('button');
          button.textContent = annotations.fileName;
          button.className =
            'py-2 px-4 mb-2 justify-center font-semibold text-white focus:outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 transition-all filter hover:brightness-90 active:brightness-75 file-annotation-button';
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

  return (
    <div
      class="flex flex-row justify-start mb-2 host-container"
      style={{ 'margin-right': '20px', 'align-items': 'start' }}
    >
      <Show when={true}>
        <>
          <Avatar initialAvatarSrc={'https://res.cloudinary.com/dwc808l7t/image/upload/v1713446895/Frame_427319599_n76cev.png'} />
          {props.message.type === 'apiMessage' &&
            props.message.message === '' &&
            props.loading() &&
            props.index() === props.messages().length - 1 && <LoadingBubble />}
        </>
      </Show>
      {props.message.message && (
        <div style={{ position: 'relative' }}>
          <span
            ref={botMessageEl}
            class="px-4 py-2 ml-2 max-w-full chatbot-host-bubble prose"
            data-testid="host-bubble"
            style={{
              'max-width': `${props.message.message.startsWith('<img') ? '400px' : '100%'}`,
              color: 'white',
              display: `${props.message.message.startsWith('<img') ? 'block' : 'inline'}`,
              'border-radius': '6px',
              'font-size': props.fontSize ? `${props.fontSize}px` : `${defaultFontSize}`,
            }}
          />

          {props.message.message.startsWith('<img') && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                gap: '4px',
                'z-index': 40,
                bottom: '16px',
                left: '32px',
                background: props.isMintButtonDisabled ? '#CCCCCC' : '#FECE00',
                'border-radius': '4px',
                padding: '4px 8px 4px 8px',
                color: 'black',
                'font-weight': 'bolder',
                'font-size': '12px',
                width: '120px',
                cursor: 'pointer',
              }}
            >
              <img src="https://res.cloudinary.com/dwc808l7t/image/upload/v1713262197/game-launcher/some-mint-icon_rk0pma.svg" alt="mint-icon" />
              <button
                style={{ 'font-size': '12px', 'font-weight': '600' }}
                disabled={props.isMintButtonDisabled}
                onClick={() => onClickHandler(botMessageEl?.children[0].currentSrc || null)}
              >
                Mint as NFT
              </button>
            </div>
          )}
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
