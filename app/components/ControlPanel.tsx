import React from 'react';
import { ModelGrid } from './ModelGrid';
import { SubModel, VoiceModelConfig } from '../data/modelConfigs';
import { MessageItem } from './SortableMessage';

interface ControlPanelProps {
  modelConfigs: VoiceModelConfig[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  activeConfig: VoiceModelConfig | undefined;
  selectedSubModelId: string | null;
  handleSubModelSelect: (id: string, name: string) => void;
  playSampleAudio: (src: string, id: string) => void;
  pauseSampleAudio: () => void;
  playingSubModelId: string | null;
  speechRate: number;
  setSpeechRate: (value: number) => void;
  pitch: number;
  setPitch: (value: number) => void;
  volume: number;
  setVolume: (value: number) => void;
  messages: MessageItem[];
  handleOpenSplitterModal: () => void;
  handleSynthesize: () => Promise<void>;
  isSynthesizing: boolean;
  synthesizedAudioUrl: string | null;
}

export function ControlPanel({
  modelConfigs,
  activeTab,
  setActiveTab,
  activeConfig,
  selectedSubModelId,
  handleSubModelSelect,
  playSampleAudio,
  pauseSampleAudio,
  playingSubModelId,
  speechRate,
  setSpeechRate,
  pitch,
  setPitch,
  volume,
  setVolume,
  messages,
  handleOpenSplitterModal,
  handleSynthesize,
  isSynthesizing,
  synthesizedAudioUrl,
}: ControlPanelProps) {

  const totalChars = messages.reduce((count, msg) => count + msg.text.length, 0);

  return (
    <div className="sticky top-20 flex flex-col gap-4 w-full sm:w-2/5 bg-white p-4 rounded-lg border border-gray-300 max-h-[calc(100vh-5rem)]">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {modelConfigs.map((model) => (
          <button
            key={model.id}
            onClick={() => setActiveTab(model.id)}
            className={`py-2 px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 ease-in-out focus:outline-none ${
              activeTab === model.id
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            {model.name}
          </button>
        ))}
      </div>

      {/* Model Grid */}
      <div className="overflow-y-auto h-60">
        {activeConfig && activeConfig.subModels && (
          <ModelGrid
            subModels={activeConfig.subModels}
            selectedId={selectedSubModelId}
            onSelect={handleSubModelSelect}
            onPlayAudio={playSampleAudio}
            onPauseAudio={pauseSampleAudio}
            playingId={playingSubModelId}
          />
        )}
      </div>

      {/* Sliders */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="speechRate" className="flex-shrink-0 text-sm font-medium text-gray-700">
            语速
          </label>
          <input
            type="range"
            id="speechRate"
            name="speechRate"
            min="0"
            max="15"
            step="1"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseInt(e.target.value, 10))}
            className="flex-grow w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-gray-700 mx-2"
          />
          <span className="flex-shrink-0 text-sm text-gray-600 w-10 text-right">
            {speechRate}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label htmlFor="pitch" className="flex-shrink-0 text-sm font-medium text-gray-700">
            音调
          </label>
          <input
            type="range"
            id="pitch"
            name="pitch"
            min="0"
            max="15"
            step="1"
            value={pitch}
            onChange={(e) => setPitch(parseInt(e.target.value, 10))}
            className="flex-grow w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-gray-700 mx-2"
          />
          <span className="flex-shrink-0 text-sm text-gray-600 w-10 text-right">
            {pitch}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label htmlFor="volume" className="flex-shrink-0 text-sm font-medium text-gray-700">
            音量
          </label>
          <input
            type="range"
            id="volume"
            name="volume"
            min="0"
            max="15"
            step="1"
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value, 10))}
            className="flex-grow w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-gray-700 mx-2"
          />
          <span className="flex-shrink-0 text-sm text-gray-600 w-10 text-right">
            {volume}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-2 mt-auto pt-4 border-t border-gray-200">
        <button
          onClick={handleOpenSplitterModal}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
        >
          AI多角色自动拆分
        </button>
        <button
          onClick={handleSynthesize}
          className={`flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors duration-200 ${isSynthesizing ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isSynthesizing}
        >
          {isSynthesizing ? '合成中...' : '合成'}
        </button>
      </div>

      {/* Character Count Display */}
      <div className="mt-3 text-xs text-gray-500">
        单次合成限制：3000字 / 已输入：{totalChars} 字
      </div>

      {/* Synthesis Result Section */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-medium text-gray-700">合成结果</h4>
          {!isSynthesizing && synthesizedAudioUrl && (
            <a
              href={synthesizedAudioUrl}
              download="synthesis.wav"
              className="text-sm text-gray-900 underline transition-colors duration-200"
              title="Download Audio"
            >
              下载
            </a>
          )}
        </div>
        {isSynthesizing && (
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500 animate-pulse">正在合成音频...</p>
          </div>
        )}
        {!isSynthesizing && synthesizedAudioUrl && (
          <div className="flex items-center gap-2">
            <audio controls src={synthesizedAudioUrl} className="w-full flex-grow">
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        {!isSynthesizing && !synthesizedAudioUrl && (
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-400">点击"合成"按钮生成音频</p>
          </div>
        )}
      </div>
    </div>
  );
} 