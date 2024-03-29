'use strict';

const levels = {
  A1: 'Beginner/Elementary',
  A2: 'Pre Intermediate',
  B1: 'Intermediate',
  B2: 'Upper Intermediate',
  C1: 'Advanced',
}

const systemMessages = {
  wlGeneration:
    "You are assistant designed to create word lists on designated topics while adhering to specified levels of English difficulty.\n" +
    "How you should work:\n" +
    "Step 1: Generates English words pertinent to the provided topic and aligned with the requested difficulty level.\n" +
    "Step 2: Meticulously evaluates the generated words for both topical relevance and English proficiency level.\n" +
    "Should any discrepancies arise, where the words deviate from the topic or the prescribed difficulty level, they are promptly replaced with more suitable alternatives. These alternatives are carefully chosen to be both more challenging and directly related to the chosen topic.",
  wlGenerationWithRole:
    "You are an assistant tasked with creating word lists tailored to specific topics, English difficulty levels, and the user's role in the topic.\n" +
    "Here's how you should operate:\n" +
    "Step 1: Generate English words relevant to the provided topic and aligned with the requested difficulty level.\n" +
    "Step 2: Carefully assess the role of the user in the topic and consider the relevant words from this topic that user will encounter\n" +
    "Step 3: Meticulously evaluate the generated words for topical relevance, English proficiency level, and alignment with the user's role.\n" +
    "Should any discrepancies arise, where the words deviate from the topic, the prescribed difficulty level, or fail to reflect the user's role adequately, promptly replace them with more suitable alternatives.\n" +
    "These alternatives should not only be more challenging and directly related to the chosen topic but also consider the user's perspective and responsibilities within that context.",
  wlRegeneration:
    "You are assistant specialized in regenerating word lists based on designated topics and specified levels of English difficulty.\n" +
    "How you should work:\n" +
    "Step 1: Takes as input a word list, along with the desired level of English proficiency and topic.\n" +
    "Step 2: Generates entirely new words related to the topic, while maintaining the same level of difficulty (level of English).\n" +
    "Step 3: Meticulously evaluates the generated words for both topical relevance and English proficiency level.\n" +
    "Should any discrepancies arise, where the words deviate from the topic or the prescribed difficulty level, they are promptly replaced with more suitable alternatives. These alternatives are carefully chosen to be both more challenging and directly related to the chosen topic.",
  wlRegenerationWithRole:
    "You are an assistant specialized in regenerating word lists tailored to specific topics, English difficulty levels, and the user's role in the topic.\n" +
    "How you should operate:\n" +
    "Step 1: Takes as input a word list, along with the desired level of English proficiency, topic, and user's role.\n" +
    "Step 2: Generates entirely new words related to the topic, while considering the user's role and maintaining the same level of difficulty (level of English).\n" +
    "Step 3: Meticulously evaluates the generated words for topical relevance, alignment with the user's role, and English proficiency level.\n" +
    "Should any discrepancies arise, where the words deviate from the topic, the prescribed difficulty level, or fail to reflect the user's role adequately, they are promptly replaced with more suitable alternatives. These alternatives are carefully chosen to be both more challenging and directly related to the chosen topic and user's role",
  videoScanning:
    "You are a helpful assistant designed to analyze text" +
    "Step 1 - define the main topic of the text" +
    "Step 2 - Identify Keywords and Phrases:\n" +
    "- Search for words and phrases that are central to the topic of the text. Look for nouns, verbs, and adjectives that convey key concepts and themes.  Prioritize vocabulary suitable for the specified level of English proficiency\n" +
    "Step 3 - Analyze Grammar Constructions:\n" +
    "- Examine sentence structures for complexity and variety, while ensuring they align with the designated level of English proficiency. Identify and analyze grammatical constructions appropriate for the specified proficiency level. Provide formulas or patterns for grammatical constructions.\n" +
    "Step 4 - Detect Idioms and Figurative Language:\n" +
    "- Recognize idiomatic expressions, metaphors, and other figurative language used in the text. Pay attention to phrases that convey abstract concepts or evoke imagery beyond their literal meanings.\n" +
    "Step 5 - Detect phrasal verbs\n" +
    "- Identify phrasal verbs used in the text, along with their corresponding meanings and contextual usage. ",
};


