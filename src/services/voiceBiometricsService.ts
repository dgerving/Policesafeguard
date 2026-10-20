import { VoiceTrainingProfile } from '../types';

export interface RecordedVoiceSample {
  audioDataUrl: string;
  durationMs: number;
  pitchHz: number;
  spectralCentroid: number;
  phrase: string;
}

export class VoiceBiometricsService {
  private static audioCtx: AudioContext | null = null;

  private static getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Records a user's voice calibration sample and extracts acoustic biometrics
   */
  static async recordVoiceProfileSample(
    calibrationPhrase: string,
    durationMs = 4000,
    onProgress?: (progressPercent: number, currentVol: number) => void
  ): Promise<RecordedVoiceSample> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not supported on this device/browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: true
      } 
    });

    const audioCtx = this.getAudioContext();
    const sourceNode = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    sourceNode.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Float32Array(analyser.fftSize);
    const freqData = new Uint8Array(bufferLength);

    const pitchSamples: number[] = [];
    const centroidSamples: number[] = [];

    // MediaRecorder to capture audio blob with safe fallbacks
    const chunks: Blob[] = [];
    let mimeType = 'audio/webm';
    let mediaRecorder: MediaRecorder | null = null;
    try {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      }

      mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      mediaRecorder.start();
    } catch (recErr) {
      console.warn('Voice training audio recorder fallback:', recErr);
      try {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        mediaRecorder.start();
      } catch (fallbackErr) {
        console.warn('Voice training MediaRecorder unavailable, continuing acoustic analysis:', fallbackErr);
      }
    }
    const startTime = Date.now();

    // Collect acoustic features during recording
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / durationMs) * 100));

      analyser.getFloatTimeDomainData(timeData);
      analyser.getByteFrequencyData(freqData);

      // Volume level
      let sumSquares = 0;
      for (let i = 0; i < timeData.length; i++) {
        sumSquares += timeData[i] * timeData[i];
      }
      const rms = Math.sqrt(sumSquares / timeData.length);

      // Extract pitch if volume is audible
      if (rms > 0.02) {
        const pitch = this.estimatePitchAutocorrelation(timeData, audioCtx.sampleRate);
        if (pitch > 65 && pitch < 400) {
          pitchSamples.push(pitch);
        }

        // Spectral centroid (frequency center of mass)
        let num = 0;
        let den = 0;
        const binHz = (audioCtx.sampleRate / 2) / bufferLength;
        for (let i = 0; i < bufferLength; i++) {
          const mag = freqData[i];
          const freq = i * binHz;
          num += freq * mag;
          den += mag;
        }
        if (den > 0) {
          centroidSamples.push(num / den);
        }
      }

      if (onProgress) {
        onProgress(progress, Math.min(1, rms * 5));
      }
    }, 100);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        clearInterval(intervalId);

        const finalizeResult = (audioDataUrl: string) => {
          stream.getTracks().forEach(t => t.stop());
          const avgPitch = pitchSamples.length > 0
            ? pitchSamples.sort((a, b) => a - b)[Math.floor(pitchSamples.length / 2)]
            : 145; // Default human voice baseline
          const avgCentroid = centroidSamples.length > 0
            ? centroidSamples.reduce((a, b) => a + b, 0) / centroidSamples.length
            : 1650;

          resolve({
            audioDataUrl,
            durationMs,
            pitchHz: Math.round(avgPitch),
            spectralCentroid: Math.round(avgCentroid),
            phrase: calibrationPhrase
          });
        };

        if (mediaRecorder) {
          mediaRecorder.onstop = async () => {
            if (chunks.length > 0) {
              const blob = new Blob(chunks, { type: mimeType });
              const reader = new FileReader();
              reader.onloadend = () => finalizeResult(reader.result as string);
              reader.onerror = (err) => reject(err);
              reader.readAsDataURL(blob);
            } else {
              finalizeResult('');
            }
          };

          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          } else {
            finalizeResult('');
          }
        } else {
          finalizeResult('');
        }
      }, durationMs);
    });
  }

  /**
   * Autocorrelation pitch detector for human speech
   */
  private static estimatePitchAutocorrelation(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    let r1 = 0;
    let r2 = SIZE - 1;
    const thres = 0.2;

    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) {
        r1 = i;
        break;
      }
    }

    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmed = buffer.slice(r1, r2);
    const c = new Float32Array(trimmed.length);
    for (let i = 0; i < trimmed.length; i++) {
      for (let j = 0; j < trimmed.length - i; j++) {
        c[i] = c[i] + trimmed[j] * trimmed[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < trimmed.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    if (T0 <= 0) return 0;
    return sampleRate / T0;
  }

  /**
   * Compares an incoming speech sample against the learned user voice profile
   */
  static verifySpeakerMatch(
    incomingPitch: number,
    incomingCentroid: number,
    profile?: VoiceTrainingProfile
  ): { isMatch: boolean; confidence: number; reason: string } {
    if (!profile || !profile.isTrained || !profile.voiceLockActive) {
      // Voice lock not enabled: allow all
      return { isMatch: true, confidence: 1.0, reason: 'Voice lock inactive - Open response mode' };
    }

    const learnedPitch = profile.pitchHz || 145;
    const learnedCentroid = profile.spectralCentroid || 1650;

    // Tolerance thresholds based on sensitivity
    const pitchTolPercent = profile.sensitivity === 'strict' ? 0.22 : profile.sensitivity === 'balanced' ? 0.35 : 0.48;
    const centroidTolPercent = profile.sensitivity === 'strict' ? 0.30 : profile.sensitivity === 'balanced' ? 0.45 : 0.60;

    const pitchDiff = Math.abs(incomingPitch - learnedPitch) / learnedPitch;
    const centroidDiff = Math.abs(incomingCentroid - learnedCentroid) / learnedCentroid;

    const pitchScore = Math.max(0, 1 - pitchDiff);
    const centroidScore = Math.max(0, 1 - centroidDiff);
    const confidence = Math.round(((pitchScore * 0.65) + (centroidScore * 0.35)) * 100);

    const isMatch = pitchDiff <= pitchTolPercent && centroidDiff <= centroidTolPercent;

    if (isMatch) {
      return {
        isMatch: true,
        confidence,
        reason: `Matched learned voice (Pitch ~${Math.round(incomingPitch)}Hz vs profile ${learnedPitch}Hz)`
      };
    } else {
      return {
        isMatch: false,
        confidence,
        reason: `Voice mismatch (Officer/external speaker detected ~${Math.round(incomingPitch)}Hz vs citizen ${learnedPitch}Hz)`
      };
    }
  }

  /**
   * Plays a saved audio sample URL
   */
  static playSavedAudio(audioDataUrl: string, onEnd?: () => void): HTMLAudioElement {
    const audio = new Audio(audioDataUrl);
    if (onEnd) {
      audio.onended = onEnd;
    }
    audio.play().catch(e => console.warn('Audio playback error:', e));
    return audio;
  }
}
