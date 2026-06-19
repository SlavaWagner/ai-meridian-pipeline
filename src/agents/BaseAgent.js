import { getAgent } from '../storage.js';
import { generateText } from '../gemini.js';
import { getConfig } from '../config.js';

export default class BaseAgent {
  /**
   * Initializes an agent by loading its config from storage.
   * @param {string} agentName - Agent key (e.g., 'dataExtractor')
   */
  constructor(agentName) {
    const config = getAgent(agentName);
    if (!config) {
      throw new Error(`Failed to load persistent agent configuration for: "${agentName}"`);
    }

    this.name = config.name;
    this.role = config.role;
    this.description = config.description;
    this.systemPrompt = config.systemPrompt;
    this.skills = config.skills || [];
    this.model = config.model || 'gemini-1.5-flash';
    this.logs = [];
  }

  /**
   * Logs a message with timestamp and role.
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${this.role}]: ${message}`;
    this.logs.push(formatted);
    console.log(formatted);
  }

  /**
   * Check if a skill is allowed for this agent.
   */
  hasSkill(skillName) {
    return this.skills.includes(skillName);
  }

  /**
   * Request an LLM completion.
   */
  async generateCompletion(userPrompt, jsonMode = false) {
    this.log(`Requesting LLM completion using model: ${this.model}...`);
    const appConfig = getConfig();
    
    try {
      const response = await generateText(
        appConfig.geminiApiKey,
        this.systemPrompt,
        userPrompt,
        this.model,
        jsonMode
      );
      this.log('LLM completion received.');
      return response;
    } catch (error) {
      this.log(`LLM execution failed: ${error.message}`);
      throw error;
    }
  }
}
