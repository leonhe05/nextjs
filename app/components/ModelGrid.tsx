import { useState } from 'react';
import Image from 'next/image';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { SubModel } from '../data/modelConfigs'; // Import SubModel type

interface ModelGridProps {
  subModels: SubModel[];
  selectedId: string | null;
  onSelect: (id: string, name: string) => void;
  onPlayAudio: (src: string, id: string) => void;
  onPauseAudio: () => void;
  playingId: string | null;
}

export function ModelGrid({
  subModels,
  selectedId,
  onSelect,
  onPlayAudio,
  onPauseAudio,
  playingId
}: ModelGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-3 gap-3">
      {subModels.map((subModel) => {
        const isPlaying = playingId === subModel.id;
        const isHovered = hoveredId === subModel.id;

        return (
          <div
            key={subModel.id}
            onClick={() => onSelect(subModel.id, subModel.name)}
            className={`relative py-2 px-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer ${selectedId === subModel.id
                ? 'bg-gray-100'
                : 'bg-white'
              }`}
            onMouseEnter={() => setHoveredId(subModel.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div
              className="relative flex-shrink-0 w-8 h-8 rounded-full overflow-hidden"
            >
              <Image
                src={subModel.avator || '/models_avators/women1.svg'} // Ensure default path is correct
                alt="Sub-model avatar"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                priority={false} // Usually false for lists
              />
              {subModel.audioSrc && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent parent div onClick
                    if (isPlaying) {
                      onPauseAudio();
                    } else {
                      // Check audioSrc existence again for type safety (though already checked)
                      if (subModel.audioSrc) {
                        onPlayAudio(subModel.audioSrc, subModel.id);
                      }
                    }
                  }}
                  className={`absolute inset-0 flex items-center justify-center bg-black rounded-full text-white focus:outline-none transition-opacity duration-200 ease-in-out ${isHovered || isPlaying ? 'opacity-75' : 'opacity-0 pointer-events-none'
                    }`}
                  aria-label={isPlaying ? "Pause sample audio" : "Play sample audio"}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-5 h-5" />
                  ) : (
                    <PlayIcon className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 truncate" title={subModel.name}>
              {subModel.name}
            </p>
          </div>
        );
      })}
    </div>
  );
} 