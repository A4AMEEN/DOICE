import { Component, OnInit, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-voice-to-text',
  template: `
    <div class="container">
      <textarea [(ngModel)]="text" placeholder="Your text will appear here..."></textarea>
      <button (click)="toggleListening()">
        {{ isListening ? 'Mute' : 'Unmute' }}
      </button>
      <p>Voice commands: Say "clear" to empty the text, "mute" to stop listening, or ask "What is the meaning of [word]?"</p>
      <div *ngIf="botResponse" class="bot-response">
        <h3>Bot Response:</h3>
        <p>{{ botResponse }}</p>
      </div>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    textarea {
      width: 100%;
      height: 200px;
      margin-bottom: 20px;
    }
    button {
      padding: 10px 20px;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .bot-response {
      margin-top: 20px;
      padding: 10px;
      background-color: #f0f0f0;
      border-radius: 5px;
    }
  `]
})
export class VoiceToTextComponent implements OnInit {
  text: string = '';
  isListening: boolean = false;
  recognition: any;
  botResponse: string = '';

  constructor(private ngZone: NgZone, private http: HttpClient) {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            this.processCommand(transcript.trim().toLowerCase());
          } else {
            interimTranscript += transcript;
          }
        }

        this.ngZone.run(() => {
          this.text = finalTranscript + interimTranscript;
        });
      };
    } else {
      console.error('Speech recognition not supported');
    }
  }

  ngOnInit(): void {}

  toggleListening(): void {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening(): void {
    this.recognition.start();
    this.isListening = true;
  }

  stopListening(): void {
    this.recognition.stop();
    this.isListening = false;
  }

  processCommand(command: string): void {
    if (command.startsWith('what is the meaning of')) {
      const word = command.split('what is the meaning of')[1].trim();
      this.getWordDefinition(word);
    } else {
      switch (command) {
        case 'clear':
          this.clearText();
          break;
        case 'mute':
          this.stopListening();
          break;
      }
    }
  }

  clearText(): void {
    this.text = '';
    this.botResponse = '';
  }

  getWordDefinition(word: string): void {
    this.http.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`).subscribe(
      (response: any) => {
        if (response && response.length > 0) {
          const definition = response[0].meanings[0].definitions[0].definition;
          this.botResponse = `The meaning of "${word}" is: ${definition}`;
          this.speakResponse(this.botResponse);
        } else {
          this.botResponse = `Sorry, I couldn't find a definition for "${word}".`;
          this.speakResponse(this.botResponse);
        }
      },
      (error) => {
        this.botResponse = `Sorry, I couldn't find a definition for "${word}".`;
        this.speakResponse(this.botResponse);
      }
    );
  }

  speakResponse(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Text-to-speech not supported');
    }
  }
}