'use strict';

const levels = {
  A1: 'Beginner/Elementary',
  A2: 'Pre Intermediate',
  B1: 'Intermediate',
  B2: 'Upper Intermediate',
  C1: 'Advanced',
}

const createPrompt = ({ level, language, topic, definition }) => {
  const nameLevel = levels[level];
  if (language === 'without translation') {
    if (definition) {
      return `Your task is to generate a list of 15 English words (nouns, verbs, adjectives) that are related to ${topic} for ${nameLevel} level of English.
      And to make a definition for each word
      
      Your output should use the following template:
        Word list
        [English word] - [definition]
        [English word] - [definition]`;
    } else {
      return `Your task is to generate a list of 15 English words (nouns, verbs, adjectives) that are related to ${topic} with ${nameLevel} level of difficulty.
      
      Your output should be brief and use the following template:
      Word list:
       [English word]
       [English word]`;
    }
  } else {
    return `Your task is to generate a list of 15 English words that are related to ${topic} with ${nameLevel} level of difficulty. 
    And to translate these words in ${language} language.
    
    Your output should use the following template:
      Word list
      [English word] - [translation in ${language}]`;
  }
};

const improveListPrompt = ({ level, language, topic, definition  }) => {
  if (language === 'without translation') {
    if (definition) {
      return `Your output should use the following template:
        Word list
        [English word] - [definition]
        [English word] - [definition]
        
        Please generate a compilation of 15 words associated with ${topic} suitable for individuals proficient in English at an ${level} level.
        Furthermore, kindly provide their corresponding definitions`;
    } else {
      return `Your output should use the following template:
        Word list
        [English word]
        [English word]
        
        Please generate a compilation of 15 words associated with ${topic} suitable for individuals proficient in English at an ${level} level.`;
    }
  } else {
    return `Your output should use the following template:
      Word list
      [English word] - [translation in ${language}]
      
      Please generate a compilation of 15 words associated with ${topic} suitable for individuals proficient in English at an ${level} level. 
      Furthermore, kindly provide their corresponding translations in the ${language} language.`;
  }
};

module.exports = { createPrompt, improveListPrompt };