const createPrompt = ({ level, language, topic, definition, number_words, role }) => {
  if (role) return createPromptWithRole({ level, language, topic, definition, number_words, role })
  const nameLevel = levels[level];

  if (language === 'without translation') {
    if (definition) {
      const prompt = `Your task is to generate a list of ${number_words} English words that are related to ${topic} for ${nameLevel} level of English.
      And to make a definition for each word.     
      Word list must have verbs nouns and adjectives.
      
      Your output should use the following template:
        Word list:
        1. [English word] - [definition]
        2. to [English verb] - [definition]
        3. to be [adjective] - [definition]`;
      return { prompt, systemMessage: systemMessages['wlGeneration'] }
    } else {
      const prompt = `Your task is to generate a list of ${number_words} English words that are related to ${topic} with ${nameLevel} level of difficulty.
      Word list must have verbs nouns and adjectives.
      
      Your output should be brief and use the following template:
      Add 'to' if the word is verb
      Word list:
       1. [noun]
       2. to [verb]
       3. [adjective]`;
      return { prompt, systemMessage: systemMessages['wlGeneration'] }
    }
  } else {
    const prompt = `Your task is to generate a list of ${number_words} English words that are related to ${topic} with ${nameLevel} level of difficulty. 
    And to translate these words in ${language} language.
    Word list must have verbs nouns and at least 2 adjectives.
    
    Your output should use the following template:
    Add 'to' if the word is verb
      Word list:
      1. [noun] - [translation in ${language}]
      2. to [verb] - [translation in ${language}]
      3. [adjective] - [translation in ${language}]`;
    return { prompt, systemMessage: systemMessages['wlGeneration'] }
  }
};

const createPromptWithRole = ({level, language, topic, definition, number_words, role}) => {
  const nameLevel = levels[level];

  if (language === 'without translation') {
    if (definition) {
      const prompt = `Your task is to generate a list of ${number_words} English words that are related to ${topic} for ${nameLevel} level of English tailored to ${role}'s perspective.
      And to make a definition for each word.     
      Word list must have verbs nouns and adjectives.
      
      Your output should use the following template:
        Word list:
        1. [English word] - [definition]
        2. to [English verb] - [definition]
        3. to be [adjective] - [definition]`;
      return { prompt, systemMessage: systemMessages['wlGenerationWithRole'] }
    } else {
      const prompt = `Your task is to generate a list of ${number_words} English words that are related to ${topic} with ${nameLevel} level of difficulty  tailored to ${role}'s perspective.
      Word list must have verbs nouns and adjectives.
      
      Your output should be brief and use the following template:
      Add 'to' if the word is verb
      Word list:
       1. [noun]
       2. to [verb]
       3. [adjective]`;
      return { prompt, systemMessage: systemMessages['wlGenerationWithRole'] }
    }
  } else {
    const prompt = `Your task is to generate a list of ${number_words} English words that are related to ${topic} with ${nameLevel} level of difficulty  tailored to ${role}'s perspective. 
    And to translate these words in ${language} language.
    Word list must have verbs nouns and at least 2 adjectives.
    
    Your output should use the following template:
    Add 'to' if the word is verb
      Word list:
      1. [noun] - [translation in ${language}]
      2. to [verb] - [translation in ${language}]
      3. [adjective] - [translation in ${language}]`;
    return { prompt, systemMessage: systemMessages['wlGenerationWithRole'] }
  }
}

