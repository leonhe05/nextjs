// Define the interfaces for sub-models and main models
export interface SubModel {
  id: string;
  name: string;
  audioSrc?: string;
  avator?: string;
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
      { id: '4189', name: '度涵竹-开朗女声', audioSrc: '/voices/度涵竹-开朗女声.mp3', avator: '/model_avators/women3.svg' },
      { id: '4179', name: '度泽言-温暖男声', audioSrc: '/voices/度泽言-温暖男声.mp3', avator: '/model_avators/man1.svg' },
      { id: '4146', name: '度禧禧-阳光女声', audioSrc: '/voices/度禧禧-阳光女声.mp3', avator: '/model_avators/women1.svg' },
      { id: '6567', name: '度小柔-温柔女声', audioSrc: '/voices/度小柔-温柔女声.mp3', avator: '/model_avators/women2.svg' },
      { id: '4156', name: '度言浩-年轻男声', audioSrc: '/voices/度言浩-年轻男声.mp3', avator: '/model_avators/man2.svg' },
      { id: '4194', name: '度嫣然-活泼女声', audioSrc: '/voices/度嫣然-活泼女声.mp3', avator: '/model_avators/women4.svg' },
      { id: '4193', name: '度泽言-开朗男声', audioSrc: '/voices/度泽言-开朗男声.mp3', avator: '/model_avators/man3.svg' },
      { id: '4195', name: '度怀安-磁性男声', audioSrc: '/voices/度怀安-磁性男声.mp3', avator: '/model_avators/man4.svg' },
      { id: '4196', name: '度清影-甜美女声', audioSrc: '/voices/度清影-甜美女声.mp3', avator: '/model_avators/women5.svg' },
      { id: '4197', name: '度沁遥-知性女声', audioSrc: '/voices/度沁遥-知性女声.mp3', avator: '/model_avators/women6.svg' },
      { id: '20100', name: '度小粤-粤语女声', audioSrc: '/voices/度小粤-粤语女声.mp3', avator: '/model_avators/women1.svg' },
      { id: '20101', name: '度晓芸-粤语女声', audioSrc: '/voices/度晓芸-粤语女声.mp3', avator: '/model_avators/women2.svg' },
      { id: '4257', name: '四川小哥-四川男声', audioSrc: '/voices/四川小哥-四川男声.mp3', avator: '/model_avators/man5.svg' },
      { id: '4132', name: '度阿闽-闽南男声', audioSrc: '/voices/度阿闽-闽南男声.mp3', avator: '/model_avators/man6.svg' },
      { id: '4139', name: '度小蓉-四川女声', audioSrc: '/voices/度小蓉-四川女声.mp3', avator: '/model_avators/women3.svg' },
      { id: '5977', name: '台媒女声-台湾女声', audioSrc: '/voices/台媒女声-台湾女声.mp3', avator: '/model_avators/women4.svg' },
      { id: '4007', name: '度小台-台湾女声', audioSrc: '/voices/度小台-台湾女声.mp3', avator: '/model_avators/women5.svg' },
      { id: '4150', name: '度湘玉-陕西女声', audioSrc: '/voices/度湘玉-陕西女声.mp3', avator: '/model_avators/women6.svg' },
      { id: '4134', name: '度阿锦-东北女声', audioSrc: '/voices/度阿锦-东北女声.mp3', avator: '/model_avators/women1.svg' },
      { id: '4172', name: '度筱林-天津女声', audioSrc: '/voices/度筱林-天津女声.mp3', avator: '/model_avators/women2.svg' },
      { id: '5980', name: '度阿花-上海女声', audioSrc: '/voices/度阿花-上海女声.mp3', avator: '/model_avators/women3.svg' },
      { id: '4154', name: '度老崔-北京男声', audioSrc: '/voices/度老崔-北京男声.mp3', avator: '/model_avators/man1.svg' },
    ],
  },
  {
    id: 'modelB', name: '有声书',
    subModels: [
      { id: '4003', name: '度逍遥-情感男声', audioSrc: '/voices/度逍遥-情感男声.mp3', avator: '/model_avators/man2.svg' },
      { id: '6205', name: '度悠然-旁白男声', audioSrc: '/voices/度悠然-旁白男声.mp3', avator: '/model_avators/man3.svg' },
      { id: '6221', name: '度云萱-旁白女声', audioSrc: '/voices/度云萱-旁白女声.mp3', avator: '/model_avators/women4.svg' },
      { id: '6546', name: '度清豪-逍遥侠客', audioSrc: '/voices/度清豪-逍遥侠客.mp3', avator: '/model_avators/man4.svg' },
      { id: '6602', name: '度清柔-温柔男神', audioSrc: '/voices/度清柔-温柔男神.mp3', avator: '/model_avators/man5.svg' },
      { id: '6562', name: '度雨楠-元气少女', audioSrc: '/voices/度雨楠-元气少女.mp3', avator: '/model_avators/women5.svg' },
      { id: '6543', name: '度雨萌-邻家女孩', audioSrc: '/voices/度雨萌-邻家女孩.mp3', avator: '/model_avators/women6.svg' },
      { id: '6747', name: '度书古-情感男声', audioSrc: '/voices/度书古-情感男声.mp3', avator: '/model_avators/man6.svg' },
      { id: '6748', name: '度书严-沉稳男声', audioSrc: '/voices/度书严-沉稳男声.mp3', avator: '/model_avators/man1.svg' },
      { id: '6746', name: '度书道-沉稳男声', audioSrc: '/voices/度书道-沉稳男声.mp3', avator: '/model_avators/man2.svg' },
      { id: '6644', name: '度书宁-亲和女声', audioSrc: '/voices/度书宁-亲和女声.mp3', avator: '/model_avators/women1.svg' },
      { id: '4148', name: '度小夏-甜美女声', audioSrc: '/voices/度小夏-甜美女声.mp3', avator: '/model_avators/women2.svg' },
    ]
  },
  {
    id: 'modelC', name: '资讯',
    subModels: [
      { id: '4106', name: '度博文-专业男主播', audioSrc: '/voices/度博文-专业男主播.mp3', avator: '/model_avators/man3.svg' },
      { id: '4115', name: '度小贤-电台男主播', audioSrc: '/voices/度小贤-电台男主播.mp3', avator: '/model_avators/man4.svg' },
      { id: '5147', name: '度常盈-电台女主播', audioSrc: '/voices/度常盈-电台女主播.mp3', avator: '/model_avators/women3.svg' },
      { id: '5976', name: '度小皮-萌娃童声', audioSrc: '/voices/度小皮-萌娃童声.mp3', avator: '/model_avators/man4.svg' },
      { id: '5971', name: '度皮特-老外男声', audioSrc: '/voices/度皮特-老外男声.mp3', avator: '/model_avators/man5.svg' },
      { id: '4164', name: '度阿肯-主播男声', audioSrc: '/voices/度阿肯-主播男声.mp3', avator: '/model_avators/man6.svg' },
      { id: '4176', name: '度有为-磁性男声', audioSrc: '/voices/度有为-磁性男声.mp3', avator: '/model_avators/man1.svg' },
      { id: '4259', name: '度小新-播音女声', audioSrc: '/voices/度小新-播音女声.mp3', avator: '/model_avators/women4.svg' },
      { id: '4100', name: '度小雯-活力女主播', audioSrc: '/voices/度小雯-活力女主播.mp3', avator: '/model_avators/women5.svg' },
      { id: '4278', name: '度小贝-知识女主播', audioSrc: '/voices/度小贝-知识女主播.mp3', avator: '/model_avators/women6.svg' },
      { id: '4140', name: '度小新-专业女主播', audioSrc: '/voices/度小新-专业女主播.mp3', avator: '/model_avators/women1.svg' },
      { id: '4129', name: '度小彦-知识男主播', audioSrc: '/voices/度小彦-知识男主播.mp3', avator: '/model_avators/man2.svg' },
      { id: '4226', name: '南方-电台女主播', audioSrc: '/voices/南方-电台女主播.mp3', avator: '/model_avators/women2.svg' },
    ]
  },
  {
    id: 'modelD', name: '配音',
    subModels: [
      { id: '4144', name: '度姗姗-娱乐女声', audioSrc: '/voices/度姗姗-娱乐女声.mp3', avator: '/model_avators/women3.svg' },
      { id: '4143', name: '度清风-配音男声', audioSrc: '/voices/度清风-配音男声.mp3', avator: '/model_avators/man3.svg' },
      { id: '4149', name: '度星河-广告男声', audioSrc: '/voices/度星河-广告男声.mp3', avator: '/model_avators/man4.svg' },
      { id: '4254', name: '度小清-广告女声', audioSrc: '/voices/度小清-广告女声.mp3', avator: '/model_avators/women4.svg' },
      { id: '4206', name: '度博文-综艺男声', audioSrc: '/voices/度博文-综艺男声.mp3', avator: '/model_avators/man5.svg' },
      { id: '4147', name: '度云朵-可爱童声', audioSrc: '/voices/度云朵-可爱童声.mp3', avator: '/model_avators/women4.svg' },
      { id: '4141', name: '度婉婉-甜美女声', audioSrc: '/voices/度婉婉-甜美女声.mp3', avator: '/model_avators/women5.svg' },
      { id: '4277', name: '西贝-脱口秀女声', audioSrc: '/voices/西贝-脱口秀女声.mp3', avator: '/model_avators/women6.svg' },
      { id: '4114', name: '阿龙-说书男声', audioSrc: '/voices/阿龙-说书男声.mp3', avator: '/model_avators/man6.svg' },
    ]
  },
  {
    id: 'modelE', name: '对话助手',
    subModels: [
      { id: '4119', name: '度小鹿-甜美女声', audioSrc: '/voices/度小鹿-甜美女声.mp3', avator: '/model_avators/women1.svg' },
      { id: '4105', name: '度灵儿-清激女声', audioSrc: '/voices/度灵儿-清激女声.mp3', avator: '/model_avators/women2.svg' },
      { id: '4117', name: '度小乔-活泼女声', audioSrc: '/voices/度小乔-活泼女声.mp3', avator: '/model_avators/women3.svg' },
      { id: '4288', name: '度晴岚-甜美女声', audioSrc: '/voices/度晴岚-甜美女声.mp3', avator: '/model_avators/women4.svg' },
      { id: '4192', name: '度青川-温柔男声', audioSrc: '/voices/度青川-温柔男声.mp3', avator: '/model_avators/man1.svg' },
      { id: '4103', name: '度米朵-可爱女声', audioSrc: '/voices/度米朵-可爱女声.mp3', avator: '/model_avators/women5.svg' },
    ]
  },
]; 