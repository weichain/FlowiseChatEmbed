import { For } from 'solid-js';
import { TrashIcon } from './icons';

interface IPreviewProps {
  previews: any;
  handleDeletePreview: any;
}

export const Previews = (props: IPreviewProps) => {
  return (
    <div class="w-full flex items-center justify-start gap-2 px-5 pt-2">
      <For each={[...props.previews()]}>
        {(item) => (
          <>
            {item.mime.startsWith('image/') ? (
              <button
                class="group w-9 h-9 flex items-center justify-center relative rounded-[10px] transition-colors duration-200"
                onClick={() => props.handleDeletePreview(item)}
              >
                <img class="w-full h-full bg-cover rounded-md" src={item.data as string} />
                <span class="absolute flex items-center justify-center z-40 w-3 h-3 top-[-5px] right-[-5px] border border-[#606060] bg-black rounded-full transition-colors duration-200">
                  <img src="/delete-preview.svg" />
                </span>
              </button>
            ) : (
              <div class={`inline-flex basis-auto flex-grow-0 flex-shrink-0 justify-between items-center rounded-xl h-12 p-1 mr-1 bg-gray-500`}>
                <audio class="block bg-cover bg-center w-full h-full rounded-none text-transparent" controls src={item.data as string} />
                <button class="w-7 h-7 flex items-center justify-center bg-transparent p-1" onClick={() => props.handleDeletePreview(item)}>
                  <TrashIcon color="#ffffff" />
                </button>
              </div>
            )}
          </>
        )}
      </For>
    </div>
  );
};
