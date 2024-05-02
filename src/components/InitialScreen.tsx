import { For } from 'solid-js';

const boxPropsData = [
  {
    label: 'What is AImagine?',
    icon: '/question-mark.svg',
  },
  {
    label: 'What are Creator Pools?',
    icon: '/question-mark.svg',
  },
  {
    label: 'Generate a picture of a whale holding Bitcoin',
    icon: '/generate-image.svg',
  },
  {
    label: 'Where can I find $AIMG Tokenomics?',
    icon: '/question-mark.svg',
  },
];

interface IPredefinedPromptsProps {
  onPredefinedPromptClick: any;
}

export const InitialScreen = (props: IPredefinedPromptsProps) => {
  return (
    <div class="mt-8 flex w-full h-screen flex-col items-center gap-4 lg:m-auto lg:w-12/12">
      <img src="/stars.svg" width={70} height={70} alt="starts" />
      <p class="bg-gradient-to-r from-[#FF4646] via-[#FF7246] to-[#FECE00] bg-clip-text text-center text-[28px] font-bold text-transparent lg:text-[32px]">
        Hello! I&apos;m AImagine Creator Tool assistant.
      </p>
      <p class="max-w-[600px] text-center text-sm text-white">
        I&apos;m here to bring your imagination to life, transforming your words into stunning visuals. Whether it&apos;s a serene landscape, a
        bustling cityscape, or something entirely unique, just describe your vision and let me craft the perfect image for you.
      </p>
      <p class="text-sm font-extrabold">Ready to get started?</p>
      <div class="mt-6 grid lg:grid-cols-4 gap-2 lg:flex lg:justify-center grid-cols-2">
        <For each={boxPropsData}>
          {({ label, icon }) => {
            return <PredefinedPrompts onPredefinedPromptClick={props.onPredefinedPromptClick} label={label} icon={icon} />;
          }}
        </For>
      </div>
    </div>
  );
};

interface PredefinedPromptsProps {
  label: string;
  icon: string;
  onPredefinedPromptClick: any;
}

function PredefinedPrompts(props: PredefinedPromptsProps) {
  return (
    <div
      onClick={() => props.onPredefinedPromptClick(props.label)}
      class="relative flex h-[174px] lg:h-[209px] w-[170px] md:w-[308px] lg:w-[220px] cursor-pointer rounded-2xl bg-[#272727] p-4 hover:border hover:border-red-500"
    >
      <p>{props.label}</p>
      <img class="absolute bottom-3 right-3" src={props.icon} width={30} height={30} alt="Prompt Image" />
    </div>
  );
}
