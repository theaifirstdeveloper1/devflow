"use client";

import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { cn } from '@/lib/utils';

interface VoiceInputButtonProps {
    onTranscript: (text: string) => void;
    className?: string;
}

export function VoiceInputButton({ onTranscript, className }: VoiceInputButtonProps) {
    const {
        isRecording,
        interimTranscript,
        error,
        isSupported,
        startRecording,
        stopRecording,
    } = useVoiceInput({
        onFinalTranscript: (text) => {
            onTranscript(text);
        },
    });

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    if (!isSupported) {
        return (
            <Button
                variant="ghost"
                size="icon"
                disabled
                title="Voice input not supported in this browser"
                className={className}
            >
                <MicOff className="h-4 w-4 text-muted-foreground" />
            </Button>
        );
    }

    return (
        <div className="relative">
            {/* Simple Mic Button */}
            <Button
                variant={isRecording ? 'default' : 'outline'}
                size="icon"
                onClick={handleToggleRecording}
                className={cn(
                    'relative',
                    isRecording && 'bg-red-500 hover:bg-red-600 animate-pulse',
                    className
                )}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
                <Mic className="h-4 w-4" />
                {isRecording && (
                    <>
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-white animate-ping" />
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-white" />
                    </>
                )}
            </Button>

            {/* Interim Transcript (shows what you're saying) */}
            {isRecording && interimTranscript && (
                <div className="absolute left-0 right-0 top-full mt-2 min-w-[200px] rounded-md bg-muted p-2 text-sm text-muted-foreground border shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
                    <span className="italic">{interimTranscript}...</span>
                </div>
            )}

            {/* Error Message */}
            {error && !isRecording && (
                <div className="absolute right-0 top-full mt-2 min-w-[200px] rounded-md bg-destructive/10 border border-destructive p-2 text-xs text-destructive z-50">
                    {error}
                </div>
            )}
        </div>
    );
}
