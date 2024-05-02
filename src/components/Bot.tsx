/* eslint-disable no-constant-condition */
import { createSignal, createEffect, For, onMount, Show, mergeProps, on, createMemo } from 'solid-js';
import { v4 as uuidv4 } from 'uuid';
import { sendMessageQuery } from '@/queries/sendMessageQuery';
import { TextInput } from './inputs/textInput';
import { GuestBubble } from './bubbles/GuestBubble';
import { BotBubble } from './bubbles/BotBubble';
import { LoadingBubble } from './bubbles/LoadingBubble';
import { BotMessageTheme, TextInputTheme, UserMessageTheme } from '@/features/bubble/types';
import { Badge } from './Badge';
import { SendButton } from '@/components/buttons/SendButton';
import { CircleDotIcon } from './icons';
import { CancelButton } from './buttons/CancelButton';
import { cancelAudioRecording, startAudioRecording, stopAudioRecording } from '@/utils/audioRecording';
import { InitialScreen } from './InitialScreen';
import { Previews } from './Previews';

export type FileEvent<T = EventTarget> = {
  target: T;
};

type ImageUploadConstraits = {
  fileTypes: string[];
  maxUploadSize: number;
};

export type UploadsConfig = {
  imgUploadSizeAndTypes: ImageUploadConstraits[];
  isImageUploadAllowed: boolean;
  isSpeechToTextEnabled: boolean;
};

type FilePreviewData = string | ArrayBuffer;

type FilePreview = {
  data: FilePreviewData;
  mime: string;
  name: string;
  preview: string;
  type: string;
};

type messageType = 'apiMessage' | 'userMessage' | 'usermessagewaiting';

export type FileUpload = Omit<FilePreview, 'preview'>;

export type MessageType = {
  messageId?: string;
  message: string;
  type: messageType;
  sourceDocuments?: any;
  fileAnnotations?: any;
  fileUploads?: Partial<FileUpload>[];
};

type observerConfigType = (accessor: string | boolean | object | MessageType[]) => void;
export type observersConfigType = Record<'observeUserInput' | 'observeLoading' | 'observeMessages', observerConfigType>;

export type BotProps = {
  authToken: string;
  onMintHandler: (input: string) => void;
  isMintButtonDisabled: boolean;
  chatflowid: string;
  apiHost?: string;
  chatBotBEUrl: string;
  chatflowConfig?: Record<string, unknown>;
  welcomeMessage?: string;
  botMessage?: BotMessageTheme;
  userMessage?: UserMessageTheme;
  textInput?: TextInputTheme;
  poweredByTextColor?: string;
  badgeBackgroundColor?: string;
  bubbleBackgroundColor?: string;
  bubbleTextColor?: string;
  showTitle?: boolean;
  title?: string;
  titleAvatarSrc?: string;
  fontSize?: number;
  isFullPage?: boolean;
  observersConfig?: observersConfigType;
};

const defaultWelcomeMessage = 'Hi there! How can I help?';

const defaultBackgroundColor = '#ffffff';
const defaultTextColor = '#303235';

export const Bot = (botProps: BotProps & { class?: string }) => {
  // set a default value for showTitle if not set and merge with other props
  const props = mergeProps({ showTitle: true }, botProps);
  let chatContainer: HTMLDivElement | undefined;
  let bottomSpacer: HTMLDivElement | undefined;
  let botContainer: HTMLDivElement | undefined;

  const [userInput, setUserInput] = createSignal('');

  const [loading, setLoading] = createSignal(false);
  const [messages, setMessages] = createSignal<MessageType[]>([]);
  const [isChatFlowAvailableToStream, setIsChatFlowAvailableToStream] = createSignal(false);
  const [chatId, setChatId] = createSignal(uuidv4());
  const [chatFeedbackStatus, setChatFeedbackStatus] = createSignal<boolean>(false);
  const [uploadsConfig, setUploadsConfig] = createSignal<UploadsConfig>();
  const [showInitialScreen, setShowInitialScreen] = createSignal<boolean>(false);
  const [fileToUpload, setFileToUpload] = createSignal<any>();

  // drag & drop file input
  const [previews, setPreviews] = createSignal<FilePreview[]>([]);

  // audio recording
  const [elapsedTime, setElapsedTime] = createSignal('00:00');
  const [isRecording, setIsRecording] = createSignal(false);
  const [recordingNotSupported, setRecordingNotSupported] = createSignal(false);
  const [isLoadingRecording, setIsLoadingRecording] = createSignal(false);

  onMount(() => {
    if (botProps?.observersConfig) {
      const { observeUserInput, observeLoading, observeMessages } = botProps.observersConfig;
      typeof observeUserInput === 'function' &&
        // eslint-disable-next-line solid/reactivity
        createMemo(() => {
          observeUserInput(userInput());
        });
      typeof observeLoading === 'function' &&
        // eslint-disable-next-line solid/reactivity
        createMemo(() => {
          observeLoading(loading());
        });
      typeof observeMessages === 'function' &&
        // eslint-disable-next-line solid/reactivity
        createMemo(() => {
          observeMessages(messages());
        });
    }

    if (!bottomSpacer) return;
    setTimeout(() => {
      chatContainer?.scrollTo(0, chatContainer.scrollHeight);
    }, 50);
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      chatContainer?.scrollTo(0, chatContainer.scrollHeight);
    }, 50);
  };

  const addChatMessage = (allMessage: MessageType[]) => {
    localStorage.setItem(`${props.chatflowid}_EXTERNAL`, JSON.stringify({ chatId: chatId(), chatHistory: allMessage }));
  };

  const updateLastMessage = (text: string, messageId: string, sourceDocuments: any = null, fileAnnotations: any = null) => {
    setMessages((data) => {
      const updated = data.map((item, i) => {
        if (i === data.length - 1) {
          return { ...item, message: item.message + text, messageId, sourceDocuments, fileAnnotations };
        }
        return item;
      });

      addChatMessage(updated);
      return [...updated];
    });
  };
  const clearPreviews = () => {
    // Revoke the data uris to avoid memory leaks
    previews().forEach((file) => URL.revokeObjectURL(file.preview));
    setPreviews([]);
  };

  // Handle errors
  const handleError = (message = 'Oops! There seems to be an error. Please try again.') => {
    setMessages((prevMessages) => {
      const messages: MessageType[] = [...prevMessages, { message, type: 'apiMessage' }];
      addChatMessage(messages);
      return messages;
    });
    setLoading(false);
    setUserInput('');
    scrollToBottom();
  };

  const promptClick = (prompt: string) => {
    handleSubmit(prompt);
  };

  // Handle form submission
  const handleSubmit = async (value: string) => {
    setShowInitialScreen(false);
    setUserInput(value);

    if (value.trim() === '') {
      const containsAudio = previews().filter((item) => item.type === 'audio').length > 0;
      if (!(previews().length >= 1 && containsAudio)) {
        return;
      }
    }

    setLoading(true);
    scrollToBottom();

    // Send user question and history to API
    const welcomeMessage = props.welcomeMessage ?? defaultWelcomeMessage;
    const messageList = messages().filter((msg) => msg.message !== welcomeMessage);

    const urls = previews().map((item) => {
      return {
        data: item.data,
        type: item.type,
        name: item.name,
        mime: item.mime,
      };
    });

    let body;
    if (fileToUpload()) {
      body = fileToUpload();
      setFileToUpload(null);
    } else {
      const formData = new FormData();
      formData.append('text', value);
      body = formData;
    }

    clearPreviews();

    setMessages((prevMessages) => [...prevMessages, { message: '', type: 'apiMessage' }]);

    const result = await sendMessageQuery({
      apiHost: 'interact-with-llm/',
      body,
      authToken: props.authToken,
      chatBotBEUrl: props.chatBotBEUrl,
    });

    if (result.data?.image_html) {
      const image = result.data?.image_html;
      updateLastMessage(image, uuidv4());
      setUserInput('');
      setLoading(false);
      scrollToBottom();
    }

    if (result.data?.response) {
      const data = result.data;

      const question = data.response;

      if (value === '' && question) {
        setMessages((data) => {
          const messages = data.map((item, i) => {
            if (i === data.length - 2) {
              return { ...item, message: question };
            }
            return item;
          });
          addChatMessage(messages);
          return [...messages];
        });
      }
      if (urls && urls.length > 0) {
        setMessages((data) => {
          const messages = data.map((item, i) => {
            if (i === data.length - 2) {
              if (item.fileUploads) {
                const fileUploads = item?.fileUploads.map((file) => ({
                  type: file.type,
                  name: file.name,
                  mime: file.mime,
                }));
                return { ...item, fileUploads };
              }
            }
            return item;
          });
          addChatMessage(messages);
          return [...messages];
        });
      }
      if (!isChatFlowAvailableToStream()) {
        let text = '';
        if (data.response) text = data.response;
        else if (data.json) text = JSON.stringify(data.json, null, 2);
        else text = JSON.stringify(data, null, 2);

        updateLastMessage(text, data?.chatMessageId, data?.sourceDocuments, data?.fileAnnotations);
      } else {
        updateLastMessage(question, data?.chatMessageId, data?.sourceDocuments, data?.fileAnnotations);
      }
      setLoading(false);
      setUserInput('');
      scrollToBottom();
    }
    if (result.error) {
      const error = result.error;
      console.error(error);
      const err: any = error;
      const errorData = typeof err === 'string' ? err : err.response.data || `${err.response.status}: ${err.response.statusText}`;
      handleError(errorData);
      return;
    }
  };

  // Auto scroll chat to bottom
  createEffect(() => {
    if (messages()) scrollToBottom();
  });

  createEffect(() => {
    if (props.fontSize && botContainer) botContainer.style.fontSize = `${props.fontSize}px`;
  });

  // eslint-disable-next-line solid/reactivity
  createEffect(async () => {
    const chatMessage = localStorage.getItem(`${props.chatflowid}_EXTERNAL`);
    if (chatMessage) {
      const objChatMessage = JSON.parse(chatMessage);
      setChatId(objChatMessage.chatId);
      const loadedMessages = objChatMessage.chatHistory.map((message: MessageType) => {
        const chatHistory: MessageType = {
          messageId: message?.messageId,
          message: message.message,
          type: message.type,
        };
        if (message.sourceDocuments) chatHistory.sourceDocuments = message.sourceDocuments;
        if (message.fileAnnotations) chatHistory.fileAnnotations = message.fileAnnotations;
        if (message.fileUploads) chatHistory.fileUploads = message.fileUploads;
        return chatHistory;
      });

      setMessages([...loadedMessages]);
    }

    // eslint-disable-next-line solid/reactivity
    return () => {
      setUserInput('');
      setLoading(false);
      setMessages([
        {
          message: props.welcomeMessage ?? defaultWelcomeMessage,
          type: 'apiMessage',
        },
      ]);
    };
  });

  createEffect(() => {
    const chatMessage = localStorage.getItem(`${props.chatflowid}_EXTERNAL`);
    if (!chatMessage) {
      setShowInitialScreen(true);
    }
  });

  const addRecordingToPreviews = (blob: Blob) => {
    const mimeType = blob.type.substring(0, blob.type.indexOf(';'));
    // read blob and add to previews
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result as FilePreviewData;
      const upload: FilePreview = {
        data: base64data,
        preview: '../assets/wave-sound.jpg',
        type: 'audio',
        name: 'audio.wav',
        mime: mimeType,
      };
      setPreviews((prevPreviews) => [...prevPreviews, upload]);
    };
  };

  const handleFileChange = async (event: FileEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const formData = new FormData();
    formData.append('file', event.target.files[0]);
    setFileToUpload(formData);

    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    const { name } = file;

    const newFile = await new Promise<FilePreview>((resolve) => {
      reader.onload = (evt) => {
        if (!evt?.target?.result) {
          return;
        }
        const { result } = evt.target;
        resolve({
          data: result,
          preview: URL.createObjectURL(file),
          type: 'file',
          name: name,
          mime: file.type,
        });
      };
      reader.readAsDataURL(file);
    });

    setPreviews((prevPreviews) => {
      const newPreviews = prevPreviews.slice(0, -1);
      return [...newPreviews, newFile];
    });
  };

  const handleDeletePreview = (itemToDelete: FilePreview) => {
    if (itemToDelete.type === 'file') {
      URL.revokeObjectURL(itemToDelete.preview);
    }
    setPreviews(previews().filter((item) => item !== itemToDelete));
  };

  const onMicrophoneClicked = () => {
    setIsRecording(true);
    setShowInitialScreen(false);
    startAudioRecording(setIsRecording, setRecordingNotSupported, setElapsedTime);
  };

  const onRecordingCancelled = () => {
    if (!recordingNotSupported) cancelAudioRecording();
    setIsRecording(false);
    setRecordingNotSupported(false);
  };

  const onRecordingStopped = async () => {
    setIsLoadingRecording(true);
    stopAudioRecording(addRecordingToPreviews);
  };

  createEffect(
    // listen for changes in previews
    on(previews, (uploads) => {
      // wait for audio recording to load and then send
      const containsAudio = uploads.filter((item) => item.type === 'audio').length > 0;
      if (uploads.length >= 1 && containsAudio) {
        setIsRecording(false);
        setRecordingNotSupported(false);
        promptClick('');
      }

      return () => {
        setPreviews([]);
      };
    }),
  );

  const onPredefinedPromptClick = (prompt: string) => {
    handleSubmit(prompt);
    setShowInitialScreen(false);
  };

  return (
    <>
      {showInitialScreen() ? (
        <div class="flex w-full h-screen flex-col items-center gap-4 lg:m-auto lg:w-12/12">
          <InitialScreen onPredefinedPromptClick={onPredefinedPromptClick} />
          <div class="lg:absolute lg:bottom-3 lg:m-auto mt-10 w-full lg:w-6/12">
            <TextInput
              backgroundColor={props.textInput?.backgroundColor}
              textColor={props.textInput?.textColor}
              placeholder={props.textInput?.placeholder}
              sendButtonColor={props.textInput?.sendButtonColor}
              fontSize={props.fontSize}
              disabled={loading()}
              previews={previews}
              defaultValue={userInput()}
              onSubmit={handleSubmit}
              uploadsConfig={uploadsConfig()}
              setPreviews={setPreviews}
              onMicrophoneClicked={onMicrophoneClicked}
              handleFileChange={handleFileChange}
            />
            <Show when={previews().length > 0}>
              <Previews previews={previews} handleDeletePreview={handleDeletePreview} />
            </Show>
          </div>
        </div>
      ) : (
        <div
          ref={botContainer}
          class={
            'relative flex w-full max-w-5xl h-full text-base overflow-hidden bg-cover bg-center flex-col items-center chatbot-container ' +
            props.class
          }
        >
          <div class="flex flex-col w-full h-full justify-start z-0">
            <div
              ref={chatContainer}
              class="overflow-y-scroll flex flex-col flex-grow min-w-full w-full px-3 pt-[12px] relative scrollable-container chatbot-chat-view scroll-smooth"
            >
              <For each={[...messages()]}>
                {(message, index) => {
                  return (
                    <>
                      {message.type === 'userMessage' && (
                        <GuestBubble
                          message={message}
                          apiHost={props.apiHost}
                          chatflowid={props.chatflowid}
                          chatId={chatId()}
                          backgroundColor={props.userMessage?.backgroundColor}
                          textColor={props.userMessage?.textColor}
                          showAvatar={props.userMessage?.showAvatar}
                          avatarSrc={props.userMessage?.avatarSrc}
                          fontSize={props.fontSize}
                        />
                      )}
                      {message.type === 'apiMessage' && (
                        <BotBubble
                          loading={loading}
                          index={index}
                          messages={messages}
                          isMintButtonDisabled={props.isMintButtonDisabled}
                          onMintHandler={props.onMintHandler}
                          message={message}
                          fileAnnotations={message.fileAnnotations}
                          chatflowid={props.chatflowid}
                          chatId={chatId()}
                          apiHost={props.apiHost}
                          backgroundColor={props.botMessage?.backgroundColor}
                          textColor={props.botMessage?.textColor}
                          showAvatar={props.botMessage?.showAvatar}
                          avatarSrc={props.botMessage?.avatarSrc}
                          chatFeedbackStatus={chatFeedbackStatus()}
                          fontSize={props.fontSize}
                        />
                      )}
                      {message.type === 'userMessage' && loading() && index() === messages().length - 1 && <LoadingBubble />}
                    </>
                  );
                }}
              </For>
            </div>
            <div class="w-full pl-3 pr-7">
              {isRecording() ? (
                <>
                  {recordingNotSupported() ? (
                    <div class="w-full flex items-center justify-between p-4">
                      <div class="w-full flex items-center justify-between gap-3">
                        <span class="text-base">To record audio, use modern browsers like Chrome or Firefox that support audio recording.</span>
                        <button
                          class="py-2 px-4 justify-center flex items-center bg-red-500 text-white rounded-md"
                          type="button"
                          onClick={() => onRecordingCancelled()}
                        >
                          Okay
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      class="h-[58px] flex items-center justify-between chatbot-input border border-[#eeeeee]"
                      data-testid="input"
                      style={{
                        margin: 'auto',
                        'background-color': props.textInput?.backgroundColor ?? defaultBackgroundColor,
                        color: props.textInput?.textColor ?? defaultTextColor,
                      }}
                    >
                      <div class="flex items-center gap-3 px-4 py-2">
                        <span>
                          <CircleDotIcon color="red" />
                        </span>
                        <span>{elapsedTime() || '00:00'}</span>
                        {isLoadingRecording() && <span class="ml-1.5">Sending...</span>}
                      </div>
                      <div class="flex items-center">
                        <CancelButton buttonColor={props.textInput?.sendButtonColor} type="button" class="m-0" on:click={onRecordingCancelled}>
                          <span style={{ 'font-family': 'Poppins, sans-serif' }}>Send</span>
                        </CancelButton>
                        <SendButton
                          sendButtonColor={props.textInput?.sendButtonColor}
                          type="button"
                          isDisabled={loading()}
                          class="m-0"
                          on:click={onRecordingStopped}
                        >
                          <span style={{ 'font-family': 'Poppins, sans-serif' }}>Send</span>
                        </SendButton>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <TextInput
                  backgroundColor={props.textInput?.backgroundColor}
                  textColor={props.textInput?.textColor}
                  placeholder={props.textInput?.placeholder}
                  sendButtonColor={props.textInput?.sendButtonColor}
                  fontSize={props.fontSize}
                  disabled={loading()}
                  previews={previews}
                  defaultValue={userInput()}
                  onSubmit={handleSubmit}
                  uploadsConfig={uploadsConfig()}
                  setPreviews={setPreviews}
                  onMicrophoneClicked={onMicrophoneClicked}
                  handleFileChange={handleFileChange}
                />
              )}
            </div>
            <Show when={previews().length > 0}>
              <div class="w-full flex items-center justify-start gap-2 pr-[28px] pl-[12px]">
                <Previews previews={previews} handleDeletePreview={handleDeletePreview} />
              </div>
            </Show>
            <Badge badgeBackgroundColor={props.badgeBackgroundColor} poweredByTextColor={props.poweredByTextColor} botContainer={botContainer} />
          </div>
        </div>
      )}
    </>
  );
};
