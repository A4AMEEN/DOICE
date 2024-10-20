import { Component, OnInit, NgZone, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { jsPDF } from 'jspdf';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';

declare var webkitSpeechRecognition: any;

interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: number;
}

@Component({
  selector: 'app-document-editor',
  template: `
    <div class="editor-container">
      <mat-toolbar color="primary" class="toolbar">
        <button mat-icon-button (click)="toggleSidebar()" matTooltip="Toggle Sidebar">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="document-title">
    <i class="fas fa-microphone"></i> DOICE
</span>

        <span class="spacer"></span>
        <button mat-icon-button (click)="newDocument()" matTooltip="New Document" [@buttonAnimation]>
          <mat-icon>note_add</mat-icon>
        </button>
        <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Download" [@buttonAnimation] [disabled]="!documentForm.get('content')?.value">
          <mat-icon>save_alt</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item (click)="downloadAsText()" [disabled]="!documentForm.get('content')?.value">Download as .txt</button>
          <button mat-menu-item (click)="downloadAsPDF()" [disabled]="!documentForm.get('content')?.value">Download as .pdf</button>
          <button mat-menu-item (click)="downloadAsDoc()" [disabled]="!documentForm.get('content')?.value">Download as .doc</button>
        </mat-menu>
        <button mat-icon-button (click)="toggleVoiceRecognition()" matTooltip="{{ isListening ? 'Stop Listening' : 'Start Listening' }}" [@buttonAnimation]>
          <mat-icon>{{ isListening ? 'mic' : 'mic_off' }}</mat-icon>
        </button>
      </mat-toolbar>

      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #sidenav mode="side" [opened]="sidenavOpened" class="sidenav">
          <div class="inbox-container">
            <h3 class="inbox-header">Saved Documents</h3>
            <mat-nav-list>
              <a mat-list-item *ngFor="let doc of savedDocuments" (click)="loadDocument(doc.id)" [@listAnimation] class="inbox-item">
                <mat-icon mat-list-icon class="inbox-icon">description</mat-icon>{{ doc.title }}
                <!-- <div mat-line class="inbox-title">{{ doc.title }}</div> -->
                
                <button mat-icon-button (click)="deleteDocument(doc.id); $event.stopPropagation()" matTooltip="Delete Document" class="delete-button">
                  <mat-icon>delete</mat-icon>
                </button>
                <div mat-line class="inbox-date">{{ doc.lastModified | date:'short' }}</div>
              </a>
            </mat-nav-list>
          </div>
        </mat-sidenav>

        <mat-sidenav-content class="editor-content">
          <div class="content-area" [@fadeAnimation]>
            <mat-form-field appearance="outline" class="title-input">
              <input matInput [(ngModel)]="currentDocument.title" placeholder="Document Title">
            </mat-form-field>

            <form [formGroup]="documentForm" class="editor-form">
              <mat-form-field appearance="outline" class="content-input">
                <textarea #contentTextarea matInput formControlName="content" placeholder="Start typing your document or use voice input..."></textarea>
              </mat-form-field>
            </form>

            <div class="button-container">
              <button *ngIf="!isListening" mat-raised-button color="primary" (click)="saveDocument()" class="save-button" [@buttonAnimation] [disabled]="!documentForm.get('content')?.value">
                Save
              </button>
              <button *ngIf="isListening" mat-raised-button color="warn" class="listening-button" [@buttonAnimation]>
                Listening...
              </button>
              <button mat-raised-button color="accent" (click)="toggleVoiceRecognition()" class="voice-button" [@buttonAnimation]>
                {{ isListening ? 'Stop Listening' : 'Start Listening' }}
              </button>
            </div>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .editor-container { display: flex; flex-direction: column; height: 100vh; background-color: #f8f9fa; }
    .toolbar { background-color: #2196f3; color: white; box-shadow: 0 2px 4px rgba(0,0,0,.1); }
    .document-title { font-size: 18px; margin-left: 16px; }
    .spacer { flex: 1 1 auto; }
    .sidenav-container { flex: 1; }
    .sidenav { width: 300px; background-color: #e3f2fd; border-right: none; }
    .inbox-container { padding: 16px; }
    .inbox-header { color: #1976d2; font-weight: 500; margin-bottom: 16px; padding-left: 16px; }
    .inbox-item { background-color: white; margin-bottom: 8px; border-radius: 4px; transition: all 0.3s ease; }
    .inbox-item:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .inbox-icon { color: #1976d2; }
    .inbox-title { font-weight: 500; }
    .inbox-date { font-size: 12px; color: #757575; }
    .delete-button { opacity: 0; transition: opacity 0.3s ease; }
    .inbox-item:hover .delete-button { opacity: 1; }
    .editor-content { display: flex; flex-direction: column; height: 100%; }
    .content-area { display: flex; flex-direction: column; padding: 20px; height: 100%; overflow-y: auto; }
    .title-input { width: 100%; }
    .listening-button { background-color: #f44336; color: white; }
    .editor-form { display: flex; flex-direction: column; flex: 1; }
    .content-input { flex: 1; }
    .content-input .mat-form-field-wrapper { height: 100%; }
    .content-input .mat-form-field-flex { height: 100%; }
    .content-input textarea { height: 100%; resize: none; }
    .mat-form-field-wrapper { padding-bottom: 0; }
    .button-container { display: flex; justify-content: space-between; margin-top: 20px; }
    .save-button, .voice-button { transition: all 0.3s ease; }
    .save-button:hover, .voice-button:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    ::ng-deep .mat-form-field-flex { background-color: white; }
    ::ng-deep .mat-nav-list { padding-top: 0; }
    ::ng-deep .mat-list-item { height: auto; padding: 8px 16px; margin-bottom: 8px; }
    ::ng-deep .mat-list-item-content { background-color: white; border-radius: 4px; padding: 8px; }
  `],
  animations: [
    trigger('buttonAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ]),
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-20px)' }),
          stagger('50ms', [
            animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
  export class DocumentEditorComponent implements OnInit {
    @ViewChild('contentTextarea') contentTextarea: ElementRef;
    documentForm: FormGroup;
    currentDocument: Document;
    savedDocuments: Document[] = [];
    sidenavOpened = true;
    isListening = false;
    recognition: any;
    lastProcessedIndex = 0;
  
    constructor(
      private fb: FormBuilder,
      private sanitizer: DomSanitizer,
      private snackBar: MatSnackBar,
      private ngZone: NgZone
    ) {
      this.documentForm = this.fb.group({
        content: ['']
      });
      this.currentDocument = this.createNewDocument();
      this.initSpeechRecognition();
    }
  
    ngOnInit() {
      this.loadSavedDocuments();
    }
  
    ngAfterViewInit() {
      this.contentTextarea.nativeElement.addEventListener('focus', () => {
        if (this.isListening) {
          this.toggleVoiceRecognition();
        }
      });
    }
  
    initSpeechRecognition() {
      if ('webkitSpeechRecognition' in window) {
        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
  
        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
  
          for (let i = this.lastProcessedIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
              this.lastProcessedIndex = i + 1;
            } else {
              interimTranscript += transcript;
            }
          }
  
          this.ngZone.run(() => {
            const currentContent = this.documentForm.get('content')?.value || '';
            const newContent = (currentContent + finalTranscript).trim();
            this.documentForm.patchValue({ content: newContent });
            
            // Update the textarea to show interim results
            const textareaElement = this.contentTextarea.nativeElement;
            textareaElement.value = newContent + interimTranscript;
            textareaElement.scrollTop = textareaElement.scrollHeight;
          });
        };
  
        this.recognition.onend = () => {
          this.ngZone.run(() => {
            this.isListening = false;
            this.lastProcessedIndex = 0;
          });
        };
      } else {
        console.error('Speech recognition not supported');
      }
    }
  
    toggleVoiceRecognition() {
      if (this.isListening) {
        this.stopListening();
      } else {
        this.startListening();
      }
    }
  
    startListening() {
      this.recognition.start();
      this.isListening = true;
      this.lastProcessedIndex = 0;
    }
  
    stopListening() {
      this.recognition.stop();
      this.isListening = false;
    }
    toggleSidebar() {
      this.sidenavOpened = !this.sidenavOpened;
    }

    downloadAsText() {
      const content = this.documentForm.get('content')?.value;
      const blob = new Blob([content], { type: 'text/plain' });
      this.downloadFile(blob, `${this.currentDocument.title}.txt`);
    }

    downloadAsPDF() {
      const content = this.documentForm.get('content')?.value;
      const pdf = new jsPDF();
      pdf.text(content, 10, 10);
      pdf.save(`${this.currentDocument.title}.pdf`);
    }

    downloadAsDoc() {
      const content = this.documentForm.get('content')?.value;
      const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
      const postHtml = "</body></html>";
      const html = preHtml + content + postHtml;
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      this.downloadFile(blob, `${this.currentDocument.title}.doc`);
    }

    loadSavedDocuments() {
      const savedDocs = localStorage.getItem('savedDocuments');
      if (savedDocs) {
        this.savedDocuments = JSON.parse(savedDocs);
      }
    }

    loadDocument(id: string) {
      const doc = this.savedDocuments.find(d => d.id === id);
      if (doc) {
        this.currentDocument = { ...doc };
        this.documentForm.patchValue({ content: doc.content });
      }
    }

    saveDocument() {
      this.currentDocument.content = this.documentForm.get('content')?.value;
      this.currentDocument.lastModified = Date.now();

      const existingIndex = this.savedDocuments.findIndex(d => d.id === this.currentDocument.id);
      if (existingIndex !== -1) {
        this.savedDocuments[existingIndex] = { ...this.currentDocument };
      } else {
        this.savedDocuments.push({ ...this.currentDocument });
      }

      localStorage.setItem('savedDocuments', JSON.stringify(this.savedDocuments));
      this.loadSavedDocuments(); // Refresh the list
      this.snackBar.open('Document saved successfully', 'Close', {
        duration: 2000,
      });
    }

    deleteDocument(id: string) {
      this.savedDocuments = this.savedDocuments.filter(doc => doc.id !== id);
      localStorage.setItem('savedDocuments', JSON.stringify(this.savedDocuments));
      this.snackBar.open('Document deleted successfully', 'Close', {
        duration: 2000,
      });
    }

    createNewDocument(): Document {
      return {
        id: this.generateId(),
        title: 'New Document',
        content: '',
        lastModified: Date.now()
      };
    }

    generateId(): string {
      return Math.random().toString(36).substr(2, 9);
    }

    downloadFile(blob: Blob, filename: string) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }

    newDocument() {
      this.currentDocument = this.createNewDocument();
      this.documentForm.reset({ content: '' });
    }
  }