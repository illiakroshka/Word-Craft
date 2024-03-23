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
      return `Your task is to generate a list of 15 English words that are related to ${topic} for ${nameLevel} level of English.
      And to make a definition for each word.     
      Word list must have verbs nouns and adjectives.
      
      Your output should use the following template:
        Word list:
        1. [English word] - [definition]
        2. to [English verb] - [definition]
        3. to be [adjective] - [definition]`;
    } else {
      return `Your task is to generate a list of 15 English words that are related to ${topic} with ${nameLevel} level of difficulty.
      Word list must have verbs nouns and adjectives.
      
      Your output should be brief and use the following template:
      Add 'to' if the word is verb
      Word list:
       1. [noun]
       2. to [verb]
       3. [adjective]`;
    }
  } else {
    return `Your task is to generate a list of 15 English words that are related to ${topic} with ${nameLevel} level of difficulty. 
    And to translate these words in ${language} language.
    Word list must have verbs nouns and at least 2 adjectives.
    
    Your output should use the following template:
    Add 'to' if the word is verb
      Word list:
      1. [noun] - [translation in ${language}]
      2. to [verb] - [translation in ${language}]
      3. [adjective] - [translation in ${language}]`;
  }
};

const improveListPrompt = (level, language, topic, definition, wordList) => {
  const nameLevel = levels[level];
  if (language === 'without translation') {
    if (definition) {
      return `
      Your task is to completely redo following word list: ${wordList}, by generating more specific words
      that are related to ${topic} with ${nameLevel} level of difficulty. And to make a definition for each word
      Word list must have verbs nouns and adjectives and must have 15 words.
      
      Your output should use the following template:
      Add 'to' if the word is verb
        Word list:
        1. [noun] - [definition]
        2. to [verb] - [definition]
        3. [adjective] - [definition]`;
    } else {
      return `Your task is to completely redo following word list: ${wordList}, by generating new more specific words 
      that are related to ${topic} with ${nameLevel} level of difficulty.
      Word list must have verbs nouns and adjectives and must have 15 words.
           
      Your output should be brief and use the following template:
      Add 'to' if the word is verb
      Word list:
       1. [noun]
       2. to [verb]
       3. [adjective]`;
    }
  } else {
    return `Your task is to completely redo following word list: ${wordList}, by generating new more specific words 
      that are related to ${topic} with ${nameLevel} level of difficulty.And to translate these words in ${language} language.
      Word list must have verbs nouns and adjectives and must have 15 words.
    
    Your output should use the following template:
    Add 'to' if the word is verb
      Word list:
      1. [noun] - [translation in ${language}]
      2. to [verb] - [translation in ${language}]
      3. [adjective] - [translation in ${language}]`;
  }
};

const analyzeVideoPrompt = (videoText, language) => {
  if (language === 'without translation') {
    return `I will provide you text of the video, and your tasks is to:
     1) Determine the topic of the text
     2) Analyze it and find specific words used in this text related to it's topic
     3) Find idioms used in this text 
  
  TEXT: ${videoText}
  
  Your output should use the following template:
  Topic of the video
  
  Words:
  1. list of words
  Idioms:
  1. list of idioms`
  }
  return `I will provide you text of the video, and your tasks is:
   1) To determine the topic of the text 
   2) Analyze it and find specific words used in this text related to it's topic and to translate these words in ${language} language 
   3) Find idioms used in this text and write the meaning in ${language} language 
  
  TEXT: ${videoText}
  
  Your output should use the following template:
  Topic of the video
  Words:
  1. list of words - translation in ${language}
  Idioms:
  1. list of idioms - meaning in ${language}`
}

module.exports = { createPrompt, improveListPrompt, analyzeVideoPrompt };