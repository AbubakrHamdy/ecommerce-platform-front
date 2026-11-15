import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './core/layout/footer';
import { Header } from './core/layout/header';
import { Toaster } from './shared/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Toaster],
  templateUrl: './app.html',
})
export class App {}