const improveListPrompt = (level, language, topic, definition, numberWords, wordList, role) => {
  if (role) improveListWithRole(level, language, topic, definition, numberWords, wordList, role);

  const nameLevel = levels[level];
  if (language === 'without translation') {
    if (definition) {
      const prompt = `
      Your task is to completely redo following word list: ${wordList}, by generating more specific words
      that are related to ${topic} with ${nameLevel} level of difficulty. And to make a definition for each word
      Word list must have verbs nouns and adjectives and must have ${numberWords} words.
      
      Your output should use the following template:
      Add 'to' if the word is verb
        Word list:
        1. [noun] - [definition]
        2. to [verb] - [definition]
        3. [adjective] - [definition]`;
      return { prompt, systemMessage: systemMessages['wlRegeneration'] }
    } else {
      const prompt = `Your task is to completely redo following word list: ${wordList}, by generating new more specific words 
      that are related to ${topic} with ${nameLevel} level of difficulty.
      Word list must have verbs nouns and adjectives and must have ${numberWords} words.
           
      Your output should be brief and use the following template:
      Add 'to' if the word is verb
      Word list:
       1. [noun]
       2. to [verb]
       3. [adjective]`;
      return { prompt, systemMessage: systemMessages['wlRegeneration'] }
    }
  } else {
    const prompt = `Your task is to completely redo following word list: ${wordList}, by generating new more specific words 
      that are related to ${topic} with ${nameLevel} level of difficulty.And to translate these words in ${language} language.
      Word list must have verbs nouns and adjectives and must have ${numberWords} words.
    
    Your output should use the following template:
    Add 'to' if the word is verb
      Word list:
      1. [noun] - [translation in ${language}]
      2. to [verb] - [translation in ${language}]
      3. [adjective] - [translation in ${language}]`;
    return { prompt, systemMessage: systemMessages['wlRegeneration'] }
  }
};

const improveListWithRole = (level, language, topic, definition, numberWords, wordList, role) => {
  const nameLevel = levels[level];

  if (language === 'without translation') {
    if (definition) {
      const prompt = `
      Your task is to completely redo following word list: ${wordList}, by generating more specific words
      that are related to ${topic} with ${nameLevel} level of difficulty tailored to ${role}'s perspective. 
      And to make a definition for each word
      Word list must have verbs nouns and adjectives and must have ${numberWords} words.
      
      Your output should use the following template:
      Add 'to' if the word is verb
        Word list:
        1. [noun] - [definition]
        2. to [verb] - [definition]
        3. [adjective] - [definition]`;
      return { prompt, systemMessage: systemMessages['wlRegenerationWithRole'] }
    } else {
      const prompt = `Your task is to completely redo following word list: ${wordList}, by generating new more specific words 
      that are related to ${topic} with ${nameLevel} level of difficulty tailored to ${role}'s perspective.
      Word list must have verbs nouns and adjectives and must have ${numberWords} words.
           
      Your output should be brief and use the following template:
      Add 'to' if the word is verb
      Word list:
       1. [noun]
       2. to [verb]
       3. [adjective]`;
      return { prompt, systemMessage: systemMessages['wlRegenerationWithRole'] }
    }
  } else {
    const prompt = `Your task is to completely redo following word list: ${wordList}, by generating new more specific words 
      that are related to ${topic} with ${nameLevel} level of difficulty tailored to ${role}'s perspective.
      And to translate these words in ${language} language.
      Word list must have verbs nouns and adjectives and must have ${numberWords} words.
    
    Your output should use the following template:
    Add 'to' if the word is verb
      Word list:
      1. [noun] - [translation in ${language}]
      2. to [verb] - [translation in ${language}]
      3. [adjective] - [translation in ${language}]`;
    return { prompt, systemMessage: systemMessages['wlRegenerationWithRole'] }
  }
}

const analyzeVideoPrompt = (videoText, language, level) => {
  const nameLevel = levels[level];

  if (language === 'without translation') {
    const prompt = `
    TEXT: ${videoText}
  
    Your output should use the following template:
    Topic of the video
   
    Words:
    1. list of words
    
    Grammar constructions:
    1. list of grammar constructions
    
    Idioms:
    1. list of idioms - example of usage from text
    
    Phrasal verbs: 
    1. list of phrasal verbs - meaning in the context - example of usage from text`;
    return { prompt, systemMessage: systemMessages['videoScanning'] }
  }
  const prompt = `
  TEXT: ${videoText}
  
  Your output should use the following template:
  Topic of the video
  Words:
  1. list of words - translation in ${language} language
   
  Grammar constructions:
  1. list of grammar constructions - example from video
  
  Idioms:
  1. list of idioms - meaning in ${language} language
  
  Phrasal verbs: 
  1. phrasal verb - explanation of usage in the context in ${language} language - example of usage from text
  2. phrasal verb - explanation of usage in the context in ${language} language - example of usage from text`
  return { prompt, systemMessage: systemMessages['videoScanning'] }
}

module.exports = { createPrompt, improveListPrompt, analyzeVideoPrompt };