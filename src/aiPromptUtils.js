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