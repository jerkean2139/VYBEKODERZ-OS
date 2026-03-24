import { v4 as uuid } from 'uuid';
import { storeEpisodic } from '../memory/engine';

// ============================================================
// Voice Layer
//
// Input:  OpenAI Whisper API (speech-to-text)
// Output: ElevenLabs TTS (text-to-speech)
// Modes:  Push-to-talk, Voice SOP walkthrough, Meeting assistant
//
// In production: streams audio to Whisper, returns text,
// processes with Donna, sends response to ElevenLabs for TTS.
// Here: simulated with the same API contracts.
// ============================================================

export type VoiceMode = 'push_to_talk' | 'voice_walkthrough' | 'meeting_assistant';
export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceSession {
  id: string;
  tenantId: string;
  mode: VoiceMode;
  status: VoiceStatus;
  transcript: TranscriptEntry[];
  createdAt: string;
}

export interface TranscriptEntry {
  id: string;
  role: 'user' | 'donna';
  text: string;
  audioUrl?: string;
  timestamp: string;
  confidence?: number;
}

export interface WhisperConfig {
  apiKey: string;
  model: 'whisper-1';
  language?: string;
  responseFormat: 'json' | 'text' | 'verbose_json';
}

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
  stability: number;
  similarityBoost: number;
  style: number;
}

// Active sessions
const voiceSessions: Map<string, VoiceSession> = new Map();

// ============================================================
// Configuration
// ============================================================

export function getWhisperConfig(): WhisperConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'whisper-1',
    language: 'en',
    responseFormat: 'verbose_json',
  };
}

export function getElevenLabsConfig(): ElevenLabsConfig {
  return {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL', // default: Sarah
    modelId: 'eleven_multilingual_v2',
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.3,
  };
}

// ============================================================
// Voice Session Management
// ============================================================

export function createVoiceSession(tenantId: string, mode: VoiceMode = 'push_to_talk'): VoiceSession {
  const session: VoiceSession = {
    id: uuid(),
    tenantId,
    mode,
    status: 'idle',
    transcript: [],
    createdAt: new Date().toISOString(),
  };
  voiceSessions.set(session.id, session);
  return session;
}

export function getVoiceSession(id: string): VoiceSession | undefined {
  return voiceSessions.get(id);
}

// ============================================================
// Speech-to-Text (Whisper API)
// ============================================================

export async function transcribeAudio(
  sessionId: string,
  audioBuffer: Buffer
): Promise<TranscriptEntry> {
  const session = voiceSessions.get(sessionId);
  if (!session) throw new Error('Voice session not found');

  session.status = 'processing';

  const config = getWhisperConfig();

  try {
    if (!config.apiKey) {
      // Simulated response when no API key
      const entry: TranscriptEntry = {
        id: uuid(),
        role: 'user',
        text: '[Simulated transcription — set OPENAI_API_KEY for real STT]',
        timestamp: new Date().toISOString(),
        confidence: 0.95,
      };
      session.transcript.push(entry);
      session.status = 'idle';
      return entry;
    }

    // Real Whisper API call
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer]), 'audio.webm');
    formData.append('model', config.model);
    if (config.language) formData.append('language', config.language);
    formData.append('response_format', config.responseFormat);

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: formData,
    });

    const data = await res.json();

    const entry: TranscriptEntry = {
      id: uuid(),
      role: 'user',
      text: data.text,
      timestamp: new Date().toISOString(),
      confidence: data.segments?.[0]?.avg_logprob ? Math.exp(data.segments[0].avg_logprob) : 0.9,
    };
    session.transcript.push(entry);
    session.status = 'idle';

    // Store in memory
    storeEpisodic(session.tenantId, `Voice input: "${entry.text}"`, 'donna');

    return entry;
  } catch (error) {
    session.status = 'error';
    throw error;
  }
}

// ============================================================
// Text-to-Speech (ElevenLabs API)
// ============================================================

export async function synthesizeSpeech(
  sessionId: string,
  text: string
): Promise<TranscriptEntry> {
  const session = voiceSessions.get(sessionId);
  if (!session) throw new Error('Voice session not found');

  session.status = 'speaking';

  const config = getElevenLabsConfig();

  const entry: TranscriptEntry = {
    id: uuid(),
    role: 'donna',
    text,
    timestamp: new Date().toISOString(),
  };

  try {
    if (!config.apiKey) {
      // Simulated — no audio URL without API key
      entry.audioUrl = undefined;
      session.transcript.push(entry);
      session.status = 'idle';
      return entry;
    }

    // Real ElevenLabs API call
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: config.modelId,
          voice_settings: {
            stability: config.stability,
            similarity_boost: config.similarityBoost,
            style: config.style,
          },
        }),
      }
    );

    if (res.ok) {
      // In production: save audio buffer to storage, return URL
      entry.audioUrl = `/api/voice/audio/${entry.id}`;
    }

    session.transcript.push(entry);
    session.status = 'idle';

    return entry;
  } catch (error) {
    session.transcript.push(entry);
    session.status = 'error';
    throw error;
  }
}

// ============================================================
// Meeting Intelligence
// Ingest transcript → extract actions → create tasks
// ============================================================

export interface MeetingAction {
  type: 'task' | 'decision' | 'question' | 'followup';
  text: string;
  assignee?: string;
  dueDate?: string;
}

export async function extractMeetingActions(transcript: string): Promise<MeetingAction[]> {
  // In production: use Claude API to analyze meeting transcript
  // Here: return simulated actions
  return [
    { type: 'task', text: 'Update project timeline with new milestones', assignee: 'Ops Agent' },
    { type: 'decision', text: 'Approved Q2 marketing budget increase' },
    { type: 'followup', text: 'Schedule follow-up with client next Tuesday', assignee: 'Scheduler' },
  ];
}
