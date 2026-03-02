import { startVoiceSession } from "@/lib/actions/session.action";
import { DEFAULT_VOICE, ASSISTANT_ID, VOICE_SETTINGS } from "@/lib/constants";
import { getVoice } from "@/lib/utils";
import { IBook, Messages } from "@/types";
import { useAuth } from "@clerk/nextjs";
import Vapi from "@vapi-ai/web"
import { useEffect, useRef, useState } from "react";

export type CallStatus = 'idle' | 'connecting' | 'start' | 'listening' | 'thinking' |'speaking';

const useLatestRef = <T>(value: T) => {
    const ref = useRef(value);
    useEffect(() => {
        ref.current = value;
    }, [value]); 

    return ref; 
}

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;

let vapi: InstanceType<typeof Vapi>

function getVapi(){
    if(!vapi){
        if(!VAPI_API_KEY){
            throw new Error('NEXT_PUBLIC_VAPI_API_KEY not found.Please set it in the .env file.')
        }

        vapi = new Vapi(VAPI_API_KEY);
    }

    return vapi;
}

export const useVapi =  (book : IBook) => {
    const { userId } = useAuth();
    //TODO: Implement limits

    const [ status , setStatus ] = useState<CallStatus>('idle');
    const [ messages, setMessages ] = useState<Messages[]>([]);
    const [ currentMessage , setCurrentMessage ] = useState('');
    const [ currentUserMessage, setCurrentUserMessage ] = useState('');
    const [ duration, setDuration] = useState(0);
    const [ limitError, setLimitError ] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const isStoppingRef = useRef<boolean>(false);

    const bookRef = useLatestRef(book);
    const durationRef = useLatestRef(duration);
    const voice = book.persona || DEFAULT_VOICE;

    const isActive = status === 'listening' || status === 'thinking' || status === 'speaking' || status === 'connecting';

    //Limits
    // const maxDuration = useLatestRef(limits.maxSessionMinutes * 60);
    //const maxDurationSeconds
    //cont remainingSeconds
    //const showTimeWarning

    // VAPI event listeners
    useEffect(() => {
        const vapiInstance = getVapi();

        const onCallStart = () => {
            console.log('[VAPI] Call started');
            setStatus('listening');
        };

        const onCallEnd = () => {
            console.log('[VAPI] Call ended');
            setStatus('idle');
            setCurrentMessage('');
            setCurrentUserMessage('');
            isStoppingRef.current = false;
        };

        const onSpeechStart = () => {
            setStatus('speaking');
        };

        const onSpeechEnd = () => {
            setStatus('listening');
        };

        const onError = (error: unknown) => {
            console.error('[VAPI] Error details:', JSON.stringify(error, null, 2));
            console.error('[VAPI] Error raw:', error);
            setStatus('idle');
            const errorMessage = error instanceof Error ? error.message : (typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error));
            setLimitError(errorMessage || 'An error occurred with VAPI');
        };

        const onCallStartFailed = (event: { stage: string; error: string; errorStack?: string; context: Record<string, unknown> }) => {
            console.error('[VAPI] Call start failed:', event);
            console.error('[VAPI] Failed at stage:', event.stage);
            console.error('[VAPI] Error message:', event.error);
            console.error('[VAPI] Context:', event.context);
            setStatus('idle');
            setLimitError(`Call failed at ${event.stage}: ${event.error}`);
        };

        const onCallStartProgress = (event: { stage: string; status: string }) => {
            console.log('[VAPI] Call progress:', event.stage, '-', event.status);
        };

        const onMessage = (message: {
            type: string;
            role?: string;
            transcript?: string;
            transcriptType?: 'partial' | 'final';
        }) => {
            if (message.type === 'transcript') {
                const { role, transcript, transcriptType } = message;

                if (role === 'user') {
                    if (transcriptType === 'partial') {
                        // User partial - update current user message with live transcript
                        setCurrentUserMessage(transcript || '');
                    } else if (transcriptType === 'final') {
                        // User final - clear current user message, set status to thinking, add to messages
                        setCurrentUserMessage('');
                        setStatus('thinking');
                        setMessages((prev) => {
                            // Deduplicate: check if last message has same content and role
                            const lastMessage = prev[prev.length - 1];
                            if (lastMessage?.role === 'user' && lastMessage?.content === transcript) {
                                return prev;
                            }
                            return [...prev, { role: 'user', content: transcript || '' }];
                        });
                    }
                } else if (role === 'assistant') {
                    if (transcriptType === 'partial') {
                        // Assistant partial - update current assistant message with live transcript
                        setCurrentMessage(transcript || '');
                    } else if (transcriptType === 'final') {
                        // Assistant final - clear current message, set status to listening, add to messages
                        setCurrentMessage('');
                        setStatus('listening');
                        setMessages((prev) => {
                            // Deduplicate: check if last message has same content and role
                            const lastMessage = prev[prev.length - 1];
                            if (lastMessage?.role === 'assistant' && lastMessage?.content === transcript) {
                                return prev;
                            }
                            return [...prev, { role: 'assistant', content: transcript || '' }];
                        });
                    }
                }
            }
        };

        vapiInstance.on('call-start', onCallStart);
        vapiInstance.on('call-end', onCallEnd);
        vapiInstance.on('speech-start', onSpeechStart);
        vapiInstance.on('speech-end', onSpeechEnd);
        vapiInstance.on('message', onMessage);
        vapiInstance.on('error', onError);
        vapiInstance.on('call-start-failed', onCallStartFailed);
        vapiInstance.on('call-start-progress', onCallStartProgress);

        return () => {
            vapiInstance.off('call-start', onCallStart);
            vapiInstance.off('call-end', onCallEnd);
            vapiInstance.off('speech-start', onSpeechStart);
            vapiInstance.off('speech-end', onSpeechEnd);
            vapiInstance.off('message', onMessage);
            vapiInstance.off('error', onError);
            vapiInstance.off('call-start-failed', onCallStartFailed);
            vapiInstance.off('call-start-progress', onCallStartProgress);
        };
    }, []);

    const start = async () => {
        if(!userId) return setLimitError('Please login to start a conversation');

        setLimitError(null);
        setStatus('connecting');

        try {
            const result = await startVoiceSession(userId, book._id);
            
            if(!result.success){
                setLimitError(result.error || 'Session limit reached. Please upgrade your plan')
                setStatus('idle');
                return;
            }

            sessionIdRef.current = result.sessionId || null;

            const firstMessage = `Hey, good to meet you.Quick question. before we dive in have you actually read ${book.title}
            yet ? Or are we starting fresh.`
            
            console.log('[VAPI] Starting call with Assistant ID:', ASSISTANT_ID);
            await getVapi().start(ASSISTANT_ID , {
                firstMessage,
                variableValues: {
                    title: book.title, author: book.author, bookId: book._id
                }, voice: {
                    provider: `11labs` as const,
                    voiceId:  getVoice(voice).id, 
                    model: "eleven_turbo_v2_5" as const,
                    stability: VOICE_SETTINGS.stability,
                    similarityBoost: VOICE_SETTINGS.similarityBoost,
                    style: VOICE_SETTINGS.style,
                    useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost
                }
            })
        } catch(e) {
            console.error('Error starting call',e);
            setStatus('idle');
            setLimitError('An error occurred while starting the call');
        }

    }
    const stop = async () => {
        isStoppingRef.current = true;
        await getVapi().stop();
    }
    const clearErrors = async () => {}

    return {
        status , isActive, messages, currentMessage, currentUserMessage, duration,
        limitError,
        start, stop, clearErrors,
        //maxDurationSeconds , remainingSeconds, showTimeWarning
    }
}

export default useVapi;