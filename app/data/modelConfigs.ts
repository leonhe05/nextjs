// Define the interfaces for sub-models and main models
export interface SubModel {
  id: string;
  name: string;
  audioSrc?: string;
}

export interface VoiceModelConfig {
  id: string;
  name: string;
  subModels: SubModel[];
}

// Configuration data for models and sub-models
export const modelConfigs: VoiceModelConfig[] = [
  {
    id: 'modelA', name: 'AI大模型超拟人',
    subModels: [
      { id: '1', name: '涵竹-开朗女声', audioSrc: '/response.wav' },
      { id: '2', name: '涵雅-开朗女声', audioSrc: '/response.wav' },
      { id: '3', name: '涵竹-开朗女声', audioSrc: '/response.wav' },
      { id: '4', name: '涵雅-开朗女声', audioSrc: '/response.wav' },
      { id: '5', name: '涵竹-开朗女声', audioSrc: '/response.wav' },
      { id: '6', name: '涵雅-开朗女声', audioSrc: '/response.wav' },
      { id: '7', name: '涵竹-开朗女声', audioSrc: '/response.wav' },
      { id: '8', name: '涵雅-开朗女声', audioSrc: '/response.wav' },
      { id: '9', name: '涵竹-开朗女声', audioSrc: '/response.wav' },
      { id: '10', name: '涵雅-开朗女声', audioSrc: '/response.wav' },
      { id: '11', name: '涵竹-开朗女声', audioSrc: '/response.wav' },
      { id: '12', name: '涵雅-开朗女声', audioSrc: '/response.wav' },
      { id: '13', name: '涵雅-开朗女声', audioSrc: '/response.wav' },
      { id: '14', name: '涵竹-开朗女声', audioSrc: '/response.wav' },
      { id: '15', name: '涵雅-开朗女声', audioSrc: '/response.wav' }
    ],
  },
  {
    id: 'modelB', name: '有声书',
    subModels: [{ id: '1', name: '涵竹-开朗女声', audioSrc: '/response.wav' }]
  },
  {
    id: 'modelC', name: '资讯',
    subModels: [{ id: '1', name: '涵竹-开朗女声', audioSrc: '/response.wav' }]
  },
  {
    id: 'modelD', name: '配音',
    subModels: [{ id: '1', name: '涵竹-开朗女声', audioSrc: '/response.wav' }]
  },
  {
    id: 'modelE', name: '对话助手',
    subModels: [{ id: '1', name: '涵竹-开朗女声', audioSrc: '/response.wav' }]
  },
]; 