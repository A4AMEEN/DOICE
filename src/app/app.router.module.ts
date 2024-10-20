import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { SupermarioComponent } from "./supermario/supermario.component";
import { DocumentEditorComponent } from "./document-editor/document-editor.component";
import { VoiceToTextComponent } from "./voice-to-text/voice-to-text.component";

const routes: Routes = [
  { path: '', component: DocumentEditorComponent },  // Default route
  { path: 'docs', component: DocumentEditorComponent },  // Explicit route to the game
  { path: '**', redirectTo: '' }  // Wildcard route for any unmatched routes
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }