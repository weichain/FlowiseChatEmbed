/* eslint-disable no-constant-condition */
import { createSignal, createEffect, For, Show, mergeProps } from 'solid-js';
import { sendMessageQuery } from '@/queries/sendMessageQuery';
import { TextInput } from './inputs/textInput';
import { GuestBubble } from './bubbles/GuestBubble';
import { BotBubble } from './bubbles/BotBubble';
import { LoadingBubble } from './bubbles/LoadingBubble';
import { BotMessageTheme, TextInputTheme, UserMessageTheme } from '@/features/bubble/types';
import { SendButton } from '@/components/buttons/SendButton';
import { CircleDotIcon } from './icons';
import { CancelButton } from './buttons/CancelButton';
import { cancelAudioRecording, startAudioRecording, stopAudioRecording } from '@/utils/audioRecording';
import { InitialScreen } from './InitialScreen';
import { Previews } from './Previews';
import { getChatById } from '@/queries/conversations';

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

type messageType = 'assistant' | 'user';

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
  onMintHandler: any;
  isMintButtonDisabled: boolean;
  walletAddress: string;
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
  chatId: string;
};

const defaultWelcomeMessage = 'Hi there! How can I help?';

const defaultBackgroundColor = '#363636';
const defaultTextColor = '#303235';

export const Bot = (botProps: BotProps & { class?: string }) => {
  // set a default value for showTitle if not set and merge with other props
  const props = mergeProps({ showTitle: true }, botProps);
  let chatContainer: HTMLDivElement | undefined;
  let botContainer: HTMLDivElement | undefined;

  const [userInput, setUserInput] = createSignal('');

  const [loading, setLoading] = createSignal(false);
  const [messages, setMessages] = createSignal<any>([]);
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

  createEffect(() => {
    const fetchChats = async () => {
      if (props.chatId) {
        const result = await getChatById({ conversationId: props.chatId, walletAddress: props.walletAddress, baseUrl: props.chatBotBEUrl });
        if (result.data) {
          setShowInitialScreen(false);
          setMessages(result.data.messages || []);
          localStorage.setItem(`${props.chatflowid}_EXTERNAL`, JSON.stringify({ chatId: props.chatId, chatHistory: result.data.messages }));
        } else {
          setShowInitialScreen(true);
          setMessages([]);
          localStorage.setItem(`${props.chatflowid}_EXTERNAL`, JSON.stringify({ chatId: props.chatId, chatHistory: [] }));
        }
      } else {
        setShowInitialScreen(true);
        setMessages([]);
        localStorage.setItem(`${props.chatflowid}_EXTERNAL`, JSON.stringify({ chatId: props.chatId, chatHistory: [] }));
      }
    };

    fetchChats();
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      chatContainer?.scrollTo(0, chatContainer.scrollHeight);
    }, 50);
  };

  const addChatMessage = (allMessage: MessageType[]) => {
    localStorage.setItem(`${props.chatflowid}_EXTERNAL`, JSON.stringify({ chatId: props.chatId, chatHistory: allMessage }));
  };

  const updateLastMessage = (text: string, messageId?: string) => {
    setMessages((data) => {
      const updated = data.map((item: any, i: any) => {
        if (i === data.length - 1) {
          return { ...item, content: text, _id: messageId };
        }
        return item;
      });

      addChatMessage(updated);
      return [...updated];
    });
  };

  const updateUserMessageWithImageUrl = (prevMessages: any[], imageUrl: string) => {
    return prevMessages.map((item: any, i: any) => {
      if (i === prevMessages.length - 2 && item.role === 'user') {
        // Check length - 2 for the user message
        return { ...item, userUploadedImageUrl: imageUrl };
      }
      return item;
    });
  };

  const clearPreviews = () => {
    previews().forEach((file) => URL.revokeObjectURL(file.preview));
    setPreviews([]);
  };

  // Handle errors
  const handleError = (message = 'Oops! There seems to be an error. Please try again.') => {
    setMessages((prevMessages) => {
      const messages: MessageType[] = [...prevMessages, { message, type: 'assistant' }];
      addChatMessage(messages);
      return messages;
    });
    setLoading(false);
    setUserInput('');
    scrollToBottom();
  };

  // Handle form submission
  const handleSubmit = async (value: string) => {
    setShowInitialScreen(false);
    setUserInput(value);

    // if (value.trim() === '') {
    //   const containsAudio = previews().filter((item) => item.type === 'audio').length > 0;
    //   if (!(previews().length >= 1 && containsAudio)) {
    //     return;
    //   }
    // }

    setLoading(true);
    scrollToBottom();

    // Send user question and history to API
    const welcomeMessage = props.welcomeMessage ?? defaultWelcomeMessage;
    const messageList = messages().filter((msg: any) => msg.message !== welcomeMessage);

    const urls = previews().map((item) => {
      return {
        data: item.data,
        type: item.type,
        name: item.name,
        mime: item.mime,
      };
    });

    setMessages((prevMessages) => {
      const newMessage: any = { content: value, role: 'user' };

      if (urls && urls.length > 0) {
        newMessage.userUploadedImageUrl = urls[0].data;
      }

      const messages: MessageType[] = [...prevMessages, newMessage];
      addChatMessage(messages);

      return messages;
    });

    let body;
    const formData = new FormData();

    if (value !== undefined) {
      formData.append('text', value);
    }

    const fileData = fileToUpload();

    if (fileData) {
      if (value !== undefined) {
        fileData.append('text', value);
      }

      if (props.chatId) {
        fileData.append('convId', props.chatId);
      }
      body = fileData;
      setFileToUpload(null);
    } else {
      if (props.chatId) {
        formData.append('convId', props.chatId);
      }
      body = formData;
    }
    clearPreviews();

    setMessages((prevMessages) => [...prevMessages, { content: '', role: 'assistant' }]);

    const result = await sendMessageQuery({
      body,
      baseUrl: props.chatBotBEUrl,
      isConvNew: props.chatId ? false : true,
    });

    if (result.data?.data) {
      const data = result.data.data;
      const question = data;

      window.history.replaceState(null, '', `${window.location.pathname}?chatId=${result.data.conversationId}`);
      updateLastMessage(question, result.data.messageId);
      if (result.data.userUploadedImageUrl) {
        const updatedMessages = updateUserMessageWithImageUrl(messages(), result.data.userUploadedImageUrl);
        setMessages(updatedMessages);
        addChatMessage(updatedMessages);
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

  createEffect(() => {
    if (messages()) scrollToBottom();
  });

  createEffect(() => {
    if (props.fontSize && botContainer) botContainer.style.fontSize = `${props.fontSize}px`;
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

  const onPredefinedPromptClick = (prompt: string) => {
    handleSubmit(prompt);
    setShowInitialScreen(false);
  };

  return (
    <>
      {showInitialScreen() ? (
        <div class="flex w-full h-screen chatbot-container flex-col items-center gap-4 pb-2">
          <InitialScreen onPredefinedPromptClick={onPredefinedPromptClick} />
          <div class="lg:absolute lg:bottom-3 lg:m-auto px-2 pb-1 w-full lg:w-6/12">
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
          class={'relative flex w-full h-fit pb-2 max-w-5xl text-base overflow-hidden bg-cover bg-center flex-col items-center ' + props.class}
        >
          <div class="flex flex-col w-full h-full justify-start z-0 pb-2 chatbot-container">
            <div
              ref={chatContainer}
              class="overflow-y-scroll overflow-x-hidden flex flex-col flex-grow min-w-full w-full px-3 lg:mt-[30px] md:mt-[30px] relative scrollable-container chatbot-chat-view scroll-smooth"
            >
              <For each={[...messages()]}>
                {(message: any, index) => {
                  return (
                    <>
                      {message.role === 'user' && (
                        <GuestBubble
                          messages={messages}
                          message={message.content}
                          userUploadedImageUrl={message.userUploadedImageUrl}
                          apiHost={props.apiHost}
                          chatflowid={props.chatflowid}
                          chatId={props.chatId}
                          backgroundColor={props.userMessage?.backgroundColor}
                          textColor={props.userMessage?.textColor}
                          showAvatar={props.userMessage?.showAvatar}
                          avatarSrc={props.userMessage?.avatarSrc}
                          fontSize={props.fontSize}
                        />
                      )}
                      {message.role === 'assistant' && (
                        <BotBubble
                          baseUrl={props.chatBotBEUrl}
                          chatBotBEUrl={props.chatBotBEUrl}
                          role={message.role}
                          createdAt={message.createdAt}
                          walletAddress={props.walletAddress}
                          messageId={message._id}
                          imagedSaved={message.imageSaved}
                          loading={loading}
                          index={index}
                          messages={messages}
                          isMintButtonDisabled={props.isMintButtonDisabled}
                          onMintHandler={props.onMintHandler}
                          message={message.content}
                          fileAnnotations={message.fileAnnotations}
                          chatflowid={props.chatflowid}
                          chatId={props.chatId}
                          apiHost={props.apiHost}
                          backgroundColor={props.botMessage?.backgroundColor}
                          textColor={props.botMessage?.textColor}
                          showAvatar={props.botMessage?.showAvatar}
                          avatarSrc={props.botMessage?.avatarSrc}
                          fontSize={props.fontSize}
                        />
                      )}
                      {message.role === 'user' && loading() && index() === messages().length - 1 && <LoadingBubble />}
                    </>
                  );
                }}
              </For>
            </div>
            <div class="w-full pr-[11px] md:pr-7 pl-3 lg:pr-7">
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
                <div>
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
                </div>
              )}
            </div>
            <Show when={previews().length > 0}>
              <div class="w-full flex items-center justify-start gap-2 pr-[28px] pl-[12px]">
                <Previews previews={previews} handleDeletePreview={handleDeletePreview} />
              </div>
            </Show>
          </div>
        </div>
      )}
    </>
  );
};
