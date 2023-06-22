'use strict';

const createPrompt = ({ level, language, topic, definition }) => {
  if (language === 'without translation') {
    if (definition) {
      return `Your output should use the following template:
        Word list
        [English word] - [definition]
        [English word] - [definition]
        
        Your task is to generate a list of 15 words that are related to ${topic} for ${level} level of English.
        And to make a definition for each word`;
    } else {
      return `Your output should use the following template:
        Word list
        [English word]
        [English word]
        
        Your task is to generate a list of 15 words that are related to ${topic} for ${level} level of English.`;
    }
  } else {
    return `Your output should use the following template:
    Word list
    [English word] - [translation in ${language}]
  
    Your task is to generate a list of 15 words that are related to ${topic} for ${level} level of English. 
    And to translate these words in ${language} language.`;
  }
};

const improveListPrompt = ({ language, definition }) => {
  if (language === 'without translation') {
    if (definition) {
      return `Your output should use the following template:
        Word list
        [English word] - [definition]
        [English word] - [definition]
        
        Your task is to regenerate the previous list of words by replacing the previous words with new ones.`;
    } else {
      return `Your output should use the following template:
        Word list
        [English word]
        [English word]
        
        Your task is to regenerate the previous list of words by replacing the previous words with new ones.`;
    }
  } else {
    return `Your output should use the following template:
      Word list
      [English word] - [translation in ${language}]
      
      Your task is to regenerate the previous list of words by replacing the previous words with new ones.`;
  }
};

module.exports = { createPrompt, improveListPrompt };