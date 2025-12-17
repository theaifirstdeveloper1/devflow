"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// Language configurations for Indian languages
export const VOICE_LANGUAGES = {
    'en-US': { label: 'English', flag: '🇬🇧', name: 'English' },
    'hi-IN': { label: 'हिंदी', flag: '🇮🇳', name: 'Hindi' },
    'mr-IN': { label: 'मराठी', flag: '🇮🇳', name: 'Marathi' },
} as const;

export type VoiceLanguage = keyof typeof VOICE_LANGUAGES;

interface UseVoiceInputOptions {
    onTranscriptChange?: (transcript: string) => void;
    onFinalTranscript?: (transcript: string) => void;
    continuous?: boolean;
    interimResults?: boolean;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
    const {
        onTranscriptChange,
        onFinalTranscript,
        continuous = true,
        interimResults = true,
    } = options;

    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguage>('en-US');

    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Check browser support
    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            setIsSupported(true);
            recognitionRef.current = new SpeechRecognition();

            // Load saved language preference
            const savedLang = localStorage.getItem('voiceLanguage') as VoiceLanguage;
            if (savedLang && VOICE_LANGUAGES[savedLang]) {
                setSelectedLanguage(savedLang);
            }
        } else {
            setIsSupported(false);
            setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Configure recognition when language changes
    useEffect(() => {
        if (!recognitionRef.current) return;

        const recognition = recognitionRef.current;
        recognition.lang = selectedLanguage;
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.maxAlternatives = 1;

        // Save language preference
        localStorage.setItem('voiceLanguage', selectedLanguage);
    }, [selectedLanguage, continuous, interimResults]);

    // Setup event handlers
    useEffect(() => {
        if (!recognitionRef.current) return;

        const recognition = recognitionRef.current;

        recognition.onstart = () => {
            setIsRecording(true);
            setError(null);
            setTranscript('');
            setInterimTranscript('');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimText = '';
            let finalText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;

                if (result.isFinal) {
                    finalText += text + ' ';
                } else {
                    interimText += text;
                }
            }

            if (finalText) {
                const newTranscript = transcript + finalText;
                setTranscript(newTranscript);
                onTranscriptChange?.(newTranscript);
            }

            setInterimTranscript(interimText);
        };

        recognition.onend = () => {
            setIsRecording(false);
            setInterimTranscript('');

            if (transcript) {
                onFinalTranscript?.(transcript);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            setIsRecording(false);

            switch (event.error) {
                case 'no-speech':
                    setError('No speech detected. Please try again.');
                    break;
                case 'audio-capture':
                    setError('Microphone not found. Please check your device.');
                    break;
                case 'not-allowed':
                    setError('Microphone permission denied. Please enable it in browser settings.');
                    break;
                case 'network':
                    setError('Network error. Please check your connection.');
                    break;
                default:
                    setError(`Error: ${event.error}. Please try again.`);
            }
        };
    }, [transcript, onTranscriptChange, onFinalTranscript]);

    const startRecording = useCallback(() => {
        if (!recognitionRef.current || !isSupported) {
            setError('Speech recognition not available');
            return;
        }

        try {
            setError(null);
            recognitionRef.current.start();
        } catch (err) {
            if (err instanceof Error && err.message.includes('already started')) {
                // Already recording, ignore
                return;
            }
            setError('Failed to start recording. Please try again.');
        }
    }, [isSupported]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
        }
    }, [isRecording]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
    }, []);

    const changeLanguage = useCallback((lang: VoiceLanguage) => {
        if (isRecording) {
            stopRecording();
        }
        setSelectedLanguage(lang);
    }, [isRecording, stopRecording]);

    return {
        // State
        isRecording,
        transcript,
        interimTranscript,
        error,
        isSupported,
        selectedLanguage,

        // Actions
        startRecording,
        stopRecording,
        resetTranscript,
        changeLanguage,

        // Utils
        languages: VOICE_LANGUAGES,
    };
}
